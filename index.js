global.config = require("./config");
global.Minecraft = require("./classes/minecraft");
global.connection = new Minecraft(config.serverIp, config.serverPort, config.serverVersion, config.minecraft_credentials)

if (config.discord_configuration.enabled){
    require("./modules/discord")(connection)
}
if (config.webserver_configuration.enabled){
    require("./modules/webserver")(connection)
}