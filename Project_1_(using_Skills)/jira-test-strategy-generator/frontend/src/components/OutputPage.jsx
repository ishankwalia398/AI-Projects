import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import apiService from '../services/apiService';
import './OutputPage.css';

const OutputPage = () => {
  const { generationResult, resetGeneration, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('preview');

  if (!generationResult) {
    navigateTo('generator');
    return null;
  }

  const { jiraData, metadata, files } = generationResult;
  const hasPdf = files && files.pdf;

  const handleDownloadMarkdown = () => {
    const success = apiService.downloadFile(
      files.markdown.filename,
      files.markdown.contentBase64,
      'text/markdown'
    );

    if (success) {
      console.log('✓ Markdown downloaded');
    }
  };

  const handleDownloadPDF = () => {
    if (!hasPdf) return;
    const success = apiService.downloadFile(
      files.pdf.filename,
      files.pdf.content,
      'application/pdf'
    );

    if (success) {
      console.log('✓ PDF downloaded');
    }
  };

  const handleDownloadBoth = () => {
    handleDownloadMarkdown();
    setTimeout(() => handleDownloadPDF(), 500);
  };

  const handleNewGeneration = () => {
    resetGeneration();
    navigateTo('generator');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="output-page">
      <div className="output-container">
        <header className="output-header">
          <h1>✅ Test Strategy Generated!</h1>
          <p>Successfully generated test strategy for <strong>{jiraData.key}</strong></p>
        </header>

        {/* JIRA Info Card */}
        <div className="info-card">
          <h3>📄 JIRA Issue Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Key:</span>
              <span className="value">{jiraData.key}</span>
            </div>
            <div className="info-item">
              <span className="label">Type:</span>
              <span className="value">{jiraData.type}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value badge">{jiraData.status}</span>
            </div>
            <div className="info-item">
              <span className="label">Priority:</span>
              <span className="value">{jiraData.priority}</span>
            </div>
          </div>
          <div className="info-summary">
            <span className="label">Summary:</span>
            <p>{jiraData.summary}</p>
          </div>
        </div>

        {/* Generation Metadata */}
        <div className="metadata-card">
          <h3>🤖 Generation Details</h3>
          <div className="metadata-grid">
            <div className="meta-item">
              <span className="label">Model:</span>
              <span className="value">{metadata.model}</span>
            </div>
            <div className="meta-item">
              <span className="label">Tokens Used:</span>
              <span className="value">{metadata.tokensUsed.toLocaleString()}</span>
            </div>
            <div className="meta-item">
              <span className="label">Generated At:</span>
              <span className="value">{new Date(metadata.generatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
          <button
            className={`tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            📁 Files
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'preview' && (
          <div className="preview-section">
            <div className="markdown-preview">
              <pre>{files.markdown.content}</pre>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="files-section">
            <div className="file-card">
              <div className="file-icon">📝</div>
              <div className="file-info">
                <h4>{files.markdown.filename}</h4>
                <p>Markdown Document • {formatFileSize(files.markdown.size)}</p>
              </div>
              <button className="btn btn-download" onClick={handleDownloadMarkdown}>
                Download
              </button>
            </div>

            {hasPdf ? (
              <div className="file-card">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <h4>{files.pdf.filename}</h4>
                  <p>PDF Document • {formatFileSize(files.pdf.size)}</p>
                </div>
                <button className="btn btn-download" onClick={handleDownloadPDF}>
                  Download
                </button>
              </div>
            ) : (
              <div className="file-card file-muted">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <h4>PDF not generated</h4>
                  <p>No PDF available for this generation.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="output-actions">
          <button className="btn btn-secondary" onClick={handleNewGeneration}>
            ← Generate Another
          </button>

          {hasPdf ? (
            <button className="btn btn-primary" onClick={handleDownloadBoth}>
              📥 Download Both Files
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleDownloadMarkdown}>
              📥 Download Markdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputPage;
