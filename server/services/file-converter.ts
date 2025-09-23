import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import yazl from 'yazl';
import yauzl from 'yauzl';
import LibreOffice from 'libreoffice-convert';
import pdfParse from 'pdf-parse-new';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { promisify } from 'util';

const execAsync = promisify(exec);
const libreOfficeConvert = LibreOffice.convert; // already async, no promisify needed

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
  private static readonly MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
  private static readonly TIMEOUT = 8 * 60 * 1000; // 8 minutes

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
            const processedPath = await this.convertPdfToDocxAdvanced(inputPath, finalOutputPath, options);
            const result = await this.buildConversionResult(inputPath, processedPath, startTime, warnings);
            result.url = `/api/download/${path.basename(processedPath)}`;
            return result;
          } catch (err: any) {
            warnings.push('pdf2docx failed, falling back to LibreOffice');
          }
        }
      }

      // fallback: LibreOffice
      const processedPath = await this.convertWithLibreOffice(inputPath, outputExt, options);
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
    } catch {
      return '';
    }
  }

  private async createDocxFromText(text: string, outputPath: string): Promise<void> {
    const doc = new Document();
    const paragraphs = text.split(/\n{2,}/).map(block => new Paragraph({ children: [new TextRun(block)] }));
    doc.addSection({ children: paragraphs.length ? paragraphs : [new Paragraph('')] });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
  }

  private async convertPdfToDocxAdvanced(inputPath: string, outputPath: string, _options: ConversionOptions) {
    let pythonBin = 'python3';
    try { await execAsync(`${pythonBin} -c "import pdf2docx"`); } catch { pythonBin = 'python'; }
    try { await execAsync(`${pythonBin} -c "import pdf2docx"`); } catch { throw new Error('pdf2docx not installed'); }

    const script = `
from pdf2docx import Converter
cv = Converter(r"${inputPath.replace(/\\/g, '\\\\')}")
cv.convert(r"${outputPath.replace(/\\/g, '\\\\')}", start=0, end=None)
cv.close()
`;
    const tempScript = path.join(FileConverterService.TEMP_DIR, `pdf2docx_${Date.now()}.py`);
    fs.writeFileSync(tempScript, script);

    try {
      await execAsync(`${pythonBin} "${tempScript}"`, { timeout: FileConverterService.TIMEOUT });
      return outputPath;
    } finally { fs.unlinkSync(tempScript); }
  }

  private async convertWithLibreOffice(inputPath: string, outputExt: string, _options: ConversionOptions) {
    const outputPath = path.join(
      FileConverterService.CONVERTED_DIR,
      `${path.basename(inputPath, path.extname(inputPath))}_${Date.now()}${outputExt}`
    );

    const inputBuffer = fs.readFileSync(inputPath);

    // Explicit export filters
    const formatMap: Record<string, string> = {
      '.pdf': 'pdf:writer_pdf_Export',
      '.docx': 'docx:MS Word 2007 XML',
      '.odt': 'odt',
      '.txt': 'txt:Text',
      '.rtf': 'rtf:Rich Text Format',
      '.html': 'html:XHTML Writer File'
    };

    const format = formatMap[outputExt.toLowerCase()] || outputExt.replace('.', '');

    const convertedBuffer = await libreOfficeConvert(inputBuffer, format, undefined);
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
}

export default FileConverterService;
