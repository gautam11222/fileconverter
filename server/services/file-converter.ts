import sharp from 'sharp';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import yazl from 'yazl';
import yauzl from 'yauzl';
import LibreOffice from 'libreoffice-convert';
import pdfParse from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const execAsync = promisify(exec);
const libreOfficeConvert = promisify(LibreOffice.convert);

export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  compress: boolean;
  metadata?: Record<string, any>;
  preserveFormatting?: boolean;
  ocrEnabled?: boolean; // if true, force OCR on scanned PDFs
  tableExtraction?: boolean; // attempt to extract tables (uses camelot/tabula via python)
}

export interface ConversionResult {
  outputPath: string;
  originalSize: number;
  convertedSize: number;
  processingTime: number;
  warnings?: string[];
  url?: string;
}

/**
 * Modern File Converter Service for Express/React Application
 * - Implements a conversion pipeline with detection (text-based vs scanned PDF)
 * - Uses pdf2docx (Python) when available, falls back to LibreOffice
 * - Uses Tesseract OCR for scanned PDFs (if installed)
 * - Optional table extraction via Camelot/Tabula (Python)
 */
export class FileConverterService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');
  private static readonly CONVERTED_DIR = path.join(process.cwd(), 'converted');
  private static readonly MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
  private static readonly TIMEOUT = 8 * 60 * 1000; // 8 minutes for heavy ops

  constructor() {
    this.ensureDirectories();
  }

  // ===================== QUALITY PRESETS =====================
  private static getQualitySettings(quality: 'low' | 'medium' | 'high' = 'medium') {
    const presets = {
      low: {
        imageQuality: 60,
        imageCompressionLevel: 9,
        videoBitrate: '500k',
        audioSampleRate: 22050
      },
      medium: {
        imageQuality: 80,
        imageCompressionLevel: 6,
        videoBitrate: '1000k',
        audioSampleRate: 44100
      },
      high: {
        imageQuality: 95,
        imageCompressionLevel: 3,
        videoBitrate: '2000k',
        audioSampleRate: 48000
      }
    };
    return presets[quality];
  }

  // ===================== DOCUMENT CONVERSION (PIPELINE) =====================

  /**
   * Top-level conversion pipeline for documents
   * - Detects PDF vs other
   * - If PDF and text-based -> try pdf2docx then LibreOffice
   * - If PDF and scanned -> OCR -> generate DOCX from extracted text (docx lib)
   * - Optionally attempt table extraction via Python (camelot/tabula)
   */
  async convertDocument(
    inputPath: string,
    outputFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const finalOutputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}${outputExt}`);

    await this.validateFile(inputPath);

    const warnings: string[] = [];

    try {
      // If PDF -> detect scanned or text-based
      if (inputExt === '.pdf') {
        const isScanned = await this.isPdfScanned(inputPath);

        // If user forced OCR explicitly
        if (options.ocrEnabled) {
          // treat as scanned
        }

        if (!isScanned && outputExt.toLowerCase() === '.docx') {
          // Try specialized pdf2docx Python-based conversion first
          try {
            const processingPath = await this.convertPdfToDocxAdvanced(inputPath, finalOutputPath, options);
            const result = await this.buildConversionResult(inputPath, processingPath, startTime, warnings);
            result.url = `/api/download/${path.basename(processingPath)}`;
            return result;
          } catch (err: any) {
            console.warn('pdf2docx failed:', err?.message || err);
            warnings.push('pdf2docx failed, falling back to LibreOffice');
          }
        }

        // If scanned or pdf2docx failed -> OCR path if output is docx/text
        if (isScanned || options.ocrEnabled) {
          // prefer tesseract if available
          if (await this.isCliAvailable('tesseract')) {
            const ocrTxt = await this.runTesseractOCR(inputPath);
            // If target is docx -> convert text->docx
            if (outputExt.toLowerCase() === '.docx') {
              const docxPath = finalOutputPath;
              await this.createDocxFromText(ocrTxt, docxPath);
              const result = await this.buildConversionResult(inputPath, docxPath, startTime, warnings);
              result.url = `/api/download/${path.basename(docxPath)}`;
              return result;
            }

            // if target is txt
            if (outputExt.toLowerCase() === '.txt') {
              fs.writeFileSync(finalOutputPath, ocrTxt, 'utf8');
              const result = await this.buildConversionResult(inputPath, finalOutputPath, startTime, warnings);
              result.url = `/api/download/${path.basename(finalOutputPath)}`;
              return result;
            }

            // otherwise fall back to LibreOffice for other formats
          } else {
            warnings.push('Tesseract not available; OCR not performed');
          }
        }

        // Optionally attempt table extraction for CSV/XLSX targets
        if (options.tableExtraction && (outputExt.toLowerCase() === '.csv' || outputExt.toLowerCase() === '.xlsx')) {
          try {
            const tablePath = await this.extractTablesUsingCamelot(inputPath);
            if (tablePath) {
              // if CSV target and camelot produced csv, return it
              if (outputExt.toLowerCase() === '.csv' && tablePath.endsWith('.csv')) {
                fs.copyFileSync(tablePath, finalOutputPath);
                const result = await this.buildConversionResult(inputPath, finalOutputPath, startTime, warnings);
                result.url = `/api/download/${path.basename(finalOutputPath)}`;
                return result;
              }
              // otherwise let LibreOffice handle other targets
            }
          } catch (err: any) {
            console.warn('Table extraction failed:', err?.message || err);
            warnings.push('Table extraction failed');
          }
        }
      }

      // Default: use LibreOffice for all other conversions
      const processingPath = await this.convertWithLibreOffice(inputPath, outputExt, options);
      const result = await this.buildConversionResult(inputPath, processingPath, startTime, warnings);
      result.url = `/api/download/${path.basename(processingPath)}`;
      return result;

    } catch (error: any) {
      throw new Error(`Document conversion failed: ${error?.message || error}`);
    }
  }

  private async isPdfScanned(inputPath: string): Promise<boolean> {
    // Use pdf-parse to check if text is extractable and non-trivial
    try {
      const dataBuffer = fs.readFileSync(inputPath);
      const data = await pdfParse(dataBuffer);
      const text = (data && data.text) ? data.text.replace(/\s+/g, ' ').trim() : '';
      // If extracted text is short or empty, it's likely a scanned PDF
      return text.length < 200; // heuristic threshold
    } catch (err) {
      console.warn('pdf-parse failed, assuming scanned PDF:', err?.message || err);
      return true;
    }
  }

  private async runTesseractOCR(inputPath: string): Promise<string> {
    // Render PDF pages to images and run tesseract on them
    // We use LibreOffice or pdftoppm (poppler) if available to render images, else use pdf2image python fallback
    const imagesDir = path.join(FileConverterService.TEMP_DIR, `ocr_images_${Date.now()}`);
    fs.mkdirSync(imagesDir, { recursive: true });

    try {
      // Try pdftoppm
      if (await this.isCliAvailable('pdftoppm')) {
        const outPrefix = path.join(imagesDir, 'page');
        await execAsync(`pdftoppm -png "${inputPath}" "${outPrefix}"`, { timeout: FileConverterService.TIMEOUT });
      } else if (await this.isCliAvailable('magick')) {
        // imagemagick convert
        await execAsync(`magick -density 300 "${inputPath}" "${path.join(imagesDir, 'page')}.png"`, { timeout: FileConverterService.TIMEOUT });
      } else {
        // fallback: use libreoffice to convert pages to images (not ideal) - try python pdf2image if available
        throw new Error('No PDF->image renderer available (install poppler pdftoppm or ImageMagick)');
      }

      // Collect generated images
      const images = fs.readdirSync(imagesDir).filter(f => /page-?\d+.*\.png$|page\d+.*\.png$|page.*\.png$/i.test(f)).map(f => path.join(imagesDir, f));
      let aggregatedText = '';

      for (const img of images) {
        const txtOut = `${img}.txt`;
        // run tesseract: tesseract input output_base (without extension)
        await execAsync(`tesseract "${img}" "${img}"`, { timeout: FileConverterService.TIMEOUT });
        const txt = fs.readFileSync(txtOut, 'utf8');
        aggregatedText += txt + '\n\n';
        // cleanup text files but keep images until end
        try { fs.unlinkSync(txtOut); } catch (e) {}
      }

      return aggregatedText.trim();
    } finally {
      // cleanup images
      try {
        const files = fs.readdirSync(imagesDir);
        for (const f of files) { fs.unlinkSync(path.join(imagesDir, f)); }
        fs.rmdirSync(imagesDir);
      } catch (e) {
        // ignore cleanup errors
      }
    }
  }

  private async createDocxFromText(text: string, outputPath: string): Promise<void> {
    const doc = new Document();
    const paragraphs = text.split(/\n{2,}/).map(block => new Paragraph({ children: [new TextRun(block)] }));
    doc.addSection({ children: paragraphs.length ? paragraphs : [new Paragraph('')] });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
  }

  private async extractTablesUsingCamelot(inputPdf: string): Promise<string | null> {
    // Attempts to call a small Python helper script that uses camelot to extract tables
    // Requires: camelot, pandas installed in python environment
    if (!(await this.isCliAvailable('python3') || await this.isCliAvailable('python'))) {
      throw new Error('Python not available for table extraction');
    }

    // write helper script
    const script = `
import sys
import json
from pathlib import Path
try:
    import camelot
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
    sys.exit(0)

input_pdf = sys.argv[1]
out = sys.argv[2]

tables = camelot.read_pdf(input_pdf, pages='all', flavor='lattice')
if tables.n == 0:
    tables = camelot.read_pdf(input_pdf, pages='all', flavor='stream')

if tables.n == 0:
    print(json.dumps({'success': False, 'error': 'No tables found'}))
    sys.exit(0)

# write combined CSV
csv_out = out
frames = [t.df for t in tables]
import pandas as pd
combined = pd.concat(frames, ignore_index=True)
combined.to_csv(csv_out, index=False)
print(json.dumps({'success': True, 'path': csv_out}))
`;

    const scriptPath = path.join(FileConverterService.TEMP_DIR, `extract_tables_${Date.now()}.py`);
    const csvOut = path.join(FileConverterService.TEMP_DIR, `tables_${Date.now()}.csv`);
    fs.writeFileSync(scriptPath, script, 'utf8');

    try {
      const pythonBin = (await this.isCliAvailable('python3')) ? 'python3' : 'python';
      const { stdout } = await execAsync(`${pythonBin} "${scriptPath}" "${inputPdf}" "${csvOut}"`, { timeout: FileConverterService.TIMEOUT });
      const parsed = JSON.parse(stdout || '{}');
      if (parsed.get('success') || parsed.success) {
        return csvOut;
      }
      return null;
    } catch (err: any) {
      throw new Error(`Camelot extraction failed: ${err?.message || err}`);
    } finally {
      try { fs.unlinkSync(scriptPath); } catch (e) {}
    }
  }

  private async convertPdfToDocxAdvanced(
    inputPath: string,
    outputPath: string,
    options: ConversionOptions
  ): Promise<string> {
    // Check if pdf2docx is available in a python environment
    let pythonBin = 'python3';
    try {
      await execAsync(`${pythonBin} -c "import pdf2docx"`, { timeout: 5000 });
    } catch {
      pythonBin = 'python';
    }

    try {
      await execAsync(`${pythonBin} -c "import pdf2docx"`, { timeout: 5000 });
    } catch {
      throw new Error('pdf2docx not found. Install with: pip install pdf2docx');
    }

    const pythonScript = `
from pdf2docx import Converter
import sys

input_path = r"${inputPath.replace(/\\/g, '\\\\')}"
output_path = r"${outputPath.replace(/\\/g, '\\\\')}"

try:
    cv = Converter(input_path)
    cv.convert(output_path, start=0, end=None)
    cv.close()
    print('{"success": true}')
except Exception as e:
    print('{"success": false, "error": "%s"}' % str(e))
`;

    const tempScriptPath = path.join(FileConverterService.TEMP_DIR, `convert_pdf2docx_${Date.now()}.py`);
    fs.writeFileSync(tempScriptPath, pythonScript);

    try {
      const { stdout } = await execAsync(`${pythonBin} "${tempScriptPath}"`, { timeout: FileConverterService.TIMEOUT });
      const result = stdout ? JSON.parse(stdout) : { success: false };
      if (!result.success) throw new Error(result.error || 'Unknown error');
      return outputPath;
    } finally {
      try { fs.unlinkSync(tempScriptPath); } catch (e) {}
    }
  }

  private async convertWithLibreOffice(
    inputPath: string,
    outputExt: string,
    options: ConversionOptions
  ): Promise<string> {
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}${outputExt}`);

    try {
      const inputBuffer = fs.readFileSync(inputPath);
      const format = outputExt.replace('.', '');

      const convertedBuffer = await libreOfficeConvert(inputBuffer, format, undefined);
      fs.writeFileSync(outputPath, convertedBuffer);

      return outputPath;
    } catch (error: any) {
      throw new Error(`LibreOffice conversion error: ${error?.message || error}`);
    }
  }

  // ===================== IMAGE CONVERSION =====================

  async convertImage(
    inputPath: string,
    outputFormat: 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff',
    options: ConversionOptions = { quality: 'medium', compress: true }
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const settings = FileConverterService.getQualitySettings(options.quality);
    const outputExt = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}.${outputExt}`);

    await this.validateFile(inputPath);

    try {
      let sharpInstance = sharp(inputPath);
      const formatOptions = this.getImageFormatOptions(outputFormat, settings, options);

      if (options.metadata) {
        sharpInstance = sharpInstance.withMetadata(options.metadata);
      }

      await sharpInstance.toFormat(outputFormat as any, formatOptions).toFile(outputPath);

      const result = await this.buildConversionResult(inputPath, outputPath, startTime);
      result.url = `/api/download/${path.basename(outputPath)}`;
      return result;
    } catch (error: any) {
      throw new Error(`Image conversion failed: ${error?.message || error}`);
    }
  }

  private getImageFormatOptions(format: string, settings: any, options: ConversionOptions) {
    const baseOptions = {
      quality: settings.imageQuality,
      compression: options.compress ? settings.imageCompressionLevel : 0
    };

    switch (format) {
      case 'webp':
        return { ...baseOptions, effort: 6, smartSubsample: true };
      case 'avif':
        return { ...baseOptions, effort: 4, chromaSubsampling: '4:2:0' };
      case 'png':
        return { compressionLevel: settings.imageCompressionLevel, progressive: true };
      case 'jpg':
      case 'jpeg':
        return { ...baseOptions, progressive: true, mozjpeg: true };
      default:
        return baseOptions;
    }
  }

  // ===================== VIDEO/AUDIO CONVERSION =====================

  async convertVideo(
    inputPath: string,
    outputFormat: 'mp4' | 'avi' | 'mkv' | 'webm' | 'mov',
    options: ConversionOptions = { quality: 'medium', compress: true }
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const settings = FileConverterService.getQualitySettings(options.quality);
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}.${outputFormat}`);

    await this.validateFile(inputPath);

    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:v', settings.videoBitrate,
        '-y', // Overwrite output
        outputPath
      ];

      if (options.compress) {
        args.splice(-2, 0, '-preset', 'medium', '-crf', '23');
      }

      const ffmpegProcess = spawn('ffmpeg', args);

      ffmpegProcess.on('close', async (code: number) => {
        if (code === 0) {
          const result = await this.buildConversionResult(inputPath, outputPath, startTime);
          result.url = `/api/download/${path.basename(outputPath)}`;
          resolve(result);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (error: any) => {
        reject(new Error(`FFmpeg process error: ${error?.message || error}`));
      });

      setTimeout(() => {
        ffmpegProcess.kill('SIGKILL');
        reject(new Error('Video conversion timeout'));
      }, FileConverterService.TIMEOUT);
    });
  }

  async convertAudio(
    inputPath: string,
    outputFormat: 'mp3' | 'aac' | 'ogg' | 'wav' | 'flac' | 'm4a',
    options: ConversionOptions = { quality: 'medium', compress: true }
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const settings = FileConverterService.getQualitySettings(options.quality);
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}.${outputFormat}`);

    await this.validateFile(inputPath);

    return new Promise((resolve, reject) => {
      const codec = this.getAudioCodec(outputFormat);
      const args = [
        '-i', inputPath,
        '-c:a', codec,
        '-ar', settings.audioSampleRate.toString(),
        '-y',
        outputPath
      ];

      const ffmpegProcess = spawn('ffmpeg', args);

      ffmpegProcess.on('close', async (code: number) => {
        if (code === 0) {
          const result = await this.buildConversionResult(inputPath, outputPath, startTime);
          result.url = `/api/download/${path.basename(outputPath)}`;
          resolve(result);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (error: any) => {
        reject(new Error(`Audio conversion error: ${error?.message || error}`));
      });
    });
  }

  private getAudioCodec(format: string): string {
    const codecs = {
      mp3: 'libmp3lame',
      aac: 'aac',
      ogg: 'libvorbis',
      wav: 'pcm_s16le',
      flac: 'flac',
      m4a: 'aac'
    };
    return codecs[format] || 'libmp3lame';
  }

  // ===================== ARCHIVE OPERATIONS =====================

  async createArchive(
    inputPaths: string[],
    outputName?: string,
    options: ConversionOptions = { quality: 'medium', compress: true }
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const fileName = outputName || `archive_${Date.now()}`;
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}.zip`);

    return new Promise((resolve, reject) => {
      const zipFile = new yazl.ZipFile();
      let totalSize = 0;

      inputPaths.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          totalSize += stat.size;

          if (stat.isDirectory()) {
            this.addDirectoryToZip(zipFile, filePath, path.basename(filePath));
          } else {
            zipFile.addFile(filePath, path.basename(filePath));
          }
        }
      });

      zipFile.end();

      const writeStream = fs.createWriteStream(outputPath);
      zipFile.outputStream.pipe(writeStream);

      writeStream.on('close', async () => {
        try {
          const result: ConversionResult = {
            outputPath,
            originalSize: totalSize,
            convertedSize: fs.statSync(outputPath).size,
            processingTime: Date.now() - startTime,
            url: `/api/download/${path.basename(outputPath)}`
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      writeStream.on('error', reject);
    });
  }

  private addDirectoryToZip(zipFile: yazl.ZipFile, dirPath: string, relativePath: string) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const relPath = path.join(relativePath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.addDirectoryToZip(zipFile, fullPath, relPath);
      } else {
        zipFile.addFile(fullPath, relPath);
      }
    });
  }

  async extractArchive(archivePath: string, extractTo?: string): Promise<void> {
    const extractPath = extractTo || path.join(FileConverterService.TEMP_DIR, `extracted_${Date.now()}`);

    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      yauzl.open(archivePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile!.readEntry();
        zipfile!.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            fs.mkdirSync(path.join(extractPath, entry.fileName), { recursive: true });
            zipfile!.readEntry();
          } else {
            zipfile!.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);

              const filePath = path.join(extractPath, entry.fileName);
              const dir = path.dirname(filePath);

              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }

              const writeStream = fs.createWriteStream(filePath);
              readStream!.pipe(writeStream);

              writeStream.on('close', () => {
                zipfile!.readEntry();
              });
            });
          }
        });

        zipfile!.on('end', () => resolve());
        zipfile!.on('error', reject);
      });
    });
  }

  // ===================== UTILITY METHODS =====================

  private async validateFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file does not exist: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size > FileConverterService.MAX_FILE_SIZE) {
      throw new Error(`File too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: ${Math.round(FileConverterService.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
    }

    if (stats.size === 0) {
      throw new Error('Input file is empty');
    }
  }

  private async buildConversionResult(
    inputPath: string,
    outputPath: string,
    startTime: number,
    warnings: string[] = []
  ): Promise<ConversionResult> {
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);

    return {
      outputPath,
      originalSize: inputStats.size,
      convertedSize: outputStats.size,
      processingTime: Date.now() - startTime,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private ensureDirectories(): void {
    const dirs = [
      FileConverterService.UPLOAD_DIR,
      FileConverterService.TEMP_DIR,
      FileConverterService.CONVERTED_DIR
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async cleanupTempFiles(): Promise<void> {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    try {
      const files = fs.readdirSync(FileConverterService.TEMP_DIR);

      for (const file of files) {
        const filePath = path.join(FileConverterService.TEMP_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error: any) {
      console.warn('Cleanup failed:', error.message);
    }
  }

  async getConvertedFiles(): Promise<{ name: string; size: number; created: Date; url: string }[]> {
    try {
      const files = fs.readdirSync(FileConverterService.CONVERTED_DIR);

      return files.map(file => {
        const filePath = path.join(FileConverterService.CONVERTED_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          url: `/api/download/${file}`
        };
      }).sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      return [];
    }
  }

  private async isCliAvailable(cmd: string): Promise<boolean> {
    try {
      await execAsync(`${cmd} --version`, { timeout: 4000 });
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default FileConverterService;