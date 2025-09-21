import sharp from 'sharp';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import yazl from 'yazl';
import yauzl from 'yauzl';
import LibreOffice from 'libreoffice-convert';

const execAsync = promisify(exec);
const libreOfficeConvert = promisify(LibreOffice.convert);

export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  compress: boolean;
  metadata?: Record<string, any>;
  preserveFormatting?: boolean;
  ocrEnabled?: boolean;
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
 * Uses supported packages: sharp, yazl/yauzl, libreoffice-convert
 */
export class FileConverterService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');
  private static readonly CONVERTED_DIR = path.join(process.cwd(), 'converted');
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly TIMEOUT = 300000; // 5 minutes

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

  // ===================== DOCUMENT CONVERSION =====================

  async convertDocument(
    inputPath: string,
    outputFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}${outputExt}`);

    await this.validateFile(inputPath);

    const warnings: string[] = [];

    try {
      // Special PDF→DOCX conversion using pdf2docx (if available)
      if (inputExt === '.pdf' && outputExt.toLowerCase() === '.docx') {
        try {
          const processingPath = await this.convertPdfToDocxAdvanced(inputPath, outputPath, options);
          const result = await this.buildConversionResult(inputPath, processingPath, startTime, warnings);
          result.url = `/api/download/${path.basename(processingPath)}`;
          return result;
        } catch (error: any) {
          console.warn('pdf2docx failed, falling back to LibreOffice:', error.message);
          warnings.push('Fell back to LibreOffice conversion');
        }
      }

      // Use LibreOffice for all other document conversions
      const processingPath = await this.convertWithLibreOffice(inputPath, outputExt, options);
      const result = await this.buildConversionResult(inputPath, processingPath, startTime, warnings);
      result.url = `/api/download/${path.basename(processingPath)}`;
      return result;

    } catch (error: any) {
      throw new Error(`Document conversion failed: ${error.message}`);
    }
  }

  private async convertPdfToDocxAdvanced(
    inputPath: string,
    outputPath: string,
    options: ConversionOptions
  ): Promise<string> {
    // Check if pdf2docx is available
    try {
      await execAsync('python3 -c "import pdf2docx"');
    } catch {
      try {
        await execAsync('python -c "import pdf2docx"');
      } catch {
        throw new Error('pdf2docx not found. Install with: pip install pdf2docx');
      }
    }

    const pythonScript = `
import sys
from pdf2docx import Converter
import json

def convert_pdf_to_docx(input_path, output_path, preserve_formatting=True):
    try:
        cv = Converter(input_path)
        settings = {
            'start': 0,
            'end': None,
            'pages': None,
            'multi_processing': True,
            'cpu_count': None,
            'password': None
        }
        cv.convert(output_path, **settings)
        cv.close()
        return {"success": True, "message": "PDF converted successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = convert_pdf_to_docx(
        "${inputPath.replace(/\\/g, '\\\\')}", 
        "${outputPath.replace(/\\/g, '\\\\')}", 
        ${options.preserveFormatting !== false}
    )
    print(json.dumps(result))
`;

    const tempScriptPath = path.join(FileConverterService.TEMP_DIR, `convert_${Date.now()}.py`);
    fs.writeFileSync(tempScriptPath, pythonScript);

    try {
      const { stdout } = await execAsync(`python3 "${tempScriptPath}"`, {
        timeout: FileConverterService.TIMEOUT
      });

      const result = JSON.parse(stdout);
      if (!result.success) {
        throw new Error(result.error);
      }

      return outputPath;
    } finally {
      fs.unlink(tempScriptPath, () => {});
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
      throw new Error(`LibreOffice conversion error: ${error.message}`);
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
      throw new Error(`Image conversion failed: ${error.message}`);
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

      const ffmpegProcess = require('child_process').spawn('ffmpeg', args);

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
        reject(new Error(`FFmpeg process error: ${error.message}`));
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

      const ffmpegProcess = require('child_process').spawn('ffmpeg', args);

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
        reject(new Error(`Audio conversion error: ${error.message}`));
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
}

export default FileConverterService;
