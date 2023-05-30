import fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const newline = `
`

export async function check(path){
    let promise = new Promise((resolve) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            if(err){
                resolve(false)
            }
            else{
                resolve(true)
            }
        })
    })

    return await promise
}

export async function writeLog(string){
    let dir = __dirname+"/../cache_log"
    let logfile = dir+"/log.txt"
    let checkdir = await check(dir)
    
    if(!checkdir){
        fs.mkdirSync(dir)
    }

    let checkfile = await check(logfile)
    if(!checkfile){
        fs.writeFileSync(logfile, string)
    }
    else{
        fs.appendFileSync(logfile, newline+string)
    }
}

export async function writeCount(string){
    let dir = __dirname+"/../cache_log"
    let logfile = dir+"/count.txt"
    let checkdir = await check(dir)
    
    if(!checkdir){
        fs.mkdirSync(dir)
    }
    string =  ""+string
    fs.writeFileSync(logfile, string)
}

export async function readCount(){
    let dir = __dirname+"/../cache_log"
    let logfile = dir+"/count.txt"
    let checkdir = await check(dir)
    
    if(!checkdir){
        fs.mkdirSync(dir)
    }

    let checkFile = await check(logfile)

    if(!checkFile){
        return 0
    }
    else{
        let file = fs.readFileSync(logfile)
        file = Buffer.from(file).toString("utf-8")

        return parseInt(file)
    }
}