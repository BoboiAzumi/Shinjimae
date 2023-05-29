import express from "express"

export default class Server{
    constructor(port){
        this.server = express()
        this.listen = this.server.listen(port, () => console.log("Open http://localhost:"+port+"/qr to QR Auth"))
    }
}