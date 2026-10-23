// Fallback wallpaper: 'Milky Way' by Stefan Stefancik on Unsplash (Unsplash License), as bundled by arn0-tv — temporary, until Immich wallpapers are configured.
// Downloads the image and writes assets/fallback.jpg at 1920x1080 (cover), JPEG q82 via mozjpeg.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://raw.githubusercontent.com/NelsonEU/arn0-tv/b35c292e5bc63648cb8fef576bf5eacd9ea488d1/src/img/wallpapers/milky-way.jpg';
const OUT = fileURLToPath(new URL('../assets/fallback.jpg', import.meta.url));

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`download failed: ${res.status} ${SOURCE_URL}`);
const input = Buffer.from(await res.arrayBuffer());

await sharp(input)
  .resize(1920, 1080, { fit: 'cover' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT);
