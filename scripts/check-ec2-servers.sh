#!/bin/bash

# EC2 Server Health Check Script
# Tests your TURN/STUN and Jitsi servers

echo "🔍 Checking EC2 Server Status"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test HTTP endpoint
test_http() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    if curl -s --max-time 5 --head "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Online${NC}"
        return 0
    else
        echo -e "${RED}❌ Offline${NC}"
        return 1
    fi
}

# Function to test TCP port
test_port() {
    local host=$1
    local port=$2
    local name=$3
    
    echo -n "Testing $name ($host:$port)... "
    
    if timeout 3 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "${GREEN}✅ Open${NC}"
        return 0
    else
        echo -e "${RED}❌ Closed/Timeout${NC}"
        return 1
    fi
}

# Test Jitsi Meet
echo -e "\n${YELLOW}📡 Testing Jitsi Meet${NC}"
test_http "https://meet.jit.si" "Jitsi Meet Main"
test_http "https://meet.jit.si/external_api.js" "Jitsi API"

# Test common STUN/TURN servers
echo -e "\n${YELLOW}🌐 Testing STUN/TURN Servers${NC}"
test_port "stun.l.google.com" "19302" "Google STUN"
test_port "openrelay.metered.ca" "80" "OpenRelay TURN (80)"
test_port "openrelay.metered.ca" "443" "OpenRelay TURN (443)"

# Test your EC2 instances (if you provide the IPs)
echo -e "\n${YELLOW}☁️  Testing EC2 Instances${NC}"
echo -e "${BLUE}Note: Replace these with your actual EC2 instance IPs${NC}"

# Example EC2 tests - replace with your actual IPs
# test_port "your-ec2-ip" "3478" "Your TURN Server"
# test_port "your-ec2-ip" "80" "Your Jitsi HTTP"
# test_port "your-ec2-ip" "443" "Your Jitsi HTTPS"

echo -e "\n${BLUE}💡 To test your EC2 servers:${NC}"
echo "1. Replace 'your-ec2-ip' with your actual EC2 public IP"
echo "2. Uncomment the test lines above"
echo "3. Run this script again"

# Test WebRTC connectivity (requires browser)
echo -e "\n${YELLOW}🔧 For Complete WebRTC Testing:${NC}"
echo "Visit: http://localhost:3000/debug/servers"
echo "This will test actual ICE candidate gathering"

echo -e "\n${YELLOW}📋 Summary:${NC}"
echo "- Basic connectivity tests completed"
echo "- For full WebRTC testing, use the browser tool"
echo "- Check EC2 Security Groups if ports are closed"
echo "- Verify EC2 instances are running"