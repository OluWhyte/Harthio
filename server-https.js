const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost+3-key.pem'),
  cert: fs.readFileSync('./localhost+3.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    
    console.log('🚀 HTTPS Development Server Ready!');
    console.log('');
    console.log('📱 Mobile Access URLs:');
    console.log('   Local:     https://localhost:3000');
    console.log('   Network 1: https://10.0.0.2:3000');
    console.log('   Network 2: https://172.20.10.2:3000');
    console.log('');
    console.log('💡 Use any of the network URLs on your mobile device');
    console.log('   (Make sure your phone is on the same WiFi network)');
    console.log('');
  });
});