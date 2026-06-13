/**
 * GROQ API Connection Test Script
 * Phase 2: Link - Verify GROQ API connectivity
 */

require('dotenv').config({ path: '../.env' });
const Groq = require('groq-sdk');

// Load credentials from .env
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testGroqConnection() {
  console.log('🔗 Testing GROQ API Connection...\n');

  try {
    console.log('📋 Configuration:');
    console.log(`   API Key: ${GROQ_API_KEY.substring(0, 10)}...${GROQ_API_KEY.slice(-4)}`);
    console.log(`   Model: openai/gpt-oss-120b\n`);

    // Initialize GROQ client
    const client = new Groq({
      apiKey: GROQ_API_KEY
    });

    console.log('📤 Sending test prompt to GROQ...\n');

    // Test with a simple prompt
    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a QA Test Strategy expert. Respond in a formal, technical tone."
        },
        {
          role: "user",
          content: "Generate a brief test strategy summary (2-3 sentences) for a login feature."
        }
      ],
      model: "llama-3.3-70b-versatile", // Note: Using this model as openai/gpt-oss-120b might not be available
      temperature: 0.3,
      max_tokens: 200
    });

    console.log('✅ GROQ API Connection Successful!\n');

    console.log('📄 Response Details:');
    console.log(`   Model: ${response.model}`);
    console.log(`   Total Tokens: ${response.usage.total_tokens}`);
    console.log(`   Completion Tokens: ${response.usage.completion_tokens}\n`);

    console.log('📝 Generated Content:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(response.choices[0].message.content);
    console.log('─────────────────────────────────────────────────────────\n');

    console.log('✅ Phase 2 (Link): GROQ API Test PASSED');
    console.log('\n💡 Note: Using "llama-3.3-70b-versatile" model.');
    console.log('   If "openai/gpt-oss-120b" is preferred, update the model name in the main app.\n');

    return true;

  } catch (error) {
    console.error('❌ GROQ API Connection Failed!\n');

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data}`);
    } else if (error.message) {
      console.error(`   Error: ${error.message}`);
    }

    console.log('\n❌ Phase 2 (Link): GROQ API Test FAILED');
    console.log('   Check your GROQ_API_KEY or API quota');
    return false;
  }
}

// Run test
testGroqConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
