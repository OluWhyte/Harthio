# Admin Path-Based Setup Guide

## 🎯 **Overview**

This guide documents the admin setup using path-based routing (`harthio.com/admin`) for better compatibility and easier management. We moved away from subdomain approach due to DNS complexity.

## 🔒 **Security Benefits**

- **Middleware protection**: Admin routes protected by authentication middleware
- **Role-based access**: Only users with admin roles can access admin pages
- **Easier deployment**: No DNS configuration required
- **Better compatibility**: Works with all hosting providers and DNS setups
- **Simpler SSL**: No additional SSL certificates needed

## 🛠 **Current Implementation**

### **Middleware Protection**

The `middleware.ts` file protects all `/admin/*` routes:

```typescript
// Security: Protect admin routes
if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
  // Check authentication token
  // Verify admin role in database
  // Redirect unauthorized users
}
```

### **Admin Routes Structure**

```
/admin/login          - Admin login page
/admin                - Admin dashboard
/admin/users          - User management
/admin/analytics      - Analytics dashboard
/admin/blog           - Blog management
/admin/settings       - Admin settings
```

## 🚀 **Access URLs**

### **Development:**

- Main app: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

### **Production:**

- Main app: `https://harthio.com`
- Admin: `https://harthio.com/admin`

## ✅ **Testing Admin Access**

### **1. Verify Protection:**

```bash
# Should redirect to login
curl https://harthio.com/admin
```

### **2. Test Login:**

```bash
# Should show login page
curl https://harthio.com/admin/login
```

### **3. Test After Login:**

```bash
# Should show admin dashboard (with valid session)
curl -H "Cookie: your-session-cookie" https://harthio.com/admin
```

## 🔧 **Configuration**

### **Environment Variables**

No special admin URL configuration needed. Uses same domain as main app.

### **Database Setup**

Admin roles are managed in the `admin_roles` table:

```sql
-- Check admin users
SELECT ar.*, u.email
FROM admin_roles ar
JOIN users u ON ar.user_id = u.id;
```

## 🎯 **Benefits of Path-Based Approach**

1. **Simpler DNS**: No subdomain configuration needed
2. **Easier SSL**: Single certificate covers all routes
3. **Better SEO**: Admin pages properly excluded via robots.txt
4. **Hosting Friendly**: Works with all hosting providers
5. **Development**: Easier local development setup

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Access Denied" Error:**

   - Check if user has admin role in database
   - Verify authentication token is valid

2. **Redirect Loop:**

   - Clear browser cookies
   - Check middleware logic

3. **404 on Admin Routes:**
   - Verify Next.js routing is working
   - Check if admin pages exist

### **Debug Commands:**

```bash
# Check admin roles
psql -c "SELECT * FROM admin_roles;"

# Check middleware logs
npm run dev # Check console output

# Test authentication
curl -v https://harthio.com/admin
```

## 📝 **Migration Notes**

If you previously set up admin subdomain:

1. **Remove DNS Records**: Delete any `admin.harthio.com` CNAME/A records
2. **Update Bookmarks**: Change `admin.harthio.com` to `harthio.com/admin`
3. **Clear Cache**: Clear browser cache and cookies
4. **Update Documentation**: Any internal docs referencing admin subdomain

## ✅ **Current Status**

- ✅ **Middleware**: Protects admin routes with authentication
- ✅ **Routing**: All admin routes work under `/admin` path
- ✅ **Security**: Role-based access control implemented
- ✅ **User Management**: Enhanced search and action buttons working
- ✅ **Database**: User management system deployed
