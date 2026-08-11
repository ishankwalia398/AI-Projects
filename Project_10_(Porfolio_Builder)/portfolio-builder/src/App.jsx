import { useState, useEffect } from 'react';
import { Moon, Sun, Star } from 'lucide-react';
import Hero from './components/Hero';
import Projects from './components/Projects';
import BragCamp from './components/BragCamp';
import DeployButton from './components/DeployButton';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('portfolioData');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      title: '',
      bio: '',
      githubUsername: '',
      linkedinUrl: '',
      twitterUrl: '',
      blogUrl: '',
      email: '',
      projects: [],
      skills: [],
      resumeFile: null,
      resumeFileName: '',
      profilePhoto: null,
      profilePhotoName: '',
    };
  });

  const [isEditMode, setIsEditMode] = useState(!formData.fullName);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('portfolioData', JSON.stringify(formData));
  }, [formData]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const formSteps = [
    {
      title: 'Personal Info',
      fields: ['fullName', 'title', 'bio', 'email'],
    },
    {
      title: 'Social Links',
      fields: ['githubUsername', 'linkedinUrl', 'twitterUrl', 'blogUrl'],
    },
    {
      title: 'Projects',
      fields: ['projects'],
    },
    {
      title: 'Skills',
      fields: ['skills'],
    },
    {
      title: 'Resume & Photo',
      fields: ['resumeFile', 'profilePhoto'],
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, file, fileNameField) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [field]: reader.result,
        [fileNameField]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: '', link: '', screenshot: '' }],
    }));
  };

  const updateProject = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const nextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsEditMode(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 transition-colors duration-500">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-400/30 dark:bg-pink-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 z-50 p-4 rounded-2xl glass-effect dark:glass-effect-dark hover:scale-110 transition-all duration-300 group shadow-2xl hover:shadow-purple-500/50"
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <div className="relative">
            <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl group-hover:bg-amber-400/50 transition-all" />
          </div>
        ) : (
          <div className="relative">
            <Moon className="w-8 h-8 text-indigo-600" strokeWidth={2.5} />
            <Star className="w-3 h-3 text-indigo-600 absolute -top-1 -right-1 animate-pulse" />
            <Star className="w-2 h-2 text-indigo-600 absolute bottom-0 right-0 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 bg-indigo-600/20 rounded-full blur-lg group-hover:bg-indigo-600/40 transition-all" />
          </div>
        )}
      </button>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
        {isEditMode ? (
          <div className="glossy-card glass-effect dark:glass-effect-dark rounded-3xl p-8 shadow-2xl mb-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {formSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex-1 text-center transition-all duration-300 ${
                      index <= currentStep ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                        index <= currentStep
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium">{step.title}</p>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStep + 1) / formSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                {formSteps[currentStep].title}
              </h2>

              {currentStep === 0 && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                  <input
                    type="text"
                    placeholder="Title/Tagline (e.g., Full-Stack Developer)"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                  <textarea
                    placeholder="Bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm resize-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                </>
              )}

              {currentStep === 1 && (
                <>
                  <input
                    type="text"
                    placeholder="GitHub Username"
                    value={formData.githubUsername}
                    onChange={(e) => handleInputChange('githubUsername', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn URL"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                  <input
                    type="url"
                    placeholder="Twitter/X URL"
                    value={formData.twitterUrl}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                  <input
                    type="url"
                    placeholder="Blog URL"
                    value={formData.blogUrl}
                    onChange={(e) => handleInputChange('blogUrl', e.target.value)}
                    className="w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                  />
                </>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  {formData.projects.map((project, index) => (
                    <div key={index} className="glossy-card glass-effect dark:glass-effect-dark p-6 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">Project {index + 1}</h3>
                        <button
                          onClick={() => removeProject(index)}
                          className="text-red-500 hover:text-red-700 transition-colors font-bold text-xl"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={project.title}
                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500"
                      />
                      <textarea
                        placeholder="Description"
                        value={project.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 resize-none"
                      />
                      <input
                        type="text"
                        placeholder="Tech Stack (comma-separated)"
                        value={project.techStack}
                        onChange={(e) => updateProject(index, 'techStack', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500"
                      />
                      <input
                        type="url"
                        placeholder="Project Link"
                        value={project.link}
                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addProject}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                  >
                    + Add Project
                  </button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      id="skill-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addSkill(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-6 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 backdrop-blur-sm"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('skill-input');
                        addSkill(input.value);
                        input.value = '';
                      }}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="glossy-card px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 flex items-center gap-2 border border-purple-300 dark:border-purple-700 shadow-md"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="glossy-card glass-effect dark:glass-effect-dark p-6 rounded-2xl">
                    <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">
                      Upload Resume (PDF, DOC, DOCX, MD)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.md"
                      onChange={(e) => handleFileUpload('resumeFile', e.target.files[0], 'resumeFileName')}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
                    />
                    {formData.resumeFileName && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">✓ {formData.resumeFileName}</p>
                    )}
                  </div>
                  <div className="glossy-card glass-effect dark:glass-effect-dark p-6 rounded-2xl">
                    <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">
                      Upload Profile Photo (JPEG, JPG, PNG, GIF)
                    </label>
                    <input
                      type="file"
                      accept=".jpeg,.jpg,.png,.gif"
                      onChange={(e) => handleFileUpload('profilePhoto', e.target.files[0], 'profilePhotoName')}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
                    />
                    {formData.profilePhotoName && (
                      <div className="mt-4 flex items-center gap-4">
                        <img
                          src={formData.profilePhoto}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                        />
                        <p className="text-sm text-green-600 dark:text-green-400">✓ {formData.profilePhotoName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition-all shadow-lg"
                >
                  Previous
                </button>
              )}
              <button
                onClick={nextStep}
                className="relative flex-1 py-5 px-8 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden group"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />

                {/* Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 blur-xl" />

                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {currentStep === formSteps.length - 1 ? 'Complete' : 'Continue'}
                  <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>

                {/* Edge Highlights */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Hero formData={formData} onEdit={() => setIsEditMode(true)} />
            <Projects projects={formData.projects} />
            {formData.githubUsername && <BragCamp githubUsername={formData.githubUsername} />}
            <DeployButton
              formData={formData}
              vercelToken={import.meta.env.VITE_VERCEL_TOKEN}
              projectName={import.meta.env.VITE_PROJECT_NAME}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
