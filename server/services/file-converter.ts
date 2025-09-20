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
  // Quality profiles
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

  // ---------------------- DOCUMENT CONVERSIONS ----------------------
  async convertDocument(
    inputPath: string,
    outputExt: string,
  ): Promise<string> {
    const inputBuffer = fs.readFileSync(inputPath);
    const outputBuffer = await convertAsync(inputBuffer, outputExt);
    const outputPath = this.replaceExtension(inputPath, outputExt);
    fs.writeFileSync(outputPath, outputBuffer);
    return outputPath;
  }

  // ---------------------- IMAGE CONVERSIONS ----------------------
  async convertImage(
    inputPath: string,
    outputExt: 'jpg' | 'png' | 'webp',
    options: ConversionOptions,
  ): Promise<string> {
    const { imageQuality } = FileConverterService.getQualitySettings(options.quality);
    const outputPath = this.replaceExtension(inputPath, `.${outputExt}`);

    await sharp(inputPath)
      .toFormat(outputExt, { quality: imageQuality })
      .toFile(outputPath);

    return outputPath;
  }

  // ---------------------- VIDEO CONVERSIONS ----------------------
  async convertVideo(
    inputPath: string,
    outputExt: 'mp4' | 'avi' | 'mkv',
    options: ConversionOptions,
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

  // ---------------------- AUDIO CONVERSIONS ----------------------
  async convertAudio(
    inputPath: string,
    outputExt: 'mp3' | 'aac' | 'ogg' | 'wav',
    options: ConversionOptions,
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

  // ---------------------- UTIL ----------------------
  private replaceExtension(filePath: string, newExt: string): string {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    return path.join(dir, base + newExt);
  }
}
