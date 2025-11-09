# 📱 Mobile Video Testing Guide

## 🚨 **CRITICAL**: Mobile browsers require HTTPS for camera/microphone access

## **Option 1: ngrok (Easiest)**

1. **One-time setup**:
   ```bash
   npm install -g ngrok
   ngrok config add-authtoken 34nud7HIjW0kq8qHpPhP6JjqlPo_3tH1VEwD4yyVYgoHfgwDK
   ```

2. **Start testing**:
   ```bash
   npm run dev          # Terminal 1
   npm run mobile:ngrok # Terminal 2
   ```
   Use the HTTPS ngrok URL on your mobile device.

## **Option 2: Local HTTPS (Ready!)**

✅ **Setup Complete!** Certificates are installed and ready.

**Start HTTPS development server:**
```bash
npm run dev:https
```

**Access from mobile:**
- `https://10.0.0.2:3000` (WiFi network)
- `https://172.20.10.2:3000` (Mobile hotspot network)
- `https://localhost:3000` (local only)

**No security warnings!** Certificates are properly trusted.

## **Recommendation: Use ngrok (Option 1)**
- ✅ Works reliably on all platforms
- ✅ No certificate issues
- ✅ Easy to share with others
- ✅ Proper HTTPS that mobile browsers trust

## **Quick Start (Recommended)**
```bash
npm run dev          # Terminal 1
npm run mobile:ngrok # Terminal 2
```
Then use the ngrok HTTPS URL on your mobile device.

### **Troubleshooting**

- **"Camera access denied"**: Allow permissions when prompted
- **"No video"**: Close other apps using camera
- **"Connection failed"**: Try refreshing the page
- **ngrok not working**: Check if auth token is set correctly
- **Certificate errors**: Use ngrok instead of local HTTPS
- **"dev:https failed"**: This is normal on Windows, use ngrok