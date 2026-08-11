import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fileToBase64 } from '../utils/slugify';

const OnboardingForm = () => {
  const { updatePortfolioData, completeOnboarding } = usePortfolio();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    blogUrl: '',
    projects: [],
    skills: [],
    resumeUrl: '',
    photoUrl: '',
  });

  const [currentProject, setCurrentProject] = useState({
    title: '',
    description: '',
    techStack: '',
    link: '',
    screenshot: '',
  });

  const [currentSkill, setCurrentSkill] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, photoUrl: base64 });
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Failed to upload photo. Please try again.');
      }
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, resumeUrl: base64 });
      } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Failed to upload resume. Please try again.');
      }
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const handleProjectScreenshot = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setCurrentProject({ ...currentProject, screenshot: base64 });
      } catch (error) {
        console.error('Error uploading screenshot:', error);
      }
    }
  };

  const addProject = () => {
    if (currentProject.title && currentProject.description) {
      setFormData({
        ...formData,
        projects: [...formData.projects, { ...currentProject }],
      });
      setCurrentProject({
        title: '',
        description: '',
        techStack: '',
        link: '',
        screenshot: '',
      });
    }
  };

  const removeProject = (index) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
    });
  };

  const addSkill = () => {
    if (currentSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()],
      });
      setCurrentSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.title)) {
      alert('Please fill in your name and title.');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePortfolioData(formData);
    completeOnboarding();
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: '👤' },
    { number: 2, title: 'Social Links', icon: '🌐' },
    { number: 3, title: 'Work', icon: '💼' },
    { number: 4, title: 'Resume', icon: '📄' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-950 dark:to-indigo-950 py-12 px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Centered Container - narrower and more visible margins */}
      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl shadow-indigo-500/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Create Your Portfolio
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Step {step} of 4 • {steps[step - 1].title}
            </p>
          </div>

          {/* Glossy Progress Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-6 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full -z-10 shadow-inner" />
              {steps.map((s, index) => (
                <div key={s.number} className="flex flex-col items-center z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 relative overflow-hidden ${
                    s.number < step
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-2xl shadow-green-500/50'
                      : s.number === step
                      ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/50 ring-4 ring-purple-200 dark:ring-purple-900 scale-110'
                      : 'bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-500 dark:text-gray-400 shadow-lg'
                  }`}>
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
                    <span className="relative z-10">{s.number < step ? '✓' : s.icon}</span>
                  </div>
                  <span className={`mt-2 text-xs font-semibold ${
                    s.number <= step ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ultra Glossy Form Card */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.7)] p-8 md:p-10 border-2 border-white/50 dark:border-gray-700/50 relative overflow-hidden">
            {/* Multi-layer glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/10 via-transparent to-indigo-500/10 pointer-events-none"></div>
            {/* Edge highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

            <form onSubmit={handleSubmit} className="relative z-10">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Title / Tagline *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
                      placeholder="Full Stack Developer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none shadow-inner"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.photoUrl && (
                        <div className="relative">
                          <img
                            src={formData.photoUrl}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover shadow-2xl ring-4 ring-purple-200 dark:ring-purple-800"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20"></div>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                              {formData.photoUrl ? 'Change photo' : 'Upload photo'}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Social Links */}
              {step === 2 && (
                <div className="space-y-4">
                  {[
                    { name: 'githubUrl', label: 'GitHub URL', placeholder: 'https://github.com/username', gradient: 'from-gray-50 to-slate-100' },
                    { name: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username', gradient: 'from-blue-50 to-cyan-100' },
                    { name: 'twitterUrl', label: 'Twitter URL', placeholder: 'https://twitter.com/username', gradient: 'from-sky-50 to-blue-100' },
                    { name: 'blogUrl', label: 'Website / Blog', placeholder: 'https://yoursite.com', gradient: 'from-purple-50 to-pink-100' },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {field.label}
                      </label>
                      <input
                        type="url"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-gradient-to-br ${field.gradient} dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner`}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Projects & Skills */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Projects */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Projects</h3>
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 space-y-3 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg backdrop-blur-sm">
                      <input
                        type="text"
                        value={currentProject.title}
                        onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-inner"
                        placeholder="Project Title"
                      />
                      <textarea
                        value={currentProject.description}
                        onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                        rows="2"
                        className="w-full px-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none shadow-inner"
                        placeholder="Description"
                      />
                      <input
                        type="text"
                        value={currentProject.techStack}
                        onChange={(e) => setCurrentProject({ ...currentProject, techStack: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-inner"
                        placeholder="Tech Stack"
                      />
                      <input
                        type="url"
                        value={currentProject.link}
                        onChange={(e) => setCurrentProject({ ...currentProject, link: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-inner"
                        placeholder="Project URL"
                      />
                      <label className="block">
                        <div className="px-4 py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg text-center cursor-pointer hover:border-indigo-500 transition-all bg-white/50 dark:bg-gray-800/50">
                          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                            {currentProject.screenshot ? '✓ Screenshot added' : '+ Add screenshot'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProjectScreenshot}
                            className="hidden"
                          />
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={addProject}
                        className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 group-hover:to-white/30 transition-all"></div>
                        <span className="relative z-10">Add Project</span>
                      </button>
                    </div>
                  </div>

                  {formData.projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Projects ({formData.projects.length})
                      </h4>
                      {formData.projects.map((project, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md"
                        >
                          <span className="text-gray-900 dark:text-white text-sm font-medium">{project.title}</span>
                          <button
                            type="button"
                            onClick={() => removeProject(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Skills</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-inner"
                        placeholder="e.g. JavaScript"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2.5 px-6 rounded-lg font-semibold transition-all shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 group-hover:to-white/30 transition-all"></div>
                        <span className="relative z-10">Add</span>
                      </button>
                    </div>
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-purple-200 dark:border-purple-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="hover:text-purple-900 dark:hover:text-purple-100 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Resume */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Upload Resume (PDF)
                    </label>
                    <label className="block cursor-pointer">
                      <div className="flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                        <svg className="w-12 h-12 text-purple-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {formData.resumeUrl ? '✓ Resume uploaded' : 'Upload your resume'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF format only
                        </p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 shadow-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">
                      <strong>🎉 Ready to launch!</strong> Click "Complete Setup" to create your portfolio.
                    </p>
                  </div>
                </div>
              )}

              {/* Glossy Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 dark:to-white/10 group-hover:to-white/40 dark:group-hover:to-white/20 transition-all"></div>
                    <span className="relative z-10">← Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-[0_20px_50px_rgba(147,51,234,0.7)] hover:scale-105 relative overflow-hidden group"
                  >
                    {/* Glossy shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    {/* Animated shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      Continue
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/60 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 group-hover:to-white/30 transition-all"></div>
                    <span className="relative z-10">✨ Complete Setup</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
