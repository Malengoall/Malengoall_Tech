const db = require('./start/lib/lowdb');

async function saveChat(chat) {
  await db.read();
  db.data.chats.push(chat);
  await db.write();
}
