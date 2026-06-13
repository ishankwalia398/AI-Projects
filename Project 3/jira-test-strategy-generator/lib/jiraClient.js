/**
 * JIRA API Client
 * Implements jira_fetch_sop.md
 */

const axios = require('axios');

class JiraClient {
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
  }

  /**
   * Fetch JIRA issue with all related data
   * @param {string} issueId - JIRA issue ID (e.g., "MTP-17248")
   * @returns {Promise<Object>} Issue data with linked issues, subtasks, attachments
   */
  async fetchIssue(issueId) {
    try {
      // Validate issue ID format
      if (!this.validateIssueId(issueId)) {
        throw new Error(`Invalid JIRA issue ID format: ${issueId}`);
      }

      console.log(`📥 Fetching JIRA issue: ${issueId}`);

      const response = await this.makeRequest(
        `/rest/api/3/issue/${issueId}`,
        { retries: 3 }
      );

      const transformedData = this.transformIssueData(response.data);

      console.log(`✅ Successfully fetched ${issueId}`);
      return {
        success: true,
        issue: transformedData,
        error: null
      };

    } catch (error) {
      console.error(`❌ Failed to fetch JIRA issue ${issueId}:`, error.message);
      return this.handleError(error, issueId);
    }
  }

  /**
   * Make authenticated request to JIRA API
   */
  async makeRequest(endpoint, options = {}) {
    const { retries = 3, timeout = 10000 } = options;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout
        });

        return response;

      } catch (error) {
        lastError = error;

        if (attempt < retries && this.isRetryable(error)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`⚠️ Retry ${attempt}/${retries} after ${delay}ms...`);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Transform JIRA API response to clean structure
   */
  transformIssueData(issueData) {
    const { key, fields } = issueData;

    return {
      key: key,
      summary: fields.summary || 'No summary',
      description: this.sanitizeDescription(fields.description),
      type: fields.issuetype?.name || 'Unknown',
      status: fields.status?.name || 'Unknown',
      priority: fields.priority?.name || 'Not set',
      created: fields.created,
      updated: fields.updated,
      assignee: fields.assignee?.displayName || 'Unassigned',
      reporter: fields.reporter?.displayName || 'Unknown',
      labels: fields.labels || [],
      components: (fields.components || []).map(c => ({ name: c.name })),
      attachments: this.extractAttachments(fields.attachment),
      linkedIssues: this.extractLinkedIssues(fields.issuelinks),
      subtasks: this.extractSubtasks(fields.subtasks)
    };
  }

  /**
   * Extract and format attachments
   */
  extractAttachments(attachments) {
    if (!attachments || attachments.length === 0) return [];

    return attachments.map(att => ({
      filename: att.filename,
      url: att.content,
      mimeType: att.mimeType,
      size: att.size,
      created: att.created
    }));
  }

  /**
   * Extract and format linked issues
   */
  extractLinkedIssues(issuelinks) {
    if (!issuelinks || issuelinks.length === 0) return [];

    const linkedIssues = [];

    issuelinks.forEach(link => {
      const linkedIssue = link.inwardIssue || link.outwardIssue;
      if (linkedIssue) {
        linkedIssues.push({
          key: linkedIssue.key,
          summary: linkedIssue.fields.summary,
          type: linkedIssue.fields.issuetype?.name || 'Unknown',
          status: linkedIssue.fields.status?.name || 'Unknown',
          linkType: link.type?.name || 'Related'
        });
      }
    });

    return linkedIssues;
  }

  /**
   * Extract and format subtasks
   */
  extractSubtasks(subtasks) {
    if (!subtasks || subtasks.length === 0) return [];

    return subtasks.map(sub => ({
      key: sub.key,
      summary: sub.fields.summary,
      status: sub.fields.status?.name || 'Unknown',
      assignee: sub.fields.assignee?.displayName || 'Unassigned'
    }));
  }

  /**
   * Sanitize description for security
   */
  sanitizeDescription(description) {
    if (!description) return 'No description provided';

    // If description is ADF (Atlassian Document Format), extract plain text
    if (typeof description === 'object') {
      return this.extractTextFromADF(description);
    }

    // Remove potential XSS
    return String(description)
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .trim();
  }

  /**
   * Extract plain text from ADF (Atlassian Document Format)
   */
  extractTextFromADF(adf) {
    if (!adf || !adf.content) return 'No description provided';

    let text = '';

    function traverse(node) {
      if (node.type === 'text') {
        text += node.text;
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
      if (node.type === 'paragraph' || node.type === 'heading') {
        text += '\n';
      }
    }

    traverse(adf);
    return text.trim() || 'No description provided';
  }

  /**
   * Validate JIRA issue ID format
   */
  validateIssueId(issueId) {
    const issueIdRegex = /^[A-Z]+-\d+$/;
    return issueIdRegex.test(issueId);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    if (error.code === 'ECONNABORTED') return true; // Timeout
    if (error.code === 'ENOTFOUND') return false;   // DNS error
    if (!error.response) return true;               // Network error

    const status = error.response.status;
    return status === 429 || status >= 500;         // Rate limit or server error
  }

  /**
   * Error handling
   */
  handleError(error, issueId) {
    let errorCode = 'JIRA_UNKNOWN_ERROR';
    let errorMessage = 'Failed to fetch JIRA issue';
    let statusCode = null;

    if (error.response) {
      statusCode = error.response.status;

      switch (statusCode) {
        case 401:
          errorCode = 'JIRA_AUTH_FAILED';
          errorMessage = 'Invalid JIRA credentials. Check your email and API token.';
          break;
        case 403:
          errorCode = 'JIRA_ACCESS_DENIED';
          errorMessage = `Access denied to issue ${issueId}. Check permissions.`;
          break;
        case 404:
          errorCode = 'JIRA_ISSUE_NOT_FOUND';
          errorMessage = `Issue ${issueId} not found. Check the issue ID.`;
          break;
        case 429:
          errorCode = 'JIRA_RATE_LIMIT';
          errorMessage = 'JIRA API rate limit exceeded. Please try again later.';
          break;
        default:
          errorMessage = error.response.data?.errorMessages?.join(', ') || error.response.statusText;
      }
    } else if (error.request) {
      errorCode = 'JIRA_NETWORK_ERROR';
      errorMessage = 'Cannot connect to JIRA server. Check your network or JIRA URL.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      issue: null,
      error: {
        code: errorCode,
        message: errorMessage,
        statusCode: statusCode
      }
    };
  }

  /**
   * Sleep utility for retry logic
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = JiraClient;
