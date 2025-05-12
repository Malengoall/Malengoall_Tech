// Load environment variables
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Start bot logic
const botName = process.env.BOT_NAME || 'Malengoall Bot';
const port = process.env.PORT || 3000;

const app = express();

app.get('/', (req, res) => {
  res.send(`botName is running successfully! 🚀`);
);

app.listen(port, () => 
  console.log(`🤖{botName} is starting on port port`);
  setTimeout(() => 
    console.log(`✅{botName} is now running! Ready for action.`);
  }, 1000);
});
