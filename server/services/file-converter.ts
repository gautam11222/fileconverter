import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import LibreOffice from 'libreoffice-convert';
import pdfParse from 'pdf-parse-new';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  compress: boolean;
  metadata?: Record<string, any>;
  preserveFormatting?: boolean;
  ocrEnabled?: boolean;
  tableExtraction?: boolean;
}

export interface ConversionResult {
  outputPath: string;
  originalSize: number;
  convertedSize: number;
  processingTime: number;
  warnings?: string[];
  url?: string;
}

export class FileConverterService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp');
  private static readonly CONVERTED_DIR = path.join(process.cwd(), 'converted');
  private static readonly MAX_FILE_SIZE = 200 * 1024 * 1024;
  private static readonly TIMEOUT = 8 * 60 * 1000;

  constructor() {
    this.ensureDirectories();
  }

  private static getQualitySettings(quality: 'low' | 'medium' | 'high' = 'medium') {
    const presets = {
      low: { imageQuality: 60, imageCompressionLevel: 9, videoBitrate: '500k', audioSampleRate: 22050 },
      medium: { imageQuality: 80, imageCompressionLevel: 6, videoBitrate: '1000k', audioSampleRate: 44100 },
      high: { imageQuality: 95, imageCompressionLevel: 3, videoBitrate: '2000k', audioSampleRate: 48000 }
    };
    return presets[quality];
  }

  // ===================== DOCUMENT CONVERSION =====================
  async convertDocument(
    inputPath: string,
    outputFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<ConversionResult> {
    if (!fs.existsSync(inputPath)) throw new Error(`Input file not found: ${inputPath}`);
    inputPath = path.resolve(inputPath);
    const startTime = Date.now();
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const finalOutputPath = path.join(FileConverterService.CONVERTED_DIR, `${fileName}_${Date.now()}${outputExt}`);
    const warnings: string[] = [];

    try {
      if (inputExt === '.pdf') {
        const isScanned = await this.isPdfScanned(inputPath);

        if (!isScanned && outputExt.toLowerCase() === '.docx') {
          try {
            const processedPath = await this.convertPdfToDocxAdvanced(inputPath, finalOutputPath);
            const result = await this.buildConversionResult(inputPath, processedPath, startTime, warnings);
            result.url = `/api/download/${path.basename(processedPath)}`;
            return result;
          } catch {
            warnings.push('pdf2docx failed, falling back to LibreOffice');
          }
        }

        if (isScanned || options.ocrEnabled) {
          if (await this.isCliAvailable('tesseract')) {
            const ocrText = await this.runTesseractOCR(inputPath);
            if (outputExt.toLowerCase() === '.docx') {
              await this.createDocxFromText(ocrText, finalOutputPath);
            } else if (outputExt.toLowerCase() === '.txt') {
              fs.writeFileSync(finalOutputPath, ocrText, 'utf8');
            }
            const result = await this.buildConversionResult(inputPath, finalOutputPath, startTime, warnings);
            result.url = `/api/download/${path.basename(finalOutputPath)}`;
            return result;
          } else {
            warnings.push('Tesseract not available; OCR skipped');
          }
        }

        if (options.tableExtraction && ['.csv', '.xlsx'].includes(outputExt.toLowerCase())) {
          try {
            const tablePath = await this.extractTablesUsingCamelot(inputPath);
            if (tablePath) {
              fs.copyFileSync(tablePath, finalOutputPath);
              const result = await this.buildConversionResult(inputPath, finalOutputPath, startTime, warnings);
              result.url = `/api/download/${path.basename(finalOutputPath)}`;
              return result;
            }
          } catch {
            warnings.push('Table extraction failed');
          }
        }
      }

      // fallback to LibreOffice
      const processedPath = await this.convertWithLibreOffice(inputPath, outputExt);
      const result = await this.buildConversionResult(inputPath, processedPath, startTime, warnings);
      result.url = `/api/download/${path.basename(processedPath)}`;
      return result;
    } catch (err: any) {
      throw new Error(`Document conversion failed: ${err.message || err}`);
    }
  }

  // ===================== PDF UTILITIES =====================
  private async isPdfScanned(inputPath: string): Promise<boolean> {
    try {
      const text = await this.safePdfParse(inputPath);
      return text.length < 200;
    } catch {
      return true;
    }
  }

  private async safePdfParse(inputPath: string): Promise<string> {
    if (!fs.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`);
    try {
      const buffer = fs.readFileSync(inputPath);
      const data = await pdfParse(buffer);
      return (data.text || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      console.error('PDF parse error:', err);
      return '';
    }
  }

  private async runTesseractOCR(inputPath: string): Promise<string> {
    const imagesDir = path.join(FileConverterService.TEMP_DIR, `ocr_${Date.now()}`);
    fs.mkdirSync(imagesDir, { recursive: true });
    try {
      if (await this.isCliAvailable('pdftoppm')) {
        execSync(`pdftoppm -png "${inputPath}" "${path.join(imagesDir, 'page')}"`, { timeout: FileConverterService.TIMEOUT });
      } else if (await this.isCliAvailable('magick')) {
        execSync(`magick -density 300 "${inputPath}" "${path.join(imagesDir, 'page')}.png"`, { timeout: FileConverterService.TIMEOUT });
      } else {
        throw new Error('No PDF->image renderer available (pdftoppm or ImageMagick required)');
      }

      const images = fs.readdirSync(imagesDir).map(f => path.join(imagesDir, f)).filter(f => f.endsWith('.png'));
      let aggregatedText = '';
      for (const img of images) {
        const txtOut = `${img}.txt`;
        execSync(`tesseract "${img}" "${img}"`, { timeout: FileConverterService.TIMEOUT });
        aggregatedText += fs.readFileSync(txtOut, 'utf8') + '\n\n';
        fs.unlinkSync(txtOut);
      }
      return aggregatedText.trim();
    } finally {
      fs.rmSync(imagesDir, { recursive: true, force: true });
    }
  }

  private async createDocxFromText(text: string, outputPath: string): Promise<void> {
    const doc = new Document();
    const paragraphs = text.split(/\n{2,}/).map(block => new Paragraph({ children: [new TextRun(block)] }));
    doc.addSection({ children: paragraphs.length ? paragraphs : [new Paragraph('')] });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
  }

  private async convertPdfToDocxAdvanced(inputPath: string, outputPath: string) {
    let pythonBin = 'python3';
    try { execSync(`${pythonBin} -c "import pdf2docx"`); } catch { pythonBin = 'python'; }
    try { execSync(`${pythonBin} -c "import pdf2docx"`); } catch { throw new Error('pdf2docx not installed'); }

    const script = `
from pdf2docx import Converter
cv = Converter(r"${inputPath.replace(/\\/g, '\\\\')}")
cv.convert(r"${outputPath.replace(/\\/g, '\\\\')}", start=0, end=None)
cv.close()
`;
    const tempScript = path.join(FileConverterService.TEMP_DIR, `pdf2docx_${Date.now()}.py`);
    fs.writeFileSync(tempScript, script);
    try {
      execSync(`${pythonBin} "${tempScript}"`, { timeout: FileConverterService.TIMEOUT });
      return outputPath;
    } finally { fs.unlinkSync(tempScript); }
  }

  private async convertWithLibreOffice(inputPath: string, outputExt: string) {
    const format = outputExt.startsWith('.') ? outputExt.slice(1) : outputExt;
    const outputPath = path.join(FileConverterService.CONVERTED_DIR, `${path.basename(inputPath, path.extname(inputPath))}_${Date.now()}.${format}`);
    const inputBuffer = fs.readFileSync(inputPath);

    const convertedBuffer: Buffer = await new Promise((resolve, reject) => {
      LibreOffice.convert(inputBuffer, format, undefined, (err, done) => {
        if (err) reject(err);
        else resolve(done);
      });
    });

    fs.writeFileSync(outputPath, convertedBuffer);
    return outputPath;
  }

  // ===================== UTILITY =====================
  private async buildConversionResult(inputPath: string, outputPath: string, startTime: number, warnings: string[] = []): Promise<ConversionResult> {
    return {
      outputPath,
      originalSize: fs.statSync(inputPath).size,
      convertedSize: fs.statSync(outputPath).size,
      processingTime: Date.now() - startTime,
      warnings: warnings.length ? warnings : undefined
    };
  }

  private ensureDirectories() {
    [FileConverterService.UPLOAD_DIR, FileConverterService.TEMP_DIR, FileConverterService.CONVERTED_DIR]
      .forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
  }

  private async isCliAvailable(cmd: string): Promise<boolean> {
    try { execSync(`${cmd} --version`, { stdio: 'ignore', timeout: 4000 }); return true; } catch { return false; }
  }

  private async extractTablesUsingCamelot(inputPath: string): Promise<string | null> {
    return null; // Implement table extraction if needed
  }
}

export default FileConverterService;
