#!/usr/bin/env node

/**
 * Test Google Gemini Integration
 * Usage: node test-gemini.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const aiMock = require('./utils/aiMock');

async function testGemini() {
  console.log('🤖 Testing Google Gemini Integration\n');
  console.log('═'.repeat(60));

  // Check API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ ERROR: GEMINI_API_KEY not set in .env file');
    console.log('📋 Instructions:');
    console.log('1. Go to: https://aistudio.google.com/app/apikey');
    console.log('2. Click "Create API Key"');
    console.log('3. Copy the key');
    console.log('4. Update Backend/.env with your actual API key');
    process.exit(1);
  }

  console.log('✅ API Key found\n');

  // Test 1: Generate Report
  console.log('📊 Test 1: Generate Report');
  console.log('─'.repeat(60));
  try {
    const reportResult = await aiMock.generateReportFromData({
      title: 'Test Report',
      metrics: { revenue: 100000, users: 500 },
      findings: ['Performance improved', 'User retention up'],
      notes: 'Test quarter'
    });

    console.log('✅ Report generated successfully');
    console.log(`Title: ${reportResult.title}`);
    console.log(`Engine: ${reportResult.metadata.engine}`);
    console.log(`Tokens - Prompt: ${reportResult.metadata.promptTokens}, Output: ${reportResult.metadata.outputTokens}`);
    console.log(`Content length: ${reportResult.content.length} characters\n`);
  } catch (error) {
    console.log('❌ Report generation failed:', error.message);
    console.log('\nDebugging tips:');
    console.log('- Verify API key is correct');
    console.log('- Check internet connection');
    console.log('- Verify Gemini API is enabled in Google Cloud');
    process.exit(1);
  }

  // Test 2: Chat with PDF
  console.log('📄 Test 2: Chat with PDF');
  console.log('─'.repeat(60));
  try {
    const chatResult = await aiMock.chatWithPdf(
      'This is a test document about machine learning. Introduction covers ML basics. Conclusion recommends using neural networks.',
      'What does the conclusion recommend?'
    );

    console.log('✅ Chat response generated successfully');
    console.log(`Engine: ${chatResult.metadata.engine}`);
    console.log(`Tokens - Prompt: ${chatResult.metadata.promptTokens}, Output: ${chatResult.metadata.outputTokens}`);
    console.log(`Response: ${chatResult.reply.substring(0, 100)}...\n`);
  } catch (error) {
    console.log('❌ Chat generation failed:', error.message);
    process.exit(1);
  }

  console.log('═'.repeat(60));
  console.log('✨ All tests passed! Gemini integration is working.\n');
  console.log('Next steps:');
  console.log('1. Start backend: npm start');
  console.log('2. Test endpoints with curl or Postman');
  console.log('3. Monitor API usage in Google AI Studio\n');
}

testGemini();
