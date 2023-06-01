import Server from "./server/index.js"
import Whatsapp from "./whatsapp/index.js"
import QRCode from "qrcode"
import fs from "fs"
import {check} from "./log/index.js"

// Default server port is 8080
const port = 8080

const ServerInterface = new Server(port)
const WhatsappInterface = new Whatsapp()
WhatsappInterface.WAConnect()

ServerInterface.server.get("/status", (req,res) => {
    let data = {
        status: "OK",
        whatsapp: WhatsappInterface.status == 0 ? "Close" : WhatsappInterface.status == 1 ? "QR" : WhatsappInterface.status == 2 ? "Connecting" : "Open"
    }
    res.send(JSON.stringify(data))
})

ServerInterface.server.get("/qr", async (req,res) => {
    let isQR = WhatsappInterface.qr ? true : false
    if(isQR) {
        let dataurl = await QRCode.toDataURL(WhatsappInterface.qr)
        res.send("<head> <meta http-equiv=\"refresh\" content=\"3\"> </head><img src=\""+dataurl+"\" width=\"30%\">")
    }
    else if (WhatsappInterface.status == 2){
        res.send("<head> <meta http-equiv=\"refresh\" content=\"3\"> </head>Connecting")
    }
    else{
        res.send("<script type='text/javascript'>document.location.href = '/'</script>")
    }
})

ServerInterface.server.get("/", async (req, res) => {
    if(WhatsappInterface.status !== 3){
        res.redirect(302, "./qr")
    }
    else{
        let html = fs.readFileSync("./public/index.html")
        html = Buffer.from(html).toString("utf-8")

        res.send(html)
    }
})

ServerInterface.server.get("/count", async(req, res) => {
    let struct = {
        status: "OK",
        count: WhatsappInterface.count
    }

    res.send(JSON.stringify(struct))
})

ServerInterface.server.get("/log", async(req, res) => {
    let logFile = "./cache_log/log.txt"
    let c = await check(logFile)
    if(!c){
        res.status(500).send("Log File not Exists")
    }
    else{
        let read = fs.readFileSync(logFile)
        read = Buffer.from(read).toString("utf-8")
        res.status(200).send("<pre>"+read+"</pre>")
    }
})
