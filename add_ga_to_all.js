const fs = require('fs');
const path = require('path');

const baseDir = 'd:/Bilalmania/scratch/arbeitszeitrechner';

const gaSnippet = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-1EXYYVNZKJ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-1EXYYVNZKJ');
  </script>\n`;

let updatedCount = 0;
let alreadyCount = 0;

function processDir(dir) {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (item.name !== '.git' && item.name !== 'node_modules') {
                processDir(fullPath);
            }
        } else if (item.isFile() && item.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('G-1EXYYVNZKJ') || content.includes('googletagmanager.com/gtag/js')) {
                alreadyCount++;
            } else {
                // Insert right after <head>
                if (content.includes('<head>')) {
                    content = content.replace('<head>', `<head>\n${gaSnippet}`);
                } else if (content.includes('<HEAD>')) {
                    content = content.replace('<HEAD>', `<HEAD>\n${gaSnippet}`);
                } else {
                    console.warn('No <head> tag found in:', item.name);
                    continue;
                }
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Added GA to: ${path.relative(baseDir, fullPath)}`);
                updatedCount++;
            }
        }
    }
}

processDir(baseDir);
console.log(`\nFinished! Updated: ${updatedCount} files. Already had GA: ${alreadyCount} files.`);
