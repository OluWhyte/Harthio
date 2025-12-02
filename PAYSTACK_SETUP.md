# Paystack Payment Setup

## ✅ Setup Complete (Test Mode)

Paystack test credentials have been added to your project.

---

## 🔑 Test Credentials (Already Added)

**In `.env.local`:**
```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_dfd7a6c7a15cf8147acceabf3000daad96f23d3f
PAYSTACK_SECRET_KEY=sk_test_8037b56bfe497701a26cd8f7fbf9b6f83bc5a194
```

---

## 🔗 Webhook Configuration

### Test Webhook URL:
```
https://harthio.com/api/paystack/webhook
```

### How to Set Up in Paystack Dashboard:

1. Go to **Paystack Dashboard** → **Settings** → **Webhooks**
2. Click **Add Webhook URL**
3. Enter: `https://harthio.com/api/paystack/webhook`
4. Click **Save**

### Events to Subscribe To:
- ✅ `charge.success` - Payment successful
- ✅ `subscription.create` - Subscription created
- ✅ `subscription.disable` - Subscription cancelled

---

## 🧪 Testing Payments

### Test Cards (Paystack Test Mode):

**Successful Payment:**
```
Card Number: 4084084084084081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

**Failed Payment:**
```
Card Number: 5060666666666666666
CVV: 123
Expiry: Any future date
```

### Test Flow:
1. User clicks "Upgrade to Pro"
2. Paystack popup opens
3. Enter test card details
4. Payment processes
5. Webhook receives notification
6. User tier upgraded automatically

---

## 📋 What Happens on Payment:

1. **Payment Successful** → Webhook receives `charge.success`
2. **Record Payment** → Saved to `payments` table
3. **Upgrade User** → User tier updated to "pro"
4. **Create Subscription** → Saved to `subscriptions` table (if recurring)

---

## 🔧 Production Setup (Later)

When ready for live payments:

1. **Get Production Keys** from Paystack Dashboard
2. **Add to Vercel** environment variables:
   ```
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
   PAYSTACK_SECRET_KEY=sk_live_...
   ```
3. **Update Webhook URL** in Paystack Dashboard
4. **Test with real card** (small amount first!)

---

## 🛡️ Security Features

✅ **Signature Verification** - Validates webhook authenticity
✅ **HTTPS Only** - Secure communication
✅ **Secret Key Protected** - Never exposed to client
✅ **Database Logging** - All transactions recorded

---

## 📊 Monitoring

### Check Payment Logs:
```sql
-- Recent payments
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Successful payments
SELECT * FROM payments 
WHERE status = 'completed'
ORDER BY created_at DESC;
```

### Check Webhook Logs:
- Vercel Dashboard → Logs → Filter by `/api/paystack/webhook`

---

## 🚨 Troubleshooting

### Webhook not receiving events?
- Check webhook URL is correct in Paystack Dashboard
- Verify webhook is saved and active
- Check Vercel logs for errors

### Payment not upgrading user?
- Check `metadata.user_id` is passed in payment
- Verify user exists in database
- Check webhook logs for errors

### Test card not working?
- Ensure using Paystack test mode
- Use exact test card numbers provided
- Check Paystack dashboard for test mode toggle

---

## ✅ Next Steps

1. **Test locally** (after deploying webhook)
2. **Verify webhook receives events**
3. **Test payment flow end-to-end**
4. **Add production keys when ready**

---

## 📞 Support

**Paystack Documentation:**
- Webhooks: https://paystack.com/docs/payments/webhooks
- Test Cards: https://paystack.com/docs/payments/test-payments
- API Reference: https://paystack.com/docs/api

**Need help?** Check Paystack Dashboard → Support

---

**Status:**
- [x] Test credentials added
- [x] Webhook endpoint created
- [ ] Webhook URL configured in Paystack Dashboard
- [ ] Payment flow tested
- [ ] Production keys added (later)
