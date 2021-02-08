const mcprotcol = require("minecraft-protocol");
const proxyServer = require("./proxyServer");
const events = require("events");

class Minecraft {

    constructor(ip, port, version, auth){
        this.ip = ip;
        this.port = port;
        this.version = version;
        this.auth = auth;

        this.canConnect = true;
        this.inQueue = false;
        this.inGame = false;
        this.queuePosition = 1000000;
        this.queueEstimation = "100d";
        this.timeRemaining = 0;

        this.etaArray = [];

        this.emitter = new events.EventEmitter();
        this.emitter.setMaxListeners(99999999) // :D

        this.client = null;
        this.proxy = null;

        this.startConnection();
        
        if (config.antiAFK){
            setInterval(function () {
                if(this.inGame == true && this.client !== null){
                    if (this.proxy.getConnection() == undefined){
                        client.write("chat", { message: "!que", position: 1 })
                    }
                }
            }, 25000)
        }

    }

    getEmitter(){
        return this.emitter;
    }

    getSettings(){
        return {
            inQueue: this.inQueue,
            inGame: this.inGame,
            queuePosition: this.queuePosition,
            queueEstimation: this.queueEstimation,
            timeRemaining: this.timeRemaining,
            canConnect: this.canConnect
        }
    }

    toggleQueue(){
        if (this.inGame == false){
            if (this.inQueue){
                this.canConnect = false;
                this.leaveQueue();
            }else{
                this.canConnect = true;
                this.startConnection();
            }
        }
    }

    startConnection(){
        if (this.canConnect ){
            this.client = mcprotcol.createClient({
                host: this.ip,
                port: this.port,
                version: this.version,
                username: this.auth.email,
                password: this.auth.password,
                auth: this.auth.authMode
            });

            this.client.on("connect", () => {
                console.log("2b2w: Successfully logged in, connecting to queue");
                this.proxy = new proxyServer(this.client, this.emitter);
                this.startQueue();
            })

            this.client.on("error", (err) => {
                console.log(`2b2w: Something went wrong starting Minecraft client.`)
                console.log(`2b2w: MINECRAFT: ${err}`)
            })
        }
    }

    calculateEstimation(){
        const calcArr = this.etaArray;
        console.log(calcArr[0][1], calcArr[calcArr.length-1][1], calcArr.length)
        
        if (calcArr.length >= 20){
            let theArray = calcArr;
        
            theArray = theArray.slice(Math.max(0, theArray.length-50));
            let averages = [];
        
            for (i =0; i <= theArray.length; i+=2){
                const positionA = theArray[i];
                const positionB = theArray[i+1];
                if (positionA !== undefined && positionB !== undefined){
                    const timeForPosition = positionB[0]-positionA[0];
                    averages.push(timeForPosition);
                }
            }
        
            let total = 0;
            for(var i = 0; i < averages.length; i++) {
                total += averages[i];
            }
            let avg = total / averages.length;
            this.timeRemaining = (avg/1000)*calcArr[calcArr.length-1][1]; // in seconds, works by getting last 50 positions in queue, and calculates the amount of time it takes to make way down.

            console.log(this.timeRemaining)
        }

    }

    startQueue(){
        console.log(`2b2w: We're attempting to open a new connection to the 2b2t queue.`);
        if (this.inQueue){
            console.log(`2b2w: You are already in the queue, you can not re-enter the queue on an already connected account.`);
        }else if (this.inGame == false){
            this.inQueue = true;
            this.emitter.emit("connected")
            this.client.on("packet", (data, meta, rawData) => {
                if (this.proxy.getConnection() !== undefined){
                    if (meta.name !== "keep_alive" && meta.name !== "update_time") {
                        this.proxy.getConnection().writeRaw(rawData);
                    }
                }

                switch(meta.name){
                    case "kick_disconnect": {
                        this.proxy.stopProxy();
                        this.emitter.emit("disconnected")
                        console.log(`2b2w: You were disconnected from the queue, we're going to reconnect you here in a second.`);
                        console.log(`2b2w: Server reason for disconect: ${JSON.parse(data.reason).text}`);

                        this.inQueue = false;
                        this.etaArray = [];
                        setTimeout(() => {
                            if (this.canConnect){
                                this.startConnection();
                            }
                        }, 60000)
                        break;
                    }

                    case "playerlist_header": {
                        const header = JSON.parse(data.header).text;
                        let splitHeader = header.replace(/\s+/g, " ");
                        splitHeader = splitHeader.split(" ")

                        if (splitHeader[11] !== undefined && splitHeader[15] !== undefined){
                            const position = splitHeader[11].replace("§l").replace("undefined", "");
                            const estimated = splitHeader[15].replace("§l").replace("undefined", "") + " " + splitHeader[16].replace("undefined", "");

                            this.queuePosition = position;
                            this.queueEstimation = estimated;

                            this.proxy.getProxy().motd = `Place in queue: ${position} ETA: ${estimated}`;


                            if (position == "None" || estimated == "None "){
                                // in queue, waiting for data...
                            }else{
                                // send events
                                console.log(`2b2w: P: ${this.queuePosition} E: ${this.queueEstimation}`)
                                
                                if (this.etaArray.find(a => a[1] == this.queuePosition) == undefined){
                                    this.etaArray.push([Date.now(), this.queuePosition]);
                                }

                                this.calculateEstimation()
                                this.emitter.emit("queue_update", {
                                    position: this.queuePosition,
                                    estimation: this.queueEstimation,
                                    magicEstimation: this.timeRemaining
                                })
                            }
                        }else{
                            //in game!
                            this.inQueue=false;
                            this.inGame=true;
                            this.emitter.emit("finished_queue", true);
                            if (config.disconnectIfNoClientAfterQueue == true){
                                console.log("2b2w: No client on connection to server, disconnecting and rejoining queue.");
                                this.leaveQueue();
                                this.startConnection();
                            }
                        }

                        break;
                    }

                    case "chat": {
                        const message = JSON.parse(data.message);
                        if (message.text && message.text === "Connecting to the server...") {
                            this.emitter.emit("finished_queue")
                        }else{
                            if (message.extra !== undefined){
                                const position = message.extra[1].text;
                                this.queuePosition = position;
                                this.emitter.emit("queue_update", {
                                    position: this.queuePosition,
                                    estimation: this.queueEstimation,
                                })
                            }
                        }
                        break;
                    }

                }
            });
        }
    }

    leaveQueue(){
        this.client.end();
        this.proxy.stopProxy();
        this.emitter.emit("disconnected")

        this.inGame = false;
        this.inQueue = false;
        this.queuePosition = 1000000;
        this.queueEstimation = "100d";
        this.etaArray = [];
        this.timeRemaining = 0;
    }

}

module.exports = Minecraft;