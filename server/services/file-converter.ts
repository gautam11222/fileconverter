import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver';
import unzipper from 'unzipper';

const execAsync = promisify(exec);

export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  compress: boolean;
  metadata?: Record<string, any>;
}

export class FileConverterService {
<<<<<<< HEAD
  // ---------------------- QUALITY SETTINGS ----------------------
  private static getQualitySettings(quality: 'low' | 'medium' | 'high') {
    switch (quality) {
=======
  private static getQualitySettings(q: 'low' | 'medium' | 'high' = 'medium') {
    switch (q) {
>>>>>>> 5358066945de0529b790bd4ffe7d8a7cbf367aa6
      case 'low':
        return { imageQuality: 60, videoBitrate: '500k', audioBitrate: '64k' };
      case 'medium':
        return { imageQuality: 80, videoBitrate: '1000k', audioBitrate: '128k' };
      case 'high':
        return { imageQuality: 95, videoBitrate: '2000k', audioBitrate: '192k' };
<<<<<<< HEAD
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

    await sharp(inputPath)
      .toFormat(outputExt, { quality: imageQuality })
      .toFile(outputPath);
=======
      case 'medium':
      default:
        return { imageQuality: 80, videoBitrate: '1000k', audioBitrate: '128k' };
    }
  }

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
>>>>>>> 5358066945de0529b790bd4ffe7d8a7cbf367aa6

    return outputPath;
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

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoBitrate(videoBitrate)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

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
  }

  // ---------------------- ARCHIVE SUPPORT ----------------------
  async zipFile(inputPaths: string[], outputPath: string): Promise<string> {
=======
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
>>>>>>> 5358066945de0529b790bd4ffe7d8a7cbf367aa6
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outputPath));
<<<<<<< HEAD
      archive.on('error', reject);

      archive.pipe(output);
      inputPaths.forEach(file => archive.file(file, { name: path.basename(file) }));
=======
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      inputPaths.forEach((p) => {
        archive.file(p, { name: path.basename(p) });
      });
>>>>>>> 5358066945de0529b790bd4ffe7d8a7cbf367aa6
      archive.finalize();
    });
  }

<<<<<<< HEAD
  async unzipFile(zipPath: string, extractTo: string): Promise<void> {
    await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: extractTo })).promise();
  }

  // ---------------------- UTILS ----------------------
  private replaceExtension(filePath: string, newExt: string): string {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    return path.join(dir, base + newExt);
=======
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
>>>>>>> 5358066945de0529b790bd4ffe7d8a7cbf367aa6
  }
}
