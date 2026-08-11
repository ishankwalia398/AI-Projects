# 🚀 Portfolio Builder

An ultra-glossy, feature-rich React portfolio website builder with GitHub stats integration and one-click Vercel deployment.

## ✨ Features

### 🎨 Ultra-Glossy UI Design
- **Animated Background Orbs**: Beautiful floating gradients in purple, pink, and indigo
- **Glassmorphism Effects**: Multi-layer glossy cards with backdrop blur
- **Shimmer Animations**: Eye-catching shimmer effects on buttons
- **Enhanced Continue Button**: Large glossy button with glow, scale effects, and arrow animation
- **Distinct Theme Icons**: 
  - 🌙 Light Mode: Indigo crescent moon with animated stars
  - ☀️ Dark Mode: Bright amber sun with rays and glow effect
- **Vibrant Color Scheme**: Purple/pink/indigo gradients throughout
- **Edge Highlights**: Shine effects on all interactive elements

### 📝 Portfolio Builder
- **Multi-Step Onboarding Form**:
  1. Personal Info (name, title, bio, email)
  2. Social Links (GitHub, LinkedIn, Twitter, blog)
  3. Projects (title, description, tech stack, links)
  4. Skills (tag-based system)
  5. Resume & Photo upload

- **File Support**:
  - Resume: `.pdf`, `.doc`, `.docx`, `.md`
  - Profile Photo: `.jpeg`, `.jpg`, `.png`, `.gif`

- **LocalStorage Persistence**: All data is saved automatically

### 🏆 Brag Camp Section
- **GitHub Stats Integration**:
  - Public repositories count
  - Followers count
  - Recent commits count
- **GitHub Contribution Calendar**: Visual heatmap of coding activity
- **Graceful Error Handling**: Friendly messages for invalid usernames or API rate limits

### 🚀 Vercel Deployment
- **One-Click Deploy**: Deploy your portfolio instantly to Vercel
- **Custom Project Name**: Deploys to `porfolio-builder.vercel.app`
- **Deployment Progress**: Real-time status updates
- **Success Modal**: Beautiful confirmation with live URL
- **Error Handling**: User-friendly error messages

### 🌓 Dark Mode
- Persistent theme preference
- Smooth transitions
- Distinct theme toggle icons

### 📱 Responsive Design
- Mobile-friendly layout
- Narrower container (max-w-3xl) with visible margins
- Optimized for all screen sizes

## 🛠️ Tech Stack

- **React 19** - Latest React with concurrent features
- **Vite 8** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **react-github-calendar** - GitHub contribution calendar
- **Axios** - HTTP client for Vercel API
- **LocalStorage API** - Client-side data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd portfolio-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

## 📖 Usage Guide

### 1. Fill Out Your Portfolio

1. **Personal Info**: Enter your name, title, bio, and email
2. **Social Links**: Add your GitHub username and other social profiles
3. **Projects**: Add your projects with descriptions and tech stacks
4. **Skills**: Tag your technical skills
5. **Resume & Photo**: Upload your resume and profile picture

### 2. Preview Your Portfolio

After completing the form, click "Complete" to see your live portfolio preview.

### 3. Deploy to Vercel

Click the "Deploy to Vercel" button. The app will:
- Generate a static HTML version of your portfolio
- Deploy it to Vercel using the provided API token
- Provide you with a live URL

### 4. Edit Anytime

Click the edit button (top-right) to modify your portfolio at any time.

## 🎨 Design Philosophy

### Glossy UI Elements
- **Multi-Layer Effects**: Each card has multiple gradient overlays
- **Backdrop Blur**: Glassmorphism effect on all cards
- **Border Highlights**: Subtle white borders for depth
- **Shadow Effects**: Dynamic shadows that respond to hover
- **Scale Animations**: Smooth hover animations on interactive elements

### Color Scheme
- **Primary**: Purple (#7e22ce to #c084fc)
- **Secondary**: Pink (#ec4899 to #f472b6)
- **Accent**: Indigo (#4f46e5 to #818cf8)
- **Background Orbs**: Animated floating gradients
- **Glass Effects**: White/black overlays with transparency

### Animation Strategy
- **Float Animation**: 6s ease-in-out for background orbs
- **Shimmer Animation**: 2s linear for button effects
- **Glow Animation**: 2s ease-in-out for theme toggle
- **Spin-Slow**: 8s for sun icon
- **Scale Transforms**: Quick 300ms for hover effects

## 📁 Project Structure

```
portfolio-builder/
├── src/
│   ├── components/
│   │   ├── Hero.jsx              # Profile header section
│   │   ├── Projects.jsx          # Projects showcase
│   │   ├── BragCamp.jsx         # GitHub stats & calendar
│   │   ├── DeployButton.jsx     # Vercel deployment
│   │   ├── DeploySuccessModal.jsx # Success modal
│   │   └── ErrorBoundary.jsx    # Error handling
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
├── vite.config.js               # Vite configuration
└── package.json                 # Dependencies
```

## 🐛 Troubleshooting

### GitHub Stats Not Loading
- Check if username is correct
- GitHub API has rate limits (60 requests/hour for unauthenticated)
- Wait and try again if rate limited

### Deployment Fails
- Verify Vercel API token is valid
- Check network connection
- See error message for specific issue

### Dark Mode Not Persisting
- Check if localStorage is enabled in browser
- Clear browser cache and try again

### Styles Not Loading
- Run `npm install` to ensure Tailwind is installed
- Check if Vite dev server is running
- Hard refresh browser (Ctrl+Shift+R)

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run oxlint
```

## 📄 License

MIT License - feel free to use this project for your own portfolio!

---

**Made with 💜 using React + Vite + Tailwind CSS**
