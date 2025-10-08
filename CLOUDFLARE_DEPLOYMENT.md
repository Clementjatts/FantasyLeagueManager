# Cloudflare Deployment Guide
## Fantasy League Manager on fpl.clementadegbenro.com

This guide will help you deploy your Fantasy League Manager application to Cloudflare Pages with your custom subdomain.

## Prerequisites

- Cloudflare account with your domain `clementadegbenro.com` configured
- GitHub repository with your Fantasy League Manager code
- Node.js 18+ installed locally
- Firebase project configured (for authentication)

## Architecture Overview

Your application consists of:
- **Frontend**: React + Vite application in `/client`
- **Backend**: Cloudflare Worker API proxy (replaces Express.js server)
- **Database**: Firebase/Firestore (replaces PostgreSQL)
- **Authentication**: Firebase Auth
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Workers (backend)

## Step 1: Prepare Your Project for Cloudflare

### 1.1 Update Build Configuration

First, we need to modify your build process to work with Cloudflare's architecture:

```bash
# Install Cloudflare Workers dependencies
npm install --save-dev wrangler
npm install @cloudflare/workers-types
```

### 1.2 Create Cloudflare Worker for Backend API

Create a new file `worker.js` in your project root:

```javascript
// worker.js - Cloudflare Worker for API
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handleRequest } from './dist/server/index.js'

const app = new Hono()

// Add CORS middleware
app.use('/*', cors({
  origin: ['https://fpl.clementadegbenro.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Proxy all API requests to your Express server
app.all('/api/*', async (c) => {
  try {
    const url = new URL(c.req.url)
    const response = await fetch(`https://your-worker-name.your-subdomain.workers.dev${url.pathname}${url.search}`, {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.method !== 'GET' ? await c.req.text() : undefined,
    })
    
    const data = await response.text()
    return new Response(data, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default app
```

### 1.3 Update package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:client": "vite build",
    "build:worker": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18",
    "build": "npm run build:client && npm run build:worker",
    "deploy:worker": "wrangler deploy",
    "deploy:pages": "wrangler pages deploy dist/public --project-name=fpl-manager"
  }
}
```

### 1.4 Create wrangler.toml Configuration

Create `wrangler.toml` in your project root:

```toml
name = "fpl-manager-api"
main = "worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "fpl-manager-api"

[env.production.vars]
NODE_ENV = "production"

# Firebase configuration (set these as secrets if needed for server-side operations)
# wrangler secret put FIREBASE_API_KEY
# wrangler secret put FIREBASE_AUTH_DOMAIN
# wrangler secret put FIREBASE_PROJECT_ID
# wrangler secret put FIREBASE_STORAGE_BUCKET
# wrangler secret put FIREBASE_MESSAGING_SENDER_ID
# wrangler secret put FIREBASE_APP_ID

# Note: No database secrets needed - using Firebase/Firestore
```

## Step 2: Set Up Cloudflare Pages

### 2.1 Create Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub repository
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build:client`
   - **Build output directory**: `dist/public`
   - **Root directory**: `/` (leave empty)

### 2.2 Configure Environment Variables

In your Cloudflare Pages project settings, add these environment variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_API_BASE_URL=https://fpl-manager-api.your-subdomain.workers.dev
```

## Step 3: Set Up Custom Domain

### 3.1 Add Custom Domain to Pages

1. In your Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter `fpl.clementadegbenro.com`
4. Cloudflare will automatically configure DNS

### 3.2 Configure DNS (if needed)

If DNS isn't automatically configured, add a CNAME record:
- **Type**: CNAME
- **Name**: fpl
- **Target**: your-pages-project.pages.dev
- **Proxy status**: Proxied (orange cloud)

## Step 4: Deploy Backend API

### 4.1 Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 4.2 Deploy Worker

```bash
# Build the worker
npm run build:worker

# Deploy to Cloudflare Workers
wrangler deploy
```

## Step 5: Update Frontend Configuration

### 5.1 Update API Base URL

Update your `client/src/lib/api.ts` to use the Cloudflare Worker URL:

```typescript
// client/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fpl-manager-api.your-subdomain.workers.dev';

export const api = {
  baseURL: API_BASE_URL,
  // ... rest of your API configuration
};
```

### 5.2 Update Firebase Auth Domain

Make sure your Firebase project allows your custom domain:
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `fpl.clementadegbenro.com`

## Step 6: Firebase/Firestore Configuration

Since you're already using Firebase for authentication, we'll use **Firestore** as your database. This eliminates the need for a separate PostgreSQL database and provides better integration with your existing Firebase setup.

### 6.1 Configure Firestore Database

1. **Go to Firebase Console** → Your Project → Firestore Database
2. **Create Database** (if not already created)
3. **Choose production mode** for security rules
4. **Select a location** closest to your users

### 6.2 Set Up Firestore Security Rules

Create these security rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User preferences and settings
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // FPL team data (cached for performance)
    match /fplTeams/{teamId} {
      allow read: if true; // Public read access for team data
      allow write: if false; // Only server can write (via Cloudflare Worker)
    }
    
    // Cached FPL data (bootstrap, fixtures, etc.)
    match /fplData/{document=**} {
      allow read: if true; // Public read access
      allow write: if false; // Only server can write
    }
    
    // User's personal notes and favorites
    match /userData/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6.3 Data Structure Recommendations

**User Profile (`/users/{userId}`):**
```javascript
{
  uid: "user-firebase-uid",
  email: "user@example.com",
  displayName: "User Name",
  fplTeamId: 12345,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

**User Settings (`/userSettings/{userId}`):**
```javascript
{
  theme: "dark",
  notifications: true,
  favoritePlayers: ["player1", "player2"],
  customNotes: {
    "player123": "Great form, consider for captain"
  }
}
```

**Cached FPL Data (`/fplData/{type}`):**
```javascript
// /fplData/bootstrap-static
{
  data: { /* FPL bootstrap data */ },
  lastUpdated: timestamp,
  season: "2024-25"
}

// /fplData/fixtures
{
  data: [ /* FPL fixtures */ ],
  lastUpdated: timestamp,
  gameweek: 15
}
```

### 6.4 Benefits of Using Firestore

✅ **No Additional Database Setup** - Uses existing Firebase project
✅ **Real-time Updates** - Built-in real-time listeners
✅ **Offline Support** - Automatic offline caching
✅ **Scalable** - Firebase handles scaling automatically
✅ **Cost Effective** - Generous free tier
✅ **Integrated Security** - Works seamlessly with Firebase Auth
✅ **Client-side Access** - Direct access from React app

## Step 7: Deploy and Test

### 7.1 Deploy Frontend

```bash
# Build and deploy to Pages
npm run build:client
wrangler pages deploy dist/public --project-name=fpl-manager
```

### 7.2 Deploy Backend

```bash
# Build and deploy Worker
npm run build:worker
wrangler deploy
```

### 7.3 Test Your Deployment

1. Visit `https://fpl.clementadegbenro.com`
2. Test authentication flow
3. Test API endpoints
4. Check browser console for errors

## Step 8: Set Up CI/CD (Optional)

### 8.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: fpl-manager
          directory: dist/public
          
      - name: Deploy Worker
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is configured in both frontend and backend
   - Check that your domain is in the allowed origins

2. **Environment Variables Not Loading**
   - Verify variables are set in Cloudflare Pages settings
   - Check that variable names start with `VITE_` for client-side

3. **API Not Responding**
   - Check Worker logs in Cloudflare Dashboard
   - Verify Worker is deployed and running
   - Test API endpoints directly

4. **Firebase/Firestore Issues**
   - Verify Firebase configuration in environment variables
   - Check Firestore security rules are properly configured
   - Ensure Firebase project allows your custom domain
   - Test Firebase authentication flow

### Useful Commands

```bash
# View Worker logs
wrangler tail

# Test Worker locally
wrangler dev

# Check Pages deployment status
wrangler pages deployment list --project-name=fpl-manager

# Test Firebase connection (if using server-side Firebase)
# Check Firebase project settings in Firebase Console
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to your repository
2. **CORS**: Restrict origins to your domain only in production
3. **Rate Limiting**: Consider implementing rate limiting for API endpoints
4. **Firebase Rules**: Configure Firestore security rules properly
5. **Firestore Security**: Ensure proper user-based access controls
6. **API Rate Limiting**: Consider implementing rate limiting for FPL API calls

## Performance Optimization

1. **Caching**: Configure appropriate cache headers
2. **CDN**: Cloudflare's global CDN will serve your static assets
3. **Compression**: Enable compression in Cloudflare settings
4. **Minification**: Ensure your build process minifies assets

## Monitoring

1. **Analytics**: Enable Cloudflare Analytics for your Pages project
2. **Logs**: Monitor Worker logs for errors
3. **Performance**: Use Cloudflare's performance insights
4. **Uptime**: Set up uptime monitoring

## Support

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

---

**Your Fantasy League Manager will be available at: https://fpl.clementadegbenro.com**

Remember to update your Firebase project settings to allow your custom domain for authentication!
