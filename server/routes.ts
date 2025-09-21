import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { storage } from "./storage";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File conversion endpoint
  app.post('/api/convert', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { targetFormat, quality = 'medium', compress = 'false', emailResult = 'false' } = req.body;
      
      if (!targetFormat) {
        return res.status(400).json({ error: 'Target format is required' });
      }

      const sessionId = (req as any).sessionID || randomUUID();
      const originalFileName = req.file.originalname;
      const originalFormat = path.extname(originalFileName).substring(1).toLowerCase();
      const fileSize = req.file.size;

      // Create conversion record
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
        },
      });

      // Store file info for async processing
      const uploadedFile = req.file;
      
      // In a real implementation, this would trigger actual file conversion
      // For now, we'll simulate the conversion process
      setTimeout(async () => {
        try {
          // Simulate conversion by copying the file with new extension
          const convertedFileName = `${path.parse(originalFileName).name}.${targetFormat}`;
          const downloadPath = `downloads/${randomUUID()}_${convertedFileName}`;
          const fullDownloadPath = path.join(process.cwd(), downloadPath);
          
          // Ensure downloads directory exists
          const downloadsDir = path.dirname(fullDownloadPath);
          if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
          }

          // Copy file to downloads directory (simulating conversion)
          if (uploadedFile) {
            fs.copyFileSync(uploadedFile.path, fullDownloadPath);
          }
          
          // Update conversion status
          await storage.updateConversion(conversion.id, {
            status: 'completed',
            downloadPath: downloadPath,
            completedAt: new Date(),
          });

          // Clean up uploaded file
          if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
          }
        } catch (error) {
          console.error('Conversion failed:', error);
          await storage.updateConversion(conversion.id, {
            status: 'failed',
            completedAt: new Date(),
          });
        }
      }, 2000); // Simulate 2-second conversion time

      res.json({
        conversionId: conversion.id,
        status: 'processing',
        message: 'File uploaded successfully. Conversion in progress.',
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
        });
      } else {
        res.json({
          id: conversion.id,
          status: conversion.status,
          originalFileName: conversion.originalFileName,
          targetFormat: conversion.targetFormat,
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

      // Clean up file after download
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.error('Failed to delete file:', error);
          }
        }, 1000); // Delete after 1 second to ensure download completed
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Contact form endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, category, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }

      // In a real implementation, this would send an email or save to database
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

  // Cleanup old files (run periodically)
  const cleanupOldFiles = () => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const downloadsDir = path.join(process.cwd(), 'downloads');
    
    const cleanupDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < oneDayAgo) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          } catch (error) {
            console.error(`Failed to cleanup file ${filePath}:`, error);
          }
        }
      });
    };

    cleanupDirectory(uploadsDir);
    cleanupDirectory(downloadsDir);
  };

  // Run cleanup every hour
  setInterval(cleanupOldFiles, 60 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
