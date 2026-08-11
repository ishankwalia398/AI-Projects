import { Mail, Globe, Edit2 as Edit, Download } from 'lucide-react';

function Hero({ formData, onEdit }) {
  return (
    <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl mb-8 text-center relative">
      <button
        onClick={onEdit}
        className="absolute top-6 right-6 p-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-110"
      >
        <Edit className="w-5 h-5" />
      </button>

      {formData.profilePhoto && (
        <img
          src={formData.profilePhoto}
          alt={formData.fullName}
          className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-purple-500 shadow-2xl shadow-purple-500/50"
        />
      )}

      <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">
        {formData.fullName || 'Your Name'}
      </h1>

      <p className="text-2xl text-purple-600 dark:text-purple-400 mb-6 font-semibold">
        {formData.title || 'Your Title'}
      </p>

      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
        {formData.bio || 'Your bio goes here...'}
      </p>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {formData.email && (
          <a
            href={`mailto:${formData.email}`}
            className="glossy-card glass-effect dark:glass-effect-dark px-6 py-3 rounded-xl hover:scale-110 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium"
          >
            <Mail className="w-5 h-5" />
            Email
          </a>
        )}
        {formData.githubUsername && (
          <a
            href={`https://github.com/${formData.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glossy-card glass-effect dark:glass-effect-dark px-6 py-3 rounded-xl hover:scale-110 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium"
          >
            GitHub
          </a>
        )}
        {formData.linkedinUrl && (
          <a
            href={formData.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glossy-card glass-effect dark:glass-effect-dark px-6 py-3 rounded-xl hover:scale-110 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium"
          >
            LinkedIn
          </a>
        )}
        {formData.twitterUrl && (
          <a
            href={formData.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glossy-card glass-effect dark:glass-effect-dark px-6 py-3 rounded-xl hover:scale-110 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium"
          >
            Twitter
          </a>
        )}
        {formData.blogUrl && (
          <a
            href={formData.blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glossy-card glass-effect dark:glass-effect-dark px-6 py-3 rounded-xl hover:scale-110 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium"
          >
            <Globe className="w-5 h-5" />
            Blog
          </a>
        )}
      </div>

      {formData.skills.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Skills
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="glossy-card px-5 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-lg font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {formData.resumeFile && (
        <a
          href={formData.resumeFile}
          download={formData.resumeFileName}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
        >
          <Download className="w-5 h-5" />
          Download Resume
        </a>
      )}
    </div>
  );
}

export default Hero;
