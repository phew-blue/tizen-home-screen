import { cp, readFile, writeFile, rm, mkdir, copyFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function stageWgt({ uiDir, wallpaperDir, configPath, iconPath, outDir }) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp(uiDir, outDir, { recursive: true, filter: (src) => basename(src) !== 'package.json' });
  const index = join(outDir, 'index.html');
  const html = (await readFile(index, 'utf8')).split('\n').filter((l) => !l.includes('data-preview-only')).join('\n');
  await writeFile(index, html);
  await copyFile(join(wallpaperDir, 'wallpapers.js'), join(outDir, 'wallpapers.js'));
  await cp(join(wallpaperDir, 'wallpapers'), join(outDir, 'wallpapers'), { recursive: true });
  await copyFile(configPath, join(outDir, 'config.xml'));
  await copyFile(iconPath, join(outDir, 'icon.png'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [uiDir, wallpaperDir, configPath, iconPath, outDir] = process.argv.slice(2);
  await stageWgt({ uiDir, wallpaperDir, configPath, iconPath, outDir });
}
