import { readdir } from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGOS_DIR = path.resolve(__dirname, '../../assets/logos');
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.avif']);

export async function listLogoAssets(req, res) {
  try {
    const files = await readdir(LOGOS_DIR);
    const images = files.filter(
      (f) => !f.startsWith('.') && ALLOWED_EXT.has(path.extname(f).toLowerCase())
    );
    const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    res.json(
      images.map((name) => ({
        name,
        url: `${base}/assets/logos/${encodeURIComponent(name)}`
      }))
    );
  } catch {
    res.json([]);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGOS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase()
      .slice(0, 60);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_EXT.has(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
}).single('logo');

export async function uploadLogoAsset(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  res.status(201).json({
    name: req.file.filename,
    url: `${base}/assets/logos/${encodeURIComponent(req.file.filename)}`
  });
}
