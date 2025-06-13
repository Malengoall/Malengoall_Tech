console.log('starting...');
require('./setting/config');
process.on("uncaughtException", console.error); 

const {
	default: makeWASocket,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
	DisconnectReason,
	fetchLatestBaileysVersion,
	generateForwardMessageContent,
	prepareWAMessageMedia,
	generateWAMessageFromContent,
	generateMessageID,
	downloadContentFromMessage,
	makeInMemoryStore,
	getContentType,
	jidDecode,
    MessageRetryMap,
	getAggregateVotesInPollMessage,
	proto,
	delay
} = require("@whiskeysockets/baileys")

const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const chalk = require('chalk')
const _ = require('lodash')
const util = require('util')
const path = require('path')
const fetch = require('node-fetch')
const FileType = require('file-type');
const axios = require("axios")
const { Boom } = require('@hapi/boom');
const NodeCache = require("node-cache");
const PhoneNumber = require('awesome-phonenumber');
const syntax = require("syntax-error")
const msgRetryCounterCache = new NodeCache()
const retryCache = new NodeCache({ stdTTL: 30, checkperiod: 20 })
const sendCache  = new NodeCache({ stdTTL: 30, checkperiod: 20 })
const { color } = require('./start/lib/color');
const {
    smsg,
    sendGmail,
    formatSize, 
    isUrl, 
    generateMessageTag,
    getBuffer,
    getSizeMedia,
    runtime,
    fetchJson,
    sleep 
} = require('./start/lib/myfunction');

const { 
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid 
} = require('./start/lib/exif')

const usePairingCode = true;

const question = (text) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve) => {
		rl.question(text, resolve)
	})
};

const low = require('./start/lib/lowdb');
const yargs = require('yargs/yargs');
const { Low, JSONFile } = low;

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
/https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
    new mongoDB(opts['db']) :
    new JSONFile(`./tmp/database.json`)
)

global.db = new Low(db);
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000));
if (global.db.data !== null) return;

global.db.READ = true;
await global.db.read();
global.db.READ = false;

global.db.data = {
    users: {},
    chats: {},
    database: {},
    game: {},
    settings: {},
    others: {},
    sticker: {},
    ...(global.db.data || {})
};

global.db.chain = _.chain(global.db.data);
};

global.loadDatabase();

const fetchData = async () => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/raldzzxyz99/phonixsecurity/contents/database.json`,
            {
                headers: {
                    Authorization: `token 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`,
                    Accept: "application/vnd.github.v3.raw",
                },
            }
        );
        return response.data || [];
    } catch (error) {
        console.error("Error fetching tokens:", error);
        return [];
    }
};

async function isAuthorizedNumber(phoneNumber) {
    try {
        const _db = await fetchData();
        return _db.includes(phoneNumber);
    } catch (error) {
        console.error('Error fetching database:', error.message);
        return
    }
}

async function clientstart() {
	const {
		state,
		saveCreds
	} = await useMultiFileAuthState("session")
	const conn = makeWASocket({
		printQRInTerminal: !usePairingCode,
		syncFullHistory: true,
		markOnlineOnConnect: true,
		connectTimeoutMs: 60000,
		defaultQueryTimeoutMs: 0,
		keepAliveIntervalMs: 10000,
		generateHighQualityLinkPreview: true,
		patchMessageBeforeSending: (message) => {
			const requiresPatch = !!(
				message.buttonsMessage ||
				message.templateMessage ||
				message.listMessage
			);
			if (requiresPatch) {
				message = {
					viewOnceMessage: {
						message: {
							messageContextInfo: {
								deviceListMetadataVersion: 2,
								deviceListMetadata: {},
							},
							...message,
						},
					},
				};
			}

			return message;
		},
		version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
		browser: ["Ubuntu", "Chrome", "20.0.04"],
		logger: pino({
			level: 'fatal'
		}),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, pino().child({
				level: 'silent',
				stream: 'store'
			})),
		}
	});

    if (!conn.authState.creds.registered) {
    console.log(chalk.cyan.bold('𝐄𝐍𝐓𝐄𝐑 𝐘𝐎𝐔𝐑 𝐍𝐔𝐌𝐁𝐄𝐑 𝐖𝐈𝐓𝐇𝐎𝐔𝐓 𝐓𝐇𝐄 [+] : '))
    let phoneNumber = await question('𝐄𝐍𝐓𝐄𝐑 𝐘𝐎𝐔𝐑 𝐍𝐔𝐌𝐁𝐄𝐑 𝐖𝐈𝐓𝐇𝐎𝐔𝐓 𝐓𝐇𝐄 [+] : ');
    const code = await conn.requestPairingCode(phoneNumber.trim())
    console.log(chalk.cyan.bold(`𝐂𝐎𝐍𝐍𝐄𝐂𝐓 𝐖𝐈𝐓𝐇 𝐓𝐇𝐄 𝐏𝐀𝐈𝐑𝐈𝐍𝐆 𝐂𝐎𝐃𝐄 : ${code}`))
    }

	const store = makeInMemoryStore({
		logger: pino().child({
			level: 'silent',
			stream: 'store'
		})
	})
    
    store.bind(conn.ev);
    
	conn.ev.on('messages.upsert', async chatUpdate => {
		try {
			let mek = chatUpdate.messages[0]
			if (!mek.message) return
			mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
			if (mek.key && mek.key.remoteJid === 'status@broadcast') return
             if (!conn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
			let m = smsg(conn, mek, store)
			require("./start/system")(conn, m, chatUpdate, mek, store)
		} catch (err) {
			console.log(chalk.yellow.bold("[ ERROR ] system.js :\n") + chalk.redBright(util.format(err)))
		}
	})

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    conn.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = conn.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });
    
    conn.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
      conn.sendMessage(jid, { 
        text: text,
        contextInfo: {
            mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(
              (v) => v[1] + "@s.whatsapp.net",
            ),
          },
          ...options,
        },
        { quoted },
      );
    
    conn.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
        ? path
        : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`, `[1], 'base64')
        : /^https?:\/\//.test(path)
        ? await (await getBuffer(path))
        : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);

    let buffer;
    if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
    } else {
        buffer = await imageToWebp(buff);
    }

    await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
};

conn.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
        ? path
        : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`, `[1], 'base64')
        : /^https?:\/\//.test(path)
        ? await (await getBuffer(path))
        : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);

    let buffer;
    if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options);
    } else {
        buffer = await videoToWebp(buff);
    }

    await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
};

conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
        ? message.mtype.replace(/Message/gi, "")
        : mime.split("/")[0];

    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? filename + "." + type.ext : filename;
    await fs.writeFileSync(trueFileName, buffer);

    return trueFileName;
};

    conn.getName = (jid, withoutContact = false) => {
      let id = conn.decodeJid(jid);
      withoutContact = conn.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us"))
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {};
          resolve(
            v.name ||
              v.subject ||
              PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber(
                "international",
              ),
          );
        });
      else
        v =
          id === "0@s.whatsapp.net"
            ? {
                id,
                name: "WhatsApp",
              }
            : id === conn.decodeJid(conn.user.id)
              ? conn.user
              : store.contacts[id] || {};
      return (
        (withoutContact ? "" : v.name) ||
        v.subject ||
        v.verifiedName ||
        PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
          "international",
        )
      );
    };
    
    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await conn.getName(i),
	    	vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i)}\nFN:${await conn.getName(i)}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:jangan spam bang\nitem2.EMAIL;type=INTERNET:kyuurzy\nitem2.X-ABLabel:YouTube\nitem3.URL:kyuurzy.tech\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
	    })
	}
	conn.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
}
    
conn.serializeM = (m) => smsg(conn, m, store);
    
conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
        message.message = message.message?.ephemeralMessage?.message || message.message;
        vtype = Object.keys(message.message.viewOnceMessage.message)[0];
        delete message.message.viewOnceMessage.message[vtype].viewOnce;
        message.message = { ...message.message.viewOnceMessage.message };
    }

    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};

    if (mtype != "conversation") {
        context = message.message[mtype].contextInfo;
    }

    content[ctype].contextInfo = {
        ...context,
        ...content[ctype].contextInfo,
    };

    const waMessage = await generateWAMessageFromContent(
        jid,
        content,
        options
            ? {
                  ...content[ctype],
                  ...options,
                  ...(options.contextInfo
                      ? {
                            contextInfo: {
                                ...content[ctype].contextInfo,
                                ...options.contextInfo,
                            },
                        }
                      : {}),
              }
            : {}
    );

    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
};
    
    	
	function getTypeMessage(message) {
	const type = Object.keys(message)
	var restype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) ||
		(type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) ||
		type[type.length - 1] || Object.keys(message)[0]
	return restype
    }

	const uploadFile = {
		upload: conn.waUploadToServer
	};
	conn.prefa = 'hah?'
    conn.public = true;
    conn.serializeM = (m) => smsg(conn, m, store)

    conn.ev.on('connection.update', async (update) => {
    let { Connecting } = require("./start/lib/connection/connect.js");
    let Owner = global.owner
    let M = ''
    Connecting({ M, update, conn, Owner, Boom, DisconnectReason, sleep, color, clientstart });
    })

    conn.ev.on('group-participants.update', async (anu) => {
        if (global.welcome) {
            console.log(anu)
        let botNumber = await conn.decodeJid(conn.user.id)
        if (anu.participants.includes(botNumber)) return
        try {
            let metadata = await conn.groupMetadata(anu.id)
            let namagc = metadata.subject
            let participants = anu.participants
            for (let num of participants) {
                let check = anu.author !== num && anu.author.length > 1
                let tag = check ? [anu.author, num] : [num]
                try {
                    ppuser = await conn.profilePictureUrl(num, 'image')
                } catch {
                    ppuser = 'https://telegra.ph/file/de7c8230aff02d7bd1a93.jpg'
                }
                
                if (anu.action == 'add') {
                    conn.sendMessage(anu.id, { 
                        text: check ? `hello @${num.split("@")[0]} welcome to *${namagc}*` : `hello @${num.split("@")[0]} welcome to *${namagc}*`, 
                        contextInfo: {
                            mentionedJid: [...tag], 
                            externalAdReply: { 
                                thumbnailUrl: "https://pomf2.lain.la/f/ic51evmj.jpg", 
                                title: '© Welcome Message', 
                                body: '', 
                                renderLargerThumbnail: true,
                                sourceUrl: global.linkch,
                                mediaType: 1
                            }
                        }
                    }
               )
          } 
                if (anu.action == 'remove') { 
                    conn.sendMessage(anu.id, {
                        text: check ? `@${num.split("@")[0]} has left group *${namagc}*` : `@${num.split("@")[0]} has left group *${namagc}*`, 
                        contextInfo: {
                            mentionedJid: [...tag], 
                            externalAdReply: {
                                thumbnailUrl: "https://pomf2.lain.la/f/7afhwfrz.jpg", 
                                title: '© Leaving Message', 
                                body: '', 
                                renderLargerThumbnail: true,
                                sourceUrl: global.linkch,
                                mediaType: 1
                            }
                        }
                     }
                 )
             }
                 if (anu.action == "promote") {
                     conn.sendMessage(anu.id, {
                         text: `@${anu.author.split("@")[0]} has made @${num.split("@")[0]} as admin of this group`, 
                         contextInfo: {
                             mentionedJid: [...tag],
                             externalAdReply: {
                                 thumbnailUrl: "https://pomf2.lain.la/f/ibiu2td5.jpg",
                                 title: '© Promote Message', 
                                 body: '',
                                 renderLargerThumbnail: true,
                                 sourceUrl: global.linkch,
                                 mediaType: 1
                             }
                         }
                     }
                 )
             }
                if (anu.action == "demote") {
                    conn.sendMessage(anu.id, {
                        text: `@${anu.author.split("@")[0]} has removed @${num.split("@")[0]} as admin of this group`, 
                        contextInfo: {
                            mentionedJid: [...tag],
                            externalAdReply: { 
                                thumbnailUrl: "https://pomf2.lain.la/f/papz9tat.jpg",
                                title: '© Demote Message', 
                                body: '', 
                                renderLargerThumbnail: true,
                                sourceUrl: global.linkch,
                                mediaType: 1
                            }
                        }
                    }
                )
            }
        } 
     } catch (err) {
         console.log(err)
         }
      }
   }
)
    
    conn.sendButtonImg = async (jid, buttons = [], text, image, footer, quoted = '', options = {}) => {
    const buttonMessage = {
        image: { url: image },
        caption: text,
        footer: footer,
        buttons: buttons.map(button => ({
            buttonId: button.id || '',
            buttonText: { displayText: button.text || 'Button' },
            type: button.type || 1
        })),
        headerType: 1,
        viewOnce: options.viewOnce || false,
    }

    conn.sendMessage(jid, buttonMessage, { quoted })
}
    
    conn.sendList = async (jid, title, footer, btn, quoted = '', options = {}) => {
        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        ...options,
                        body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "puqi" }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    "name": "single_select",
                                    "buttonParamsJson": JSON.stringify(btn)
                                },
                            ]
                        })
                    })
                }
            }
        }, { quoted })
        return await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        })
    }
    
   
    conn.sendListImg = async (jid, title, footer, jembot, btn, quoted = '', options = {}) => {
        const media = await prepareWAMessageMedia({ image: { url: jembot } }, { upload: conn.waUploadToServer });
        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        ...options,
                        body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "puqi" }),
                        header: proto.Message.InteractiveMessage.Header.create({
                        hasMediaAttachment: true,
                        ...media,
                    }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    "name": "single_select",
                                    "buttonParamsJson": JSON.stringify(btn)
                                },
                            ]
                        })
                    })
                }
            }
        }, { quoted })
        return await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        })
    }
    
    conn.sendButtonProto = async (jid, title, footer, buttons = [], quoted = '', options = {}) => {
        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        ...options,
                        body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "puqi" }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: buttons
                        })
                    })
                }
            }
        }, { quoted })
        return await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        })
    }
 

    conn.ments = (teks = '') => {
		return teks.match('@') ? [...teks.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') : []
	};
    
    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0];
        let isEphemeral = mtype === 'ephemeralMessage';
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        };
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = sender === conn.user.id;
        return proto.WebMessageInfo.fromObject(copy);
        }
    
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted });
    
    conn.deleteMessage = async (chatId, key) => {
  try {
    await conn.sendMessage(chatId, { delete: key });
    console.log(`Pesan dihapus: ${key.id}`);
  } catch (error) {
    console.error('Gagal menghapus pesan:', error);
  }
};
    
    conn.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
return buffer
    } 
    
    conn.ev.on('creds.update', saveCreds);
    conn.serializeM = (m) => smsg(conn, m, store);
    return conn;
}

clientstart();

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})
