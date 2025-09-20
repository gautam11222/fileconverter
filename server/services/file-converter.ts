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
  // ---------------------- QUALITY SETTINGS ----------------------
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

  // ---------------------- DOCUMENT CONVERSION ----------------------
  async convertDocument(
    inputPath: string,
    outputExt: string
  ): Promise<string> {
    const outputDir = path.dirname(inputPath);
    const outputPath = path.join(
      outputDir,
      path.basename(inputPath, path.extname(inputPath)) + outputExt
    );

    // Run LibreOffice headless conversion
    await execAsync(
      `soffice --headless --convert-to ${outputExt.replace('.', '')} --outdir "${outputDir}" "${inputPath}"`
    );

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Document conversion failed: ${inputPath} → ${outputExt}`);
    }

    return outputPath;
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

    return outputPath;
  }

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
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outputPath));
      archive.on('error', reject);

      archive.pipe(output);
      inputPaths.forEach(file => archive.file(file, { name: path.basename(file) }));
      archive.finalize();
    });
  }

  async unzipFile(zipPath: string, extractTo: string): Promise<void> {
    await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: extractTo })).promise();
  }

  // ---------------------- UTILS ----------------------
  private replaceExtension(filePath: string, newExt: string): string {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    return path.join(dir, base + newExt);
  }
}
