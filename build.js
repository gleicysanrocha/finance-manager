const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Remove www directory if it exists
  if (fs.existsSync('www')) {
    fs.rmSync('www', { recursive: true, force: true });
  }
  // Create www directory
  fs.mkdirSync('www', { recursive: true });

  // Copy files
  const filesToCopy = ['index.html', 'manifest.json', 'sw.js'];
  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('www', file));
    }
  });

  // Copy directories
  const dirsToCopy = ['js', 'css', 'icons'];
  dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
      copyRecursiveSync(dir, path.join('www', dir));
    }
  });

  console.log('Build completed successfully!');
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
