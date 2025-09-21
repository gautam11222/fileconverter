import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FileConverterService, { ConversionOptions } from '../services/FileConverterService.js';

const router = express.Router();
const converter = new FileConverterService();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// ===================== CONVERSION ROUTES =====================

/**
 * POST /api/convert/document
 */
router.post('/convert/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { outputFormat = 'pdf', quality = 'medium', preserveFormatting = 'true' } = req.body;

    const options: ConversionOptions = {
      quality: quality as 'low' | 'medium' | 'high',
      compress: req.body.compress === 'true',
      preserveFormatting: preserveFormatting === 'true'
    };

    console.log(`🔄 Converting document: ${req.file.originalname} → ${outputFormat}`);

    const result = await converter.convertDocument(
      req.file.path,
      outputFormat,
      options
    );

    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      message: 'Document converted successfully',
      result: {
        originalName: req.file.originalname,
        outputPath: result.outputPath,
        downloadUrl: result.url,
        fileSize: {
          original: result.originalSize,
          converted: result.convertedSize
        },
        processingTime: result.processingTime,
        warnings: result.warnings
      }
    });

  } catch (error: any) {
    console.error('❌ Document conversion error:', error);

    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      error: error.message,
      suggestions: error.message.includes('pdf2docx') 
        ? ['Install pdf2docx: pip install pdf2docx']
        : []
    });
  }
});

/**
 * POST /api/convert/image
 */
router.post('/convert/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { outputFormat = 'webp', quality = 'medium' } = req.body;

    const options: ConversionOptions = {
      quality: quality as 'low' | 'medium' | 'high',
      compress: req.body.compress !== 'false',
    };

    console.log(`🖼️  Converting image: ${req.file.originalname} → ${outputFormat}`);

    const result = await converter.convertImage(
      req.file.path,
      outputFormat as any,
      options
    );

    fs.unlink(req.file.path, () => {});

    const compressionRatio = ((result.originalSize - result.convertedSize) / result.originalSize * 100).toFixed(1);

    res.json({
      success: true,
      message: 'Image converted successfully',
      result: {
        originalName: req.file.originalname,
        downloadUrl: result.url,
        fileSize: {
          original: result.originalSize,
          converted: result.convertedSize
        },
        compressionRatio: `${compressionRatio}%`,
        processingTime: result.processingTime
      }
    });

  } catch (error: any) {
    console.error('❌ Image conversion error:', error);

    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/convert/video
 */
router.post('/convert/video', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { outputFormat = 'mp4', quality = 'medium' } = req.body;

    const options: ConversionOptions = {
      quality: quality as 'low' | 'medium' | 'high',
      compress: req.body.compress !== 'false',
    };

    console.log(`🎥 Converting video: ${req.file.originalname} → ${outputFormat}`);

    const result = await converter.convertVideo(
      req.file.path,
      outputFormat as any,
      options
    );

    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      message: 'Video converted successfully',
      result: {
        originalName: req.file.originalname,
        downloadUrl: result.url,
        fileSize: {
          original: result.originalSize,
          converted: result.convertedSize
        },
        processingTime: result.processingTime
      }
    });

  } catch (error: any) {
    console.error('❌ Video conversion error:', error);

    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/download/:filename
 */
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'converted', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip'
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

export default router;
