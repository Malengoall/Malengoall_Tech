const { Client, LocalAuth, MessageMedia } = import('whatsapp-web.js');
const qrcode = import('qrcode-terminal');
const fs = import('fs');
const ytdl = import('ytdl-core');
const axios = import('axios');
const { exec } = import('child_process');

// Tengeneza WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code itaonekana kwenye Terminal (Termux)
client.on('qr', (qr) => {
    console.log('Scan QR Code Below:');
    qrcode.generate(qr, { small: true });
});

// Bot iko tayari
client.on('ready', () => {
    console.log('BOT is ready on WhatsApp!');
});

// Message handler
client.on('message', async message => {
    const msg = message.body.toLowerCase();

    if (msg === 'hi' || msg === 'hello') {
        return message.reply('Hello! I am your bot. Type *menu* to see options.');
    }

    if (msg === 'menu') {
        return message.reply(`*BOT COMMANDS:*
1. play [YouTube link] - Download audio
2. video [YouTube link] - Download video
3. info - View your contact info
4. sticker - Reply to an image to get sticker
5. ping - Test bot speed
6. help - Show this menu`);
    }

    if (msg === 'info') {
        const contact = await message.getContact();
        return message.reply(`*Your Info:*
Name: ${contact.pushname}
Number: ${contact.number}
ID: ${contact.id.user}`);
    }

    if (msg === 'help') {
        return message.reply('Type *menu* to see all commands.');
    }

    if (msg === 'ping') {
        const start = Date.now();
        const reply = await message.reply('Pinging...');
        const end = Date.now();
        return reply.reply(`Pong! Speed: ${end - start}ms`);
    }

    if (msg === 'sticker' && message.hasMedia) {
        const media = await message.downloadMedia();
        return client.sendMessage(message.from, media, {
            sendMediaAsSticker: true
        });
    }

    if (msg.startsWith('play ')) {
        const url = msg.split(' ')[1];
        if (!ytdl.validateURL(url)) {
            return message.reply('Invalid YouTube link.');
        }

        message.reply('Downloading audio...');
        const path = './audio.mp3';
        const stream = ytdl(url, { filter: 'audioonly' });

        stream.pipe(fs.createWriteStream(path)).on('finish', async () => {
            const media = MessageMedia.fromFilePath(path);
            await client.sendMessage(message.from, media);
            fs.unlinkSync(path);
        });
    }

    if (msg.startsWith('video ')) {
        const url = msg.split(' ')[1];
        if (!ytdl.validateURL(url)) {
            return message.reply('Invalid YouTube link.');
        }

        message.reply('Downloading video...');
        const path = './video.mp4';
        const stream = ytdl(url, { quality: '18' });

        stream.pipe(fs.createWriteStream(path)).on('finish', async () => {
            const media = MessageMedia.fromFilePath(path);
            await client.sendMessage(message.from, media);
            fs.unlinkSync(path);
        });
    }
});

// Anzisha BOT
client.initialize();
