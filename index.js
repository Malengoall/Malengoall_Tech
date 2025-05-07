```js
const { default: makeWASocket, useSingleFileAuthState } = require("@adiwajshing/baileys");
const fs = require("fs");
const qrcode = require("qrcode-terminal");

const { state, saveState } = useSingleFileAuthState("./auth.json");

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveState);

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text.toLowerCase() === "hello") {
            await sock.sendMessage(sender, { text: "👋 Hi! Karibu kwenye Malengoall Bot 🤖" });
        } else if (text.toLowerCase() === "menu") {
            await sock.sendMessage(sender, { text: "📋 *Bot Menu:*\n1. hello\n2. menu\n3. help\n4. group members\n5. sticker\n6. vcf" });
} else if (text.toLowerCase() === "help") {
            await sock.sendMessage(sender, { text: "❓ Tuma neno *menu* kupata orodha ya command." });
        } else if (text.toLowerCase() === "group members") {
            if (msg.key.remoteJid.endsWith("@g.us")) {
                let groupMetadata = await sock.groupMetadata(sender);
                let members = groupMetadata.participants.map(p => p.id).join("\n");
                await sock.sendMessage(sender, { text: `👥 *Group Members:*\n${members}` });
            } else {
                await sock.sendMessage(sender, { text: "❗ Amri hii inatumika tu kwenye group." });
            }
        } else if (text.toLowerCase() === "vcf") {
            const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:Malengoall Contact
TEL;type=CELL;type=VOICE;waid=255613086900:+255 613 086 900
END:VCARD
`;
            await sock.sendMessage(sender, {
                contacts: {
                    displayName: "Malengoall Contact",
                    contacts: [{ vcard }]
                }
            });
        } else if (msg.message.imageMessage && text.toLowerCase() === "sticker") {
            const buffer = await sock.downloadMediaMessage(msg);
            await sock.sendMessage(sender, { sticker: buffer }, { quoted: msg });
        }
    });
}

startBot();
``
