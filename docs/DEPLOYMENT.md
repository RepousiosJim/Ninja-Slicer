# Deployment Guide

Complete guide for deploying Monster Slayer to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Build Configuration](#build-configuration)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [Self-Hosted](#self-hosted)
  - [AWS S3 + CloudFront](#aws-s3--cloudfront)
  - [Firebase Hosting](#firebase-hosting)
- [Environment Variables](#environment-variables)
- [PWA Configuration](#pwa-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **Node.js 20.0.0+** installed
- ✅ **npm** or **yarn** installed
- ✅ **Git** installed and configured
- ✅ **Supabase** project created (for online features)
- ✅ **Domain** (optional, for custom URLs)
- ✅ **SSL Certificate** (required for PWA features)

---

## Pre-Deployment Checklist

Run through this checklist before deploying:

### Code Quality

```bash
# Run all checks
npm run lint
npm run typecheck
npm run build

# Verify no errors
```

### Testing

- ✅ Test all game modes (campaign, endless, etc.)
- ✅ Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- ✅ Test on mobile devices
- ✅ Test offline functionality
- ✅ Test save/load system
- ✅ Test online features (leaderboards, cloud saves)

### Configuration

- ✅ Update `package.json` version
- ✅ Set production environment variables
- ✅ Configure Supabase connection
- ✅ Configure Sentry (optional, for error tracking)
- ✅ Update web manifest (if needed)

### Assets

- ✅ Optimize all images (WebP format recommended)
- ✅ Compress audio files
- ✅ Verify all assets are included in build
- ✅ Test asset loading times

---

## Build Configuration

### Production Build

```bash
# Build for production
npm run build

# Output in dist/ folder
ls -la dist/
```

### Build Options

Edit `vite.config.ts` for custom build options:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable in production
    minify: 'terser',
    chunkSizeWarningLimit: 1000, // Increase warning threshold
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

### Environment-Specific Builds

```bash
# Development build (with sourcemaps)
NODE_ENV=development npm run build

# Production build (minified)
NODE_ENV=production npm run build

# Custom build directory
npm run build -- --out-dir custom-dist
```

---

## Deployment Platforms

### Vercel (Recommended)

Vercel offers the easiest deployment with automatic SSL, CDN, and CI/CD.

#### Setup

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Login:**

```bash
vercel login
```

3. **Deploy:**

```bash
vercel
```

Follow the prompts:
- Set project name
- Select framework preset (Vite)
- Set build command: `npm run build`
- Set output directory: `dist`
- Override settings if needed

#### Production Deployment

```bash
# Deploy to production
vercel --prod
```

#### Configuration

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Environment Variables

Set in Vercel dashboard:

1. Go to Project → Settings → Environment Variables
2. Add variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SENTRY_DSN=your-sentry-dsn (optional)
   ```
3. Redeploy to apply

#### Custom Domain

1. Go to Project → Settings → Domains
2. Add your domain
3. Follow DNS instructions (CNAME record)
4. SSL is automatically configured

---

### Netlify

Netlify offers free hosting with continuous deployment from Git.

#### Setup

1. **Install Netlify CLI:**

```bash
npm i -g netlify-cli
```

2. **Login:**

```bash
netlify login
```

3. **Initialize project:**

```bash
netlify init
```

4. **Deploy:**

```bash
# Preview deployment
netlify deploy

# Production deployment
netlify deploy --prod
```

#### Configuration

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false
```

#### Git Integration

Connect GitHub repository to Netlify for automatic deployments:

1. Go to Netlify Dashboard
2. "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy!

---

### GitHub Pages

Free hosting via GitHub Pages.

#### Setup

1. **Install gh-pages:**

```bash
npm install -D gh-pages
```

2. **Build project:**

```bash
npm run build
```

3. **Deploy to gh-pages branch:**

```bash
# Add deploy script to package.json
npm pkg set scripts.deploy="npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

#### Configuration

Create `.nojekyll` in `dist/` (prevents Jekyll processing):

```bash
touch dist/.nojekyll
```

#### Custom Domain

1. Go to repository Settings → Pages
2. Add custom domain
3. Configure DNS (CNAME record for subdomain, A record for root)
4. Enable HTTPS (GitHub provides Let's Encrypt SSL)

---

### Self-Hosted

Deploy to any web server (Nginx, Apache, etc.).

#### Build

```bash
npm run build
```

#### Nginx Configuration

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  root /var/www/monster-slayer/dist;
  index index.html;

  # Try static files first
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

#### Apache Configuration

Create `.htaccess` in `dist/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
</IfModule>
```

---

### AWS S3 + CloudFront

Scalable hosting with CloudFront CDN.

#### Setup

1. **Create S3 Bucket:**

```bash
aws s3 mb s3://monster-slayer --region us-east-1
```

2. **Enable static website hosting:**

```bash
aws s3 website s3://monster-slayer --index-document index.html --error-document index.html
```

3. **Upload files:**

```bash
npm run build
aws s3 sync dist/ s3://monster-slayer --delete
```

4. **Create CloudFront Distribution:**

Use AWS Console or CLI:

```bash
aws cloudfront create-distribution \
  --distribution-config \
    CallerReference=monster-slayer-$(date +%s),\
    Comment=Monster+Slicer+CDN,\
    Enabled=true,\
    Origins={Id=S3Origin,DomainName=monster-slayer.s3-website-us-east-1.amazonaws.com,Id=S3Origin,CustomOriginConfig={},S3OriginConfig={OriginAccessIdentity}},\
    DefaultCacheBehavior={TargetOriginId=S3Origin,ViewerProtocolPolicy=redirect-to-https,MinTTL=0,ForwardedValues={QueryString=false,Cookies={Forward=none}},TrustedSigners={Enabled=false},DefaultTTL=86400,MaxTTL=31536000,Compress=true}},\
    PriceClass=PriceClass_All
```

5. **Configure SSL:**

Add custom domain to CloudFront and use AWS Certificate Manager for free SSL.

#### Deployment Script

Create `deploy-aws.sh`:

```bash
#!/bin/bash

# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://monster-slayer --delete --cache-control "public, max-age=31536000, immutable"

# Invalidate CloudFront cache
DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

---

### Firebase Hosting

Google's Firebase hosting platform.

#### Setup

1. **Install Firebase CLI:**

```bash
npm install -g firebase-tools
```

2. **Login:**

```bash
firebase login
```

3. **Initialize project:**

```bash
firebase init
```

Select:
- Hosting
- Use existing project or create new
- Public directory: `dist`
- Configure as single-page app: Yes
- No GitHub integration (optional)

4. **Deploy:**

```bash
firebase deploy --only hosting
```

#### Configuration

Create `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

## Environment Variables

### Local Development

Create `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (optional)
VITE_SENTRY_DSN=your-sentry-dsn
```

### Production

Set in platform-specific configuration:

#### Vercel

Dashboard → Settings → Environment Variables

#### Netlify

Dashboard → Site → Environment variables

#### AWS

Lambda environment variables or EC2 user data

#### Firebase

```
firebase functions:config:set
```

---

## PWA Configuration

### Web App Manifest

Update `public/manifest.webmanifest`:

```json
{
  "name": "Monster Slayer",
  "short_name": "Monster Slayer",
  "description": "A fast-paced monster slicing game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#8b0000",
  "orientation": "any",
  "icons": [
    {
      "src": "/assets/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

Register in `main.ts`:

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

### Offline Page

Ensure `public/offline.html` exists and is accessible.

---

## Performance Optimization

### Asset Optimization

```bash
# Optimize images (install imagemin-cli)
npm install -g imagemin-cli

# Optimize all images in assets folder
imagemin public/assets/**/*.{png,jpg,jpeg,gif,svg} --out-dir=public/assets/optimized
```

### Code Splitting

Configure in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'supabase': ['@supabase/supabase-js'],
          'sentry': ['@sentry/browser'],
        },
      },
    },
  },
});
```

### Lazy Loading

```typescript
// Lazy load heavy assets
preloadHeavyAssets() {
  this.load.on('complete', () => {
    this.scene.start('GameplayScene');
  });
  this.load.image('heavy_asset', 'assets/heavy.png');
}
```

### CDN Configuration

Use CDN for static assets:

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.85.2/dist/phaser.min.js"></script>
```

---

## Monitoring

### Sentry Integration

1. **Install Sentry:**

```bash
npm install @sentry/browser
```

2. **Initialize in `main.ts`:**

```typescript
import * as Sentry from '@sentry/browser';

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.PACKAGE_VERSION,
    tracesSampleRate: 0.1,
  });
}
```

3. **Track errors:**

```typescript
try {
  // Game code
} catch (error) {
  Sentry.captureException(error);
}
```

### Analytics

#### Google Analytics

```html
<!-- Add to index.html head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Custom Analytics

Track game events:

```typescript
// Track level completion
this.analytics.trackEvent('level_complete', {
  level: '1-1',
  stars: 3,
  time: 45
});

// Track weapon purchase
this.analytics.trackEvent('weapon_purchased', {
  weaponId: 'fire_sword',
  cost: 500
});
```

---

## Post-Deployment

### Verification Checklist

After deploying, verify:

- ✅ Homepage loads correctly
- ✅ All assets load (no 404s)
- ✅ Game plays without errors
- ✅ Save/load works
- ✅ Leaderboards function
- ✅ Mobile responsive
- ✅ PWA features work (offline, install)
- ✅ SSL certificate valid
- ✅ Performance good (Core Web Vitals)
- ✅ Error tracking configured

### Performance Testing

Test performance with:

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [WebPageTest](https://www.webpagetest.org/)

Target metrics:
- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1

### SEO Verification

Check:

- Meta tags (title, description, OG tags)
- Robots.txt
- Sitemap.xml
- Structured data (if applicable)

---

## Troubleshooting

### Common Issues

#### 404 Errors on Refresh

**Problem:** Refreshing any page shows 404

**Solution:** Configure SPA routing (see platform-specific config above)

#### Assets Not Loading

**Problem:** Game assets return 404

**Solution:**
1. Check asset paths in build
2. Verify build includes all assets
3. Check server configuration for static files

#### CORS Errors

**Problem:** Supabase API returns CORS errors

**Solution:**
1. Check Supabase project settings
2. Verify allowed origins
3. Check environment variables

#### PWA Won't Install

**Problem:** "Add to Home Screen" not available

**Solution:**
1. Verify HTTPS is enabled (required)
2. Check web manifest is valid
3. Verify service worker is registered
4. Test with PWA Builder tools

#### Slow Performance

**Problem:** Game lags or low FPS

**Solution:**
1. Check bundle size
2. Enable code splitting
3. Optimize assets
4. Use CDN
5. Enable compression on server

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

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
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test

    - name: Run linter
      run: npm run lint

    - name: Build
      run: npm run build

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID}}
        vercel-project-id: ${{ secrets.PROJECT_ID}}
        vercel-args: '--prod'
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
image: node:20

stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm run lint
    - npm run typecheck
    - npm run test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - npm install -g netlify-cli
    - netlify deploy --prod --dir=dist
  only:
    - main
```

---

## Rollback Strategy

### Automatic Rollback

Most platforms support instant rollback:

- **Vercel:** Dashboard → Deployments → Rollback
- **Netlify:** Dashboard → Deploys → Rollback
- **AWS:** Previous CloudFront versions cached

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Redeploy
npm run build
# Deploy to platform
```

---

## Security

### Headers

Configure security headers:

```nginx
# Nginx
add_header X-Frame-Options "DENY"
add_header X-Content-Type-Options "nosniff"
add_header X-XSS-Protection "1; mode=block"
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains"
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
```

### Environment Variables

Never commit secrets:

```bash
# .gitignore
.env
.env.local
.env.production
*.pem
```

### HTTPS

Always use HTTPS:

- Let's Encrypt (free)
- CloudFlare (free SSL)
- Platform-specific SSL (Vercel, Netlify, etc.)

---

## Cost Estimation

### Platform Costs

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| Vercel | 100GB bandwidth/mo | $20/mo |
| Netlify | 100GB bandwidth/mo | $19/mo |
| GitHub Pages | Unlimited | Free |
| AWS S3 + CloudFront | 5GB storage + 2TB transfers/mo | Variable |
| Firebase Hosting | 10GB storage/mo | Variable |

### Additional Costs

- **Domain:** ~$10-15/year
- **SSL:** Free (Let's Encrypt) or ~$50-200/year
- **Supabase:** Free tier (500MB DB, 1GB bandwidth)
- **Sentry:** Free tier (5,000 errors/mo)

---

## Support

### Deployment Issues

- **Vercel:** [Vercel Support](https://vercel.com/support)
- **Netlify:** [Netlify Support](https://www.netlify.com/support/)
- **AWS:** [AWS Support](https://aws.amazon.com/support/)
- **Firebase:** [Firebase Support](https://firebase.google.com/support)

### Community

- [Vercel Community](https://vercel.com/community)
- [Netlify Community](https://community.netlify.com/)
- [Stack Overflow](https://stackoverflow.com/)

---

**[⬆ Back to Top](#deployment-guide)**
