import { useState } from 'react';
import axios from 'axios';
import { Rocket, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import DeploySuccessModal from './DeploySuccessModal';

function DeployButton({ formData, vercelToken, projectName }) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState(null);
  const [deployUrl, setDeployUrl] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const generatePortfolioHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.fullName} - Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-900 via-purple-950 to-indigo-950 text-white min-h-screen">
  <!-- Animated Background Orbs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float"></div>
    <div class="absolute top-1/3 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
    <div class="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-float" style="animation-delay: 4s;"></div>
  </div>

  <div class="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
    <!-- Hero Section -->
    <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mb-8 text-center">
      ${formData.profilePhoto ? `<img src="${formData.profilePhoto}" alt="${formData.fullName}" class="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-purple-500 shadow-2xl">` : ''}
      <h1 class="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-4">
        ${formData.fullName}
      </h1>
      <p class="text-2xl text-purple-400 mb-6 font-semibold">${formData.title}</p>
      <p class="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">${formData.bio}</p>

      <!-- Social Links -->
      <div class="flex flex-wrap justify-center gap-4 mb-8">
        ${formData.email ? `<a href="mailto:${formData.email}" class="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-xl hover:scale-110 transition-all">Email</a>` : ''}
        ${formData.githubUsername ? `<a href="https://github.com/${formData.githubUsername}" target="_blank" class="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-xl hover:scale-110 transition-all">GitHub</a>` : ''}
        ${formData.linkedinUrl ? `<a href="${formData.linkedinUrl}" target="_blank" class="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-xl hover:scale-110 transition-all">LinkedIn</a>` : ''}
        ${formData.twitterUrl ? `<a href="${formData.twitterUrl}" target="_blank" class="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-xl hover:scale-110 transition-all">Twitter</a>` : ''}
        ${formData.blogUrl ? `<a href="${formData.blogUrl}" target="_blank" class="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-xl hover:scale-110 transition-all">Blog</a>` : ''}
      </div>

      <!-- Skills -->
      ${formData.skills.length > 0 ? `
      <div class="mb-8">
        <h3 class="text-2xl font-bold text-purple-400 mb-4">Skills</h3>
        <div class="flex flex-wrap justify-center gap-3">
          ${formData.skills.map(skill => `<span class="px-5 py-2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-700">${skill}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Resume Download -->
      ${formData.resumeFile ? `<a href="${formData.resumeFile}" download="${formData.resumeFileName}" class="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-all">Download Resume</a>` : ''}
    </div>

    <!-- Projects -->
    ${formData.projects.length > 0 ? `
    <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mb-8">
      <h2 class="text-4xl font-bold text-purple-400 mb-8 text-center">Projects</h2>
      <div class="grid gap-6 md:grid-cols-2">
        ${formData.projects.map(project => `
          <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-105 transition-all">
            <h3 class="text-2xl font-bold text-purple-400 mb-3">${project.title}</h3>
            <p class="text-gray-300 mb-4">${project.description}</p>
            ${project.techStack ? `
              <div class="flex flex-wrap gap-2 mb-4">
                ${project.techStack.split(',').map(tech => `<span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">${tech.trim()}</span>`).join('')}
              </div>
            ` : ''}
            ${project.link ? `<a href="${project.link}" target="_blank" class="text-purple-400 hover:text-purple-300 font-semibold">View Project →</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
  };

  const deployToVercel = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      setDeployStatus('Creating project...');

      const html = generatePortfolioHTML();

      // Create deployment
      const deploymentResponse = await axios.post(
        'https://api.vercel.com/v13/deployments',
        {
          name: projectName,
          files: [
            {
              file: 'index.html',
              data: Buffer.from(html).toString('base64'),
            },
          ],
          projectSettings: {
            framework: null,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setDeployStatus('Deploying...');

      const deploymentUrl = `https://${deploymentResponse.data.url}`;
      setDeployUrl(deploymentUrl);
      setDeployStatus('Deployed successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Deployment error:', err);
      setError(err.response?.data?.error?.message || err.message || 'Deployment failed');
      setDeployStatus(null);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          Ready to Deploy?
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Deploy your portfolio to Vercel with one click!
        </p>

        <button
          onClick={deployToVercel}
          disabled={isDeploying}
          className={`relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden group ${
            isDeploying ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isDeploying ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <span>{deployStatus}</span>
            </>
          ) : (
            <>
              <Rocket className="w-6 h-6" />
              <span>Deploy to Vercel</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-400 flex items-center gap-3 justify-center">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {deployUrl && !showSuccessModal && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-400 flex items-center gap-3 justify-center">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Deployment successful!</p>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:text-green-600"
              >
                {deployUrl}
              </a>
            </div>
          </div>
        )}
      </div>

      {showSuccessModal && (
        <DeploySuccessModal
          deployUrl={deployUrl}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </>
  );
}

export default DeployButton;
