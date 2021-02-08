/*
Note, this is a super basic API. It's not meant to be complicated, therefore, please don't expect it to be so!
Not following best practices, as it's just quick and dirty.
*/

module.exports = (connection) => {
    const express = require("express");
    const server = express();
    const bodyParser = require("body-parser");
    server.use(bodyParser.json());
    const events = connection.getEmitter();

    server.get("/", (req, res) => {
        res.sendFile(`${__dirname.replace("modules", "")}/website_files/index.html`)
    })
    server.get("/index.css", (req, res) => {
        res.sendFile(`${__dirname.replace("modules", "")}/website_files/index.css`)
    })

    server.get("/events", (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          })

          const interval = setInterval(() => {
            res.write(`event: ping\n`);
            res.write(`data: none\n\n`);
          }, 5000)

          const dstatus = connection.getSettings();
          res.write(`event: status\n`);
          res.write(`data: ${JSON.stringify({
              position: dstatus.queuePosition,
              estimation: dstatus.queueEstimation,
              inQueue: dstatus.inQueue,
              inGame: dstatus.inGame,
              canConnect: dstatus.canConnect
          })}\n\n`);



        events.on("connected", (data) => {
            res.write(`event: connected\n`);
            res.write(`data: true\n\n`);
        })
        events.on("queue_update", (data) => {
            const status = connection.getSettings();
            res.write(`event: status\n`);
            res.write(`data: ${JSON.stringify({
                position: status.queuePosition,
                estimation: status.queueEstimation,
                inQueue: status.inQueue,
                inGame: status.inGame,
                canConnect: status.canConnect
            })}\n\n`);
        })
        events.on("finished_queue", (data) => {
            res.write(`event: finished\n`);
            res.write(`data: true\n\n`);
        })
        events.on("disconnected", (data) => {
            res.write(`event: connected\n`);
            res.write(`data: false\n\n`);
        })


        req.on("close", () => {
            clearInterval(interval);
        })
    })

    server.post("/api/:param", (req, res) => {
        if (req.body.password == config.webserver_configuration.password){
            if (req.params.param == "toggleQueuing"){
                connection.toggleQueue();
            }else{
                res.status(400).json({
                    success: false,
                    reason: "invalid request"
                })
            }
        }else{
            res.status(401).json({
                success: false,
                reason: "unauthenticated"
            })
        }
    })

    server.listen(config.webserver_configuration.port, () => {
        console.log(`2b2w: Webserver online on port ${config.webserver_configuration.port}`);
    })
}