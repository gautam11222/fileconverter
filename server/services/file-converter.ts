// file-converter.ts
/* eslint-disable @typescript-eslint/no-var-requires */
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Some libs don't have good ESM typings — require them safely
const LibreOffice = require('libreoffice-convert');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const execAsync = promisify(exec);

export interface ConversionOptions {
  quality?: 'low' | 'medium' | 'high';
  compress?: boolean;
  metadata?: Record<string, any>;
}

export class FileConverterService {
<<<<<<< HEAD
<<<<<<< HEAD
  private static getQualitySettings(q: 'low' | 'medium' | 'high' = 'medium') {
    switch (q) {
=======
  // ---------------------- QUALITY SETTINGS ----------------------
=======
>>>>>>> parent of 823cb10 (Update file-converter.ts)
  private static getQualitySettings(quality: 'low' | 'medium' | 'high') {
    switch (quality) {
>>>>>>> edee6286fd12ff8f04f1aff987631096a91a2c45
      case 'low':
        return { imageQuality: 60, videoBitrate: '500k', audioBitrate: '64k' };
      case 'high':
        return { imageQuality: 95, videoBitrate: '2000k', audioBitrate: '192k' };
<<<<<<< HEAD
      case 'medium':
      default:
        return { imageQuality: 80, videoBitrate: '1000k', audioBitrate: '128k' };
    }
  }

<<<<<<< HEAD
  // Wrap libreoffice-convert into a promise
  private convertWithLibreOffice(buffer: Buffer, targetExt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // libreoffice-convert expects extension like '.pdf' or '.docx'
      LibreOffice.convert(buffer, targetExt, (err: any, done: Buffer) => {
        if (err) return reject(err);
        resolve(done);
      });
    });
  }

  // ---------- Documents ----------
  /**
   * Convert documents using LibreOffice where possible.
   * Special fallback for PDF -> DOCX: if LibreOffice's output contains little/no text,
   * extract text from PDF and create a new DOCX using 'docx' package.
   */
  async convertDocument(inputPath: string, outputExt: string, options?: ConversionOptions): Promise<string> {
    const inputBuffer = fs.readFileSync(inputPath);
    const lowerOutExt = outputExt.startsWith('.') ? outputExt.toLowerCase() : `.${outputExt.toLowerCase()}`;
    const outputPath = this.replaceExtension(inputPath, lowerOutExt);

    // Try LibreOffice conversion first for anything LibreOffice supports
    try {
      const convertedBuffer = await this.convertWithLibreOffice(inputBuffer, lowerOutExt);
      fs.writeFileSync(outputPath, convertedBuffer);
    } catch (e) {
      // If LibreOffice conversion fails, rethrow with helpful message
      throw new Error(`LibreOffice conversion failed: ${(e && e.message) || e}`);
    }

    // If converting to .docx (or similar) from a PDF, check whether result has real text.
    // If not, fallback to extracting text and generating a new .docx.
    const inputExt = path.extname(inputPath).toLowerCase();
    if (inputExt === '.pdf' && (lowerOutExt === '.docx' || lowerOutExt === '.doc' || lowerOutExt === '.odt')) {
      try {
        // Use mammoth to extract text from produced docx
        if (lowerOutExt === '.docx') {
          const mammothRes = await mammoth.extractRawText({ path: outputPath });
          const extracted = String(mammothRes?.value || '').trim();

          // If LibreOffice produced almost no text (likely images only), fallback
          if (extracted.length < 50) {
            // Extract text from PDF using pdf-parse
            const pdfData = await pdfParse(inputBuffer);
            const pdfText = (pdfData && pdfData.text) ? String(pdfData.text).trim() : '';

            // If no text found, warn user — scanned PDF likely needs OCR (tesseract)
            if (!pdfText || pdfText.length < 10) {
              // Keep the LibreOffice output, but surface a warning
              // (Don't overwrite with an empty doc)
              console.warn('Warning: PDF seems scanned or image-only. Consider running OCR (tesseract) for full text extraction.');
              return outputPath;
            }

            // Build a simple .docx with extracted text so the output actually has editable content
            const paragraphs = pdfText.split(/\r?\n\r?\n/).map((para) => new Paragraph({ children: [new TextRun(para.replace(/\r?\n/g, ' '))] }));
            const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(outputPath, buffer);
          }
        } else {
          // If output was .doc or .odt, still attempt to sanity-check via converting to docx and running mammoth
          // create temp docx from the output using libreoffice (if possible)
          try {
            const tempDocxPath = this.replaceExtension(outputPath, '.docx');
            const outBuf = fs.readFileSync(outputPath);
            // Try converting the produced file to docx (this may succeed)
            const convertedAgain = await this.convertWithLibreOffice(outBuf, '.docx');
            fs.writeFileSync(tempDocxPath, convertedAgain);
            const mammothRes = await mammoth.extractRawText({ path: tempDocxPath });
            const extracted = String(mammothRes?.value || '').trim();
            if (extracted.length < 50) {
              // Fallback to PDF text extraction
              const pdfData = await pdfParse(inputBuffer);
              const pdfText = (pdfData && pdfData.text) ? String(pdfData.text).trim() : '';
              if (pdfText && pdfText.length > 10) {
                const paragraphs = pdfText.split(/\r?\n\r?\n/).map((para) => new Paragraph({ children: [new TextRun(para.replace(/\r?\n/g, ' '))] }));
                const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
                const buffer = await Packer.toBuffer(doc);
                // overwrite the original outputPath (doc/odt) by generating a docx and renaming
                fs.writeFileSync(tempDocxPath, buffer);
                // Optionally convert tempDocxPath to user's requested extension via libreoffice
                const finalBuf = await this.convertWithLibreOffice(buffer, lowerOutExt);
                fs.writeFileSync(outputPath, finalBuf);
              } else {
                console.warn('Warning: PDF seems scanned or image-only. Consider OCR.');
              }
            }
            // cleanup temp docx if exists
            try { if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath); } catch (_) {}
          } catch (_) {
            // ignore fallback errors here
          }
        }
      } catch (ex) {
        // don't block main conversion if fallback check fails; log and continue
        console.warn('Document content check/fallback failed:', ex && ex.message ? ex.message : ex);
      }
    }

    return outputPath;
  }

  // ---------- Images ----------
  async convertImage(inputPath: string, outputExt: 'jpg' | 'jpeg' | 'png' | 'webp' | 'tiff', options?: ConversionOptions): Promise<string> {
    const q = FileConverterService.getQualitySettings(options?.quality || 'medium');
    const normalized = outputExt === 'jpeg' ? 'jpg' : outputExt;
    const out = this.replaceExtension(inputPath, `.${normalized}`);
    // Sharp toFormat expects format string without dot
    await sharp(inputPath).toFormat(normalized as any, { quality: q.imageQuality }).toFile(out);
    return out;
  }

  // ---------- Video ----------
  async convertVideo(inputPath: string, outputExt: 'mp4' | 'avi' | 'mkv' = 'mp4', options?: ConversionOptions): Promise<string> {
    const q = FileConverterService.getQualitySettings(options?.quality || 'medium');
    const out = this.replaceExtension(inputPath, `.${outputExt}`);

    const codecMap: Record<string, { v?: string; a?: string }> = {
      mp4: { v: 'libx264', a: 'aac' },
      mkv: { v: 'libx264', a: 'aac' },
      avi: { v: 'mpeg4', a: 'libmp3lame' },
    };

    const codec = codecMap[outputExt] || { v: 'libx264', a: 'aac' };

    return new Promise((resolve, reject) => {
      const proc = ffmpeg(inputPath)
        .videoCodec(codec.v)
        .audioCodec(codec.a)
        .outputOptions(['-b:v', q.videoBitrate])
        .on('error', (err) => reject(err))
        .on('end', () => resolve(out))
        .save(out);
    });
  }

  // ---------- Audio ----------
  async convertAudio(inputPath: string, outputExt: 'mp3' | 'aac' | 'ogg' | 'wav' = 'mp3', options?: ConversionOptions): Promise<string> {
    const q = FileConverterService.getQualitySettings(options?.quality || 'medium');
    const out = this.replaceExtension(inputPath, `.${outputExt}`);

    const codecMap: Record<string, string> = {
      mp3: 'libmp3lame',
      aac: 'aac',
      ogg: 'libvorbis',
      wav: 'pcm_s16le',
    };
    const codec = codecMap[outputExt] || 'libmp3lame';

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec(codec)
        .audioBitrate(q.audioBitrate)
        .on('error', (err) => reject(err))
        .on('end', () => resolve(out))
        .save(out);
    });
  }

  // ---------- ZIP / UNZIP ----------
  async zipFiles(inputPaths: string[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outputPath));
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      inputPaths.forEach((p) => {
        archive.file(p, { name: path.basename(p) });
      });
      archive.finalize();
    });
  }

  async unzipFile(zipPath: string, destDir: string): Promise<void> {
    await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: destDir })).promise();
  }

  // ---------- Utility ----------
  private replaceExtension(filePath: string, newExt: string): string {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    // ensure newExt begins with dot
    const ext = newExt.startsWith('.') ? newExt : `.${newExt}`;
    return path.join(dir, base + ext);
=======
    }
  }

  // ---------------------- DOCUMENT CONVERSION ----------------------
  private getLibreOfficeFilter(ext: string): string {
    switch (ext) {
      case '.pdf':
        return 'pdf:writer_pdf_Export';
      case '.docx':
        return 'docx:"MS Word 2007 XML"';
      case '.doc':
        return 'doc:"MS Word 97"';
      case '.xlsx':
        return 'xlsx:"Calc MS Excel 2007 XML"';
      case '.pptx':
        return 'pptx:"Impress MS PowerPoint 2007 XML"';
      case '.odt':
        return 'odt';
      default:
        return ext.replace('.', '');
    }
  }

  async convertDocument(inputPath: string, outputExt: string): Promise<string> {
    const outputDir = path.dirname(inputPath);
    const outputPath = path.join(
      outputDir,
      path.basename(inputPath, path.extname(inputPath)) + outputExt
    );

    // Special case: PDF → DOCX needs a dedicated tool
    if (path.extname(inputPath).toLowerCase() === '.pdf' && outputExt === '.docx') {
      await this.convertPdfToDocx(inputPath, outputPath);
      return outputPath;
    }

    const filter = this.getLibreOfficeFilter(outputExt);

    await execAsync(
      `soffice --headless --convert-to ${filter} --outdir "${outputDir}" "${inputPath}"`
    );

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Document conversion failed: ${inputPath} → ${outputExt}`);
    }
    return outputPath;
  }

  private async convertPdfToDocx(inputPath: string, outputPath: string): Promise<void> {
    // Requires Python + pdf2docx installed
    // pip install pdf2docx
    const cmd = `python3 -m pdf2docx.cli ${inputPath} ${outputPath}`;
    try {
      await execAsync(cmd);
    } catch (err) {
      throw new Error(`PDF→DOCX conversion failed. Ensure pdf2docx is installed. ${err}`);
    }
  }

  // ---------------------- IMAGE CONVERSION ----------------------
  async convertImage(
    inputPath: string,
    outputExt: 'jpg' | 'png' | 'webp',
    options: ConversionOptions
  ): Promise<string> {
    const { imageQuality } = FileConverterService.getQualitySettings(options.quality);
    const outputPath = this.replaceExtension(inputPath, `.${outputExt}`);
=======
  // Document Conversions
  static async convertDocument(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<void> {
    const inputBuffer = fs.readFileSync(inputPath);
    
    try {
      const outputBuffer = await convertAsync(inputBuffer, `.${targetFormat}`, undefined);
      fs.writeFileSync(outputPath, outputBuffer);
    } catch (error) {
      // Fallback to pandoc for some conversions
      const inputExt = path.extname(inputPath).substring(1);
      await execAsync(`pandoc "${inputPath}" -f ${inputExt} -t ${targetFormat} -o "${outputPath}"`);
    }
  }

  // Image Conversions
  static async convertImage(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<void> {
    const qualitySettings = this.getQualitySettings(options.quality);
    
    let sharpInstance = sharp(inputPath);
    
    // Apply compression if requested
    if (options.compress) {
      sharpInstance = sharpInstance.jpeg({ quality: qualitySettings.imageQuality - 20 });
    }
>>>>>>> parent of 823cb10 (Update file-converter.ts)

    switch (targetFormat.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        await sharpInstance.jpeg({ quality: qualitySettings.imageQuality }).toFile(outputPath);
        break;
      case 'png':
        await sharpInstance.png({ 
          quality: qualitySettings.imageQuality,
          compressionLevel: options.compress ? 9 : 6 
        }).toFile(outputPath);
        break;
      case 'webp':
        await sharpInstance.webp({ quality: qualitySettings.imageQuality }).toFile(outputPath);
        break;
      case 'pdf':
        // Convert image to PDF using sharp and PDFKit would be complex
        // For now, use imagemagick
        await execAsync(`convert "${inputPath}" "${outputPath}"`);
        break;
      default:
        await sharpInstance.toFormat(targetFormat as any).toFile(outputPath);
    }
  }

<<<<<<< HEAD
  // ---------------------- VIDEO CONVERSION ----------------------
  async convertVideo(
    inputPath: string,
    outputExt: 'mp4' | 'avi' | 'mkv',
    options: ConversionOptions
  ): Promise<string> {
    const { videoBitrate } = FileConverterService.getQualitySettings(options.quality);
    const outputPath = this.replaceExtension(inputPath, `.${outputExt}`);
=======
  // Audio Conversions
  static async convertAudio(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<void> {
    const qualitySettings = this.getQualitySettings(options.quality);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .audioBitrate(qualitySettings.audioBitrate)
        .format(targetFormat);
>>>>>>> parent of 823cb10 (Update file-converter.ts)

      // Apply compression settings
      if (options.compress) {
        command = command.audioBitrate('64k');
      }

      command
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', reject);
    });
  }

  // Video Conversions
  static async convertVideo(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<void> {
    const qualitySettings = this.getQualitySettings(options.quality);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .videoBitrate(qualitySettings.videoBitrate)
        .audioBitrate(qualitySettings.audioBitrate)
        .format(targetFormat);

      // Apply compression settings
      if (options.compress) {
        command = command
          .videoBitrate('300k')
          .size('720x?')
          .aspect('16:9');
      }

      command
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', reject);
    });
  }

  // Extract audio from video
  static async extractAudio(
    inputPath: string,
    outputPath: string,
    targetFormat: string = 'mp3',
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<void> {
    const qualitySettings = this.getQualitySettings(options.quality);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioBitrate(qualitySettings.audioBitrate)
        .format(targetFormat)
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', reject);
    });
  }

<<<<<<< HEAD
  // ---------------------- AUDIO CONVERSION ----------------------
  async convertAudio(
    inputPath: string,
    outputExt: 'mp3' | 'aac' | 'ogg' | 'wav',
    options: ConversionOptions
  ): Promise<string> {
    const { audioBitrate } = FileConverterService.getQualitySettings(options.quality);
    const outputPath = this.replaceExtension(inputPath, `.${outputExt}`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate(audioBitrate)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
=======
  // Archive Operations
  static async createArchive(
    inputPaths: string[],
    outputPath: string,
    format: 'zip' | '7z' | 'tar' = 'zip'
  ): Promise<void> {
    if (format === 'zip') {
      return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);

        inputPaths.forEach(inputPath => {
          if (fs.statSync(inputPath).isDirectory()) {
            archive.directory(inputPath, path.basename(inputPath));
          } else {
            archive.file(inputPath, { name: path.basename(inputPath) });
          }
        });

        archive.finalize();
      });
    } else {
      // Use 7z command for other formats
      const filesList = inputPaths.map(p => `"${p}"`).join(' ');
      await execAsync(`7z a "${outputPath}" ${filesList}`);
    }
  }

  static async extractArchive(
    inputPath: string,
    outputDir: string
  ): Promise<void> {
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.zip') {
      return new Promise((resolve, reject) => {
        fs.createReadStream(inputPath)
          .pipe(unzipper.Extract({ path: outputDir }))
          .on('close', resolve)
          .on('error', reject);
      });
    } else {
      // Use 7z for other archive formats
      await execAsync(`7z x "${inputPath}" -o"${outputDir}"`);
    }
>>>>>>> parent of 823cb10 (Update file-converter.ts)
  }

  // OCR (Image to Text)
  static async imageToText(inputPath: string): Promise<string> {
    try {
      // Use tesseract for OCR
      const { stdout } = await execAsync(`tesseract "${inputPath}" stdout`);
      return stdout;
    } catch (error) {
      throw new Error('OCR processing failed');
    }
  }

  // Speech to Text (would require additional service like Google Speech-to-Text)
  static async speechToText(inputPath: string): Promise<string> {
    // This would require integration with speech recognition service
    // For now, return placeholder
    throw new Error('Speech to text conversion requires external service integration');
  }

<<<<<<< HEAD
  // ---------------------- UTILS ----------------------
  private replaceExtension(filePath: string, newExt: string): string {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    return path.join(dir, base + newExt);
>>>>>>> edee6286fd12ff8f04f1aff987631096a91a2c45
=======
  // Text to Speech
  static async textToSpeech(text: string, outputPath: string): Promise<void> {
    // This would require integration with TTS service
    // For now, use espeak if available
    try {
      await execAsync(`espeak "${text}" --stdout > "${outputPath}"`);
    } catch (error) {
      throw new Error('Text to speech conversion requires espeak or external service');
    }
  }

  // Main conversion dispatcher
  static async convertFile(
    inputPath: string,
    outputPath: string,
    fromFormat: string,
    toFormat: string,
    options: ConversionOptions = { quality: 'medium', compress: false }
  ): Promise<void> {
    const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'svg', 'gif', 'heic'];
    const audioFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const videoFormats = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv'];
    const documentFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'];
    const archiveFormats = ['zip', 'rar', '7z', 'tar', 'gz', 'iso'];

    // Special cases first
    if (fromFormat === 'gif' && toFormat === 'mp4') {
      return this.convertVideo(inputPath, outputPath, toFormat, options);
    }

    if (videoFormats.includes(fromFormat) && toFormat === 'mp3') {
      return this.extractAudio(inputPath, outputPath, toFormat, options);
    }

    if (imageFormats.includes(fromFormat) && toFormat === 'text') {
      const text = await this.imageToText(inputPath);
      fs.writeFileSync(outputPath, text);
      return;
    }

    // Standard conversions
    if (imageFormats.includes(fromFormat) && imageFormats.includes(toFormat)) {
      return this.convertImage(inputPath, outputPath, toFormat, options);
    }

    if (audioFormats.includes(fromFormat) && audioFormats.includes(toFormat)) {
      return this.convertAudio(inputPath, outputPath, toFormat, options);
    }

    if (videoFormats.includes(fromFormat) && videoFormats.includes(toFormat)) {
      return this.convertVideo(inputPath, outputPath, toFormat, options);
    }

    if (documentFormats.includes(fromFormat) && documentFormats.includes(toFormat)) {
      return this.convertDocument(inputPath, outputPath, toFormat, options);
    }

    if (archiveFormats.includes(fromFormat) && archiveFormats.includes(toFormat)) {
      // Extract and repackage
      const tempDir = path.join(path.dirname(outputPath), 'temp_' + Date.now());
      await this.extractArchive(inputPath, tempDir);
      
      const files = fs.readdirSync(tempDir).map(f => path.join(tempDir, f));
      await this.createArchive(files, outputPath, toFormat as any);
      
      // Cleanup temp directory
      fs.rmSync(tempDir, { recursive: true });
      return;
    }

    throw new Error(`Conversion from ${fromFormat} to ${toFormat} is not supported`);
>>>>>>> parent of 823cb10 (Update file-converter.ts)
  }
}
