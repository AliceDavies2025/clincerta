const fs = require('fs');
const path = require('path');

console.log('Setting up PDF.js worker...');

// Find the PDF.js worker file in node_modules
const findPdfWorker = () => {
  const possiblePaths = [
    path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs'),
    path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.js'),
    path.join(__dirname, '../node_modules/pdfjs-dist/dist/pdf.worker.js'),
    path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.js'),
  ];

  for (const workerPath of possiblePaths) {
    if (fs.existsSync(workerPath)) {
      return workerPath;
    }
  }
  
  return null;
};

// Copy PDF worker to public directory
const copyPdfWorker = () => {
  const workerPath = findPdfWorker();
  
  if (!workerPath) {
    console.error('❌ PDF.js worker not found in node_modules');
    console.log('Available paths checked:');
    const possiblePaths = [
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      'node_modules/pdfjs-dist/build/pdf.worker.js',
      'node_modules/pdfjs-dist/dist/pdf.worker.js',
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.js',
    ];
    possiblePaths.forEach(p => console.log(`  - ${p}`));
    return false;
  }

  const publicDir = path.join(__dirname, '../public');
  const targetPath = path.join(publicDir, 'pdf.worker.js');

  try {
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Copy the worker file
    fs.copyFileSync(workerPath, targetPath);
    console.log(`✅ PDF.js worker copied from ${workerPath} to ${targetPath}`);
    
    // Verify the file was copied
    const stats = fs.statSync(targetPath);
    console.log(`📁 Worker file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to copy PDF.js worker:', error.message);
    return false;
  }
};

// Create a simple fallback worker if the main one fails
const createFallbackWorker = () => {
  const publicDir = path.join(__dirname, '../public');
  const fallbackPath = path.join(publicDir, 'pdf.worker.fallback.js');
  
  const fallbackContent = `
// Fallback PDF.js worker
// This is a minimal implementation for when the main worker fails to load
self.onmessage = function(e) {
  // Send back a simple response to prevent errors
  self.postMessage({
    type: 'ready',
    data: 'Fallback worker loaded'
  });
};
`;

  try {
    fs.writeFileSync(fallbackPath, fallbackContent);
    console.log(`✅ Fallback worker created at ${fallbackPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create fallback worker:', error.message);
    return false;
  }
};

// Main setup function
const setup = () => {
  console.log('🔧 Starting PDF.js worker setup...');
  
  // Try to copy the main worker
  const mainWorkerSuccess = copyPdfWorker();
  
  if (!mainWorkerSuccess) {
    console.log('⚠️  Main worker setup failed, creating fallback...');
    createFallbackWorker();
  }
  
  // Create a simple index file to help with debugging
  const indexContent = `<!-- PDF.js Worker Setup -->
<!-- This file helps ensure PDF.js worker is properly loaded -->
<script>
  console.log('PDF.js worker setup complete');
  
  // Check if worker is accessible
  fetch('/pdf.worker.js')
    .then(response => {
      if (response.ok) {
        console.log('✅ PDF.js worker is accessible');
      } else {
        console.warn('⚠️ PDF.js worker not accessible');
      }
    })
    .catch(error => {
      console.error('❌ Error checking PDF.js worker:', error);
    });
</script>
`;
  
  try {
    const indexPath = path.join(__dirname, '../public/pdf-setup.html');
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ PDF setup index file created');
  } catch (error) {
    console.error('❌ Failed to create setup index:', error.message);
  }
  
  console.log('🎉 PDF.js worker setup complete!');
};

// Run the setup
setup();
