// Generate Android app icons from SVG
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Android icon sizes for mipmap directories
const mipmapSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const svgPath = join(__dirname, 'public', 'favicon.svg');
const androidResDir = join(__dirname, 'android', 'app', 'src', 'main', 'res');

const svg = readFileSync(svgPath);

async function generateAndroidIcons() {
  console.log('Generating Android app icons...');

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    const folderPath = join(androidResDir, folder);

    // Ensure directory exists
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    // Generate launcher icon
    const iconPath = join(folderPath, 'ic_launcher.png');
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(iconPath);
    console.log(`  Created: ${folder}/ic_launcher.png (${size}x${size})`);

    // Generate round icon (same for now)
    const roundIconPath = join(folderPath, 'ic_launcher_round.png');
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(roundIconPath);
    console.log(`  Created: ${folder}/ic_launcher_round.png (${size}x${size})`);

    // Generate foreground icon for adaptive icons (larger, for masking)
    const fgSize = Math.round(size * 1.5);
    const foregroundPath = join(folderPath, 'ic_launcher_foreground.png');
    await sharp(svg)
      .resize(fgSize, fgSize)
      .extend({
        top: Math.round((size * 2 - fgSize) / 2),
        bottom: Math.round((size * 2 - fgSize) / 2),
        left: Math.round((size * 2 - fgSize) / 2),
        right: Math.round((size * 2 - fgSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(size, size)
      .png()
      .toFile(foregroundPath);
  }

  console.log('Done!');
}

generateAndroidIcons().catch(console.error);
