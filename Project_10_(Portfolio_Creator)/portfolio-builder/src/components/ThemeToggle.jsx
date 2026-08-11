import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 p-4 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-purple-900 dark:via-indigo-900 dark:to-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 z-50 border-2 border-white/50 dark:border-purple-700/50 hover:scale-110 group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      {/* Multi-layer glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent dark:from-white/20 dark:via-white/5 dark:to-transparent rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/20 via-transparent to-indigo-500/20 dark:from-purple-400/30 dark:to-indigo-400/30 rounded-2xl"></div>

      {theme === 'dark' ? (
        // Bright sun icon for dark mode
        <svg
          className="w-7 h-7 relative z-10 transition-all duration-500 group-hover:rotate-180 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <g className="text-amber-400">
            <circle cx="12" cy="12" r="5" fill="currentColor" className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <g strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
          </g>
        </svg>
      ) : (
        // Crescent moon icon for light mode
        <svg
          className="w-7 h-7 relative z-10 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            className="text-indigo-600 fill-indigo-600/20"
          />
          {/* Stars */}
          <circle cx="18" cy="6" r="1" fill="currentColor" className="text-indigo-600 animate-pulse" />
          <circle cx="20" cy="9" r="0.5" fill="currentColor" className="text-indigo-600 animate-pulse" style={{animationDelay: '0.5s'}} />
        </svg>
      )}

      {/* Animated shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-2xl -translate-x-full group-hover:translate-x-full"></div>
    </button>
  );
};

export default ThemeToggle;
