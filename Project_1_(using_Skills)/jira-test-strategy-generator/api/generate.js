/**
 * Vercel Serverless Function: /api/generate
 * Main endpoint for Test Strategy generation
 */

const JiraClient = require('../lib/jiraClient');
const GroqClient = require('../lib/groqClient');
// PDF generation intentionally skipped — return markdown only

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed. Use POST.' }
    });
  }

  try {
    const { jiraConfig, groqConfig, jiraId } = req.body;

    // Validate input
    if (!jiraConfig || !groqConfig || !jiraId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: jiraConfig, groqConfig, jiraId'
        }
      });
    }

    console.log(`\n🚀 Starting generation for JIRA ${jiraId}`);
    console.log(`   JIRA URL: ${jiraConfig.baseUrl}`);
    console.log(`   Model: ${groqConfig.model || 'llama-3.3-70b-versatile'}`);

    // Step 1: Fetch JIRA issue
    console.log('\n📥 Step 1/3: Fetching JIRA issue...');
    const jiraClient = new JiraClient(jiraConfig);
    const jiraResult = await jiraClient.fetchIssue(jiraId);

    if (!jiraResult.success) {
      return res.status(400).json({
        success: false,
        step: 'jira_fetch',
        error: jiraResult.error
      });
    }

    const jiraData = jiraResult.issue;
    console.log(`✅ JIRA fetch complete: ${jiraData.summary}`);

    // Step 2: Generate Test Strategy with GROQ
    console.log('\n🤖 Step 2/3: Generating Test Strategy with GROQ...');
    const groqClient = new GroqClient(groqConfig);
    const groqResult = await groqClient.generateTestStrategy(jiraData);

    if (!groqResult.success) {
      return res.status(500).json({
        success: false,
        step: 'groq_generation',
        error: groqResult.error
      });
    }

    const { markdown, metadata } = groqResult.testStrategy;
    console.log(`✅ Test Strategy generated (${metadata.tokensUsed} tokens)`);

    // We return only the generated Markdown file (no PDF).
    console.log('\n📄 Skipping PDF generation — returning Markdown only');

    const markdownBuffer = Buffer.from(markdown, 'utf8');

    console.log('\n🎉 Generation complete (markdown-only)\n');

    return res.status(200).json({
      success: true,
      data: {
        jiraData: {
          key: jiraData.key,
          summary: jiraData.summary,
          type: jiraData.type,
          status: jiraData.status,
          priority: jiraData.priority
        },
        metadata: {
          generatedAt: metadata.generatedAt,
          model: metadata.model,
          tokensUsed: metadata.tokensUsed
        },
        files: {
          markdown: {
            filename: `TestStrategy_${jiraData.key}.md`,
            content: markdownBuffer.toString('utf8'),
            contentBase64: markdownBuffer.toString('base64'),
            size: markdownBuffer.length
          }
        }
      }
    });

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};
