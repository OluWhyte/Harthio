# Mobile Testing Guide for Harthio

This guide helps you test video calling features on mobile devices during development.

## 🚨 IMPORTANT: HTTPS Required for Mobile

Mobile browsers require HTTPS for camera/microphone access. We provide two solutions:

## Option 1: HTTPS with Self-Signed Certificates (Recommended)

### Quick Start
```bash
# Generate certificates and start HTTPS server
npm run mobile:https
```

This will:
1. Generate self-signed certificates
2. Configure Next.js for HTTPS
3. Start the development server with HTTPS
4. Display network URLs for mobile access

### Mobile Access Steps
1. Connect your mobile device to the same WiFi network
2. Open browser and go to: `https://[YOUR-IP]:3000`
3. **Accept Security Warning**: Click "Advanced" → "Proceed to [IP] (unsafe)"
4. Allow camera/microphone permissions when prompted
5. Create/join a session to test video calling

### Security Warning Handling
Your browser will show a security warning because we use self-signed certificates. This is normal for development:

**iOS Safari:**
- Tap "Advanced" → "Proceed to [website]"

**Android Chrome:**
- Tap "Advanced" → "Proceed to [IP] (unsafe)"

## Option 2: ngrok Tunnel (Alternative)

If you have ngrok installed:

```bash
# Show ngrok setup instructions
npm run mobile:ngrok

# Or manually:
# Terminal 1: Start regular dev server
npm run dev:mobile

# Terminal 2: Create HTTPS tunnel
ngrok http 3000
```

Use the HTTPS URL provided by ngrok on your mobile device.

## Option 3: HTTP (Limited - Desktop Only)

For desktop testing only:
```bash
npm run dev:mobile
```

**Note**: This won't work on mobile browsers due to security restrictions.

## Network Access

### Finding Your Network IP
The setup script automatically detects your network IP. Common formats:
- `192.168.1.xxx` (home networks)  
- `172.20.10.xxx` (mobile hotspots)
- `10.0.0.xxx` (corporate networks)

### Firewall Configuration
If mobile devices can't connect, allow Node.js through Windows Firewall:
```bash
# Run as administrator
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000
```

## Mobile Browser Compatibility

### Recommended Browsers
- **iOS**: Safari (best compatibility)
- **Android**: Chrome (best compatibility)

### Known Issues
- **iOS Safari**: Requires user interaction to start media
- **Android Chrome**: May need permissions reset if blocked
- **Firefox Mobile**: Limited WebRTC support

## Troubleshooting

### Can't Connect to Server
1. ✅ Check both devices are on same WiFi network
2. ✅ Disable VPN on both devices  
3. ✅ Check firewall settings (Windows may block Node.js)
4. ✅ Try HTTPS option: `npm run mobile:https`

### "Media Not Supported" Error
This usually means you're using HTTP instead of HTTPS:
1. ✅ Use HTTPS option: `npm run mobile:https`
2. ✅ Accept security warning on mobile browser
3. ✅ Try different browser (Chrome/Safari work best)

### Camera/Microphone Not Working
1. ✅ **Use HTTPS**: Required for mobile browsers
2. ✅ **Check Permissions**: Ensure browser has camera/mic access
3. ✅ **Refresh Page**: Sometimes permissions need a refresh
4. ✅ **Try Different Browser**: Chrome/Safari work best
5. ✅ **Check Other Apps**: Close apps using camera/mic
6. ✅ **Restart Browser**: Clear cache and restart

### Certificate Errors
1. ✅ **Accept Warning**: Click "Advanced" → "Proceed to site"
2. ✅ **Clear Browser Cache**: Try incognito/private mode
3. ✅ **Regenerate Certificates**: `npm run mobile:https -- --regenerate`

### Poor Video Quality
1. ✅ **Move Closer to Router**: Better WiFi signal improves quality
2. ✅ **Close Other Apps**: Free up device resources  
3. ✅ **Lower Resolution**: App automatically adjusts for mobile

### Connection Fails
1. ✅ **Check Network**: Ensure stable WiFi connection
2. ✅ **Restart App**: Refresh both browser windows
3. ✅ **Check Firewall**: Ensure WebRTC traffic isn't blocked
4. ✅ **Try Different Network**: Some corporate networks block WebRTC

## Development Tips

### Testing Multiple Devices
1. Open the HTTPS network URL on multiple mobile devices
2. Create a session on one device
3. Join from another device to test peer-to-peer connection

### Debugging
- Open browser developer tools on mobile (if available)
- Check console for error messages
- Use the debug info component (shows automatically on mobile)
- Visit `/debug-media` for detailed media testing

### Performance Testing
- Test with different network conditions
- Try with multiple participants
- Monitor CPU/memory usage on mobile devices

## Commands Reference

```bash
# HTTPS mobile testing (recommended)
npm run mobile:https

# Regenerate certificates
npm run mobile:https -- --regenerate

# ngrok alternative
npm run mobile:ngrok

# HTTP only (desktop testing)
npm run dev:mobile

# Setup mobile testing environment
npm run mobile:setup
```

## Security Notes

- Development server only accessible on local network
- Self-signed certificates are safe for development
- Camera/microphone access requires user permission
- HTTPS is required for mobile browser media access

## Production Deployment

When deploying to production:
1. ✅ Ensure valid HTTPS certificate (Let's Encrypt, etc.)
2. ✅ Configure proper TURN servers for NAT traversal
3. ✅ Test on various mobile devices and networks
4. ✅ Monitor WebRTC connection quality and fallbacks