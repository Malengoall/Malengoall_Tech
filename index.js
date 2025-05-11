js
{
  "name": "malengoall_bot",
  "version": "1.1.0",
  "description": "Advanced WhatsApp bot using Bailey library with quick reply, group management, auto number collection, VCF export, and custom commands.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "keywords": [
    "whatsapp",
    "bot",
    "baileys",
    "quick-reply",
    "group-management",
    "vcf",
    "contact-extractor"
  ],
  "author": "Malengoall",
  "license": "MIT",
  "dependencies": {
    "@adiwajshing/baileys": "^5.0.0",
    "qrcode-terminal": "^0.12.0",
    "fs-extra": "^11.1.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=16"
  }
}

