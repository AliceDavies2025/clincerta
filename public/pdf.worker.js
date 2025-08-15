
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
  