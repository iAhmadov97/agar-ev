import { join } from "path";
import { readdirSync } from "fs";

export interface Commands<I> {
  [key: string]: I;
}

export class CommandHandler {
  public commands: Commands<any>;
  public commandFiles: string[];
  constructor() {
    this.commands = {};
    this.commandFiles = readdirSync(join(__dirname, "../commands")).filter((file: string) => {
      return file.endsWith(".js");
    });
  }
  public initCommands() {
    this.commands = {};
    for (let command of this.commandFiles) {
      this.commands[command.replace(".js", "")] = require(`../commands/${command}`).default;
    }
    return this;
  }
}
