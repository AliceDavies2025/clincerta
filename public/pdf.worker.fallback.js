
// Fallback PDF.js worker
// This is a minimal implementation for when the main worker fails to load
self.onmessage = function(e) {
  // Send back a simple response to prevent errors
  self.postMessage({
    type: 'ready',
    data: 'Fallback worker loaded'
  });
};
