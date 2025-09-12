import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import LibreOffice from 'libreoffice-convert';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver';
import unzipper from 'unzipper';

const convertAsync = promisify(LibreOffice.convert);
const execAsync = promisify(exec);

export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  compress: boolean;
  metadata?: Record<string, any>;
}

export class FileConverterService {
  private static getQualitySettings(quality: 'low' | 'medium' | 'high') {
    switch (quality) {
      case 'low':
        return { imageQuality: 60, videoBitrate: '500k', audioBitrate: '64k' };
      case 'medium':
        return { imageQuality: 80, videoBitrate: '1000k', audioBitrate: '128k' };
      case 'high':
        return { imageQuality: 95, videoBitrate: '2000k', audioBitrate: '192k' };
    }
  }

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
  }
}
