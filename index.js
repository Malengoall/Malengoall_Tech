const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, makeInMemoryStore } = require('@whiskeysockets/baileys')
const chalk = require('chalk');
const figlet = require('figlet');
const ora = require('ora');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { exec } = require('child_process');
const moment = require('moment');
const mime = require('mime-types');

const spinner = ora("Starting Malengoall Bot...").start();

// Create a memory store
const store = makeInMemoryStore({ logger: console });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        defaultQueryTimeoutMs: undefined,
        logger: console,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            return requiresPatch ? { viewOnceMessage: { message: { messageContextInfo: {}, ...message } } } : message;
        }
    });

    store.bind(sock.ev);

    console.log(chalk.green(figlet.textSync("Malengoall Bot", { horizontalLayout: "full" })));
    console.log(chalk.cyan(`📅 Started on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`));
    spinner.succeed("Bot is Live!");

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message || msg.key && msg.key.remoteJid === 'status@broadcast') return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isCmd = body.startsWith('.');
        const command = isCmd ? body.split(' ')[0].slice(1).toLowerCase() : null;
        const args = body.split(' ').slice(1);

        console.log(chalk.yellow(`[MSG] From: ${from}, CMD: ${command}`));

        // Reactions (👍❤️😂🔥)
        await sock.sendMessage(from, { react: { text: '👍', key: msg.key } });

        // Typing simulation
        await sock.sendPresenceUpdate('composing', from);
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendPresenceUpdate('paused', from);

        // COMMANDS
        if (isCmd) {
            switch (command) {
                case 'ping':
                    await sock.sendMessage(from, { text: 'Pong 🏓' });
                    break;

                case 'video':
                    const videoBuffer = fs.readFileSync('./media/sample.mp4');
                    await sock.sendMessage(from, { video: videoBuffer, caption: "Here's your video 📹" });
                    break;

                case 'audio':
                    const audioBuffer = fs.readFileSync('./media/sample.mp3');
                    await sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true });
                    break;

                case 'ai':
                    const query = args.join(" ");
                    if (!query) return sock.sendMessage(from, { text: 'Please provide a prompt e.g., `.ai Who are you?`' });

                    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: query }]
                    }, {
                        headers: {
                            "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
                            "Content-Type": "application/json"
                        }
                    });

                    const aiText = response.data.choices[0].message.content;
                    await sock.sendMessage(from, { text: aiText });
                    break;

                case 'status':
                    const statusList = await sock.fetchStatus(from);
                    await sock.sendMessage(from, { text: `Your status: ${JSON.stringify(statusList)}` });
                    break;

                case 'menu':
                    await sock.sendMessage(from, {
                        text: `🔘 *Malengoall Bot Menu*\n
• .ping – Check bot status
• .video – Send sample video
• .audio – Send sample audio
• .ai <question> – Ask AI
• .status – View your WhatsApp status
• .menu – Show this menu
                    `
                    });
                    break;

                default:
                    await sock.sendMessage(from, { text: `❌ Unknown command: *${command}*.\nType *.menu* to view available commands.` });
            }
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log(chalk.red(`❌ Disconnected: ${lastDisconnect.error}`));
            if (shouldReconnect) {
                console.log(chalk.blue('🔁 Reconnecting...'));
                startBot();
            } else {
                console.log(chalk.redBright('Logged out. Delete session and scan again.'));
            }
        } else if (connection === 'open') {
            console.log(chalk.greenBright('✅ Connected to WhatsApp Web!'));
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
