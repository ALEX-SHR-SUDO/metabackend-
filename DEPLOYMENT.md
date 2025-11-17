# Backend Deployment Guide

This guide explains how to deploy the backend API to production.

## Recommended Platform: Render

Render provides excellent free hosting for Node.js applications with automatic deployments from GitHub.

## Prerequisites

- GitHub account
- Render account ([Sign up free](https://render.com))
- Pinata API keys ([Get free account](https://pinata.cloud))

## Step-by-Step Deployment

### Step 1: Push to GitHub

1. **Create a new repository** on GitHub (e.g., `metabackend`)

2. **Initialize and push** (if not already done):
   ```bash
   cd metabackend
   git init
   git add .
   git commit -m "Initial commit: Backend API"
   git remote add origin https://github.com/YOUR_USERNAME/metabackend.git
   git push -u origin main
   ```

### Step 2: Create Web Service on Render

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +"** → Select **"Web Service"**

3. **Connect GitHub Repository**:
   - Click "Connect account" if first time
   - Select your `metabackend` repository

4. **Configure Service**:

   | Setting | Value |
   |---------|-------|
   | **Name** | `metabackend` (or your preferred name) |
   | **Region** | Oregon (or closest to your users) |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install --include=dev && npm run build` |
   | **Start Command** | `npm start` |

5. **Select Free Plan** (or upgrade if needed)

### Step 3: Configure Environment Variables

In the Render dashboard, scroll to **Environment Variables** section and add:

| Key | Value | Notes |
|-----|-------|-------|
| `PINATA_API_KEY` | Your Pinata API key | Get from pinata.cloud |
| `PINATA_SECRET_KEY` | Your Pinata secret key | Get from pinata.cloud |
| `PORT` | `10000` | Render default port |
| `NODE_ENV` | `production` | Production mode |

**How to get Pinata keys**:
1. Go to https://app.pinata.cloud
2. Sign up/login
3. Go to API Keys section
4. Create new API key with admin permissions
5. Copy both API Key and API Secret

### Step 4: Deploy

1. **Click "Create Web Service"**

2. Render will:
   - Clone your repository
   - Install dependencies
   - Build TypeScript code
   - Start the server

3. **Wait for deployment** (usually 2-5 minutes)

4. **Copy your backend URL**:
   - Will be like: `https://metabackend.onrender.com`
   - You'll need this for frontend configuration!

### Step 5: Verify Deployment

1. **Test health endpoint**:
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Check logs** in Render dashboard for any errors

## Alternative Platforms

### Railway

1. **Sign up**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Select repository**: `metabackend`
4. **Add variables**:
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`
5. Railway auto-detects Node.js and builds automatically

### Heroku

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli
2. **Create app**:
   ```bash
   heroku create metabackend
   ```
3. **Set environment variables**:
   ```bash
   heroku config:set PINATA_API_KEY=your_key
   heroku config:set PINATA_SECRET_KEY=your_secret
   ```
4. **Deploy**:
   ```bash
   git push heroku main
   ```

### VPS (DigitalOcean, AWS, etc.)

1. **Set up Node.js** on server
2. **Clone repository**
3. **Install dependencies**: `npm install --include=dev`
4. **Build**: `npm run build`
5. **Set environment variables** in `.env`
6. **Use PM2** to run:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name metabackend
   pm2 save
   ```

## Automatic Deployments

### Render (Auto-Deploy on Push)

By default, Render automatically deploys when you push to the main branch:

1. Make changes to code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```
3. Render automatically detects changes and redeploys

### Manual Deploy

In Render dashboard:
1. Go to your service
2. Click "Manual Deploy"
3. Select branch
4. Click "Deploy"

## Environment Variables Reference

### Required Variables

```env
# Pinata API credentials (Required)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Server configuration
PORT=10000                    # Render uses 10000, locally use 3001
NODE_ENV=production          # production or development
```

### Optional Variables

```env
# CORS (if you need to restrict origins)
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com
```

## Health Check

The backend includes a health check endpoint that hosting platforms can use:

**Endpoint**: `GET /health`

**Response**: 
```json
{
  "status": "ok"
}
```

Most platforms automatically detect and use this endpoint.

## Monitoring

### Render Dashboard

- **Logs**: View real-time logs
- **Metrics**: CPU, Memory, Request count
- **Events**: Deployment history

### Custom Monitoring

You can integrate with:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **New Relic**: Performance monitoring

## Troubleshooting

### ❌ Build fails

**Check**:
1. All dependencies in `package.json`
2. Build command is correct: `npm run build`
3. TypeScript compiles locally: `npm run build`

**Solution**:
```bash
# Test locally first
npm install --include=dev
npm run build
npm start
```

### ❌ Server not starting

**Check**:
1. Environment variables are set correctly
2. Start command is: `npm start`
3. `dist/server.js` exists after build

**Solution**: Check Render logs for specific error

### ❌ "Module not found" error

**Cause**: Missing dependency

**Solution**: 
1. Add to `package.json`:
   ```bash
   npm install <missing-package>
   ```
2. Commit and push

### ❌ CORS errors from frontend

**Cause**: CORS not allowing frontend domain

**Solution**:
1. Check `src/server.ts` CORS configuration
2. Backend should have `cors()` enabled
3. For production, optionally restrict origins:
   ```typescript
   app.use(cors({
     origin: ['https://your-frontend.vercel.app']
   }));
   ```

### ❌ Pinata upload fails

**Check**:
1. API keys are correct in environment variables
2. Keys have proper permissions on Pinata dashboard
3. Check backend logs for specific error

### ❌ Port issues

**Local**: Use port 3001 (configured in `.env`)
**Render**: Use port 10000 (or `process.env.PORT`)
**Code**: Should use `process.env.PORT || 3001`

## Security Best Practices

✅ **Never commit** `.env` files
✅ **Use environment variables** for all secrets
✅ **Enable CORS** but restrict origins in production
✅ **Keep dependencies updated**: `npm audit`
✅ **Use HTTPS** (automatic on Render/Vercel)
✅ **Rate limiting**: Consider adding for production

## Post-Deployment

After deploying backend:

1. **Copy Backend URL**: e.g., `https://metabackend.onrender.com`

2. **Configure Frontend**: 
   - Set `NEXT_PUBLIC_BACKEND_URL` in frontend
   - See `metafrontend/BACKEND_CONFIGURATION.md`

3. **Test Integration**:
   - Deploy frontend
   - Try uploading a logo
   - Check browser network tab

4. **Monitor**: 
   - Check logs regularly
   - Set up error alerts
   - Monitor API usage

## Costs

### Render Free Tier

✅ Free for hobby projects
✅ 750 hours/month
✅ Auto-sleep after 15 min inactivity
✅ Cold start (first request may be slow)

### Paid Plans

If you need:
- No auto-sleep
- More resources
- Custom domain
- Better performance

Consider upgrading to paid plan ($7+/month)

## Scaling

### Free Tier
- Suitable for development and testing
- Low to moderate traffic
- Occasional use

### Production
- Use paid tier for production apps
- Add Redis for caching
- Use CDN for static assets
- Consider load balancing for high traffic

## Support

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com

### This Project
- Frontend docs: See `metafrontend/README.md`
- Backend config: See `metafrontend/BACKEND_CONFIGURATION.md`
- General guide: See root `SEPARATION_GUIDE.md`

---

**Next Step**: After backend is deployed, configure frontend with backend URL and deploy it too! 🚀

See: `metafrontend/BACKEND_CONFIGURATION.md` for frontend configuration.
