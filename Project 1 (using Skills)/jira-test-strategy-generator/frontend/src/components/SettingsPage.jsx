import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { jiraConfig, setJiraConfig, groqConfig, setGroqConfig, navigateTo } = useApp();
  const [saved, setSaved] = useState(false);

  const handleJiraChange = (field, value) => {
    setJiraConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleGroqChange = (field, value) => {
    setGroqConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleContinue = () => {
    if (isValid()) {
      navigateTo('generator');
    }
  };

  const isValid = () => {
    return (
      jiraConfig.baseUrl &&
      jiraConfig.email &&
      jiraConfig.apiToken &&
      groqConfig.apiKey
    );
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>⚙️ Configuration</h1>
          <p>Configure your JIRA and GROQ API credentials</p>
        </header>

        {/* JIRA Configuration */}
        <section className="config-section">
          <h2>🔷 JIRA Configuration</h2>

          <div className="form-group">
            <label htmlFor="jiraUrl">JIRA Base URL *</label>
            <input
              type="url"
              id="jiraUrl"
              placeholder="https://yourcompany.atlassian.net/"
              value={jiraConfig.baseUrl}
              onChange={(e) => handleJiraChange('baseUrl', e.target.value)}
              required
            />
            <small>Your JIRA instance URL (with trailing slash)</small>
          </div>

          <div className="form-group">
            <label htmlFor="jiraEmail">Email *</label>
            <input
              type="email"
              id="jiraEmail"
              placeholder="your.email@company.com"
              value={jiraConfig.email}
              onChange={(e) => handleJiraChange('email', e.target.value)}
              required
            />
            <small>Your JIRA account email</small>
          </div>

          <div className="form-group">
            <label htmlFor="jiraToken">API Token *</label>
            <input
              type="password"
              id="jiraToken"
              placeholder="Your JIRA API token"
              value={jiraConfig.apiToken}
              onChange={(e) => handleJiraChange('apiToken', e.target.value)}
              required
            />
            <small>
              Generate at <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">Atlassian API Tokens</a>
            </small>
          </div>
        </section>

        {/* GROQ Configuration */}
        <section className="config-section">
          <h2>🤖 GROQ Configuration</h2>

          <div className="form-group">
            <label htmlFor="groqApiKey">API Key *</label>
            <input
              type="password"
              id="groqApiKey"
              placeholder="gsk_..."
              value={groqConfig.apiKey}
              onChange={(e) => handleGroqChange('apiKey', e.target.value)}
              required
            />
            <small>
              Get your key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">GROQ Console</a>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="groqModel">Model</label>
            <select
              id="groqModel"
              value={groqConfig.model}
              onChange={(e) => handleGroqChange('model', e.target.value)}
            >
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
            </select>
            <small>AI model for test strategy generation</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="temperature">Temperature</label>
              <input
                type="number"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={groqConfig.temperature}
                onChange={(e) => handleGroqChange('temperature', parseFloat(e.target.value))}
              />
              <small>0.3 = consistent, 0.7 = creative</small>
            </div>

            <div className="form-group">
              <label htmlFor="maxTokens">Max Tokens</label>
              <input
                type="number"
                id="maxTokens"
                min="1000"
                max="8000"
                step="100"
                value={groqConfig.maxTokens}
                onChange={(e) => handleGroqChange('maxTokens', parseInt(e.target.value))}
              />
              <small>Max output length</small>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="settings-actions">
          <button
            className="btn btn-secondary"
            onClick={handleSave}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={!isValid()}
          >
            Continue to Generator →
          </button>
        </div>

        {!isValid() && (
          <div className="validation-warning">
            ⚠️ Please fill in all required fields (*)
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
