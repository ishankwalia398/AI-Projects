import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import SettingsPage from './components/SettingsPage';
import GeneratorPage from './components/GeneratorPage';
import OutputPage from './components/OutputPage';
import './App.css';

const AppContent = () => {
  const { currentPage, error, setError } = useApp();

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-details">
              <strong>{error.code || 'Error'}</strong>
              <p>{error.message}</p>
              {error.step && <small>Failed at: {error.step}</small>}
            </div>
            <button className="error-close" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'generator' && <GeneratorPage />}
      {currentPage === 'output' && <OutputPage />}
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
