# Malengoall_Tech
WhatsApp bot use Bailey library for quick reply and group management
```js
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs");

const { state, saveState } = useSingleFileAuthState("./auth.json");

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveState);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // ==== COMMANDS ====
        if (text.toLowerCase() === "hello") {
await sock.sendMessage(sender, { text: "Hi! Karibu kwenye Malengoall Bot 🤖" });
        }

        if (text.toLowerCase() === "menu") {
            const menu = `
*🤖 Malengoall Bot Commands:*
- hello : Karibu msg
- menu : Orodha ya commands
- groupinfo : Taarifa za group
- members : Wanafunzi wa group
- mynumber : Namba yako
            `;
            await sock.sendMessage(sender, { text: menu });
        }

        if (text.toLowerCase() === "groupinfo" && sender.endsWith("@g.us")) {
            const metadata = await sock.groupMetadata(sender);
            await sock.sendMessage(sender, { text: `📌 Group: metadata.subject👥 Members:{metadata.participants.length}` });
        }

        if (text.toLowerCase() === "members" && sender.endsWith("@g.us")) {
            const metadata = await sock.groupMetadata(sender);
            const members = metadata.participants.map(p => `- p.id.split("@")[0]`).join("");
            await sock.sendMessage(sender,  text: `👥 Members:{members}` });
        }

        if (text.toLowerCase() === "0613086900") {
            const number = msg.key.participant || msg.key.remoteJid;
            await sock.sendMessage(sender, { text: `📱 Namba yako ni: ${0613086900.split("@")[0]}` });
        }
    });
}

startBot();
```

---
