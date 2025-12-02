# Apple Pay Domain Verification Setup

## ✅ Setup Complete

The Apple Pay domain verification file has been added to your project.

### File Location:
```
public/.well-known/apple-developer-merchantid-domain-association
```

### Will be accessible at:
```
https://harthio.com/.well-known/apple-developer-merchantid-domain-association
```

---

## 🧪 Testing

### Local Test (after deploying):
```bash
curl https://harthio.com/.well-known/apple-developer-merchantid-domain-association
```

Should return the verification file content (long hex string starting with `7B227073704964...`)

### Or test in browser:
Visit: https://harthio.com/.well-known/apple-developer-merchantid-domain-association

---

## 📋 Next Steps

1. **Commit the file**:
   ```bash
   git add public/.well-known/
   git commit -m "Add Apple Pay domain verification file"
   git push origin develop
   ```

2. **Deploy to production** (after database migration)

3. **Verify in Apple Developer Console**:
   - Go to Apple Developer → Certificates, Identifiers & Profiles
   - Select your Merchant ID
   - Add domain: `harthio.com`
   - Apple will verify the file automatically

4. **Wait for verification** (can take a few minutes)

---

## 🔧 Troubleshooting

### File not accessible after deploy?
- Check Vercel deployment logs
- Verify file exists in `public/.well-known/` directory
- Try clearing browser cache

### Apple verification failing?
- Ensure file has no file extension
- Ensure file content is exactly as provided by Apple
- Check file is accessible via HTTPS (not HTTP)

---

## ✅ Status

- [x] File copied to `public/.well-known/`
- [ ] Committed to git
- [ ] Deployed to production
- [ ] Verified in Apple Developer Console

---

**Ready to commit when you are!**
