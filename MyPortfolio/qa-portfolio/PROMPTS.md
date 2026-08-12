# QA Portfolio Website - Build Prompts

This document contains all the prompts used to build the professional QA portfolio website for Ishank Walia.

---

## 1. Initial Portfolio Creation

**Prompt:**
```
@My_Info.md This is my information. Build me a QA portfolio website to showcase my skills — I'll share it with HRs and on LinkedIn for brand building; my main goal is to get a job. Highlight my projects and my GitHub repositories. Build it in React, and we'll push to Vercel. Also create a "brand camp" section showing my GitHub contribution calendar and daily-coding activity.
```

**What it did:** Created a React portfolio with Vite, all sections (Hero, About, Skills, Projects, GitHub, Experience, Contact), integrated resume data, and set up for Vercel deployment.

---

## 2. Enhanced Initial Request

**Prompt:**
```
@Ishank_Walia_Resume.pdf and @My_Info.md This is my information and @photo\ Add this image as the hero photo. And highlight my GitHub repositories and contribution calendar prominently — projects first, then GitHub, clearly visible." Build me a QA portfolio website to showcase my skills — I'll share it with HRs and on LinkedIn for brand building; my main goal is to get a job. Highlight my projects and my GitHub repositories. Build it in React, and we'll push to Vercel. Also create a "brand camp" section showing my GitHub contribution calendar and daily-coding activity.
```

**What it did:** Added professional photo, created GitHub activity section with contribution calendar, organized projects prominently.

---

## 3. Deploy to Vercel

**Prompt:**
```
deploy it to vercel using the vercel token which i have added in the.env file
```

**What it did:** Deployed the portfolio to Vercel using the token from `.env` file, made it live on the internet.

---

## 4. Custom Domain Setup

**Prompt:**
```
rename the url to ishank-walia.vercel.app
```

**What it did:** Set up a custom Vercel alias for a cleaner, more professional URL.

---

## 5. Fix GitHub Stats Display

**Prompt:**
```
not showing correctly the github stats and top languages, fix it.
```

**What it did:** Fixed GitHub stats API URLs, added error handling, improved image loading reliability.

---

## 6. Major Content & Layout Updates

**Prompt:**
```
1. update the experience to 15+ instead of 14+ and also add this line - Open to GenAI roles · EU/US/APAC/Remote
2. showing the Github stats loading and Top languages loading (see attached image - 11.png)
3. rearrange and make it better so that it aligns well (see attached images - better_1.png. better_2.png)
4. Give better tagline and better short description which is at the top 
5. overall align it better so that it looks good, it has lot of misalignment
6. try to use the color which will be more appealing to the HRs and the recruiters for the dark theme, light theme keep it as it is
```

**What it did:** 
- Updated experience from 14+ to 15+ years
- Added "Open to GenAI roles · EU/US/APAC/Remote" to banner
- Fixed GitHub stats loading issues
- Improved alignment throughout
- Created better taglines and descriptions
- Changed to professional HR-appealing colors (sky blue instead of bright cyan)

---

## 7. Theme Toggle & Banner

**Prompt:**
```
also give a banner like i have given in the linked in profile
```

**Follow-up:**
```
and give option for light and dark theme both
```

**What it did:** Added professional banner at the top, implemented light/dark theme toggle button.

---

## 8. Tagline Inspiration

**Prompt:**
```
go though this link - https://sabyag42.github.io/ and check the tag line and short description which can be used after modifying as per my profile
```

**What it did:** Analyzed reference portfolio, created inspired tagline: "15+ years making streaming platforms bulletproof. Now building intelligent QA systems with AI agents, RAG pipelines, and automation frameworks."

---

## 9. Multiple Layout Fixes

**Prompt:**
```
1. Senior QA Engineer | AI-Powered Testing Leader, in the banner it is not visible, change the text color so that it is visible
2. Github stats, Top languages, are broken, and section below that is also broken
3. section below the github stats and the features repositories should be side by side 
4. in the Let's Connect section make sure the tabs and the written content all are aligned, right now the text is shorter and there is a white space aside the tabs linkedin, github and location. align it properly 
5. in the location update it to Noida, India instead of Noida, India (Open to Remote)
```

**What it did:**
- Fixed banner text visibility (white color with text shadow)
- Fixed GitHub stats layout
- Made streak stats and featured repos side-by-side
- Aligned contact section properly
- Updated location text

---

## 10. GitHub Stats Not Loading

**Prompt:**
```
@1.png fix this, it is not working
```

**What it did:** Replaced external GitHub stats API with custom-built stat cards that always work, with styled progress bars and clean design.

---

## 11. Final Polish

**Prompt:**
```
remove the blue underline, move the heading Featured Repositories in the table or form in which AI-Projects is written. check the date how i can be active since nov 2026 which is in future, fix it
```

**What it did:**
- Removed all text-decoration underlines
- Moved "Featured Repositories" heading inside the card
- Fixed date from Nov 2026 to Nov 2024

---

## 12. Perfect Alignment & Accurate Data

**Prompt:**
```
align all the 4 tables/forms currently they are not aligned, Github activity, Top technologies, Contribution streak, Featured Repositories. also make sure that the stats and the data is accurate and in sync with the github
```

**What it did:**
- Created 2x2 grid with uniform card heights
- Fetched actual GitHub data (3 repos, TypeScript/JavaScript/Python)
- Updated all stats to match real profile
- Made all cards perfectly aligned

---

## 13. Icon Placement

**Prompt:**
```
also the fire icon in the contribution streak should be beside the heading of the contribution streak with properly aligned and sized. should not be in between
```

**What it did:** Moved fire emoji from card center to heading: "Contribution Streak 🔥"

---

## Final Result

**Live URL:** https://ishank-walia.vercel.app

**Key Features Built:**
- ✅ Professional banner with opportunity status
- ✅ Light/Dark theme toggle
- ✅ Hero section with photo and stats
- ✅ 30+ AI projects showcase
- ✅ GitHub activity with accurate data
- ✅ Contribution calendar
- ✅ Experience timeline (15+ years)
- ✅ Contact section with all links
- ✅ Fully responsive design
- ✅ SEO optimized for sharing

**Tech Stack:**
- React 19
- Vite 8
- React Icons
- Vercel deployment
- Custom CSS with theme support

---

## How to Use These Prompts

These prompts can be used as a template for building similar portfolio websites. Key patterns:

1. **Start with data sources** - Provide resume, info files, photos
2. **Be specific about goals** - "to get a job", "share with HRs"
3. **Reference examples** - Share screenshots or URLs for design inspiration
4. **Iterate with screenshots** - Show what's broken with images
5. **Request specific fixes** - Break down issues into numbered lists
6. **Validate data accuracy** - Ask to sync with actual sources (GitHub)

---

## Project Structure

```
qa-portfolio/
├── public/
│   └── ishank.png              # Professional photo
├── src/
│   ├── components/
│   │   ├── Hero.jsx/css        # Banner + photo + stats
│   │   ├── About.jsx/css       # Professional summary
│   │   ├── Skills.jsx/css      # Skills matrix
│   │   ├── Projects.jsx/css    # 30+ AI projects
│   │   ├── GitHub.jsx/css      # GitHub activity cards
│   │   ├── Experience.jsx/css  # Career timeline
│   │   └── Contact.jsx/css     # Contact info
│   ├── App.jsx                 # Main app with theme toggle
│   ├── App.css                 # Global styles + theme vars
│   └── main.jsx                # Entry point
├── index.html                  # SEO meta tags
├── package.json                # Dependencies
├── vercel.json                 # Vercel config
└── README.md                   # Project docs
```

---

## Deployment Commands

```bash
# Build locally
npm run build

# Deploy to Vercel
export VERCEL_TOKEN=your_token_here
npx vercel --token $VERCEL_TOKEN --prod --yes

# Set custom alias
npx vercel alias [deployment-url] ishank-walia.vercel.app --token $VERCEL_TOKEN
```

---

**Document Created:** August 11, 2026  
**Portfolio Owner:** Ishank Walia  
**Built with:** Claude Code + Anthropic Claude AI
