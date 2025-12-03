const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simple self-signed certificate generator using Node.js
const forge = require('node-forge');

console.log('🔐 Generating self-signed SSL certificates...\n');

// Generate a keypair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a certificate
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{
  name: 'commonName',
  value: 'localhost'
}, {
  name: 'countryName',
  value: 'US'
}, {
  shortName: 'ST',
  value: 'State'
}, {
  name: 'localityName',
  value: 'City'
}, {
  name: 'organizationName',
  value: 'Harthio'
}, {
  shortName: 'OU',
  value: 'Development'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([{
  name: 'basicConstraints',
  cA: true
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: 'extKeyUsage',
  serverAuth: true,
  clientAuth: true,
  codeSigning: true,
  emailProtection: true,
  timeStamping: true
}, {
  name: 'nsCertType',
  server: true,
  client: true,
  email: true,
  objsign: true,
  sslCA: true,
  emailCA: true,
  objCA: true
}, {
  name: 'subjectAltName',
  altNames: [{
    type: 2, // DNS
    value: 'localhost'
  }, {
    type: 7, // IP
    ip: '127.0.0.1'
  }, {
    type: 7, // IP
    ip: '::1'
  }]
}]);

// Self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM format
const pemCert = forge.pki.certificateToPem(cert);
const pemKey = forge.pki.privateKeyToPem(keys.privateKey);

// Ensure .certs directory exists
const certsDir = path.join(__dirname, '.certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Write files
fs.writeFileSync(path.join(certsDir, 'localhost.crt'), pemCert);
fs.writeFileSync(path.join(certsDir, 'localhost.key'), pemKey);

console.log('✅ Certificates generated successfully!\n');
console.log('   📁 Location: .certs/');
console.log('   📄 localhost.crt (certificate)');
console.log('   🔑 localhost.key (private key)\n');
console.log('You can now run: npm run dev:https\n');
