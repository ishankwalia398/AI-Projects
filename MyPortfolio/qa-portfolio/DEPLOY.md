# Deployment Guide - Vercel

## Quick Deploy Steps

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Navigate to project folder:
```bash
cd qa-portfolio
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name: **qa-portfolio** (or your choice)
   - Directory: **./** (current directory)
   - Override settings? **No**

5. Your site will be live! Vercel will provide a URL like: `https://qa-portfolio-xxx.vercel.app`

6. For production deployment:
```bash
vercel --prod
```

### Option 2: Vercel Web Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub

2. Click **"Add New Project"**

3. Import your GitHub repository or drag & drop the `qa-portfolio` folder

4. Vercel will auto-detect Vite settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Click **"Deploy"**

6. Your site will be live in ~1 minute!

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., ishankwalia.dev)
3. Update DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

## Environment Variables

No environment variables needed for this static portfolio.

## Post-Deployment

### Update Social Links
If you want to add your deployed portfolio URL to:
- LinkedIn profile (Featured section)
- GitHub profile README
- Resume

### Share on LinkedIn
Use this template:

```
🚀 Excited to share my new portfolio website!

After 14+ years in Quality Engineering, I've built a showcase of my work in:
✅ AI-Augmented Testing
✅ DRM Validation (Widevine, FairPlay, PlayReady)
✅ OTT/TV Streaming QA
✅ 30+ AI Agents & Automation Tools

Key achievements:
📈 30% increase in DRM-protected playback success
🐛 60% reduction in production defects
⚡ 73% faster regression test execution

Built with React, deployed on Vercel. Check it out: [YOUR_URL]

#QualityEngineering #AI #Testing #DRM #Streaming #Automation #React

Open to new opportunities! 🎯
```

## Maintenance

### Update GitHub Stats
GitHub contribution calendar and stats are fetched live from:
- `ghchart.rshah.org` - Contribution calendar
- `github-readme-stats.vercel.app` - Stats cards

These update automatically when you push to GitHub.

### Update Projects
To add new projects:
1. Edit `src/components/Projects.jsx`
2. Add to the appropriate category
3. Push changes
4. Vercel auto-deploys from your git repository (if connected)

## Troubleshooting

### Build Fails
```bash
npm run build
```
Fix any errors locally first.

### Missing Image
Ensure `public/ishank.png` exists in your repository.

### Slow Load Time
Images are optimized, but you can further optimize:
```bash
npm install -D vite-plugin-image-optimizer
```

---

Your portfolio is ready to deploy! 🎉
