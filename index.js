 js
// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Read user input from terminal
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Print greeting
const botName = process.env.BOT_NAME || "Malengoall Bot";
console.log(`🤖 botName is ready. Type something below:`);

// Listen to user input
rl.on('line', (input) => 
  const lower = input.toLowerCase();

  if (lower === 'hello') 
    console.log("👋 Hello there! I'm Malengoall Bot.");
   else if (lower === 'bye') 
    console.log("👋 Goodbye!");
    rl.close();
   else 
    console.log(`🤔 I don't understand: "{input}"`);
  }
});
