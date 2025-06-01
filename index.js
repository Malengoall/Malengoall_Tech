import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import figlet from 'figlet';
import chalk from 'chalk';
import axios from 'axios';
import fs from 'fs';

// Banner
console.clear();
console.log(chalk.green(figlet.textSync('Malengoall Bot')));

// WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

// QR Code
client.on('qr', qr => {
    console.log(chalk.yellow('[*] Scan QR Code with your WhatsApp:'));
    qrcode.generate(qr, { small: true });
});

// Ready
client.on('ready', () => {
    console.log(chalk.green('[✓] Bot is online!'));
});

// Message Handling
client.on('message', async msg => {
    const message = msg.body.toLowerCase();

    // Typing status
    client.sendPresenceAvailable();
    msg.react('🤖');

    if (message === 'hi' || message === 'hello') {
        msg.reply('👋 Hujambo! Karibu kwa Malengoall Bot.');
    }

    // Play audio (must be in local folder)
    if (message === '!audio') {
        const media = MessageMedia.fromFilePath('./media/sample.mp3');
        await msg.reply(media);
    }

    // Play video
    if (message === '!video') {
        const media = MessageMedia.fromFilePath('./media/sample.mp4');
        await msg.reply(media);
    }

    // AI Chatbot (basic example using dummy AI response)
    if (message.startsWith('!ask ')) {
        const prompt = message.replace('!ask ', '');
        const aiReply = await getAIResponse(prompt);
        msg.reply(aiReply);
    }

    // View status
    if (message === '!status') {
        msg.reply('✅ Status view feature coming soon...');
    }

    // Reaction
    if (message === '!like') {
        msg.react('❤️');
    }

    // Typing and recording
    if (message === '!typing') {
        client.sendPresenceAvailable();
        msg.reply('📝 Niko naandika...');
    }

    if (message === '!recording') {
        client.sendPresenceRecording();
        msg.reply('🎙️ Niko narekodi...');
    }
});

// AI Response
async function getAIResponse(prompt) {
    try {
        // Replace with your AI service URL or key
        const res = await axios.post('https://api.chatanywhere.tech/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }]
        }, {
            headers: { "Content-Type": "application/json" }
        });
        return res.data.choices[0].message.content.trim();
    } catch (err) {
        console.error('AI Error:', err);
        return "Samahani, siwezi kujibu kwa sasa.";
    }
}

// Start client
client.initialize();
