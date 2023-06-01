import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"
import MAIN_LOGGER from 'pino'
import {writeLog, newline, readCount, writeCount} from "../log/index.js"

export default class Whatsapp {
    constructor() {
        this.logger = MAIN_LOGGER.default()
        this.logger.level = 'silent' // Change this to silent or error
        this.sock = null
        this.status = 0
        this.qr = null
        this.count = 0

        this.readCount()
    }

    async readCount(){
        this.count = await readCount()
    }

    async WAConnect() {
        const { state, saveCreds } = await useMultiFileAuthState("creds")
        this.sock = makeWASocket.default({
            auth: state,
            logger: this.logger
        })

        this.sock.ev.on("creds.update", saveCreds)

        this.sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update
            if (connection === "close") {
                const koneksiUlang = lastDisconnect.error.output.payload.statusCode != DisconnectReason.loggedOut
                if (koneksiUlang) {
                    this.WAConnect()
                }
                this.status = 0
                this.qr = null
            }
            else if (connection === "open") {
                this.status = 3
                this.qr = null
            }
            else {
                let QR = update.qr ? true : false
                if (QR) {
                    this.status = 1
                    this.qr = update.qr
                }
                else {
                    this.status = 3
                    this.qr = null
                }
            }
        })

        this.sock.ev.on("messages.upsert", async (m) => {
            let isRevoked = m.messages[0].hasOwnProperty("message")? m.messages[0].message.hasOwnProperty("protocolMessage")? true : false : false
            //console.log(m)
            if (!m.messages[0].key.fromMe) {
                if (!isRevoked) {
                    let isMessage = m.messages[0].hasOwnProperty("message") ? true : false
                    let isImage = isMessage ? m.messages[0].message.hasOwnProperty("imageMessage") ? true : false : false
                    let from = m.messages[0].key.remoteJid
                    let msg = isMessage ? isImage ? m.messages[0].message.imageMessage.caption : m.messages[0].message.hasOwnProperty("conversation") ? m.messages[0].message.conversation : m.messages[0].message.hasOwnProperty("extendedTextMessage") ? m.messages[0].message.extendedTextMessage.text : "" : ""

                    let regex = /wa\.me\/settings/gi;
                    //console.log("True 1");
                    //console.log(m.messages[0])
                    //console.log(msg)
                    if (regex.test(msg)) {
                        //console.log("True 2");
                        await this.sock.readMessages([m.messages[0].key])
                        await this.sock.chatModify({
                            clear: {
                                messages: [
                                    {
                                        id: m.messages[0].key.id,
                                        fromMe: m.messages[0].key.fromMe,
                                        timestamp: m.messages[0].messageTimestamp
                                    }
                                ]
                            }
                        }, from, [])
                        //await this.sendText(from, "Shinjimae !")
                        this.count += 1
                        await writeCount(this.count)
                        await writeLog("From        : "+m.messages[0].key.remoteJid)
                        await writeLog("PushName    : "+m.messages[0].pushName)
                        await writeLog("Message     : "+msg)
                        await writeLog(newline)
                    }

                    if(msg == "@isalive"){
                        await this.sock.readMessages([m.messages[0].key])
                        setTimeout(() => this.sendText(from, "I am still Alive"), 1300)
                    }
                }
            }
        })
    }

    getCount() {
        return this.count
    }

    async sendText(jid, str) {
        await this.sock.sendMessage(jid, { text: str })
    }
}