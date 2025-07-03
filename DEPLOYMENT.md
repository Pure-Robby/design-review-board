# Deployment Guide - Design Review Board

## Deploy to Vercel (Free Hosting)

### Step 1: Prepare Your Project

1. **Make sure all files are ready:**
   - `index.html` - Main application
   - `style.css` - Styling
   - `script.js` - Main JavaScript
   - `supabase-config.js` - Supabase configuration
   - `supabase-api.js` - Supabase API functions
   - `build.js` - Build script
   - `config.js` - Configuration
   - `assets/` - Design images

2. **Verify Supabase credentials** are set in `supabase-config.js`

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your Git repository** (GitHub, GitLab, etc.)
   - If you don't have a Git repo, create one first
4. **Configure the project:**
   - Framework Preset: `Other`
   - Build Command: `node build.js`
   - Output Directory: `.` (current directory)
   - Install Command: `npm install` (if you have package.json)
5. **Click "Deploy"**

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

### Step 3: Configure Environment Variables (Optional)

If you want to keep your Supabase credentials secure:

1. **In Vercel dashboard**, go to your project settings
2. **Add environment variables:**
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_ANON_KEY` = Your Supabase anon key

3. **Update `supabase-config.js`:**
   ```javascript
   const SUPABASE_CONFIG = {
     url: process.env.SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL',
     anonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
   };
   ```

### Step 4: Custom Domain (Optional)

1. **In Vercel dashboard**, go to your project
2. **Click "Settings" → "Domains"**
3. **Add your custom domain** (e.g., `design-review.yourdomain.com`)

### Step 5: Test Your Deployment

1. **Visit your Vercel URL** (e.g., `https://your-project.vercel.app`)
2. **Test all features:**
   - ✅ View designs
   - ✅ Like/dislike designs
   - ✅ Add comments
   - ✅ Delete comments
   - ✅ Lightbox navigation
   - ✅ Real-time updates

## Alternative Deployment Options

### Netlify
- Similar to Vercel
- Drag & drop deployment
- Free tier available

### GitHub Pages
- Free hosting for public repositories
- Requires manual build process

### Firebase Hosting
- Google's hosting solution
- Good integration with other Firebase services

## Troubleshooting

### Common Issues:

1. **Supabase connection fails:**
   - Check your credentials in `supabase-config.js`
   - Verify your Supabase project is active
   - Check browser console for errors

2. **Build fails:**
   - Make sure Node.js is installed
   - Check that all files are present
   - Verify `build.js` runs locally

3. **Images not loading:**
   - Check that `assets/` folder is included in deployment
   - Verify image paths are correct

### Support:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/docs](https://supabase.com/docs)

## Next Steps

Once deployed, you can:

1. **Share the URL** with your team
2. **Monitor usage** in Vercel dashboard
3. **Add analytics** (Google Analytics, etc.)
4. **Set up custom domain**
5. **Add authentication** for user management
6. **Implement real-time features** with Supabase subscriptions 