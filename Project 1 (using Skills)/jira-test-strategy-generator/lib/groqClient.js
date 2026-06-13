/**
 * GROQ API Client
 * Implements groq_prompt_sop.md
 */

const Groq = require('groq-sdk');

class GroqClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.temperature = config.temperature || 0.3;
    this.maxTokens = config.maxTokens || 4000;

    this.client = new Groq({ apiKey: this.apiKey });
  }

  /**
   * Generate Test Strategy from JIRA data
   * @param {Object} jiraData - Transformed JIRA issue data
   * @returns {Promise<Object>} Generated test strategy markdown
   */
  async generateTestStrategy(jiraData) {
    try {
      console.log(`🤖 Generating test strategy for ${jiraData.key}...`);

      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.constructUserPrompt(jiraData);

      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      const markdown = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;

      console.log(`✅ Generated test strategy (${tokensUsed} tokens)`);

      // Validate output
      if (!this.validateTestStrategy(markdown)) {
        console.warn('⚠️ Generated test strategy may be incomplete');
      }

      return {
        success: true,
        testStrategy: {
          markdown: markdown,
          metadata: {
            jiraId: jiraData.key,
            generatedAt: new Date().toISOString(),
            model: this.model,
            tokensUsed: tokensUsed
          }
        },
        error: null
      };

    } catch (error) {
      console.error(`❌ Failed to generate test strategy:`, error.message);
      return this.handleError(error);
    }
  }

  /**
   * Get fixed system prompt
   */
  getSystemPrompt() {
    return `You are an expert QA Test Strategy Architect with 15+ years of experience in software testing. Your role is to create comprehensive, professional Test Strategy documents that combine formal structure with deep technical insight.

Guidelines:
1. Write in a formal + technical tone suitable for stakeholder review
2. Be specific and actionable - avoid generic statements
3. Follow industry-standard Test Strategy structure
4. Include risk analysis based on issue complexity
5. Recommend appropriate test types (Unit, Integration, E2E, Regression, etc.)
6. Consider linked issues and subtasks as dependencies
7. Output ONLY the Markdown-formatted Test Strategy document
8. Do NOT include explanations, preamble, or meta-commentary

Your output must be production-ready and suitable for immediate use by QA teams.`;
  }

  /**
   * Construct dynamic user prompt from JIRA data
   * Updated format based on Test Strategy for Ecommerce Website.docx
   */
  constructUserPrompt(jiraData) {
    let prompt = `Generate a comprehensive Test Strategy document for the following JIRA issue:

**JIRA ID:** ${jiraData.key}
**Summary:** ${jiraData.summary}
**Type:** ${jiraData.type}
**Status:** ${jiraData.status}
**Priority:** ${jiraData.priority}
**Assignee:** ${jiraData.assignee}
**Reporter:** ${jiraData.reporter}

**Description:**
${jiraData.description}
`;

    // Add labels if present
    if (jiraData.labels && jiraData.labels.length > 0) {
      prompt += `\n**Labels:** ${jiraData.labels.join(', ')}\n`;
    }

    // Add components if present
    if (jiraData.components && jiraData.components.length > 0) {
      const componentNames = jiraData.components.map(c => c.name).join(', ');
      prompt += `\n**Components:** ${componentNames}\n`;
    }

    // Add linked issues if present
    if (jiraData.linkedIssues && jiraData.linkedIssues.length > 0) {
      prompt += `\n**Linked Issues:**\n`;
      jiraData.linkedIssues.forEach(link => {
        prompt += `- ${link.key}: ${link.summary} [${link.status}] (${link.linkType})\n`;
      });
    }

    // Add subtasks if present
    if (jiraData.subtasks && jiraData.subtasks.length > 0) {
      prompt += `\n**Subtasks:**\n`;
      jiraData.subtasks.forEach(task => {
        prompt += `- ${task.key}: ${task.summary} [${task.status}]\n`;
      });
    }

    // Add attachments count
    if (jiraData.attachments && jiraData.attachments.length > 0) {
      prompt += `\n**Attachments:** ${jiraData.attachments.length} file(s) attached\n`;
    }

    // Add structure requirements - Updated format matching provided document
    prompt += `\n---

Create a Test Strategy document with the following structure (based on standard format):

# Test Strategy for ${jiraData.summary}

## Objective
Write a clear, concise objective explaining what needs to be tested and why (2-3 sentences focusing on functionality, usability, and meeting business requirements).

## Scope

### In scope:
- List all features, workflows, and functionalities that WILL be tested
- Include customer-facing features
- Include admin/backend features
- Specify platforms (web, mobile, API)

### Out of scope:
- List what will NOT be covered in testing
- Third-party integrations not directly related
- Physical processes outside the system

## Focus Areas
List 5-7 key testing focus areas in bullet points:
- Functional correctness of flows
- UI/navigation
- Performance - load, stress and scalability
- Security - vulnerabilities, encryption
- Compatibility - browsers, devices, OS
- Usability - ease of use, accessibility
- [Add more based on ${jiraData.type}]

## Approach
Describe the testing approach with specific techniques and tools:
- Testing techniques (Black box, White box, Grey box)
- Automation tools (Selenium, Appium, Playwright, Cypress, etc.)
- Exploratory testing approach
- Load testing tools and targets (JMeter, K6, etc.)
- Security testing approach (OWASP Top 10)
- Browser/device compatibility testing
- User acceptance testing approach

Be specific with numbers (e.g., "at least 1000 concurrent users", "10 end users for UAT").

## Deliverables
List all testing deliverables as bullet points:
- Functional test cases and reports
- Performance test scripts and results
- Security vulnerabilities report
- User acceptance testing report
- Test coverage and defect reports
- Automation regression suite
- [Add more based on requirements]

## Team & Schedule

### Testing team
Specify team size and duration (e.g., "Testing team of 5 members needed for 4 months testing effort").

### Proposed schedule:
Break down by month or sprint with specific activities:
- Month 1: [Functional and security testing]
- Month 2: [Load/performance testing]
- Month 3: [Compatibility testing, UAT]
- Month 4: [Regression testing]

Adjust timeline based on issue complexity and priority.

## Entry & Exit Criteria

### Entry Criteria
List conditions that must be met before testing starts (e.g., "User stories to be tested must meet the defined 'Ready for Testing' criteria").

### Exit Criteria
Define when testing is considered complete (e.g., "Testing completes when all test cases execute with no critical defects outstanding").

## Risks
List potential risks as bullet points:
- Delay in test environment availability
- Lack of access to third party systems
- Complex workflows requiring more time and resources
- [Add specific risks based on ${jiraData.type} and priority]

---

**Requirements:**
- Use formal + technical language similar to the example format
- Keep it concise but comprehensive
- Use bullet points for better readability
- Be specific with numbers and timelines
- Consider the issue type (${jiraData.type}) and priority (${jiraData.priority})
- Include specific tool names and testing techniques
- Make it actionable and practical
- Format output as clean Markdown`;

    return prompt;
  }

  /**
   * Validate generated test strategy
   * Updated for new format
   */
  validateTestStrategy(markdown) {
    const requiredSections = [
      'Objective',
      'Scope',
      'Focus Areas',
      'Approach',
      'Deliverables',
      'Team',
      'Schedule',
      'Entry',
      'Exit',
      'Risks'
    ];

    const missingSections = requiredSections.filter(
      section => !markdown.toLowerCase().includes(section.toLowerCase())
    );

    if (missingSections.length > 0) {
      console.warn(`⚠️ Missing sections: ${missingSections.join(', ')}`);
      return false;
    }

    // Check for placeholder text
    const placeholders = ['...', 'TBD', 'TODO', '[Insert', '[Fill'];
    const hasPlaceholders = placeholders.some(ph => markdown.includes(ph));

    if (hasPlaceholders) {
      console.warn('⚠️ Generated content contains placeholder text');
      return false;
    }

    return true;
  }

  /**
   * Error handling
   */
  handleError(error) {
    let errorCode = 'GROQ_UNKNOWN_ERROR';
    let errorMessage = 'Failed to generate test strategy';
    let details = null;

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          errorCode = 'GROQ_AUTH_FAILED';
          errorMessage = 'Invalid GROQ API key. Check your credentials.';
          break;
        case 429:
          errorCode = 'GROQ_RATE_LIMIT';
          errorMessage = 'GROQ API rate limit exceeded. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
          errorCode = 'GROQ_SERVER_ERROR';
          errorMessage = 'GROQ server error. Please try again.';
          break;
        default:
          errorMessage = error.response.data?.error?.message || 'GROQ API error';
      }

      details = error.response.data;
    } else if (error.message) {
      if (error.message.includes('timeout')) {
        errorCode = 'GROQ_TIMEOUT';
        errorMessage = 'GROQ API request timed out. Please try again.';
      } else if (error.message.includes('network')) {
        errorCode = 'GROQ_NETWORK_ERROR';
        errorMessage = 'Network error connecting to GROQ. Check your connection.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      testStrategy: null,
      error: {
        code: errorCode,
        message: errorMessage,
        details: details
      }
    };
  }
}

module.exports = GroqClient;
