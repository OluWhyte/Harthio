# LiveKit Backend for Railway

This directory contains the LiveKit server configuration for deployment on Railway.

## Setup Instructions

### 1. Railway Deployment

1. Connect your GitHub repo to Railway
2. Create a new service and select this `livekit-backend` folder
3. Railway will automatically detect the Dockerfile and deploy

### 2. Environment Variables

Set these in your Railway dashboard:

```
LIVEKIT_API_KEY=your-generated-api-key
LIVEKIT_API_SECRET=your-generated-secret
PORT=7880
```

### 3. Generate API Keys

You can generate secure API keys using:

```bash
# API Key (32 characters)
openssl rand -hex 16

# API Secret (64 characters) 
openssl rand -hex 32
```

### 4. Domain Setup

Railway will provide you with a domain like:
`https://your-app-name.up.railway.app`

Use this as your `LIVEKIT_SERVER_URL` in your Next.js app.

## Features

- **Auto-sleep**: Saves Railway hours by sleeping after 10 minutes of inactivity
- **Health checks**: Automatic health monitoring
- **Optimized for 1-on-1**: Max 2 participants per room
- **WebRTC optimized**: STUN servers and TCP fallback
- **Auto room cleanup**: Empty rooms cleaned after 10 minutes

## Monitoring

- Health check endpoint: `/health`
- Logs available in Railway dashboard
- Auto-restart on failure

## Cost Optimization

- Uses Railway's free 500 hours/month
- Auto-sleep when not in use
- Lightweight configuration
- No unnecessary features enabled