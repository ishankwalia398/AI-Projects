import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Settings state
  const [jiraConfig, setJiraConfig] = useState(() => {
    const saved = localStorage.getItem('jiraConfig');
    return saved ? JSON.parse(saved) : {
      baseUrl: '',
      email: '',
      apiToken: ''
    };
  });

  const [groqConfig, setGroqConfig] = useState(() => {
    const saved = localStorage.getItem('groqConfig');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 4000
    };
  });

  // Generation state
  const [currentPage, setCurrentPage] = useState('settings');
  const [jiraId, setJiraId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [error, setError] = useState(null);

  // Save configs to localStorage
  useEffect(() => {
    localStorage.setItem('jiraConfig', JSON.stringify(jiraConfig));
  }, [jiraConfig]);

  useEffect(() => {
    localStorage.setItem('groqConfig', JSON.stringify(groqConfig));
  }, [groqConfig]);

  // Check if settings are configured
  const isConfigured = () => {
    return (
      jiraConfig.baseUrl &&
      jiraConfig.email &&
      jiraConfig.apiToken &&
      groqConfig.apiKey
    );
  };

  // Navigate to page
  const navigateTo = (page) => {
    setCurrentPage(page);
    setError(null);
  };

  // Reset generation state
  const resetGeneration = () => {
    setJiraId('');
    setGenerationResult(null);
    setError(null);
    setIsGenerating(false);
  };

  const value = {
    // Settings
    jiraConfig,
    setJiraConfig,
    groqConfig,
    setGroqConfig,
    isConfigured,

    // Navigation
    currentPage,
    navigateTo,

    // Generation
    jiraId,
    setJiraId,
    isGenerating,
    setIsGenerating,
    generationResult,
    setGenerationResult,
    error,
    setError,
    resetGeneration
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
