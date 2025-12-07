// Generate PWA icons from SVG
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = join(__dirname, 'public', 'favicon.svg');
const iconsDir = join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const svg = readFileSync(svgPath);

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  Created: icon-${size}x${size}.png`);
  }

  // Also create apple-touch-icon
  const appleTouchIcon = join(__dirname, 'public', 'apple-touch-icon.png');
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(appleTouchIcon);
  console.log('  Created: apple-touch-icon.png');

  console.log('Done!');
}

generateIcons().catch(console.error);
