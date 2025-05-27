import makeWASocket, {
  DisconnectReason,
  useSingleFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';
import fs from 'fs';

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const startSock = async () => {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startSock();
    } else if (connection === 'open') {
console.log('✅ Connected to WhatsApp!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!messages[0].message) return;
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text?.toLowerCase() === 'hi' || text?.toLowerCase() === 'hello') {
      await sock.sendMessage(from, { text: 'Hello! How can I help you today?' });
    }

    if (text?.toLowerCase() === 'audio') {
      ffmpeg('media/sample.mp3')
        .audioCodec('libmp3lame')
        .save('media/output.mp3')
        .on('end', async () => {
          await sock.sendMessage(from, {
            audio: fs.readFileSync('media/output.mp3'),
            mimetype: 'audio/mp4'
          });
        });
    }

    if (text?.toLowerCase() === 'video') {
      await sock.sendMessage(from, {
        video: fs.readFileSync('media/sample.mp4'),
        caption: 'Here is your video!'
      });
    }
  });
};

startSock();
