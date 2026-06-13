/**
 * JIRA API Connection Test Script
 * Phase 2: Link - Verify JIRA API connectivity
 */

require('dotenv').config({ path: '../.env' });
const axios = require('axios');

// Load credentials from .env
const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Test JIRA ID
const TEST_ISSUE_ID = 'MTP-17248';

async function testJiraConnection() {
  console.log('🔗 Testing JIRA API Connection...\n');

  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

    console.log('📋 Configuration:');
    console.log(`   JIRA URL: ${JIRA_URL}`);
    console.log(`   Email: ${JIRA_EMAIL}`);
    console.log(`   Test Issue: ${TEST_ISSUE_ID}\n`);

    // Fetch issue details
    const response = await axios.get(
      `${JIRA_URL}/rest/api/3/issue/${TEST_ISSUE_ID}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ JIRA API Connection Successful!\n');

    // Extract key fields
    const issue = response.data;
    const fields = issue.fields;

    console.log('📄 Issue Details:');
    console.log(`   Key: ${issue.key}`);
    console.log(`   Summary: ${fields.summary}`);
    console.log(`   Type: ${fields.issuetype.name}`);
    console.log(`   Status: ${fields.status.name}`);
    console.log(`   Priority: ${fields.priority?.name || 'N/A'}`);
    console.log(`   Created: ${fields.created}`);
    console.log(`   Updated: ${fields.updated}`);

    // Check for attachments
    if (fields.attachment && fields.attachment.length > 0) {
      console.log(`\n📎 Attachments (${fields.attachment.length}):`);
      fields.attachment.forEach((att, index) => {
        console.log(`   ${index + 1}. ${att.filename} (${att.mimeType})`);
      });
    } else {
      console.log('\n📎 Attachments: None');
    }

    // Check for linked issues
    if (fields.issuelinks && fields.issuelinks.length > 0) {
      console.log(`\n🔗 Linked Issues (${fields.issuelinks.length}):`);
      fields.issuelinks.forEach((link, index) => {
        const linkedIssue = link.inwardIssue || link.outwardIssue;
        if (linkedIssue) {
          console.log(`   ${index + 1}. ${linkedIssue.key} - ${linkedIssue.fields.summary}`);
        }
      });
    } else {
      console.log('\n🔗 Linked Issues: None');
    }

    // Check for subtasks
    if (fields.subtasks && fields.subtasks.length > 0) {
      console.log(`\n📋 Subtasks (${fields.subtasks.length}):`);
      fields.subtasks.forEach((subtask, index) => {
        console.log(`   ${index + 1}. ${subtask.key} - ${subtask.fields.summary} [${subtask.fields.status.name}]`);
      });
    } else {
      console.log('\n📋 Subtasks: None');
    }

    console.log('\n✅ Phase 2 (Link): JIRA API Test PASSED');
    return true;

  } catch (error) {
    console.error('❌ JIRA API Connection Failed!\n');

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.errorMessages || error.response.statusText}`);
    } else if (error.request) {
      console.error('   No response received from JIRA server');
      console.error('   Check your JIRA_URL or network connection');
    } else {
      console.error(`   Error: ${error.message}`);
    }

    console.log('\n❌ Phase 2 (Link): JIRA API Test FAILED');
    return false;
  }
}

// Run test
testJiraConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
