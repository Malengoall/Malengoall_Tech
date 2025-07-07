const { Low, JSONFile } = require('lowdb');
const path = require('path');
const fs = require('fs');

// Define path ya database file
const file = path.join(__dirname, '../../db.json');

// Hakikisha file la DB lipo, kama halipo liumbe
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({ chats: [] }, null, 2));
}

// Setup adapter na instance ya LowDB
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize database
async function initDB() {
  await db.read();
  db.data ||= { chats: [] };
  await db.write();
}
initDB();

// Export database ili utumie sehemu nyingine
module.exports = db;
