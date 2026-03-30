const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Configure DeepSeek client
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error("Error: DEEPSEEK_API_KEY environment variable is not set.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.deepseek.com'
});

async function generateDailyClaw() {
  const today = new Date().toISOString().split('T')[0];
  const filePath = path.join(__dirname, 'blueprints', `${today}.json`);

  // 1. Check if we already have today's blueprint (unless forcing overwrite)
  if (fs.existsSync(filePath) && process.env.FORCE_OVERWRITE !== 'true') {
    console.log(`Blueprint for ${today} already exists. Skipping.`);
    return;
  }

  // 2. Load the System Prompt
  const systemPrompt = fs.readFileSync(
    path.join(__dirname, 'system-clawkit-drop.txt'), 
    'utf8'
  );

  console.log(`Generating Lobster Blueprint for ${today} using DeepSeek...`);

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",           // DeepSeek's main chat model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the Daily ClawKit blueprint for ${today}.` }
      ],
      response_format: { type: "json_object" }
    });

    const blueprintData = JSON.parse(response.choices[0].message.content);

    // 3. Ensure the blueprints directory exists
    const blueprintsDir = path.join(__dirname, 'blueprints');
    if (!fs.existsSync(blueprintsDir)) {
      fs.mkdirSync(blueprintsDir, { recursive: true });
    }

    // 4. Write the file
    fs.writeFileSync(filePath, JSON.stringify(blueprintData, null, 2));
    console.log(`Successfully saved: ${filePath}`);

  } catch (error) {
    console.error("Error generating blueprint:", error);
    process.exit(1);
  }
}

generateDailyClaw();
