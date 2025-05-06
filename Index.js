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
      await sock.sendMessage(sender, { text: "Hi! Karibu kwenye Malengoall Bot 🤖" });
    }

    if (text.toLowerCase() === "menu" || text.toLowerCase() === "help") {
      await sock.sendMessage(sender, {
text: `🤖 *Malengoall Bot Menu*\n\n✅ hello\n✅ !groupinfo\n✅ !members\n✅ !vcf\n✅ !promote @user\n✅ !demote @user\n✅ !kick @user`
      });
    }

    if (text === "!groupinfo" && msg.key.participant) {
      const metadata = await sock.groupMetadata(sender);
      await sock.sendMessage(sender, {
        text: `📌 *Group Info:*\n- Name: metadata.subject- Members:{metadata.participants.length}`
      });
    }

    if (text === "!members") {
      const metadata = await sock.groupMetadata(sender);
      const numbers = metadata.participants.map(p => p.id.split("@")[0]).join("\n");
      await sock.sendMessage(sender, { text: `📱 *Members:*\nnumbers` );
    

    if (text === "!vcf") 
      const metadata = await sock.groupMetadata(sender);
      const vcf = metadata.participants.map(p =>
        `BEGIN:VCARD:3.0:GroupMember:+{p.id.split("@")[0]}\nEND:VCARD`
      ).join("\n");
      fs.writeFileSync("contacts.vcf", vcf);
      await sock.sendMessage(sender, {
        document: fs.readFileSync("contacts.vcf"),
        fileName: "group_contacts.vcf",
        mimetype: "text/x-vcard"
      });
    }

    if (text.startsWith("!promote") || text.startsWith("!demote") || text.startsWith("!kick")) {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
if (!mentioned || !mentioned[0]) return;
      const action = text.split(" ")[0];
      if (action === "!promote") {
        await sock.groupParticipantsUpdate(sender, [mentioned[0]], "promote");
      } else if (action === "!demote") {
        await sock.groupParticipantsUpdate(sender, [mentioned[0]], "demote");
      } else if (action === "!kick") {
        await sock.groupParticipantsUpdate(sender, [mentioned[0]], "remove");
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    if (update.action === "add") {
      for (const participant of update.participants) {
        await sock.sendMessage(update.id, {
          text: `👋 Karibu sana *@${participant.split("@")[0]}* kwenye group!`,
          mentions: [participant]
        });
      }
    }
  });
}

startBot();
``
