import { Schema, model } from "mongoose";

const userSchema: Schema = new Schema({
  pid: String,
  id: String,
  email: String,
  username: String,
  createdAt: Date,
  balance: Number,
  avatar: String,
  clan: String,
  role: {
    name: String,
    called: String,
    showRole: Boolean,
    admin: Boolean,
    permissionCount: Number,
    max_time: Number,
    permission: {
      mute: Boolean,
      changeColor: Boolean,
      ban: Boolean,
      changeName: Boolean,
      closeChat: Boolean,
      uploadSkin: Boolean,
    },
  },
  verified: Boolean,
  requested: Boolean,
  banned: {
    banned: Boolean,
    expire: Number
  },
  xp: {
    lastScore: Number,
    currentXP: Number,
    totalXP: Number
  },
  level: Number,
  playerDetails: {
    name: String,
    skinImgurCode: String,
    skinsSaved: [],
    muted: {
      muted: Boolean,
      expire: Number
    }
  },
});

const ClansSchema: Schema = new Schema({
  idowner: String,
  pid: String,
  createdAt: Number,
  name: String,
  joinCode: String,
  skin: String,
  bg: String,
  verified: Boolean,
  banned: Boolean,
  tag: String,
  users: {}
});


export const User = model("User", userSchema, "users");
export const Clans = model("Clans", ClansSchema, "clans");
