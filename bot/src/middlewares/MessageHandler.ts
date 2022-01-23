import { Message } from "discord.js";
import { CommandHandler } from "./Commandhandler";

export const MessageHandler = ({ commands }: CommandHandler, message: Message) => {
  let prefix: string = process.env.prefix ?? "$";

  if (message.content.charAt(0) === prefix) {
    let commandContent = message.content.replace(prefix, "").split(/\s/g);
    if (commandContent.length !== 0) {
      let command = commandContent[0];
      if (command in commands) {
        commands[command](message, commandContent);
      }
    }
  }
};
