import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

function BragCamp({ githubUsername }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch basic user data
        const userResponse = await fetch(`https://api.github.com/users/${githubUsername}`);
        if (!userResponse.ok) {
          throw new Error('GitHub user not found');
        }
        const userData = await userResponse.json();

        // Fetch events for activity stats
        const eventsResponse = await fetch(`https://api.github.com/users/${githubUsername}/events/public`);
        const eventsData = await eventsResponse.json();

        // Calculate stats
        const pushEvents = eventsData.filter(e => e.type === 'PushEvent');
        const totalCommits = pushEvents.reduce((acc, e) => acc + (e.payload.commits?.length || 0), 0);

        setStats({
          publicRepos: userData.public_repos,
          followers: userData.followers,
          totalCommits,
          bio: userData.bio,
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch GitHub data');
      } finally {
        setLoading(false);
      }
    };

    if (githubUsername) {
      fetchGitHubStats();
    }
  }, [githubUsername]);

  if (loading) {
    return (
      <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl mb-8 text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          Brag Camp
        </h2>
        <div className="flex items-center justify-center gap-3 text-purple-600 dark:text-purple-400">
          <Activity className="w-6 h-6 animate-pulse" />
          <p>Loading GitHub stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl mb-8 text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          Brag Camp
        </h2>
        <div className="text-red-500 dark:text-red-400">
          <p className="text-lg">⚠️ {error}</p>
          <p className="text-sm mt-2">Please check your GitHub username or try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl mb-8">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-8 text-center flex items-center justify-center gap-3">
        <Activity className="w-10 h-10" />
        Brag Camp
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glossy-card glass-effect dark:glass-effect-dark rounded-2xl p-6 text-center hover:scale-105 transition-all shadow-lg">
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {stats.publicRepos}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Public Repos</p>
        </div>

        <div className="glossy-card glass-effect dark:glass-effect-dark rounded-2xl p-6 text-center hover:scale-105 transition-all shadow-lg">
          <p className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
            {stats.followers}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Followers</p>
        </div>

        <div className="glossy-card glass-effect dark:glass-effect-dark rounded-2xl p-6 text-center hover:scale-105 transition-all shadow-lg">
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            {stats.totalCommits}+
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Recent Commits</p>
        </div>
      </div>

      {/* GitHub Contribution Calendar Placeholder */}
      <div className="glossy-card glass-effect dark:glass-effect-dark rounded-2xl p-6 overflow-x-auto">
        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6 text-center">
          Contribution Activity
        </h3>
        <div className="flex justify-center">
          <a
            href={`https://github.com/${githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            View GitHub Profile →
          </a>
        </div>
      </div>
    </div>
  );
}

export default BragCamp;
