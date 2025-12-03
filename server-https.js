const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Try to load SSL certificates from multiple locations
let httpsOptions;
try {
  // Try .certs folder first
  if (fs.existsSync('.certs/localhost.key') && fs.existsSync('.certs/localhost.crt')) {
    httpsOptions = {
      key: fs.readFileSync('.certs/localhost.key', 'utf8'),
      cert: fs.readFileSync('.certs/localhost.crt', 'utf8'),
    };
  } 
  // Try mkcert format
  else if (fs.existsSync('localhost+3-key.pem') && fs.existsSync('localhost+3.pem')) {
    httpsOptions = {
      key: fs.readFileSync('localhost+3-key.pem', 'utf8'),
      cert: fs.readFileSync('localhost+3.pem', 'utf8'),
    };
  } else {
    throw new Error('No SSL certificates found. Please generate certificates first.');
  }
} catch (err) {
  console.error('❌ Error loading SSL certificates:', err.message);
  console.log('\n📝 To generate certificates, run:');
  console.log('   npm install -g mkcert');
  console.log('   mkcert -install');
  console.log('   mkcert localhost 127.0.0.1 ::1');
  console.log('\nOr use: npm run dev (without HTTPS)\n');
  process.exit(1);
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
      console.log(`> Local: https://localhost:${port}`);
      console.log(`> Network: https://${getLocalIP()}:${port}`);
    });
});

// Helper to get local IP
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
