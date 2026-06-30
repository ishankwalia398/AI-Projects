# GROQ Prompt Engineering SOP
**Standard Operating Procedure for Test Strategy Generation via GROQ API**

---

## 🎯 Goal
Generate comprehensive, formal + technical Test Strategy documents from JIRA issue data using GROQ's `llama-3.3-70b-versatile` model.

---

## 📥 Input Schema
```json
{
  "groqConfig": {
    "apiKey": "string",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.3,
    "maxTokens": 4000
  },
  "jiraData": {
    "key": "string",
    "summary": "string",
    "description": "string",
    "type": "string",
    "status": "string",
    "priority": "string",
    "linkedIssues": [],
    "subtasks": [],
    "attachments": []
  }
}
```

---

## 📤 Output Schema
```json
{
  "success": true,
  "testStrategy": {
    "markdown": "string",     // Full Markdown document
    "metadata": {
      "jiraId": "string",
      "generatedAt": "ISO8601",
      "model": "string",
      "tokensUsed": "number"
    }
  },
  "error": null
}
```

---

## 🔧 Prompt Engineering Strategy

### System Prompt (Fixed)
```plaintext
You are an expert QA Test Strategy Architect with 15+ years of experience in software testing. Your role is to create comprehensive, professional Test Strategy documents that combine formal structure with deep technical insight.

Guidelines:
1. Write in a formal + technical tone suitable for stakeholder review
2. Be specific and actionable - avoid generic statements
3. Follow industry-standard Test Strategy structure
4. Include risk analysis based on issue complexity
5. Recommend appropriate test types (Unit, Integration, E2E, Regression, etc.)
6. Consider linked issues and subtasks as dependencies
7. Output ONLY the Markdown-formatted Test Strategy document
8. Do NOT include explanations, preamble, or meta-commentary
```

### User Prompt (Dynamic - Constructed from JIRA Data)
```plaintext
Generate a comprehensive Test Strategy document for the following JIRA issue:

**JIRA ID:** {issue.key}
**Summary:** {issue.summary}
**Type:** {issue.type}
**Status:** {issue.status}
**Priority:** {issue.priority}

**Description:**
{issue.description}

{if linkedIssues.length > 0}
**Linked Issues:**
{linkedIssues.map(link => `- ${link.key}: ${link.summary} [${link.status}]`).join('\n')}
{endif}

{if subtasks.length > 0}
**Subtasks:**
{subtasks.map(task => `- ${task.key}: ${task.summary} [${task.status}]`).join('\n')}
{endif}

{if attachments.length > 0}
**Attachments:** {attachments.length} file(s) attached
{endif}

---

Create a Test Strategy document with the following structure:

# Test Strategy: {issue.summary}

## 1. Executive Summary
Brief overview of what needs to be tested and why (2-3 sentences).

## 2. Scope and Objectives
- **In Scope:** What will be tested
- **Out of Scope:** What will NOT be tested
- **Testing Objectives:** Clear, measurable goals

## 3. Test Approach
Describe the overall testing methodology (Agile, Waterfall, Risk-based, etc.).

## 4. Test Types and Levels
List applicable test types:
- Unit Testing
- Integration Testing
- System Testing
- End-to-End Testing
- Regression Testing
- Performance Testing (if applicable)
- Security Testing (if applicable)
- User Acceptance Testing

For each type, specify scope and tools.

## 5. Risk Analysis
Identify risks (High/Medium/Low) and mitigation strategies.

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|------------|
| ... | ... | ... | ... |

## 6. Test Environment
Specify required environments (Dev, QA, Staging, Production).

## 7. Schedule and Milestones
Propose a testing timeline with key milestones.

## 8. Resources
- **Team:** Roles required (QA Engineers, Automation Engineers, etc.)
- **Tools:** Testing tools needed (Selenium, Jest, Postman, etc.)

## 9. Deliverables
List all testing deliverables:
- Test Plan document
- Test cases
- Test scripts (automated)
- Test execution reports
- Defect reports
- Test summary report

## 10. Entry and Exit Criteria
- **Entry Criteria:** Conditions to START testing
- **Exit Criteria:** Conditions to COMPLETE testing

## 11. Dependencies
Based on linked issues and subtasks, identify dependencies.

## 12. Assumptions and Constraints
List any assumptions or constraints affecting the test strategy.

---

**Requirements:**
- Use formal + technical language
- Be specific to THIS issue (not generic)
- Include actionable recommendations
- Consider the issue type ({issue.type}) when recommending tests
- If priority is high, emphasize risk mitigation
- Format output as clean Markdown with proper headers and tables
```

---

## 🔧 Implementation Logic

### Step 1: Prepare GROQ Client
```javascript
const Groq = require('groq-sdk');
const client = new Groq({ apiKey: groqConfig.apiKey });
```

### Step 2: Construct Messages
```javascript
const messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT  // Fixed system prompt
  },
  {
    role: "user",
    content: constructUserPrompt(jiraData)  // Dynamic from JIRA
  }
];
```

### Step 3: Call GROQ API
```javascript
const response = await client.chat.completions.create({
  messages: messages,
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,        // Low for consistency
  max_tokens: 4000,        // Sufficient for full document
  timeout: 60000           // 60 second timeout
});
```

### Step 4: Extract Markdown
```javascript
const markdown = response.choices[0].message.content;
const tokensUsed = response.usage.total_tokens;
```

---

## ⚠️ Error Handling

### Common Errors
1. **401 Unauthorized**
   - Invalid GROQ API key
   - Action: Return "Invalid GROQ API key" error

2. **429 Rate Limit**
   - Exceeded API quota
   - Action: Retry after 1 second, max 3 attempts

3. **Timeout**
   - API response > 60 seconds
   - Action: Retry once, then return error

4. **Model Not Available**
   - Model name incorrect
   - Action: Fall back to `mixtral-8x7b-32768` model

5. **Token Limit Exceeded**
   - Input > 32k tokens
   - Action: Truncate JIRA description to fit

### Error Response Format
```json
{
  "success": false,
  "testStrategy": null,
  "error": {
    "code": "GROQ_API_ERROR",
    "message": "Failed to generate test strategy",
    "details": "..."
  }
}
```

---

## 🧪 Quality Assurance

### Output Validation Checklist
- [ ] Markdown is valid (no broken syntax)
- [ ] All required sections present (1-12)
- [ ] JIRA ID referenced in document
- [ ] Specific to the issue (not generic)
- [ ] Tables formatted correctly
- [ ] No placeholder text (e.g., "...", "TBD")
- [ ] Formal + technical tone maintained
- [ ] Length: 1500-3000 words (optimal)

### Post-Generation Checks
```javascript
function validateTestStrategy(markdown) {
  const requiredSections = [
    "Executive Summary",
    "Scope and Objectives",
    "Test Approach",
    "Test Types",
    "Risk Analysis",
    "Test Environment",
    "Schedule",
    "Resources",
    "Deliverables",
    "Entry and Exit Criteria",
    "Dependencies",
    "Assumptions"
  ];
  
  const missingSections = requiredSections.filter(
    section => !markdown.includes(section)
  );
  
  if (missingSections.length > 0) {
    console.warn(`Missing sections: ${missingSections.join(', ')}`);
  }
  
  return missingSections.length === 0;
}
```

---

## 🎨 Tone Examples

### ❌ Bad (Too Generic)
> "The test strategy will ensure the application works correctly through comprehensive testing."

### ✅ Good (Formal + Technical + Specific)
> "The test strategy will validate TVOD PPV change management workflows through integration testing of payment gateway APIs, end-to-end verification of purchase flows across multi-device scenarios, and regression testing of existing VOD catalog integrity post-deployment."

---

## 📊 Performance Notes
- Average generation time: 5-15 seconds
- Token usage: 1500-3000 tokens (output)
- Cost: ~$0.001 per generation (GROQ free tier)
- Success rate: ~95% (with retry logic)

---

## 🔒 Security Considerations
- Never include API keys in prompts
- Sanitize JIRA descriptions to prevent prompt injection
- Validate markdown output for malicious links
- Log generations for audit trail (without sensitive data)

---

## 📝 Maintenance Log
- **2026-06-12:** Initial SOP created after Phase 2 GROQ API test
- **2026-06-12:** Updated prompt structure to match user-provided format (Test Strategy for Ecommerce Website.docx)
- **Model:** llama-3.3-70b-versatile (replaced openai/gpt-oss-120b)
- **Format:** Simplified, bullet-point heavy structure with Objective → Scope → Focus Areas → Approach → Deliverables → Team & Schedule → Entry/Exit Criteria → Risks
- **Next Review:** After user feedback on new format
