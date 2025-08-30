const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Define the build directory (adjust this if your build files are elsewhere)
const buildPath = path.join(__dirname, '../build');

// Check if the build directory exists
if (!fs.existsSync(buildPath)) {
  console.error('Build directory does not exist. Please run "npm run build" first.');
  process.exit(1);
}

// Serve static files from the build directory
app.use(express.static(buildPath));

// For any other routes, serve the index.html file (for single page applications)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Get the port from environment variable or use 3000 as fallback
// cPanel will typically set PORT environment variable for Node.js apps
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving content from: ${buildPath}`);
});
