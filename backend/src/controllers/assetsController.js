import { readdir } from 'fs/promises';
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
