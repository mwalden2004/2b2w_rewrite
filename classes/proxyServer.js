const mcprotcol = require("minecraft-protocol");
class proxyServer {

    constructor(client, emitter){
        this.client = client;
        this.emitter = emitter;

        this.server = null;
        this.proxyClient = null;

        this.started = false;

        this.startProxy();
    }


    startProxy(){
        if (!this.started){
            this.started = true;
            const cachePackets = require('../modules/cachePackets.js');
            cachePackets.init(this.client, config.proxy_configuration.chunkCaching);

            this.server = mcprotcol.createServer({
                'online-mode': config.proxy_configuration.whitelist,
                encryption: true,
                host: '0.0.0.0',
                port: config.proxy_configuration.port,
                version: config.serverVersion,
                'max-players': 1
            });


            this.server.on('login', (newProxyClient) => {
                if(config.whitelist && this.client.uuid !== newProxyClient.uuid) {
                    newProxyClient.end("You must connect with the same account as 2b2w is using to queue!");
                    return;
                }
                newProxyClient.on('packet', (data, meta, rawData) => {
                    if (meta.name !== "keep_alive" && meta.name !== "update_time") {
                        this.client.writeRaw(rawData);
                    }
                });
                cachePackets.join(newProxyClient);
                this.proxyClient = newProxyClient;
            });
        }
    }

    stopProxy(){
        if (this.server !== null){
            this.server.close();
            if (this.proxyClient !== null){
                this.proxyClient.end("Stopped the proxy.");
            }
        }
    }

    getConnection(){
        if (this.proxyClient == null){
            return undefined;
        }
        return this.proxyClient;
    }

    getProxy(){
        if (this.server == null){
            return undefined;
        }
        return this.server;
    }

}

module.exports = proxyServer;