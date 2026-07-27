const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const imgDir = path.join(dir, 'assets', 'images');

async function processImages() {
    console.log('Starting image conversion...');
    if (!fs.existsSync(imgDir)) {
        console.error('Image directory not found!');
        return;
    }

    const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
    const dimensionsMap = {}; // mapping new filename (without ext) to width/height

    for (const file of files) {
        const filePath = path.join(imgDir, file);
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        const webpPath = path.join(imgDir, name + '.webp');

        try {
            // Get dimensions of original image using sharp
            const metadata = await sharp(filePath).metadata();
            dimensionsMap[name] = { width: metadata.width, height: metadata.height };

            // Convert to webp if it doesn't exist
            if (!fs.existsSync(webpPath)) {
                await sharp(filePath)
                    .webp({ quality: 80 })
                    .toFile(webpPath);
                console.log(`Converted ${file} to ${name}.webp`);
            }
        } catch (e) {
            console.error(`Error processing ${file}:`, e);
        }
    }

    console.log('Image conversion complete. Now updating HTML files...');

    const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

    htmlFiles.forEach(htmlFile => {
        const htmlPath = path.join(dir, htmlFile);
        let content = fs.readFileSync(htmlPath, 'utf8');
        let modified = false;

        // Replace all references of .png and .jpg to .webp, and add width/height
        // We will do a generic replacement for src="assets/images/X.png" -> src="assets/images/X.webp" width="W" height="H"
        
        // Wait, some images might already have dimensions, or loading="lazy". 
        // Best approach: use regex to find <img ... src="assets/images/NAME.EXT" ... >
        const imgRegex = /<img([^>]*src="([^"]+\/([^\/"]+)\.(png|jpg|jpeg))"[^>]*)>/gi;
        
        content = content.replace(imgRegex, (match, p1, src, name, ext) => {
            // p1 is the content before and after src inside the tag
            // src is the full src URL, e.g. assets/images/logo.png
            // name is 'logo', ext is 'png'
            
            // Check if we have dimensions for this image
            const dim = dimensionsMap[name];
            let newTag = match;

            if (dim) {
                // Change extension to webp
                newTag = match.replace(src, src.substring(0, src.lastIndexOf('.')) + '.webp');
                
                // Add width if missing
                if (!newTag.includes('width=')) {
                    newTag = newTag.replace(/<img\s+/i, `<img width="${dim.width}" height="${dim.height}" `);
                }
                
                // Add lazy loading if not already there and if it's not the logo/hero which should be eager
                // To keep it simple, we just add dimensions and webp. The report says we need dimensions.
            }
            return newTag;
        });

        if (content !== fs.readFileSync(htmlPath, 'utf8')) {
            fs.writeFileSync(htmlPath, content, 'utf8');
            console.log(`Updated ${htmlFile}`);
        }
    });

    console.log('All done!');
}

processImages();
