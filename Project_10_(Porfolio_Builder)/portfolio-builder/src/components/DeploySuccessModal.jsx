import { CheckCircle, ExternalLink, X } from 'lucide-react';

function DeploySuccessModal({ deployUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl max-w-lg w-full relative animate-float">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mb-6">
            <CheckCircle className="w-24 h-24 mx-auto text-green-500 animate-pulse" />
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Deployment Successful! 🎉
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Your portfolio is now live and ready to share with the world!
          </p>

          <div className="glossy-card glass-effect dark:glass-effect-dark rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your site is live at:</p>
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold break-all"
            >
              {deployUrl}
            </a>
          </div>

          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
          >
            Visit Your Portfolio
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default DeploySuccessModal;
