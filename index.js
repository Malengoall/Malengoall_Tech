js
// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Start bot logic
const botName = process.env.BOT_NAME || "Malengoall Bot";
const port = process.env.PORT || 3000;

console.log(`🤖 botName is starting on port{port}...`);

// Simulate bot running
setTimeout(() => {
  console.log(`✅ ${botName} is now running! Ready to receive commands.`);
}, 1000);
