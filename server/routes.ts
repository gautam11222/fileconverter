// routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import FileConverterService, { ConversionOptions } from "./file-converter";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB (matches service)
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

const converter = new FileConverterService();

export async function registerRoutes(app: Express): Promise<Server> {
  // File conversion endpoint
  app.post('/api/convert', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        targetFormat,
        quality = 'medium',
        compress = 'false',
        emailResult = 'false',
        ocrEnabled = 'false',
        tableExtraction = 'false'
      } = req.body;

      if (!targetFormat) {
        return res.status(400).json({ error: 'Target format is required' });
      }

      const sessionId = (req as any).sessionID || randomUUID();
      const originalFileName = req.file.originalname;
      const originalFormat = path.extname(originalFileName).substring(1).toLowerCase();
      const fileSize = req.file.size;

      // Create conversion record in storage
      const conversion = await storage.createConversion({
        sessionId,
        originalFileName,
        originalFormat,
        targetFormat,
        fileSize,
        status: 'processing',
        downloadPath: null,
        metadata: {
          quality,
          compress: compress === 'true',
          emailResult: emailResult === 'true',
          uploadPath: req.file.path,
          ocrEnabled: ocrEnabled === 'true',
          tableExtraction: tableExtraction === 'true'
        },
      });

      // Kick off conversion in background (non-blocking)
      (async () => {
        const uploadedPath = req.file.path;
        const opts: ConversionOptions = {
          quality: (quality as 'low' | 'medium' | 'high') || 'medium',
          compress: compress === 'true',
          preserveFormatting: true,
          ocrEnabled: ocrEnabled === 'true',
          tableExtraction: tableExtraction === 'true'
        };

        try {
          const lowerTarget = targetFormat.startsWith('.') ? targetFormat.slice(1) : targetFormat;
          const ext = lowerTarget.toLowerCase();
          let result;

          // Choose appropriate conversion function based on target type
          if (['docx', 'doc', 'pdf', 'txt', 'html', 'md', 'odt', 'rtf', 'xlsx', 'csv'].includes(ext)) {
            // Document conversion pipeline
            result = await converter.convertDocument(uploadedPath, `.${ext}`, opts);
          } else if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff'].includes(ext)) {
            // Image conversion
            result = await converter.convertImage(uploadedPath, ext as any, opts);
          } else if (['mp4', 'avi', 'mkv', 'webm', 'mov'].includes(ext)) {
            // Video conversion
            result = await converter.convertVideo(uploadedPath, ext as any, opts);
          } else if (['mp3', 'aac', 'ogg', 'wav', 'flac', 'm4a'].includes(ext)) {
            // Audio conversion
            result = await converter.convertAudio(uploadedPath, ext as any, opts);
          } else {
            // Fallback: try document conversion via LibreOffice
            result = await converter.convertDocument(uploadedPath, `.${ext}`, opts);
          }

          // Move or copy converted file to downloads/ with an id-based name
          const downloadsDir = path.join(process.cwd(), 'downloads');
          if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

          const outFileName = `${conversion.id}_${path.basename(result.outputPath)}`;
          const destPath = path.join(downloadsDir, outFileName);

          // move or copy (some conversions produce file inside converted/; prefer copying)
          try {
            fs.copyFileSync(result.outputPath, destPath);
          } catch (copyErr) {
            // fallback to rename if copy fails
            try { fs.renameSync(result.outputPath, destPath); } catch (renameErr) { /* ignore */ }
          }

          const publicPath = `downloads/${outFileName}`;

          // Update conversion record as completed
          await storage.updateConversion(conversion.id, {
            status: 'completed',
            downloadPath: publicPath,
            completedAt: new Date(),
            warnings: result.warnings || [],
            convertedSize: result.convertedSize
          });

        } catch (convErr) {
          console.error(`Conversion failed for id=${conversion.id}:`, convErr);
          await storage.updateConversion(conversion.id, {
            status: 'failed',
            completedAt: new Date(),
            errorMessage: (convErr as any)?.message || String(convErr)
          });
        } finally {
          // remove uploaded file to free space (if exists)
          try {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          } catch (e) { /* ignore */ }
        }
      })();

      // Respond immediately with processing status and id
      res.json({
        conversionId: conversion.id,
        status: 'processing',
        message: 'File uploaded successfully. Conversion started.'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Check conversion status
  app.get('/api/conversion/:id', async (req, res) => {
    try {
      const conversion = await storage.getConversion(req.params.id);

      if (!conversion) {
        return res.status(404).json({ error: 'Conversion not found' });
      }

      if (conversion.status === 'completed' && conversion.downloadPath) {
        const convertedFileName = `${path.parse(conversion.originalFileName).name}.${conversion.targetFormat}`;
        res.json({
          id: conversion.id,
          status: conversion.status,
          downloadUrl: `/api/download/${conversion.id}`,
          fileName: convertedFileName,
          originalFileName: conversion.originalFileName,
          targetFormat: conversion.targetFormat,
          completedAt: conversion.completedAt,
          warnings: conversion.warnings || []
        });
      } else {
        res.json({
          id: conversion.id,
          status: conversion.status,
          originalFileName: conversion.originalFileName,
          targetFormat: conversion.targetFormat,
          errorMessage: conversion.errorMessage || undefined
        });
      }
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Download converted file
  app.get('/api/download/:id', async (req, res) => {
    try {
      const conversion = await storage.getConversion(req.params.id);

      if (!conversion || conversion.status !== 'completed' || !conversion.downloadPath) {
        return res.status(404).json({ error: 'File not found or not ready' });
      }

      const filePath = path.join(process.cwd(), conversion.downloadPath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const convertedFileName = `${path.parse(conversion.originalFileName).name}.${conversion.targetFormat}`;

      res.setHeader('Content-Disposition', `attachment; filename="${convertedFileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Optional: remove file after a delay to free disk space
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            // also update storage to indicate file was cleaned up (optional)
            storage.updateConversion(conversion.id, { downloadPath: null }).catch(() => {});
          } catch (error) {
            console.error('Failed to delete file:', error);
          }
        }, 60 * 1000); // delete after 60s
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Contact form endpoint (unchanged)
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, category, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }

      console.log('Contact form submission:', {
        name,
        email,
        subject,
        category,
        message,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user's recent conversions
  app.get('/api/conversions', async (req, res) => {
    try {
      const sessionId = (req as any).sessionID || '';
      const conversions = await storage.getConversionsBySession(sessionId);

      res.json(conversions.map(conversion => ({
        id: conversion.id,
        originalFileName: conversion.originalFileName,
        originalFormat: conversion.originalFormat,
        targetFormat: conversion.targetFormat,
        status: conversion.status,
        createdAt: conversion.createdAt,
        completedAt: conversion.completedAt,
      })));

    } catch (error) {
      console.error('Conversions fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Background cleanup of old uploads/downloads (hourly)
  const cleanupOldFiles = () => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const downloadsDir = path.join(process.cwd(), 'downloads');

    const cleanupDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() < oneDayAgo) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        } catch (err) {
          console.error(`Failed to cleanup file ${filePath}:`, err);
        }
      });
    };

    cleanupDirectory(uploadsDir);
    cleanupDirectory(downloadsDir);
  };

  setInterval(cleanupOldFiles, 60 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
