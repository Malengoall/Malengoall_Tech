import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  makeInMemoryStore
} from "@whiskeysockets/baileys";
import chalk from "chalk";
import { Boom } from "@hapi/boom";
import figlet from "figlet";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import qrcode from "qrcode-terminal";
import moment from "moment";

// Directories
const authDir = "./auth_info";
fs.ensureDirSync(authDir);

// Fancy welcome banner
console.log(
  chalk.cyan(
    figlet.textSync("Malengoall Bot", {
      font: "Standard",
      horizontalLayout: "default",
      verticalLayout: "default"
    })
  )
);

// Initialize bot
const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const spinner = ora("Connecting to WhatsApp...").start();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, fs)
    },
    logger: {
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {}
    },
    browser: ['MalengoallBot', 'Safari', '1.0.0']
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      spinner.succeed(chalk.green('✅ Bot connected successfully!'));
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red('🔴 Bot logged out. Re-authenticating...'));
        fs.rmSync(authDir, { recursive: true, force: true });
        startBot();
      } else {
        console.log(chalk.yellow('Reconnecting...'));
        startBot();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    console.log(`[${moment().format("HH:mm:ss")}] ${sender}: ${text}`);

    // Long and numerous commands
    if (text.toLowerCase() === "!help" || text.toLowerCase() === "help me please with all the commands you can offer") {
      await sock.sendMessage(sender, {
        text: `
📜 *Malengoall Bot Command List:*

1️⃣ !hello - Greet the bot
2️⃣ !joke - Random nerdy joke
3️⃣ !quote - Inspirational quote to change your day
4️⃣ !time - Get current server time
5️⃣ !menu - Display extended feature list
6️⃣ !support - Contact dev team
7️⃣ !funny - Get a funny meme (if enabled)
8️⃣ !info - Get WhatsApp user info
9️⃣ !groupinfo - Details about the group
🔟 !ai What is the meaning of life? - Ask the AI anything!

🔁 And many more incoming...

Type *!menu* for extended categories like:
• Media & Downloader
• Entertainment & Games
• Utilities & Tools
• Admin & AutoModeration
• Reactions, Replies, Status-viewer

Enjoy your time with the mighty Malengoall Bot! 🤖
        `.trim()
      });
    }

    if (text.toLowerCase() === "!hello") {
      await sock.sendMessage(sender, { text: "👋 Hello! I'm Malengoall, your friendly WhatsApp bot." });
    }

    if (text.toLowerCase() === "!time") {
      await sock.sendMessage(sender, { text: `🕒 Server time: ${moment().format('LLLL')}` });
    }

    // Add as many commands as you want here...
  });
};

startBot();
