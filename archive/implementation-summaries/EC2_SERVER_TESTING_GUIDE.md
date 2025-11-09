# EC2 Server Testing Guide

## 🎯 Quick Server Status Check

I've created several tools to help you test your TURN/STUN and Jitsi servers:

### 1. **Browser-Based Testing** (Most Comprehensive)
```
http://localhost:3000/debug/servers
```
This will test:
- ✅ STUN server connectivity with actual ICE gathering
- ✅ TURN server relay candidate generation  
- ✅ Jitsi Meet API accessibility
- ✅ Response times and detailed error messages

### 2. **Command Line Testing**
```bash
# Make script executable
chmod +x scripts/check-ec2-servers.sh

# Run basic connectivity tests
./scripts/check-ec2-servers.sh

# Or run Node.js version
node scripts/test-servers.js
```

### 3. **Manual Testing Commands**

**Test Jitsi Meet:**
```bash
curl -I https://meet.jit.si
curl -I https://meet.jit.si/external_api.js
```

**Test STUN/TURN Ports:**
```bash
# Test if ports are open
nc -zv stun.l.google.com 19302
nc -zv openrelay.metered.ca 80
nc -zv openrelay.metered.ca 443
```

**Test Your EC2 Instances:**
```bash
# Replace with your EC2 public IP
nc -zv YOUR_EC2_IP 3478  # TURN server
nc -zv YOUR_EC2_IP 80    # HTTP
nc -zv YOUR_EC2_IP 443   # HTTPS
```

## 🔍 What to Check

### EC2 Instance Status
1. **Instance Running**: Check AWS console
2. **Security Groups**: Ensure ports are open
   - Port 3478 (TURN/STUN)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 10000-20000 (RTP media - if using Jitsi)

### Common Issues with Free EC2

**T2.micro Limitations:**
- Limited CPU credits
- Network performance: Low to Moderate
- May throttle under load

**Security Group Settings:**
```
Inbound Rules:
- Port 80: 0.0.0.0/0 (HTTP)
- Port 443: 0.0.0.0/0 (HTTPS)  
- Port 3478: 0.0.0.0/0 (TURN/STUN)
- Port 10000-20000: 0.0.0.0/0 (RTP for Jitsi)
```

**Elastic IP:**
- Free tier includes 1 Elastic IP
- Ensure it's attached to your instance

## 🚨 Troubleshooting

### If TURN Server Fails:
```bash
# Check if coturn is running
sudo systemctl status coturn

# Check coturn logs
sudo journalctl -u coturn -f

# Test TURN server manually
turnutils_uclient -T -u username -w password YOUR_EC2_IP
```

### If Jitsi Fails:
```bash
# Check if Jitsi services are running
sudo systemctl status jicofo
sudo systemctl status jitsi-videobridge2
sudo systemctl status prosody

# Check Jitsi logs
sudo tail -f /var/log/jitsi/jicofo.log
sudo tail -f /var/log/jitsi/jvb.log
```

### If Ports Are Closed:
```bash
# Check what's listening on ports
sudo netstat -tlnp | grep :3478
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 📊 Expected Results

### Working STUN Server:
```
✅ stun.l.google.com:19302 - Connected (50ms)
✅ ICE candidates generated
✅ Server reflexive candidates found
```

### Working TURN Server:
```
✅ turn:server:3478 - Connected (100ms)
✅ Relay candidates generated
✅ Authentication successful
```

### Working Jitsi:
```
✅ https://meet.jit.si - 200 OK (200ms)
✅ external_api.js - Loaded successfully
✅ WebRTC connection established
```

## 🎯 Quick Diagnosis

### Run This First:
1. Go to `http://localhost:3000/debug/servers`
2. Wait for all tests to complete
3. Check the summary at the bottom

### If All Tests Fail:
- Check internet connection
- Verify EC2 instances are running
- Check AWS billing (free tier limits)

### If Only TURN Fails:
- Check coturn configuration
- Verify credentials
- Test with different TURN servers

### If Only Jitsi Fails:
- Check Jitsi installation
- Verify SSL certificates
- Test with meet.jit.si directly

## 💡 Recommendations

### For Production:
1. **Use multiple TURN servers** for redundancy
2. **Monitor server resources** (CPU, memory, bandwidth)
3. **Set up health checks** and alerts
4. **Consider paid hosting** for better reliability

### For Testing:
1. **Start with public servers** (Google STUN, OpenRelay TURN)
2. **Test with multiple browsers** and devices
3. **Check from different networks** (WiFi, mobile data)
4. **Monitor WebRTC connection stats** in browser

The browser-based tool at `/debug/servers` will give you the most accurate results for WebRTC connectivity!