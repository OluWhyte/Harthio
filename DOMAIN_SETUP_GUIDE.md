# Custom Domain Setup Guide for Harthio.com

## 🌐 Complete Step-by-Step Guide

### **Step 1: Add Domain in Vercel Dashboard**

1. **Go to Vercel Dashboard**:

   - Open [vercel.com](https://vercel.com) in your browser
   - Login to your account
   - Find and click on your **harthio** project

2. **Navigate to Domain Settings**:

   - Click the **Settings** tab (top navigation)
   - Click **Domains** in the left sidebar
   - You'll see your current Vercel URL listed

3. **Add Custom Domain**:

   - Click the **Add** button (or **Add Domain**)
   - Enter: `harthio.com`
   - Click **Add**

4. **Get DNS Configuration**:

   - Vercel will show you the DNS records you need to configure
   - **IMPORTANT**: Copy these exact values - they'll look like:

   ```
   Type: A
   Name: @ (or blank)
   Value: 76.76.19.61 (example IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### **Step 2: Configure DNS at Your Domain Registrar**

**Where did you buy harthio.com?** (GoDaddy, Namecheap, Cloudflare, etc.)

#### **For GoDaddy:**

1. Login to [godaddy.com](https://godaddy.com)
2. Go to **My Products** → **DNS**
3. Find **harthio.com** and click **DNS**
4. Add/Edit these records:
   - **A Record**: Name: `@`, Value: `[IP from Vercel]`
   - **CNAME Record**: Name: `www`, Value: `[CNAME from Vercel]`

#### **For Namecheap:**

1. Login to [namecheap.com](https://namecheap.com)
2. Go to **Domain List** → **Manage** next to harthio.com
3. Click **Advanced DNS**
4. Add these records:
   - **A Record**: Host: `@`, Value: `[IP from Vercel]`
   - **CNAME Record**: Host: `www`, Value: `[CNAME from Vercel]`

#### **For Cloudflare:**

1. Login to [cloudflare.com](https://cloudflare.com)
2. Select **harthio.com** domain
3. Go to **DNS** → **Records**
4. Add these records:
   - **A**: Name: `@`, IPv4: `[IP from Vercel]`, Proxy: OFF
   - **CNAME**: Name: `www`, Target: `[CNAME from Vercel]`, Proxy: OFF

### **Step 3: Verify Domain Setup**

1. **Wait for DNS Propagation** (5-30 minutes)
2. **Check in Vercel Dashboard**:
   - Go back to your project's **Domains** section
   - You should see `harthio.com` with a green checkmark
3. **Test the Domain**:
   - Visit `https://harthio.com`
   - Visit `https://www.harthio.com`
   - Both should redirect to your Harthio app

### **Step 4: Update Environment Variables**

Update your production URL in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_APP_URL`
3. Update the value to: `https://harthio.com`
4. Redeploy your app

### **Step 5: SSL Certificate**

Vercel automatically provisions SSL certificates for custom domains:

- ✅ `https://harthio.com` - Secure
- ✅ `https://www.harthio.com` - Secure
- ✅ Automatic redirects from HTTP to HTTPS

## 🚨 **Common Issues & Solutions**

### **DNS Not Propagating**

- Wait up to 24 hours for full propagation
- Use [whatsmydns.net](https://whatsmydns.net) to check propagation status
- Clear your browser cache

### **Domain Shows "Not Found"**

- Double-check DNS records match exactly what Vercel provided
- Ensure there are no extra spaces in DNS values
- Verify the domain is pointing to the correct Vercel project

### **SSL Certificate Issues**

- Vercel handles SSL automatically
- If you see SSL errors, wait 10-15 minutes for certificate provisioning
- Contact Vercel support if SSL issues persist after 1 hour

### **Redirect Issues**

- Make sure both `@` and `www` records are configured
- Vercel automatically handles www redirects

## 📋 **Verification Checklist**

- [ ] Domain added in Vercel Dashboard
- [ ] DNS A record configured for `@` (root domain)
- [ ] DNS CNAME record configured for `www`
- [ ] DNS propagation complete (check with dig or online tools)
- [ ] `https://harthio.com` loads your app
- [ ] `https://www.harthio.com` redirects to main domain
- [ ] SSL certificate is active (green lock in browser)
- [ ] Mobile video calling works on custom domain

## 🎉 **Success!**

Once complete, your users can access Harthio at:

- **https://harthio.com** - Main domain
- **https://www.harthio.com** - Redirects to main

All mobile video calling features will work perfectly with the custom domain and SSL certificate!

## 🆘 **Need Help?**

If you encounter issues:

1. Check the DNS records match exactly what Vercel provided
2. Wait for DNS propagation (up to 24 hours)
3. Contact your domain registrar's support if DNS issues persist
4. Contact Vercel support for platform-specific issues
