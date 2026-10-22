// Generates assets/fallback.jpg: a dark, neutral 1920x1080 gradient. Run once; output is committed.
import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <defs><radialGradient id="g" cx="30%" cy="25%" r="90%">
    <stop offset="0" stop-color="#1d3a5f"/><stop offset="0.55" stop-color="#0e1c2f"/><stop offset="1" stop-color="#05080d"/>
  </radialGradient></defs><rect width="1920" height="1080" fill="url(#g)"/></svg>`;
await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(new URL('../assets/fallback.jpg', import.meta.url).pathname);
