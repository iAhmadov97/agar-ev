import { Message } from "discord.js";
import { User } from "../utils/MongoSchemas";

const Id = async (message: Message, commandContent?: string[]) => {
  const userMentioned = message.mentions.users.first()?.id;
  try {
    const user = await User.findOne({ id: userMentioned ?? message.author.id });
    if (!user) throw new Error("لم يتم تسجيلك فللعبة بعد");
    const result = "_doc" in user ? user._doc : user;
    if (!("pid" in result)) return;
    message.reply(`PID: \`${result.pid}\``);
  } catch (e) {
    message.reply("شيء ما حدث, " + String(e).replace("Error:", ""));
  }
};

export default Id;
