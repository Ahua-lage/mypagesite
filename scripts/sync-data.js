import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

function mkdirp(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory not found: ${src}`);
    return;
  }
  
  mkdirp(dest);
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source file not found: ${src}`);
    return;
  }
  
  const destDir = path.dirname(dest);
  mkdirp(destDir);
  fs.copyFileSync(src, dest);
}

try {
  console.log('Syncing data...');
  
  mkdirp(path.join(rootDir, 'public', 'book-covers'));
  mkdirp(path.join(rootDir, 'public', 'bookmark-covers'));
  mkdirp(path.join(rootDir, 'src', 'data'));
  
  copyDir(
    path.join(rootDir, 'data', 'output', 'book-covers'),
    path.join(rootDir, 'public', 'book-covers'));
    
  copyDir(
    path.join(rootDir, 'data', 'output', 'bookmark-covers'),
    path.join(rootDir, 'public', 'bookmark-covers'));
    
  copyFile(
    path.join(rootDir, 'data', 'output', 'books.json'),
    path.join(rootDir, 'src', 'data', 'books.json'));
    
  copyFile(
    path.join(rootDir, 'data', 'output', 'bookmarks.json'),
    path.join(rootDir, 'src', 'data', 'bookmarks.json'));
    
  console.log('Data sync completed successfully!');
} catch (error) {
  console.log('Data sync completed with warnings:', error.message);
}
