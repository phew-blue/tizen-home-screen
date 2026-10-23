// Fallback wallpaper: arn0-tv's bg.jpg (https://github.com/NelsonEU/arn0-tv, MIT) — temporary, until Immich wallpapers are configured.
// Downloads the image and writes assets/fallback.jpg at 1920x1080 (cover), JPEG q82 via mozjpeg.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://raw.githubusercontent.com/NelsonEU/arn0-tv/main/src/img/bg.jpg';
const OUT = fileURLToPath(new URL('../assets/fallback.jpg', import.meta.url));

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`download failed: ${res.status} ${SOURCE_URL}`);
const input = Buffer.from(await res.arrayBuffer());

await sharp(input)
  .resize(1920, 1080, { fit: 'cover' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT);
