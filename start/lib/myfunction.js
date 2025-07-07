module.exports = {
  name: 'salamu',
  description: 'Inatoa salamu kwa mtumiaji',
  execute: async (client, message, args) => {
    const reply = `👋 Habari ${message.senderName || 'rafiki'}! Karibu kwenye bot yetu ya MalengoAll 💫`;
    await client.sendMessage(message.chat, { text: reply });
  }
};
