require("dotenv").config();
import { Client, Message } from "discord.js";
import { connect } from "./utils/MongoConnect";
import { CommandHandler } from "./middlewares/Commandhandler";
import { MessageHandler } from "./middlewares/MessageHandler";

(async () => {
  await connect();
  const client: Client = new Client();
  const commandsHandler = new CommandHandler();
  const commands = commandsHandler.initCommands();

  client.on("ready", () => {
    console.log("The was ready");
  });

  client.on("message", (message: Message) => {
    MessageHandler(commands, message);
  });

  client.login(process.env.token);
})();
