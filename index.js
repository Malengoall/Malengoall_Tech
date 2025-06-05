const {
    default: makeWASocket,
    useSingleFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const figlet = require('figlet');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// Auth file setup
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
const store = makeInMemoryStore({ logger: undefined });
store.readFromFile('./baileys_store.json');
setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10000);

// Banner
console.log(chalk.cyan(figlet.textSync("Malengoall Bot", { font: "Slant" })));

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        logger: undefined,
        generateHighQualityLinkPreview: true
    });

    store.bind(sock.ev);

    // Connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('❌ Connection closed. Reconnecting...'), shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log(chalk.green('✅ Bot Connected Successfully!'));
        }
    });

    // Listen to messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const content = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Command prefix
        if (content.startsWith('.')) {
            const command = content.trim().split(' ')[0].slice(1).toLowerCase();
            const args = content.trim().split(' ').slice(1);

            // Auto-typing simulation
            await sock.sendPresenceUpdate('composing', sender);

            switch (command) {
                case 'menu':
                    await sock.sendMessage(sender, { text: `🧠 *Malengoall Bot Menu*\n\n.menu - Show this menu\n.ping - Bot speed\n.say <msg> - Bot repeats\n.owner - Info` });
                    break;
                case 'ping':
                    await sock.sendMessage(sender, { text: `🏓 Ping OK!` });
                    break;
                case 'say':
                    if (!args.length) return await sock.sendMessage(sender, { text: '❌ Usage: .say <text>' });
                    await sock.sendMessage(sender, { text: args.join(' ') });
                    break;
                case 'owner':
                    await sock.sendMessage(sender, { text: `🤖 Bot by Malengoall.\nGitHub: https://github.com/malengoall` });
                    break;
                default:
                    await sock.sendMessage(sender, { text: '❌ Unknown command.' });
                    break;
            }
        }
    });

    // Save auth state
    sock.ev.on('creds.update', saveState);
}

startBot();
