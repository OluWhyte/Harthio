#!/usr/bin/env node

/**
 * Local LiveKit Setup Script
 * Sets up a local LiveKit server for testing before Railway deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local LiveKit server for testing...\n');

// Check if Docker is installed
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is installed');
} catch (error) {
  console.error('❌ Docker is not installed. Please install Docker Desktop first.');
  console.log('   Download from: https://www.docker.com/products/docker-desktop');
  process.exit(1);
}

// Generate API keys for local testing
const crypto = require('crypto');
const apiKey = crypto.randomBytes(16).toString('hex');
const apiSecret = crypto.randomBytes(32).toString('hex');

console.log('🔑 Generated API keys for local testing:');
console.log(`   API Key: ${apiKey}`);
console.log(`   API Secret: ${apiSecret}\n`);

// Create local environment file
const localEnvContent = `# Local LiveKit Testing Configuration
# Add these to your .env.local for testing

LIVEKIT_API_KEY=${apiKey}
LIVEKIT_API_SECRET=${apiSecret}
LIVEKIT_SERVER_URL=ws://localhost:7880
NEXT_PUBLIC_LIVEKIT_SERVER_URL=ws://localhost:7880
`;

fs.writeFileSync('.env.livekit.local', localEnvContent);
console.log('📝 Created .env.livekit.local with test credentials');

// Create docker-compose for local LiveKit
const dockerComposeContent = `version: '3.8'

services:
  livekit:
    image: livekit/livekit-server:latest
    ports:
      - "7880:7880"
      - "7881:7881"
    environment:
      - LIVEKIT_KEYS=${apiKey}:${apiSecret}
    volumes:
      - ./livekit-backend/livekit.yaml:/etc/livekit.yaml
    command: ["livekit-server", "--config", "/etc/livekit.yaml", "--bind", "0.0.0.0"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7880/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`;

fs.writeFileSync('docker-compose.livekit.yml', dockerComposeContent);
console.log('📦 Created docker-compose.livekit.yml for local server');

// Create local testing script
const testScriptContent = `#!/usr/bin/env node

/**
 * Local LiveKit Test Script
 */

const { spawn } = require('child_process');

console.log('🧪 Starting local LiveKit testing environment...');

// Start Docker Compose
console.log('📦 Starting LiveKit server...');
const docker = spawn('docker-compose', ['-f', 'docker-compose.livekit.yml', 'up'], {
  stdio: 'inherit'
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\\n🛑 Stopping LiveKit server...');
  spawn('docker-compose', ['-f', 'docker-compose.livekit.yml', 'down'], {
    stdio: 'inherit'
  });
  process.exit(0);
});

docker.on('close', (code) => {
  console.log(\`LiveKit server exited with code \${code}\`);
});
`;

fs.writeFileSync('scripts/test-livekit-local.js', testScriptContent);
fs.chmodSync('scripts/test-livekit-local.js', '755');
console.log('🧪 Created local testing script');

console.log('\n🎯 Next Steps:');
console.log('1. Add the credentials from .env.livekit.local to your .env.local');
console.log('2. Start the local LiveKit server: npm run livekit:local');
console.log('3. Start your Next.js app: npm run dev');
console.log('4. Test video calling at: http://localhost:3000/session/[sessionId]');
console.log('\n✨ Ready for local testing!');