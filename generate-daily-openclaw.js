const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Ensure required files exist with fallbacks
function ensureSystemPrompt() {
  const promptPath = path.join(__dirname, 'system-clawkit-drop.txt');
  const defaultPrompt = `You are ClawKit, an AI assistant that generates daily creative content about claws, kits, and related themes. Create engaging, well-structured, and informative content that's suitable for a daily blueprint. Be creative, accurate, and maintain a consistent tone.`;
  
  if (!fs.existsSync(promptPath)) {
    console.warn('⚠️  system-clawkit-drop.txt not found, using default prompt');
    return defaultPrompt;
  }
  
  try {
    return fs.readFileSync(promptPath, 'utf8');
  } catch (err) {
    console.warn('⚠️  Error reading system-clawkit-drop.txt, using default prompt');
    return defaultPrompt;
  }
}

async function generateDailyClaw() {
  try {
    // Check for DeepSeek API key
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }

    // Initialize DeepSeek client (OpenAI-compatible)
    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY
    });

    const hemisphere = process.env.DAILY_DROP_HEMISPHERE || 'northern';
    const forceOverwrite = process.env.FORCE_OVERWRITE === 'true';
    const today = new Date().toISOString().split('T')[0];
    
    // Create blueprints directory if it doesn't exist
    const blueprintsDir = path.join(__dirname, 'blueprints');
    if (!fs.existsSync(blueprintsDir)) {
      fs.mkdirSync(blueprintsDir, { recursive: true });
      console.log('📁 Created blueprints directory');
    }
    
    const outputPath = path.join(blueprintsDir, `${today}.json`);
    
    // Check if file exists and we're not forcing overwrite
    if (fs.existsSync(outputPath) && !forceOverwrite) {
      console.log(`⚠️  File ${today}.json already exists in blueprints folder. Use force_overwrite to regenerate.`);
      return;
    }
    
    // Get system prompt
    const systemPrompt = ensureSystemPrompt();
    
    console.log(`🤖 Generating Daily OpenClaw for ${today} (${hemisphere} hemisphere)...`);
    
    // Call DeepSeek API
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate a daily OpenClaw blueprint for ${today}. Hemisphere: ${hemisphere}. Include: title, description, main content, key takeaways, and metadata. Format as JSON.`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const responseContent = completion.choices[0].message.content;
    
    // Parse and validate JSON
    let blueprintData;
    try {
      blueprintData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      // Create a fallback structure
      blueprintData = {
        title: `Daily OpenClaw - ${today}`,
        description: "Generated content",
        content: responseContent,
        date: today,
        hemisphere: hemisphere,
        metadata: {
          generated_at: new Date().toISOString(),
          model: "deepseek-chat",
          version: "1.0.0"
        }
      };
    }
    
    // Add metadata
    blueprintData.date = today;
    blueprintData.hemisphere = hemisphere;
    if (!blueprintData.metadata) {
      blueprintData.metadata = {};
    }
    blueprintData.metadata.generated_at = new Date().toISOString();
    blueprintData.metadata.model = "deepseek-chat";
    blueprintData.metadata.version = "1.0.0";
    
    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(blueprintData, null, 2));
    console.log(`✅ Successfully generated ${today}.json in blueprints folder`);
    
  } catch (error) {
    console.error('❌ Error generating daily OpenClaw:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the function
generateDailyClaw();
