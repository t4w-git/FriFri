import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { logger } from '../logger.js';

const router = express.Router();

// Configure upload directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${name}_${timestamp}_${random}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse (JPEG, PNG, WebP, GIF)'));
    }
  }
});

// Upload image route
router.post('/images', authMiddleware, upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { message: 'Nessun file caricato' } });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    logger.info(`✅ File uploaded: ${req.file.filename}`);

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: { message: 'Errore durante il caricamento' } });
  }
}, (_err: any, _req: Request, res: Response, next: any): void => {
  // Multer error handling
  if (_err instanceof multer.MulterError) {
    if (_err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: { message: 'File troppo grande (max 5MB)' } });
    } else {
      res.status(400).json({ error: { message: _err.message } });
    }
  } else if (_err) {
    res.status(400).json({ error: { message: _err.message || 'Errore durante il caricamento' } });
  } else {
    next();
  }
});

// Delete image route
router.delete('/images/:filename', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { filename } = req.params;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      res.status(400).json({ error: { message: 'Filename non valido' } });
      return;
    }
    
    const filePath = path.join(uploadDir, filename);
    
    // Verify file is in upload directory
    if (!filePath.startsWith(uploadDir)) {
      res.status(400).json({ error: { message: 'File non valido' } });
      return;
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`✅ File deleted: ${filename}`);
      res.json({ success: true, message: 'File eliminato' });
    } else {
      res.status(404).json({ error: { message: 'File non trovato' } });
    }
  } catch (error) {
    logger.error('Delete error:', error);
    res.status(500).json({ error: { message: 'Errore durante l\'eliminazione' } });
  }
});

export default router;
