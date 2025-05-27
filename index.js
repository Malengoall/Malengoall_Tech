const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { exec } = require('child_process');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code inaonekana kwenye Termux
client.on('qr', (qr) => {
    console.log('Scan QR Code Below:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('BOT is ready on WhatsApp!');
});

// Command handler
client.on('message', async message => {
    const msg = message.body.toLowerCase();

    // Salamu za kawaida
    if (msg === 'hi' || msg === 'hello') {
        message.reply('Hello! I am your bot. Type *menu* to see options.');
    }

    // Menyu ya bot
    if (msg === 'menu') {
        message.reply(`*BOT COMMANDS:*
1. play [link] - Download audio
2. video [link] - Download video
3. info - Simu info
4. sticker - Tuma sticker
5. ping - Speed test
6. help - Onesha hii menyu`);
    }

    // Info ya mtumiaji
    if (msg === 'info') {
        const contact = await message.getContact();
        message.reply(`*Your Info:*
Name: ${contact.pushname}
Number: ${contact.number}
ID: ${contact.id.user}`);
    }

    // Sticker - reply to image
    if (msg === 'sticker' && message.hasMedia) {
        const media = await message.downloadMedia();
        client.sendMessage(message.from, media, {
            sendMediaAsSticker: true
        });
    }

    // Speed test
    if (msg === 'ping') {
        const start = Date.now();
        const reply = await message.reply('Pinging...');
        const end = Date.now();
        reply.reply(`Pong! Speed: ${end - start}ms`);
    }

    // Play command (audio from YouTube)
    if (msg.startsWith('play ')) {
        const url = msg.split(' ')[1];
        if (!ytdl.validateURL(url)) {
            return message.reply('Invalid YouTube link.');
        }

        message.reply('Downloading audio...');
        const stream = ytdl(url, { filter: 'audioonly' });
        const path = './audio.mp3';

        stream.pipe(fs.createWriteStream(path)).on('finish', async () => {
            const media = MessageMedia.fromFilePath(path);
            await client.sendMessage(message.from, media);
            fs.unlinkSync(path); // Futa baada ya kutuma
        });
    }

    // Download video
    if (msg.startsWith('video ')) {
        const url = msg.split(' ')[1];
        if (!ytdl.validateURL(url)) {
            return message.reply('Invalid YouTube link.');
        }

        message.reply('Downloading video...');
        const stream = ytdl(url, { quality: '18' }); // mp4 360p
        const path = './video.mp4';

        stream.pipe(fs.createWriteStream(path)).on('finish', async () => {
            const media = MessageMedia.fromFilePath(path);
            await client.sendMessage(message.from, media);
            fs.unlinkSync(path);
        });
    }

    // Help command
    if (msg === 'help') {
        message.reply('Type *menu* to see all commands.');
    }
});

client.initialize()
