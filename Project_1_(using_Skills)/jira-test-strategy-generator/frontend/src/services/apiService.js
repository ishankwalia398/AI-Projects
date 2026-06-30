import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3001/api';

class ApiService {
  /**
   * Generate Test Strategy
   */
  async generateTestStrategy(jiraConfig, groqConfig, jiraId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/generate`,
        {
          jiraConfig,
          groqConfig,
          jiraId
        },
        {
          timeout: 120000, // 2 minutes
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };

    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Test JIRA Connection
   */
  async testJiraConnection(jiraConfig, testIssueId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/test-jira`,
        {
          jiraConfig,
          issueId: testIssueId
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Test GROQ Connection
   */
  async testGroqConnection(groqConfig) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/test-groq`,
        {
          groqConfig
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data;

      return {
        success: false,
        error: {
          code: errorData.error?.code || 'API_ERROR',
          message: errorData.error?.message || 'An error occurred',
          step: errorData.step || null,
          statusCode: error.response.status
        }
      };

    } else if (error.request) {
      // No response received
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Cannot connect to server. Check your network connection.',
          step: null,
          statusCode: null
        }
      };

    } else {
      // Request setup error
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error.message || 'Failed to make request',
          step: null,
          statusCode: null
        }
      };
    }
  }

  /**
   * Download file from base64
   */
  downloadFile(filename, contentBase64, mimeType = 'application/octet-stream') {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(contentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }
}

export default new ApiService();
