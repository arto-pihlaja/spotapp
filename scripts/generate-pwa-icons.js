import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets', 'images', 'icon.png');
const outDir = path.join(root, 'public');

const sizes = [192, 512];

for (const size of sizes) {
  const outFile = path.join(outDir, `icon-${size}x${size}.png`);
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(outFile);
  console.log(`Generated ${outFile}`);
}
