# Vercel Deployment Guide

## 🚀 Deploy Your Design Review App to Vercel

### Prerequisites
- [Git](https://git-scm.com/) installed
- [Vercel CLI](https://vercel.com/cli) (optional, for advanced users)
- Your project files ready

---

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare Your Project
1. **Ensure all files are in your project folder:**
   ```
   Design Demo App/
   ├── index.html
   ├── style.css
   ├── script.js
   ├── supabase-config.js
   ├── supabase-api.js
   ├── assets/
   ├── vercel.json
   └── ... (other files)
   ```

2. **Create a Git repository (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Push to GitHub/GitLab/Bitbucket:**
   ```bash
   git remote add origin https://github.com/Pure-Robby/Design-Review-Board.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel
1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in with GitHub/GitLab/Bitbucket

2. **Import Your Project**
   - Click **"New Project"**
   - Select your repository
   - Vercel will auto-detect it's a static site

3. **Configure Project Settings**
   - **Project Name**: `hoodie-design-review` (or your preferred name)
   - **Framework Preset**: Other (or Static)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty (not needed for static sites)
   - **Output Directory**: Leave empty (not needed for static sites)

4. **Environment Variables (if needed)**
   - Usually not required for static sites
   - Your Supabase config is already in the code

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete

### Step 3: Configure Custom Domain (Optional)
1. **Go to Project Settings**
   - Click on your project in Vercel dashboard
   - Go to **Settings** → **Domains**

2. **Add Custom Domain**
   - Enter your domain (e.g., `designs.yourdomain.com`)
   - Follow Vercel's DNS configuration instructions

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
# Navigate to your project directory
cd "Design Demo App"

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: hoodie-design-review
# - Directory: ./
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### Update Supabase Settings
1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Update Auth Settings**
   - Go to **Authentication** → **URL Configuration**
   - Add your Vercel domain to **Site URL**:
     ```
     https://your-project.vercel.app
     ```

3. **Update Google OAuth (if using)**
   - Go to **Authentication** → **Providers** → **Google**
   - Add your Vercel domain to **Authorized JavaScript origins**:
     ```
     https://your-project.vercel.app
     ```

### Test Your Deployment
1. **Visit your Vercel URL**
2. **Test all functionality:**
   - ✅ Design images load
   - ✅ Lightbox works
   - ✅ Voting works
   - ✅ Comments work
   - ✅ Google auth works (if configured)

---

## 📋 Troubleshooting

### Common Issues:

1. **Images not loading**
   - Check that `assets/` folder is included in deployment
   - Verify file paths are correct

2. **Supabase connection errors**
   - Ensure your Vercel domain is added to Supabase auth settings
   - Check browser console for CORS errors

3. **Google OAuth not working**
   - Add Vercel domain to Google OAuth authorized origins
   - Update Supabase Google provider settings

4. **Build errors**
   - Check that all files are committed to Git
   - Verify `vercel.json` is in the root directory

### Performance Optimization:
- ✅ Images are optimized (already done)
- ✅ CSS/JS are minified (Vercel handles this)
- ✅ CDN is enabled (Vercel provides this)
- ✅ HTTPS is enabled (automatic)

---

## 🎉 What You Get

After deployment:
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Automatic HTTPS** - Secure connections
- ✅ **Custom domains** - Professional URLs
- ✅ **Auto-deployments** - Updates on Git push
- ✅ **Analytics** - Built-in performance monitoring
- ✅ **Edge functions** - Serverless capabilities (if needed)

Your app will be live at: `https://your-project.vercel.app`

---

## 🔄 Continuous Deployment

Once set up, every time you push to your Git repository:
1. Vercel automatically detects changes
2. Builds and deploys your updates
3. Your site is updated instantly

No manual deployment needed! 🚀 