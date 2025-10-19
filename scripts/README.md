generate-gallery.js

What it does
- Scans the `workshop_gallery_images` folder for image files (jpg, png, gif, webp, avif).
- Sorts them numerically when possible (e.g., img_0.jpg, img_1.jpg ... img_25.jpg).
- Generates `<li class="carousel-slide">` items with correct `src` and `loading="lazy"` attributes.
- Replaces the section between `<!-- GALLERY-START -->` and `<!-- GALLERY-END -->` in `index.html`.

Usage (PowerShell on Windows):

1. Ensure you have Node.js installed (v12+ recommended).
2. From the repository root run:

   node .\scripts\generate-gallery.js

3. The script will modify `index.html` in-place. Commit the change if you're satisfied.

Notes & safety
- The script looks for the exact markers `<!-- GALLERY-START -->` and `<!-- GALLERY-END -->` in `index.html`.
- If you want to revert, use your VCS (git) to discard changes to `index.html`.
- The script will exit with an error if it cannot find the images directory or the markers.

Customization
- You can modify `scripts/generate-gallery.js` to change the `alt` text format, add captions, or include additional attributes.
