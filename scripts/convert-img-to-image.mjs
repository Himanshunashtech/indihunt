/**
 * Script to convert raw <img> tags to Next.js <Image> components
 * across the IndiHunt codebase.
 * 
 * Run: node scripts/convert-img-to-image.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

// Files to skip (embed code strings, non-React contexts)
const SKIP_PATTERNS = [
  /embedCode/,          // embed HTML strings
  /`<.*img.*>`/,        // template literal strings containing img
  /LaunchScheduleWidget/  // embed widget
];

function findTsxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Parse dimensions from className
function getDimensionsFromClass(className) {
  const wMatch = className?.match(/w-(\d+)/);
  const hMatch = className?.match(/h-(\d+)/);
  
  const tailwindToPixel = {
    '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32,
    '9': 36, '10': 40, '11': 44, '12': 48, '14': 56, '16': 64,
    '20': 80, '24': 96, '28': 112, '32': 128, '36': 144, '40': 160,
    '44': 176, '48': 192,
  };
  
  const w = wMatch ? (tailwindToPixel[wMatch[1]] || parseInt(wMatch[1]) * 4) : null;
  const h = hMatch ? (tailwindToPixel[hMatch[1]] || parseInt(hMatch[1]) * 4) : null;
  
  return { width: w || 48, height: h || 48 };
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(srcDir, filePath);
  
  // Check if file has any <img tags
  if (!content.includes('<img')) return { file: relativePath, changed: false };
  
  // Skip certain files
  if (filePath.includes('LaunchScheduleWidget')) return { file: relativePath, changed: false, reason: 'skip-embed' };
  
  let changes = 0;
  
  // Check if Image is already imported
  const hasImageImport = /import\s+Image\s+from\s+["']next\/image["']/.test(content);
  
  // Match single-line <img ... /> tags
  const singleLineImgRegex = /(<img\s+[^>]*\/>)/g;
  
  // Match multi-line <img ... /> tags  
  const multiLineImgRegex = /(<img\s*\n(?:[^>]*\n)*?[^>]*\/>)/g;
  
  const lines = content.split('\n');
  const newLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip lines inside template literals (embed code)
    if (line.includes('`') && line.includes('<img')) {
      newLines.push(line);
      i++;
      continue;
    }
    
    // Check for single-line <img ... />
    if (line.includes('<img') && line.includes('/>')) {
      // Extract className for dimensions
      const classMatch = line.match(/className="([^"]*)"/);
      const className = classMatch ? classMatch[1] : '';
      const { width, height } = getDimensionsFromClass(className);
      
      // Check if it already has width/height attributes
      const hasWidth = /\bwidth[={]/.test(line);
      const hasHeight = /\bheight[={]/.test(line);
      
      // Remove onError handlers from single-line (rare but possible)
      let newLine = line;
      
      // Replace <img with <Image and add width/height if missing
      newLine = newLine.replace('<img', '<Image');
      
      if (!hasWidth) {
        newLine = newLine.replace('/>', `width={${width}} />`);
      }
      if (!hasHeight) {
        newLine = newLine.replace('/>', `height={${height}} />`);
      }
      
      newLines.push(newLine);
      changes++;
      i++;
      continue;
    }
    
    // Check for multi-line <img ... />
    if (line.includes('<img') && !line.includes('/>')) {
      // Collect all lines of this tag
      const tagLines = [line];
      let j = i + 1;
      while (j < lines.length && !lines[j].includes('/>')) {
        tagLines.push(lines[j]);
        j++;
      }
      if (j < lines.length) {
        tagLines.push(lines[j]); // closing />
      }
      
      const fullTag = tagLines.join('\n');
      
      // Skip if inside template literal
      if (fullTag.includes('`')) {
        newLines.push(...tagLines);
        i = j + 1;
        continue;
      }
      
      // Extract className
      const classMatch = fullTag.match(/className="([^"]*)"/);
      const className = classMatch ? classMatch[1] : '';
      const { width, height } = getDimensionsFromClass(className);
      
      // Check existing width/height
      const hasWidth = /\bwidth[={"{\d]/.test(fullTag);
      const hasHeight = /\bheight[={"{\d]/.test(fullTag);
      
      // Remove onError handler lines
      const filteredLines = [];
      let skipOnError = false;
      for (const tl of tagLines) {
        if (tl.includes('onError=')) {
          skipOnError = true;
          // Check if single-line onError
          if (tl.includes('}') && tl.match(/\}\}/)) {
            skipOnError = false;
            continue;
          }
          continue;
        }
        if (skipOnError) {
          if (tl.includes('}}')) {
            skipOnError = false;
          }
          continue;
        }
        filteredLines.push(tl);
      }
      
      // Replace <img with <Image
      filteredLines[0] = filteredLines[0].replace('<img', '<Image');
      
      // Add width/height before closing />
      const lastIdx = filteredLines.length - 1;
      if (!hasWidth) {
        filteredLines[lastIdx] = filteredLines[lastIdx].replace('/>', `width={${width}} />`);
      }
      if (!hasHeight) {
        filteredLines[lastIdx] = filteredLines[lastIdx].replace('/>', `height={${height}} />`);
      }
      
      newLines.push(...filteredLines);
      changes++;
      i = j + 1;
      continue;
    }
    
    newLines.push(line);
    i++;
  }
  
  if (changes > 0) {
    let newContent = newLines.join('\n');
    
    // Add Image import if not present
    if (!hasImageImport) {
      // Try to add after existing next/ imports
      if (newContent.includes('from "next/link"')) {
        newContent = newContent.replace(
          'from "next/link";',
          'from "next/link";\nimport Image from "next/image";'
        );
      } else if (newContent.includes("from 'next/link'")) {
        newContent = newContent.replace(
          "from 'next/link';",
          "from 'next/link';\nimport Image from 'next/image';"
        );
      } else {
        // Add after "use client" or at top
        if (newContent.includes('"use client"')) {
          newContent = newContent.replace(
            '"use client";',
            '"use client";\n\nimport Image from "next/image";'
          );
        } else {
          newContent = 'import Image from "next/image";\n' + newContent;
        }
      }
    }
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ ${relativePath}: ${changes} <img> → <Image> conversions`);
    return { file: relativePath, changed: true, count: changes };
  }
  
  return { file: relativePath, changed: false };
}

// Find all .tsx files
const files = findTsxFiles(srcDir);
console.log(`Found ${files.length} .tsx files to scan\n`);

let totalChanges = 0;
let filesChanged = 0;

for (const file of files) {
  const result = processFile(file);
  if (result.changed) {
    totalChanges += result.count;
    filesChanged++;
  }
}

console.log(`\n🎉 Done! Converted ${totalChanges} <img> tags across ${filesChanged} files.`);
console.log(`\nIMPORTANT: Run 'npx tsc --noEmit' to check for type errors.`);
