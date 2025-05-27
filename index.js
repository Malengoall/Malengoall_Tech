import makeWASocket, {
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';
import path from 'path';

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const startBot = async () => {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Bot connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!text) return;

    console.log("Received:", text);

    if (text.startsWith('!audio ')) {
      const query = text.slice(7).trim();
      await sock.sendMessage(from, { text: `Tafadhali subiri, napakua audio ya: ${query}` });

      try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${query}`);
        const output = `./tmp/${query}.mp3`;
        ytdl(`https://www.youtube.com/watch?v=${query}`, { filter: 'audioonly' })
          .pipe(ffmpeg().audioCodec('libmp3lame').save(output))
          .on('end', async () => {
            const audio = fs.readFileSync(output);
            await sock.sendMessage(from, {
              audio: audio,
              mimetype: 'audio/mp4'
            });
            fs.unlinkSync(output);
          });
      } catch (err) {
        await sock.sendMessage(from, { text: `Hitilafu katika kupakua audio: ${err.message}` });
      }
    }

    else if (text.startsWith('!video ')) {
      const query = text.slice(7).trim();
      await sock.sendMessage(from, { text: `Napakua video ya: ${query}` });

      try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${query}`);
        const output = `./tmp/${query}.mp4`;
        ytdl(`https://www.youtube.com/watch?v=${query}`, { quality: 'lowestvideo' })
          .pipe(fs.createWriteStream(output))
          .on('finish', async () => {
            const video = fs.readFileSync(output);
            await sock.sendMessage(from, {
              video: video,
              mimetype: 'video/mp4'
            });
            fs.unlinkSync(output);
          });
      } catch (err) {
        await sock.sendMessage(from, { text: `Tatizo kwenye video: ${err.message}` });
      }
    }

    else if (text === '!menu') {
      await sock.sendMessage(from, {
        text: `*Menu ya Bot:*
1. !audio [YouTube Video ID] - Pakua audio
2. !video [YouTube Video ID] - Pakua video
3. !menu - Onyesha menyu hii tena`
      });
    }
  });
};

startBot();
