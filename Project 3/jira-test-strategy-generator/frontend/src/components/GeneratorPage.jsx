import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import apiService from '../services/apiService';
import './GeneratorPage.css';

const GeneratorPage = () => {
  const {
    jiraConfig,
    groqConfig,
    jiraId,
    setJiraId,
    isGenerating,
    setIsGenerating,
    setGenerationResult,
    setError,
    navigateTo
  } = useApp();

  const [localJiraId, setLocalJiraId] = useState(jiraId || '');

  const handleGenerate = async () => {
    if (!localJiraId.trim()) {
      setError({ message: 'Please enter a JIRA ID' });
      return;
    }

    // Validate JIRA ID format
    const jiraIdRegex = /^[A-Z]+-\d+$/;
    if (!jiraIdRegex.test(localJiraId.trim())) {
      setError({ message: 'Invalid JIRA ID format. Expected format: PROJ-123' });
      return;
    }

    setJiraId(localJiraId.trim());
    setIsGenerating(true);
    setError(null);

    try {
      const result = await apiService.generateTestStrategy(
        jiraConfig,
        groqConfig,
        localJiraId.trim()
      );

      if (result.success) {
        setGenerationResult(result.data);
        navigateTo('output');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError({
        message: 'Unexpected error occurred',
        details: err.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  return (
    <div className="generator-page">
      <div className="generator-container">
        <header className="generator-header">
          <h1>🚀 Test Strategy Generator</h1>
          <p>Enter a JIRA issue ID to generate a comprehensive test strategy document</p>
        </header>

        <div className="generator-content">
          <div className="input-section">
            <label htmlFor="jiraInput">JIRA Issue ID</label>
            <div className="input-group">
              <input
                type="text"
                id="jiraInput"
                placeholder="e.g., MTP-17248"
                value={localJiraId}
                onChange={(e) => setLocalJiraId(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={isGenerating}
                autoFocus
              />
              <button
                className="btn btn-generate"
                onClick={handleGenerate}
                disabled={isGenerating || !localJiraId.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>Generate →</>
                )}
              </button>
            </div>
            <small>Format: PROJECT-NUMBER (e.g., PROJ-123)</small>
          </div>

          {isGenerating && (
            <div className="progress-section">
              <div className="progress-card">
                <div className="progress-step active">
                  <span className="step-icon">1️⃣</span>
                  <div>
                    <h3>Fetching JIRA Issue</h3>
                    <p>Retrieving issue details, linked issues, and subtasks...</p>
                  </div>
                </div>

                <div className="progress-step">
                  <span className="step-icon">2️⃣</span>
                  <div>
                    <h3>Generating Test Strategy</h3>
                    <p>AI is analyzing requirements and creating strategy...</p>
                  </div>
                </div>

                <div className="progress-step">
                  <span className="step-icon">3️⃣</span>
                  <div>
                    <h3>Creating PDF</h3>
                    <p>Converting markdown to professionally formatted PDF...</p>
                  </div>
                </div>
              </div>

              <p className="progress-note">⏱️ This may take 30-60 seconds...</p>
            </div>
          )}

          <div className="info-section">
            <h3>📋 What will be generated?</h3>
            <ul>
              <li><strong>Executive Summary</strong> - Overview of testing scope and objectives</li>
              <li><strong>Test Approach</strong> - Methodology and strategy</li>
              <li><strong>Test Types</strong> - Unit, Integration, E2E, Regression, etc.</li>
              <li><strong>Risk Analysis</strong> - Identified risks and mitigation plans</li>
              <li><strong>Resources & Tools</strong> - Team requirements and tooling</li>
              <li><strong>Schedule & Deliverables</strong> - Timeline and expected outputs</li>
            </ul>
          </div>

          <div className="config-info">
            <p>
              <strong>📍 JIRA:</strong> {jiraConfig.baseUrl}
            </p>
            <p>
              <strong>🤖 Model:</strong> {groqConfig.model}
            </p>
          </div>
        </div>

        <div className="generator-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigateTo('settings')}
            disabled={isGenerating}
          >
            ← Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
