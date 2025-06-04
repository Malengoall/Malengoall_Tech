const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const P = require("pino");
const chalk = require("chalk");
const figlet = require("figlet");
const fs = require("fs");
const ora = require("ora");
const moment = require("moment");

// Session
const { state, saveState } = useSingleFileAuthState('./session.json');

// Store
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });
store.readFromFile('./store.json');
setInterval(() => store.writeToFile('./store.json'), 10000);

// Terminal header
console.log(chalk.green(figlet.textSync("Malengoall Bot", { horizontalLayout: "full" })));

async function startSock() {
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['MalengoallBot', 'Safari', '1.0.0']
    });

    store.bind(sock.ev);

    sock.ev.on("creds.update", saveState);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red("🔁 Reconnecting..."));
            if (shouldReconnect) startSock();
        } else if (connection === "open") {
            console.log(chalk.green("✅ Connected to WhatsApp"));
        }
    });

    // Auto-reply
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // Sample replies
        if (/hello/i.test(text)) {
            await sock.sendMessage(sender, { text: "Hello! I am Malengoall Bot 🤖" });
        }

        if (/time/i.test(text)) {
            await sock.sendMessage(sender, { text: `⏰ Current time is: ${moment().format('LLLL')}` });
        }
    });

    // Auto view status
    sock.ev.on("messages.update", async (m) => {
        if (m[0]?.status === 'read') {
            // Simulate view
            console.log(chalk.yellow("👀 Status viewed."));
        }
    });

    // Reactions
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (msg.key.fromMe || !msg.message) return;

        if (/like/i.test(msg.message.conversation)) {
            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: "👍", key: msg.key }
            });
        }
    });

    // Group commands
    sock.ev.on("group-participants.update", async (update) => {
        console.log("👥 Group Update: ", update);
        const { id, participants, action } = update;

        for (const user of participants) {
            if (action === "add") {
                await sock.sendMessage(id, { text: `👋 Welcome @${user.split('@')[0]}!`, mentions: [user] });
            } else if (action === "remove") {
                await sock.sendMessage(id, { text: `👋 Bye @${user.split('@')[0]}`, mentions: [user] });
            }
        }
    });

    // Typing status
    setInterval(async () => {
        await sock.sendPresenceUpdate("composing", "status@broadcast");
        setTimeout(() => sock.sendPresenceUpdate("paused", "status@broadcast"), 3000);
    }, 60000);
}

startSock();
