import { verify } from "jsonwebtoken";
import { fetchUser, updateUser } from "../utils/actions";
import { User } from "../utils/mongoSchemas";
import { ClientHandler } from "./ClientWsHandler";
import { BinaryReader, BinaryWriter } from "../utils/BinaryPacket";

const secret = process.env.SQ || "0dsf62sdf60f6s5df63514";

export const WebSocketHandler = (ws: any, clients: ClientHandler) => {
  const sentAMessage = (pid: string, message: any, itsObject: boolean = false) => {
    if (!pid || !message) return;
    let users = clients.getClients();
    if (pid in users) {
      let buffer = null;
      if (itsObject !== true) {
        let writer = new BinaryWriter(0);
        writer.writeUInt8(0x10);
        writer.writeStringUtf8(message);
        buffer = writer._buffer;
      }
      users[pid].ws.send(itsObject === true && !buffer ? ("_buffer" in message ? message._buffer : message.buffer) : buffer, {
        binary: true,
      });
    }
  };
  try {
    if (!ws) return;
    ws.on("message", async (message: any) => {
      if (!message.length || message.length >= 5e4) return;
      let reader = new BinaryReader(message);
      if (!reader) return;
      let packetId = reader.readUInt8();
      if (typeof packetId !== "number") return;
      let pid: RegExpExecArray | string | null,
        content,
        target: any,
        time: string,
        user: any,
        token: string,
        expire: any,
        maxed: number,
        minutes: number | null;

      switch (packetId) {
        case 0x1: // PUSH
        case 0x2: // REMOVE
          pid = reader.readStringZeroUtf8();
          token = reader.readStringZeroUtf8();
          if (!pid || !token) break;
          user = await verify(token, secret);
          packetId === 0x2 && console.log("removed");
          if (user && "id" in user && "pid" in user) {
            if (user.pid === pid) {
              if (packetId === 0x1) {
                clients.addClient(pid, ws);
              } else clients.removeClient(pid);
            }
          }
          break;
        case 0x3: // MUTE
        case 0x4: // UNMUTE
          token = reader.readStringZeroUtf8();
          target = reader.readStringZeroUtf8();
          time = reader.readStringZeroUtf8();

          if (!token || !target) {
            break;
          }
          user = await verify(token, secret);
          if (!user || !("id" in user) || !("pid" in user)) {
            break;
          }
          if (process.env.mode !== "dev" && user.pid && user.pid === target) {
            sentAMessage(user.pid, "لايمكنك اسكات نفسك");
            break;
          }
          minutes = null;
          maxed = 0;
          User.findOne({ pid: user.pid }, (errorUser: any, resultUser: any) => {
            if (errorUser || !resultUser || resultUser.banned.banned) {
              sentAMessage(user.pid, "شيء ما حدث لحسابك");
              return;
            }
            expire =
              packetId === 0x3 && time
                ? handleTimeTaken(
                    time,
                    (min: number, mxd?: number) => {
                      minutes = min;
                      if (mxd) maxed = mxd;
                    },
                    "max_time" in resultUser.role ? resultUser.role.max_time : null,
                  )
                : null;
            let allowedToMute =
              ("admin" in resultUser.role && resultUser.role.admin === true) ||
              ("permission" in resultUser.role &&
                "mute" in resultUser.role.permission &&
                resultUser.role.permission.mute === true);
            if (!allowedToMute) {
              sentAMessage(user.pid, "ليس لديط صلحية لإسكات ناس..");
              return;
            }
            if (maxed > 0) {
              sentAMessage(user.pid, `The max time you have: ${maxed} minutes`);
            }
            User.findOne({ pid: target }, (errorTarget: any, resultTarget: any) => {
              if (errorTarget || !resultTarget) {
                sentAMessage(user.pid, "Invalid PID - ايدي غير موجود");
                return;
              }
              if (
                (resultUser.role.admin !== true && resultTarget.role.admin === true) ||
                resultUser.role.permissionCount < resultTarget.role.permissionCount
              ) {
                sentAMessage(user.pid, "ليمكنك اسكات شخص اكبر منك رتبة");
                return;
              }

              let muteObject = Object.assign(
                { muted: packetId === 0x3 },
                typeof expire === "number" ? { expire } : {},
              );
              User.updateOne(
                { pid: target },
                {
                  $set: {
                    playerDetails: Object.assign(resultTarget.playerDetails || {}, {
                      muted: muteObject,
                    }),
                  },
                },
                null,
                (error: any, resultUpdate: any) => {
                  if (!error && resultUpdate) {
                    sentAMessage(
                      user.pid,
                      `[${target}] has been ${packetId !== 0x3 ? "un" : ""}muted successfully`,
                    );
                    let packetIdClient = packetId === 0x3 ? 0x11 : 0x12;
                    let writer = new BinaryWriter(0);
                    writer.writeUInt8(packetIdClient);
                    sentAMessage(target, writer, true);
                    if (minutes && packetId === 0x3) {
                      clients.awaiterThenSend(target, { packetId: 0x12 }, minutes);
                    }
                  } else {
                    sentAMessage(
                      user.pid,
                      "شيء ما حدث اثناء البحث على الشخص, ربما هذا الأيدي غير صالح تحقق من ذلك",
                    );
                  }
                },
              );
            });
          });
          break;
        case 0x5: // BAN
        case 0x6: // UNBAN
          token = reader.readStringZeroUtf8();
          target = reader.readStringZeroUtf8();
          time = reader.readStringZeroUtf8();
          if (!token || !target) {
            break;
          }
          user = await verify(token, secret);
          if (!user || !("id" in user) || !("pid" in user)) {
            break;
          }
          if (process.env.mode !== "dev" && user.pid && user.pid === target) {
            sentAMessage(user.pid, "لايمكنك اسكات نفسك");
            break;
          }
          minutes = null;
          maxed = 0;
          User.findOne({ pid: user.pid }, (errorUser: any, resultUser: any) => {
            if (errorUser || !resultUser || (packetId === 0x5 && resultUser.banned.banned)) {
              sentAMessage(user.pid, "حدث خطاء. يرجى اعادة لاحقا");
              return;
            }

            let allowedToBan =
              ("admin" in resultUser.role && resultUser.role.admin === true) ||
              ("permission" in resultUser.role &&
                "ban" in resultUser.role.permission &&
                resultUser.role.permission.ban === true);
            expire =
              packetId === 0x5 && time
                ? handleTimeTaken(
                    time,
                    (min: number, mxd?: number) => {
                      minutes = min;
                      if (mxd) maxed = mxd;
                    },
                    "max_time" in resultUser.role ? resultUser.role.max_time : null,
                  )
                : null;
            User.findOne({ pid: target }, (errorTarget: any, resultTarget: any) => {
              if (errorTarget || !resultTarget) {
                sentAMessage(user.pid, "حدث خطاء. يرجى اعادة لاحقا");
                return;
              }
              if (maxed > 0) {
                sentAMessage(user.pid, `The max time you have: ${maxed} minutes`);
              }
              let haveBanPersmission =
                "admin" in resultTarget.role && resultTarget.role.admin === true;
              if (
                !allowedToBan ||
                (haveBanPersmission && resultUser.role.admin !== true) ||
                resultUser.role.permissionCount < resultTarget.role.permissionCount
              ) {
                sentAMessage(user.pid, "ليس لديك الصلحية لهذا");
                return;
              }
              User.updateOne(
                { pid: target },
                { $set: { banned: { banned: packetId === 0x5, expire } } },
                null,
                (error: any, result: any) => {
                  if (error || !result) {
                    sentAMessage(user.pid, "ليس لديك الصلحية لهذا");
                    return;
                  }
                  sentAMessage(
                    user.pid,
                    `[${target}] has been ${packetId !== 0x5 ? "un" : ""}banned successfully`,
                  );
                  let packetIdClient = packetId === 0x5 ? 0x13 : 0x14;
                  let writer = new BinaryWriter(0);
                  writer.writeUInt8(packetIdClient);
                  sentAMessage(target, writer, true);
                  if (minutes && packetId === 0x5) {
                    clients.awaiterThenSend(target, { packetId: 0x14 }, minutes);
                  }
                },
              );
            });
          });
          break;
        case 0x7: // XP SYSTEM
          target = reader.readStringZeroUtf8();
          let keyAccess = reader.readStringZeroUtf8();
          let newXP: number | string = reader.readStringZeroUtf8();
          let score = reader.readStringZeroUtf8();
          let checkIfNumber = (target: string | number) => {
            return typeof target === "number" || target.toString().match(/^[0-9]+$/) ? true : false;
          };

          if (
            !target ||
            !keyAccess ||
            keyAccess !== "A14d6Zd546j21Ikamine" ||
            !newXP ||
            !score ||
            !checkIfNumber(newXP) ||
            !checkIfNumber(score)
          )
            break;

          const userPlayerXpSystem: any = await fetchUser({ pid: target });

          if (
            userPlayerXpSystem &&
            "xp" in userPlayerXpSystem &&
            typeof userPlayerXpSystem.xp === "object"
          ) {
            let xp: number;
            let level = userPlayerXpSystem.level;
            let totalXP = "totalXP" in userPlayerXpSystem.xp ? userPlayerXpSystem.xp.totalXP : 5e3;
            let currentXP =
              "currentXP" in userPlayerXpSystem.xp ? userPlayerXpSystem.xp.currentXP : 0;
            let currentPoints = "balance" in userPlayerXpSystem ? userPlayerXpSystem.balance : 0;

            newXP = Number(newXP) % 5e2;
            if (newXP === 0) newXP = Math.ceil(Math.random() * 5e2);
            xp = ~~(newXP + currentXP);

            if (xp >= totalXP) {
              level++;
              totalXP = 300 * Math.pow(2, level);
              xp = 0;
              currentPoints += Math.ceil(Math.random() * 15) * 2;
            }

            let newXPData = { lastScore: score, currentXP: xp, totalXP: totalXP };
            const updateUserPlayerXpSystem: any = await updateUser(
              { pid: target },
              { xp: newXPData, level: level, balance: currentPoints },
            );
            if (updateUserPlayerXpSystem) {
              let writer = new BinaryWriter(0);
              writer.writeUInt8(0x15);
              writer.writeStringUtf8(`${xp}_${level}_${totalXP}_${score}_${currentPoints}`);
              sentAMessage(target, writer, true);
            }
          }
          break;
        case 0x8: // KILL
          token = reader.readStringZeroUtf8(); // TOKEN
          target = reader.readStringZeroUtf8(); // PID TARGET
          if (!token || !target) {
            break;
          }
          user = await verify(token, secret);
          if (!user || !("id" in user) || !("pid" in user)) {
            break;
          }
          if (process.env.mode !== "dev" && user.pid && user.pid === target) {
            break;
          }
          user = await fetchUser({ pid: user.pid });
          if (
            user &&
            (("admin" in user.role && user.role.admin === true) ||
              ("kill" in user.role.permission && user.role.permission.kill === true))
          ) {
            sentAMessage(user.pid, "The user will kill if he's not an admin");
            sentAMessage(target, new Uint8Array([0x16]), true);
          } else {
            sentAMessage(user.pid, "You don't have a permission");
          }
          break;
      }
    });
  } catch (e) {
    console.log(String(e));
  }
};

export function handleTimeTaken(
  timeTaken: string,
  cb?: (minutes: number, mxd?: number) => void,
  maxTime?: number | null,
) {
  let time: string | number | null = null,
    hour = 3600000,
    minute = 60000,
    day = 86400000;
  try {
    if (timeTaken && timeTaken.length > 0) {
      let type: any = timeTaken.match(/([a-zA-Z]{1})$/g),
        howMuch: string | number = parseInt(timeTaken.replace(/[a-zA-Z]/g, ""));
      if (type && type[0] && howMuch.toString().match(/^[0-9]+$/) && howMuch > 0) {
        type = type[0];
        if (type === "h" || type === "m" || type === "d") {
          let whichOne = type === "h" ? hour : type === "d" ? day : minute,
            maxed = false;
          if (maxTime && howMuch * whichOne > maxTime * minute) {
            maxed = true;
            console.log("MAX WAS " + maxTime + " minutes");
            howMuch = maxTime * minute;
          } else howMuch *= whichOne;
          time = Date.now() + howMuch;
          if (type === "m" && howMuch <= 30 * minute) {
            if (cb) cb(howMuch, maxed ? howMuch / minute : undefined);
          }
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
  return time;
}
