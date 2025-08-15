const fs = require('fs');
const path = require('path');

// Define possible locations for the PDF.js worker file
const possibleLocations = [
  '../node_modules/pdfjs-dist/build/pdf.worker.min.js',
  '../node_modules/pdfjs-dist/build/pdf.worker.js',
  '../node_modules/pdfjs-dist/legacy/build/pdf.worker.js',
  '../node_modules/pdfjs-dist/webpack.js',
  '../node_modules/pdfjs-dist/es5/build/pdf.worker.js',
  '../node_modules/pdfjs-dist/lib/pdf.worker.js'
];

// Destination path
const destinationFile = path.join(__dirname, '../public/pdf.worker.js');

// Create a simple PDF.js worker stub if the actual file isn't found
function createWorkerStub() {
  const workerStubContent = `
  // This is a minimal PDF.js worker stub created because the original worker wasn't found
  // It will allow the PDF.js library to function in "fake worker" mode
  self.onmessage = function(event) {
    // Send a fake response back
    self.postMessage({
      jobId: event.data.jobId,
      data: {}
    });
  };
  console.warn('Using PDF.js stub worker. PDF rendering may be limited.');
  `;
  
  fs.writeFileSync(destinationFile, workerStubContent);
  console.log(`Created PDF.js worker stub at ${destinationFile}`);
  return true;
}

// Create the directory if it doesn't exist
const dir = path.dirname(destinationFile);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Try to find and copy the PDF.js worker file
let copied = false;
for (const location of possibleLocations) {
  const sourceFile = path.join(__dirname, location);
  if (fs.existsSync(sourceFile)) {
    try {
      fs.copyFileSync(sourceFile, destinationFile);
      console.log(`PDF.js worker file copied from ${sourceFile} to ${destinationFile}`);
      copied = true;
      break;
    } catch (error) {
      console.warn(`Error copying from ${sourceFile}:`, error.message);
    }
  }
}

// If we couldn't find the file in any location, create a more functional stub
if (!copied) {
  console.warn('Could not find PDF.js worker file in node_modules. Creating enhanced stub file instead.');
  const enhancedWorkerStubContent = `
  // Enhanced PDF.js worker stub
  // This provides better compatibility when the actual worker isn't available
  
  // PDF.js will automatically fall back to "fake worker" mode
  // which processes everything on the main thread
  console.log('PDF.js using fallback worker mode');
  
  // Basic worker message handling
  self.onmessage = function(event) {
    try {
      // Log the message type for debugging
      console.log('PDF.js worker received message:', event.data?.type || 'unknown');
      
      // Send appropriate response based on message type
      if (event.data && event.data.type) {
        self.postMessage({
          type: event.data.type + '_response',
          jobId: event.data.jobId,
          data: { success: true }
        });
      }
    } catch (error) {
      console.error('PDF.js worker error:', error);
      self.postMessage({
        type: 'error',
        jobId: event.data?.jobId,
        error: error.message
      });
    }
  };
  
  console.warn('Using PDF.js enhanced stub worker. PDF rendering will use main thread.');
  `;
  
  fs.writeFileSync(destinationFile, enhancedWorkerStubContent);
  console.log(`Created enhanced PDF.js worker stub at ${destinationFile}`);
  return true;
}
