# JIRA Fetch SOP
**Standard Operating Procedure for Fetching JIRA Issue Data**

---

## 🎯 Goal
Fetch comprehensive JIRA issue data including summary, description, attachments, linked issues, and subtasks for Test Strategy generation.

---

## 📥 Input Schema
```json
{
  "jiraConfig": {
    "baseUrl": "string",        // e.g., "https://kaltura.atlassian.net/"
    "email": "string",          // JIRA account email
    "apiToken": "string"        // JIRA API token
  },
  "issueId": "string"          // e.g., "MTP-17248"
}
```

---

## 📤 Output Schema
```json
{
  "success": true,
  "issue": {
    "key": "string",
    "summary": "string",
    "description": "string",
    "type": "string",
    "status": "string",
    "priority": "string",
    "created": "ISO8601",
    "updated": "ISO8601",
    "assignee": "string",
    "reporter": "string",
    "labels": ["string"],
    "components": [{"name": "string"}],
    "attachments": [
      {
        "filename": "string",
        "url": "string",
        "mimeType": "string",
        "size": "number"
      }
    ],
    "linkedIssues": [
      {
        "key": "string",
        "summary": "string",
        "type": "string",
        "status": "string"
      }
    ],
    "subtasks": [
      {
        "key": "string",
        "summary": "string",
        "status": "string"
      }
    ]
  },
  "error": null
}
```

---

## 🔧 Implementation Logic

### Step 1: Authentication
- Create Basic Auth header:
  ```javascript
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  ```
- Add to headers:
  ```javascript
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  ```

### Step 2: API Request
- **Endpoint:** `GET /rest/api/3/issue/{issueIdOrKey}`
- **Timeout:** 10 seconds
- **Retry:** 3 attempts with exponential backoff (1s, 2s, 4s)

### Step 3: Data Extraction
Extract the following fields from `response.data.fields`:
- `summary` - Issue title
- `description` - Full description (may contain ADF or plaintext)
- `issuetype.name` - Type (Story, Bug, Task, Epic, etc.)
- `status.name` - Current status
- `priority.name` - Priority level
- `created` - Creation timestamp
- `updated` - Last updated timestamp
- `assignee.displayName` - Assigned user
- `reporter.displayName` - Reporter user
- `labels` - Array of labels
- `components` - Array of component objects
- `attachment` - Array of attachment objects
- `issuelinks` - Array of linked issues (inward/outward)
- `subtasks` - Array of subtask objects

### Step 4: Data Transformation
Transform nested JIRA API response into flat, usable structure:
```javascript
const transformedIssue = {
  key: issue.key,
  summary: fields.summary,
  description: fields.description || 'No description provided',
  type: fields.issuetype.name,
  status: fields.status.name,
  priority: fields.priority?.name || 'Not set',
  created: fields.created,
  updated: fields.updated,
  assignee: fields.assignee?.displayName || 'Unassigned',
  reporter: fields.reporter?.displayName || 'Unknown',
  labels: fields.labels || [],
  components: fields.components?.map(c => ({ name: c.name })) || [],
  attachments: fields.attachment?.map(att => ({
    filename: att.filename,
    url: att.content,
    mimeType: att.mimeType,
    size: att.size
  })) || [],
  linkedIssues: extractLinkedIssues(fields.issuelinks),
  subtasks: fields.subtasks?.map(sub => ({
    key: sub.key,
    summary: sub.fields.summary,
    status: sub.fields.status.name
  })) || []
};
```

---

## ⚠️ Error Handling

### Common Errors
1. **401 Unauthorized**
   - Invalid email or API token
   - Action: Return error message to user to check credentials

2. **404 Not Found**
   - Issue ID doesn't exist
   - Action: Return "Issue {issueId} not found" error

3. **403 Forbidden**
   - User doesn't have permission to view issue
   - Action: Return "Access denied to issue {issueId}" error

4. **Timeout**
   - JIRA server not responding
   - Action: Retry 3 times, then return "JIRA connection timeout" error

5. **Network Error**
   - No internet connection
   - Action: Return "Network error - check connection" error

### Error Response Format
```json
{
  "success": false,
  "issue": null,
  "error": {
    "code": "JIRA_AUTH_FAILED",
    "message": "Invalid JIRA credentials",
    "statusCode": 401
  }
}
```

---

## 🧪 Testing Checklist
- [ ] Valid issue ID returns full data
- [ ] Issue with attachments retrieves attachment metadata
- [ ] Issue with linked issues retrieves all links
- [ ] Issue with subtasks retrieves all subtasks
- [ ] Invalid credentials return 401 error
- [ ] Non-existent issue returns 404 error
- [ ] Timeout handling works (retry mechanism)
- [ ] Description with special characters handled correctly

---

## 🔒 Security Considerations
- Never log API tokens in plaintext
- Always use HTTPS for API calls
- Sanitize issue descriptions to prevent XSS
- Validate issue ID format before API call (regex: `^[A-Z]+-\d+$`)

---

## 📊 Performance Notes
- Average API response time: 200-500ms
- Rate limit: 5 requests/second per user
- Use connection pooling for multiple requests
- Cache issue data for 5 minutes if regenerating same issue

---

## 📝 Maintenance Log
- **2026-06-12:** Initial SOP created after Phase 2 API test success
- **Next Review:** After Phase 3 implementation
