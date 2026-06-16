const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const pagesDir = path.join(__dirname, 'pages');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalSaved = 0;
  let count = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const result = await processDirectory(fullPath);
      totalSaved += result.saved;
      count += result.count;
      continue;
    }

    if (!entry.name.match(/\.(jpg|jpeg|png)$/i)) continue;

    try {
      const stat = fs.statSync(fullPath);
      const originalSize = stat.size;

      // Skip already small files
      if (originalSize < 20000) continue;

      const webpPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      // Generate WebP version
      await sharp(fullPath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      // Optimize original JPEG (quality 80, mozjpeg)
      if (entry.name.match(/\.(jpg|jpeg)$/i)) {
        const buffer = await sharp(fullPath)
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        fs.writeFileSync(fullPath, buffer);
      }

      const newSize = fs.statSync(fullPath).size;
      const saved = originalSize - newSize;
      totalSaved += saved;
      count++;

      if (count % 50 === 0) {
        console.log(`Processed ${count} images, saved ${(totalSaved / 1024 / 1024).toFixed(1)}MB so far...`);
      }
    } catch (err) {
      // Skip problematic files
    }
  }

  return { saved: totalSaved, count };
}

async function main() {
  console.log('Optimizing images in /images...');
  const r1 = await processDirectory(imagesDir);
  console.log(`Images: ${r1.count} files, saved ${(r1.saved / 1024 / 1024).toFixed(1)}MB`);

  if (fs.existsSync(pagesDir)) {
    console.log('Optimizing images in /pages...');
    const r2 = await processDirectory(pagesDir);
    console.log(`Pages: ${r2.count} files, saved ${(r2.saved / 1024 / 1024).toFixed(1)}MB`);
  }

  console.log('Done!');
}

main().catch(console.error);
