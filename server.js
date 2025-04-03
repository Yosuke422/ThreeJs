import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Define content types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.fbx': 'application/octet-stream'
};

// Custom middleware to handle module scripts and set proper MIME types
app.use((req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  
  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }
  
  // For JavaScript files, explicitly set them as modules
  if (ext === '.js' || ext === '.mjs') {
    // For type="module" scripts, ensure proper MIME type
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  }
  
  next();
});

// Properly serve static files
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    // Ensure module scripts are properly served
    if (ext === '.js' || ext === '.mjs') {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
  }
}));

// Special handling for Three.js modules from node_modules
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Handle JavaScript module imports specifically
app.get('*.js', (req, res, next) => {
  const filePath = path.join(__dirname, req.url);
  
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.sendFile(filePath);
  } else {
    next();
  }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle server errors and try alternative ports if needed
const startServer = (port) => {
  try {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Open your browser and navigate to http://localhost:${port}`);
    });
    
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', e);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    if (port < 3010) { // Try up to port 3010
      startServer(port + 1);
    }
  }
};

startServer(PORT); 