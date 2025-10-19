// scripts/generate-gallery.js
// Node.js script to auto-generate <li class="carousel-slide"> items for the gallery
// Usage (PowerShell):
//   node .\scripts\generate-gallery.js

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'workshop_gallery_images');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');

// Markers in index.html between which the script will replace content
const START_MARKER = '<!-- GALLERY-START -->';
const END_MARKER = '<!-- GALLERY-END -->';

function isImageFile(name) {
  return /\.(jpe?g|png|gif|webp|avif)$/i.test(name);
}

function numericSort(a, b) {
  // Extract number after img_ prefix if present
  const re = /img_(\d+)/i;
  const ma = a.match(re);
  const mb = b.match(re);
  if (ma && mb) return Number(ma[1]) - Number(mb[1]);
  return a.localeCompare(b);
}

function generateListItems(files) {
  return files
    .map((f) => `                <li class="carousel-slide">\n                  <img src="./workshop_gallery_images/${f}" alt="Workshop image ${f}" loading="lazy" />\n                </li>`) 
    .join('\n\n');
}

function main() {
  if (!fs.existsSync(imagesDir)) {
    console.error('Images directory not found:', imagesDir);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(imagesDir).filter(isImageFile);
  if (allFiles.length === 0) {
    console.error('No images found in', imagesDir);
    process.exit(1);
  }

  // Sort files numerically if they follow img_0..img_25 pattern
  allFiles.sort(numericSort);

  const listItems = generateListItems(allFiles);

  // Read index.html
  let html = fs.readFileSync(indexHtmlPath, 'utf8');

  if (!html.includes(START_MARKER) || !html.includes(END_MARKER)) {
    console.error('Markers not found in index.html. Please add markers:');
    console.error(START_MARKER);
    console.error(END_MARKER);
    process.exit(1);
  }

  const before = html.split(START_MARKER)[0];
  const after = html.split(END_MARKER)[1];

  const newHtml = `${before}${START_MARKER}\n${listItems}\n${END_MARKER}${after}`;

  fs.writeFileSync(indexHtmlPath, newHtml, 'utf8');
  console.log(`Inserted ${allFiles.length} image(s) into index.html between markers.`);
}

main();
