module.exports = {
    serverIp: "connect.2b2t.org",
    serverPort: 25565,
    serverVersion: "1.12.2",
    disconnectIfNoClientAfterQueue: true,
    antiAFK: true,
    proxy_configuration: {
        port: 29873,
        whitelist: true,
        chunkCaching: true,
    },
    minecraft_credentials: {
        authMode: "mojang", // mojang/microsoft
        email: "",
        password: ""
    },
    discord_configuration: {
        enabled: true,
        botToken: "",
        ownerId: "",
        notificationSettings: {
            enabled: true,
            place: 20
        }
    },
    webserver_configuration: {
        enabled: true,
        port: 90,
        password: ""
    },
}