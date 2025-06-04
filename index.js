const {
    makeWASocket,
    makeInMemoryStore,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const figlet = require('figlet');
const ora = require('ora');
const moment = require('moment');
const { Boom } = require('@hapi/boom');

// Session
const SESSION_FOLDER = './auth';
const store = makeInMemoryStore({ logger: P({ level: 'silent' }) });
store.readFromFile('./store.json');
setInterval(() => store.writeToFile('./store.json'), 10000);

// Terminal header
console.log(chalk.green(figlet.textSync('Malengoall Bot', { horizontalLayout: 'default' })));

async function startBot() {
    const spinner = ora('⏳ Starting Malengoall Bot...').start();

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
        },
        browser: ['MalengoallBot', 'Desktop', '1.0.0'],
        printQRInTerminal: true
    });

    store.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('🔁 Disconnected. Reconnecting...'));
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            spinner.succeed('✅ Connected to WhatsApp!');
        }
    });

    // Auto-reply
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (/hello/i.test(text)) {
            await sock.sendMessage(sender, { text: 'Hello! I am Malengoall Bot 🤖' });
        }

        if (/time/i.test(text)) {
            await sock.sendMessage(sender, { text: `⏰ Current time is: ${moment().format('LLLL')}` });
        }

        if (/like/i.test(text)) {
            await sock.sendMessage(sender, {
                react: { text: '👍', key: msg.key }
            });
        }
    });

    // Typing simulation
    setInterval(async () => {
        await sock.sendPresenceUpdate("composing", "s
