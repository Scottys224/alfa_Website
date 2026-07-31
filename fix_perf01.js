const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let totalTagsModified = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to match any img tag and selectively remove srcset and sizes attributes
    // We use a replacer function to process each img tag individually.
    const newContent = content.replace(/<img[^>]+>/gi, (imgTag) => {
        if (imgTag.includes('srcset') || imgTag.includes('sizes')) {
            // Remove srcset attribute (handles both single and double quotes)
            let newTag = imgTag.replace(/\s+srcset=["'][^"']*["']/i, '');
            // Remove sizes attribute (handles both single and double quotes)
            newTag = newTag.replace(/\s+sizes=["'][^"']*["']/i, '');
            totalTagsModified++;
            return newTag;
        }
        return imgTag;
    });

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
}

console.log(`Successfully cleaned up ${totalTagsModified} <img> tags across all HTML files.`);
