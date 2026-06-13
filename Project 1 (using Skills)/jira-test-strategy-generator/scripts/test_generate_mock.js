// Mock test runner for generate API — returns markdown-only response
(function main() {
  const jiraData = {
    key: 'MTP-17248',
    summary: 'Sample feature implementation',
    description: 'This is a sample description for the issue.',
    type: 'Story',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'Jane Doe',
    reporter: 'John Smith',
    labels: ['backend', 'api'],
    components: [{ name: 'Payments' }],
    attachments: [],
    linkedIssues: [],
    subtasks: []
  };

  const metadata = {
    generatedAt: new Date().toISOString(),
    model: 'llama-3.3-70b-versatile',
    tokensUsed: 1234
  };

  const markdown = `# Test Strategy for ${jiraData.summary}\n\n## Objective\nThis document outlines testing for ${jiraData.key}.\n`;

  const markdownBuffer = Buffer.from(markdown, 'utf8');

  const response = {
    success: true,
    data: {
      jiraData: {
        key: jiraData.key,
        summary: jiraData.summary,
        type: jiraData.type,
        status: jiraData.status,
        priority: jiraData.priority
      },
      metadata: metadata,
      files: {
        markdown: {
          filename: `TestStrategy_${jiraData.key}.md`,
          content: markdownBuffer.toString('utf8'),
          contentBase64: markdownBuffer.toString('base64'),
          size: markdownBuffer.length
        }
      }
    }
  };

  console.log(JSON.stringify(response, null, 2));
})();
