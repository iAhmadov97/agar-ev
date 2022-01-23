import * as path from "path";
import { Router } from "express";
import { encrypt } from "../utils/crypto";
import { validatorText, validatorURL } from "../utils/validator";
import {
  updateUser,
  updateClan,
  fetchClan,
  fetchUser,
  createClan,
  writeFileSkins,
  readFileSkins,
  deleteClan,
} from "../utils/actions";
import { User } from "../utils/mongoSchemas";

const app = Router();

app.post("/", async (_req, res) => {
  let req: any = _req;
  if (req.user) {
    let user = (req as any).user;
    let passedBanned = user.banned.banned === true ? Date.now() >= user.banned.expire : null;
    let update = false;
    if (
      "playerDetails" in user &&
      "muted" in user.playerDetails &&
      "muted" in user.playerDetails.muted
    ) {
      if (
        user.playerDetails.muted.muted === true &&
        "expire" in user.playerDetails.muted &&
        typeof user.playerDetails.muted.expire === "number"
      ) {
        let passed = Date.now() >= user.playerDetails.muted.expire;
        if (passed) {
          update = true;
          user.playerDetails.muted = { muted: false, expire: "" };
        }
      }
    }
    if (passedBanned) {
      update = true;
      user.banned = {
        banned: false,
        expire: 0,
      };
    }
    if (update) {
      try {
        await updateUser(
          { pid: user.pid },
          { $set: Object.assign({ playerDetails: user.playerDetails }, { banned: user.banned }) },
        );
      } catch (e) {
        console.log(e);
      }
    }

    let jsonEncrypted: any = null;

    if (user && typeof user === "object") {
      jsonEncrypted = {};
      if ("verified" in user) {
        jsonEncrypted["verified"] = user.verified;
      }
      if ("pid" in user) {
        jsonEncrypted["pid"] = user.pid;
      }
      if ("role" in user && typeof user.role === "object") {
        jsonEncrypted["role"] = "called" in user.role ? user.role.called : user.role.name;
        if ("color" in user.role) jsonEncrypted["color"] = user.role.color;
      }
      if ("clan" in user && user.clan) {
        jsonEncrypted["tag"] = Buffer.from(user.clan, "hex").toString("utf-8");
      } else user["clan"] = null;

      if (Object.keys(jsonEncrypted).length > 0) {
        try {
          jsonEncrypted = encrypt(encodeURIComponent(JSON.stringify(jsonEncrypted)));
        } catch (e) {}
      } else {
        jsonEncrypted = null;
      }
    }

    res.json(Object.assign({}, user, { jsonEncrypted }, { status: true }));
  }
});

app.post("/join", async (_req, res) => {
  let req: any = _req,
    body = req.body;
  if (!req.user || ("clan" in req.user && req.user.clan)) {
    return res.json({ status: false, message: "You're already in clan ... you can't join" });
  }
  try {
    if (typeof body === "object" && "code" in body && body.code) {
      const clanIfExists: any = await fetchClan({ joinCode: body.code });
      const checkIfInside = (target: string) => !(target in clanIfExists);

      if (
        !clanIfExists ||
        typeof clanIfExists !== "object" ||
        checkIfInside("pid") ||
        checkIfInside("users")
      ) {
        return res.json({ status: false, message: "The clan does not exists" });
      }

      const isAdmin: boolean =
        req.user.id in clanIfExists &&
        "admin" in clanIfExists[req.user.id] &&
        clanIfExists[req.user.id].admin === true
          ? true
          : false;

      const pushUserIntoClan = await updateClan(
        { pid: clanIfExists.pid },
        {
          joinCode: Date.now().toString(36) + ~~(Math.random() * 10),
          users: Object.assign({}, clanIfExists.users, {
            [req.user.pid]: {
              admin: isAdmin ? ("heAdmin" in body && body.heAdmin === true ? true : false) : false,
              banned: false,
              verified: false,
              joined: Date.now(),
            },
          }),
        },
      );

      if (pushUserIntoClan) {
        await updateUser({ id: req.user.id }, { clan: clanIfExists.pid });
        return res.json({ status: true, message: "done" });
      }
    }
  } catch (e) {
    return res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/leave", async (_req, res) => {
  let req: any = _req;
  if (!req.user || !("clan" in req.user) || !req.user.clan) {
    return res.json({ status: false, message: "your account does not exists on this clan" });
  }
  try {
    await updateUser({ id: req.user.id }, { $set: { clan: null } });
    let clan: any = await fetchClan({ pid: req.user.clan }),
      updated = false;
    if (!clan) throw new Error("error");

    if (clan.idowner === req.user.pid) {
      await deleteClan({ pid: req.user.clan });
      res.json({ status: true, message: "the clan was removed successfully" });
    } else {
      if (req.user.pid in clan.users) {
        updated = true;
        delete clan.users[req.user.pid];
      }
      if (updated) await updateClan({ pid: req.user.clan }, { $set: { users: clan.users } });
      res.json({ status: true, message: "you leaved successfully" });
    }
  } catch (e) {
    res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/skins", async (_req, res) => {
  let req = _req as any;
  let skins = readFileSkins().skins;

  let skinsOwn: any = {};
  let skinsGlobal: any = {};

  const checkTargetIfInt = (target: any) => {
    let isInt = false;
    if (target && target.toString().match(/^[0-9]+$/)) {
      isInt = true;
    }
    return isInt;
  };

  let start: number =
    "start" in req.query &&
    checkTargetIfInt(req.query.start) &&
    parseInt(req.query.start as string) < Object.keys(skins).length
      ? parseInt(req.query.start)
      : 0x0;

  if (start === 0x0) {
    for (let _skin in skins) {
      let skin: any = skins[_skin];
      if (typeof skin === "object" && "private" in skin && skin.private === true) {
        if (skin.id === req.user.id) {
          skinsOwn[_skin] = skin;
        }
	      delete skins[_skin];
      }
    }
  }

  let skinsScalledCounts = Object.keys(skins).slice(start, start + 0x14);
  for (let skinKey of skinsScalledCounts) {
    skinsGlobal[skinKey] = skins[skinKey];
  }

  let clan = null;

  try {
    if (req.user && "clan" in req.user) {
      const clanObject: any = await fetchClan({ pid: req.user.clan });
      if (clanObject && "skin" in clanObject) {
        clan = {
          url: clanObject.skin,
          code: clanObject.skin.substring(clanObject.skin.lastIndexOf("/") + 1).replace(/\./g, ""),
        };
      }
    }
  } catch (e) {
    console.log("failed to request clan");
  }

  res.json(
    Object.assign(
      { status: true },
      { skins: Object.assign(skinsOwn, skinsGlobal), totalSkins: Object.keys(skins).length },
      clan ? { clan } : {},
    ),
  );
});

app.post("/create_clan", async (_req, res) => {
  let req: any = _req;
  try {
    let balanceMust = readFileSkins("global.json").prixs.prixBuyClan ?? 200;
    if (req.user && balanceMust) {
      let user = req.user;
      if (user.balance >= balanceMust) {
        if ("clan" in user && user.clan) {
          return res.json({
            status: false,
            message: "انت بالفعل موجود في كلان يجب انت تخرج منه ثم اعد الكرة",
          });
        }
        let body = req.body;
        if (
          typeof body === "object" &&
          "name" in body &&
          "tag" in body &&
          "bg" in body &&
          "skin" in body
        ) {
          if (
            validatorText(body.name) &&
            validatorText(body.tag, true) &&
            validatorURL(body.bg, true) &&
            validatorURL(body.skin, true)
          ) {
            const timestamp = Date.now();
            const pidClan = `${Buffer.from(body.tag.slice(0, 15), "utf-8").toString("hex")}`;
            const create = await createClan({
              idowner: user.pid, // ID owner
              pid: pidClan,
              createdAt: timestamp,
              name: body.name.toLowerCase(),
              joinCode: timestamp.toString(36) + ~~(Math.random() * 10),
              skin: body.skin,
              bg: body.bg,
              verified: false,
              banned: false,
              tag: body.tag.slice(0, 15),
              users: {
                [user.pid]: {
                  admin: true,
                  banned: false,
                  joined: timestamp,
                  verified: false,
                },
              },
            });
            if (create) {
              const userUpdaterProfile = await updateUser(
                { id: user.id },
                { balance: ~~(user.balance - balanceMust), clan: pidClan },
              );
              if (userUpdaterProfile) {
                return res.json({ status: true, message: "Done" });
              } else {
                res.json({
                  status: false,
                  message: "plase if you get this error open a ticket directly",
                });
              }
            } else {
              res.json({
                status: false,
                message: "something went wrong chile writing your account",
              });
            }
          } else res.json({ status: false, message: "check all the contents if exists" });
        } else res.json({ status: false, message: "check all params is exists" });
      } else res.json({ status: false, message: "your points it's not enough" });
    }
  } catch (e) {
    res.json({ status: false, message: "An error occurred" });
  }
});

app.post("/edite_clan", async (_req, res) => {
  let req: any = _req,
    body = req.body;
  try {
    if (!req.user || typeof body !== "object") {
      throw new Error("");
    }
    if ("name" in body && "tag" in body && "bg" in body && "skin" in body) {
      if (
        validatorText(body.name) &&
        validatorText(body.tag, true) &&
        validatorURL(body.bg, true) &&
        validatorURL(body.skin, true)
      ) {
        const clan: any = await fetchClan({ pid: req.user.clan });
        if (!clan || typeof clan !== "object") {
          throw new Error("clan does not exists");
        }
        let objectDocument: any = {};

        for (let prop of ["name", "tag", "bg", "skin"]) {
          if (body[prop] && clan[prop] !== body[prop]) {
            objectDocument[prop] = body[prop];
          }
        }
        if ("tag" in objectDocument) {
          objectDocument.tag = objectDocument.tag.slice(0, 15);
          objectDocument.pid = Buffer.from(objectDocument.tag, "utf-8").toString("hex");
        }
        await updateClan({ pid: req.user.clan }, { ...objectDocument });
        res.json({ status: true, message: "updated" });
      } else {
        throw new Error("Invalid data, check for mistakes");
      }
    }
  } catch (e) {
    console.log(e);
    return res.json({ status: false, message: e || "something went wrong" });
  }
});

app.post("/clans", async (_req, res) => {
  let req: any = _req;

  if (req.user) {
    let user = req.user;
    if (typeof user === "object" && "clan" in user) {
      var clan: any = null;
      try {
        clan = await fetchClan({ pid: user.clan });
      } catch (e) {
        console.log(e);
        console.log("something went wrong");
        // await updateUser({ id: user.id }, { clan: null });
      }

      try {
        if (clan && typeof clan === "object") {
          if (!(user.pid in clan.users)) {
            console.log(user.pid + " does not exists on users clan");
            await updateUser({ id: user.id }, { clan: null });
          }
          let usersData: any = {},
            usersClan = Object.keys(clan.users).slice(0, 20); // max
          for (let userClan of usersClan) {
            try {
              let userFetchClan: any = await fetchUser({ pid: userClan });
              if (typeof userFetchClan === "object") {
                usersData[userClan] = {
                  verified: clan.users[userClan].verified,
                  avatar: userFetchClan.avatar,
                  name: userFetchClan.username,
                  id: userFetchClan.id,
                  banned: userFetchClan.banned.banned || clan.users[userClan].banned,
                  joined: clan.users[userClan].joined,
                  owner: clan.idowner === userFetchClan.pid,
                  admin:
                    "admin" in clan.users[userClan] && clan.users[userClan].admin === true
                      ? true
                      : false,
                };
              }
            } catch (e) {}
          }
          res.json(
            Object.assign(
              {},
              clan,
              { status: true },
              Object.keys(usersData).length > 0 ? { users: usersData } : {},
            ),
          );
        } else {
          return res.json({ status: false, message: "This clan maybe was deleted" });
        }
      } catch (e) {
        return res.json({ status: false });
      }
    } else return res.json({ status: false });
  }
});

app.post("/upload_skin", async (_req, res) => {
  let req: any = _req,
    body = req.body || {};
  try {
    if (!req.user || typeof req.user !== "object" || typeof body !== "object") {
      throw new Error("something went wrong");
    }
    if ("skin_url" in body && "type_skin" in body) {
      var skinsFile = readFileSkins();

      if (
        (body.type_skin === "GLOBAL_SKIN" || body.type_skin === "PRIVATE_SKIN") &&
        body.skin_url.toString().match(/^(https?)\:\/\/+.*\.(png|jpg|gif)$/)
      ) {
        const balanceMustBe = body.type_skin === "PRIVATE_SKIN" ? 2e2 : 6e1;
        if (balanceMustBe > req.user.balance) {
          return res.json({
            status: false,
            message: "You don't have a points enough for upload the skin",
          });
        }
        let isAdmin = false;
        if ("role" in req.user && "admin" in req.user.role && req.user.role.admin === true) {
          isAdmin = true;
        }

        let skinHash: string =
          body.skin_url.indexOf("imgur") >= 0
            ? body.skin_url.substring(body.skin_url.lastIndexOf("/") + 1).replace(/\./g, "")
            : Date.now().toString(36);

        let skinObject = {
          [skinHash]: {
            url: body.skin_url,
            private: body.type_skin === "PRIVATE_SKIN",
            id: req.user.id,
            author: req.user.username,
          },
        };

        let skinsSaved: any[] | null = null;
        if (isAdmin) {
          skinsSaved = req.user.playerDetails.skinsSaved as any[];
          skinsSaved.push(skinHash);
        }
        await updateUser(
          { id: req.user.id },
          Object.assign(
            skinsSaved
              ? {
                  playerDetails: {
                    ...req.user.playerDetails,
                    skinsSaved: skinsSaved,
                  },
                }
              : {},
            !isAdmin ? { balance: ~~(req.user.balance - balanceMustBe) } : {},
          ),
        );

        let prop: string =
          process.env.mode === "dev" ? "skinsWait" : isAdmin ? "skins" : "skinsWait";
        skinsFile[prop] = Object.assign({}, skinsFile[prop], skinObject);

        writeFileSkins(skinsFile);

        return res.json({ status: true, message: "success" });
      }
    } else throw new Error("check the params in the request");
  } catch (e) {
    return res.json({ status: false, message: e || "something went wrong" });
  }
});

app.post("/add_role", (_req, res) => {
  let req: any = _req,
    body = req.body;
  try {
    let check = (target: string, object: any) => !(target in object);
    if (
      check("user", req) ||
      check("called", body) ||
      check("color", body) ||
      check("max_time", body) ||
      check("permission", body)
    ) {
      throw new Error("access");
    }
    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      return res.json({ status: false, message: "Access denied" });
    }
    let roles = readFileSkins("roles.json");
    roles[body.called] = {
      called: body.called,
      color: body.color,
      max_time: body.max_time,
      permission: body.permission,
    };
    writeFileSkins(roles, "roles.json");
    res.json({ status: true, message: "The role was added successfully" });
  } catch (e) {
    return res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/get_roles", (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (check("user", req)) {
      throw new Error("error");
    }
    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      return res.json({ status: false, message: "Access denied" });
    }
    let roles = readFileSkins("roles.json");
    res.json({ status: true, roles });
  } catch (e) {
    return res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/remove_role", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (check("user", req) || check("role", req.body)) {
      throw new Error("error");
    }
    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      return res.json({ status: false, message: "Access denied" });
    }
    let roles = readFileSkins("roles.json");
    if (req.body.role in roles) {
      delete roles[req.body.role];
      writeFileSkins(roles, "roles.json");
      res.json({ status: true });
    } else {
      return res.json({ status: false, message: "Actually the role does not exists" });
    }
  } catch (e) {
    return res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/give_role", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (check("user", req) || check("pid", req.body) || check("role", req.body)) {
      throw new Error("error");
    }
    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      return res.json({ status: false, message: "Access denied" });
    }
    let roles = readFileSkins("roles.json");
    if (req.body.role in roles) {
      const role = roles[req.body.role];
      const target: any = await fetchUser({ pid: req.body.pid });
      if (!target || target.role.permissionCount > req.user.role.permissionCount)
        throw new Error("error");
      let lay = {
        name: role.called,
        called: role.called,
        permissionCount: 0,
        admin:
          req.user.id === target.id && req.user.role.admin === true
            ? true
            : role.permission.admin || false,
        color: role.color || "blue",
        max_time: role.max_time,
        permission: {
          ...role.permission,
        },
      };
      await updateUser({ pid: req.body.pid }, { role: lay });
      res.json({ status: true, message: "success" });
    } else {
      return res.json({ status: false, message: "Actually the role does not exists" });
    }
  } catch (e) {
    return res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/ownership_clan", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (check("user", req) || check("pid", req.body) || check("target", req.body)) {
      throw new Error("error");
    }
    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      return res.json({ status: false, message: "Access denied" });
    }
    var clan: any = await fetchClan({ idowner: req.body.pid });
    if (!clan) {
      return res.json({ status: false, message: "the clan does not exists" });
    }
    var userTarget: any = await fetchUser({ pid: req.body.target });
    if (!userTarget || userTarget.clan) {
      return res.json({
        status: false,
        message: "target user his already on clan or the user does not exists",
      });
    }
    let updateUserTarget = await updateUser({ pid: req.body.target }, { clan: clan.pid });
    if (!updateUserTarget) throw new Error("error");
    let updateUserOff = await updateUser({ pid: req.body.pid }, { clan: null });
    if (!updateUserOff) throw new Error("error");
    delete clan.users[req.body.pid];
    await updateClan(
      { idowner: req.body.pid },
      {
        idowner: req.body.target,
        users: {
          ...clan.users,
          [req.body.target]: {
            admin: true,
            banned: false,
            verified: true,
            joined: Date.now(),
          },
        },
      },
    );
    return res.json({ status: true, message: "The clan was updated successfully" });
  } catch (e) {
    console.log(e);
    res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/manage_skins_wait", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (check("user", req)) {
      throw new Error("error");
    }
    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      return res.json({ status: false, message: "Access denied" });
    }
    let skinsFile: any = readFileSkins();
    if (check("t", req.body) && check("s", req.body)) {
      res.json({ status: true, content: { ...skinsFile.skinsWait } });
    } else {
      let type: number =
        req.body.t && req.body.t.toString().match(/^[0-9]+$/) ? parseInt(req.body.t) : 0x0;
      let skin: string | null = req.body.s ? req.body.s : null;
      if (type === 0x0 || !skin || check(skin, skinsFile.skinsWait)) throw new Error("error");
      let skinsSaveUpdated: any[];
      switch (type) {
        case 0x1: // ACCEPT
          skinsFile.skins[skin] = skinsFile.skinsWait[skin];
          skinsSaveUpdated = req.user.playerDetails.skinsSaved;
          skinsSaveUpdated.push(skin);
          if (skinsSaveUpdated) {
            await updateUser(
              { id: req.user.id },
              {
                playerDetails: {
                  ...req.user.playerDetails,
                  skinsSaved: skinsSaveUpdated,
                },
              },
            );
          }
          delete skinsFile.skinsWait[skin];
          break;
        case 0x2: // REFUSE
          delete skinsFile.skinsWait[skin];
          break;
        default:
          throw new Error("error");
      }
      writeFileSkins(skinsFile);
      res.json({
        status: true,
        message: `[${skin}] ${type === 0x1 ? "Accepted" : "Removed"} successfully`,
      });
    }
  } catch (e) {
    console.log(e);
    res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/manage_users_clan", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (
      check("user", req) ||
      check("type", req.body) ||
      check("target", req.body) ||
      !req.user.clan
    ) {
      throw new Error("error");
    }
    let clan: any = await fetchClan({ pid: req.user.clan });
    if (!clan) throw new Error("error");
    let type = parseInt(req.body.type);
    if (
      check(req.body.target, clan.users) ||
      (type === 0x0 && clan.users[req.body.target].banned === true)
    ) {
      throw new Error("error");
    }
    let msg = "";
    switch (type) {
      case 0x0: // BAN
      case 0x1: // UNBAN
      case 0x2: // MAKE ADMIN
      case 0x3: // THE MIRROR
      case 0x4: // VERIFICATION
      case 0x5: // THE MIRROR
        if (type === 0x0 || type === 0x1) {
          msg = "the user has been " + (type === 0x0 ? "" : "un") + "banned";
          clan.users[req.body.target].banned = type === 0x0;
        }
        if (type === 0x2 || type === 0x3) {
          msg = type === 0x2 ? "he's an admin now" : "you romved admin from " + req.body.target;
          clan.users[req.body.target].verified = clan.users[req.body.target].admin = type === 0x2;
        }
        if (type === 0x4 || type === 0x5) {
          msg =
            type === 0x4
              ? "The user was verified successfully"
              : "The verification rmoved from " + req.body.target;
          clan.users[req.body.target].verified = type === 0x4;
        }
        await updateClan({ pid: req.user.clan }, { $set: { users: clan.users } });
        res.json({ status: true, message: msg });
        break;
      default:
        throw new Error("error");
    }
  } catch (e) {
    res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/request-verify", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (check("user", req) || check("type", req.body)) {
      throw new Error("error");
    }

    let type = parseInt(req.body.type);
    let forverify = readFileSkins("verification.json");

    switch (type) {
      case 0x0: // GET users (admin)
        if (check("admin", req.user.role) || req.user.role.admin !== true) {
          return res.json({ status: false, message: "Access denied" });
        }
        return res.json({ status: true, content: forverify });
      case 0x1: // set request verify
        if (!check(req.user.pid, forverify) || req.user.verified === true) {
          return res.json({
            status: false,
            message: "you already requested to verify before or you're verified",
          });
        }
        forverify[req.user.pid] = {
          name: req.user.username,
          id: req.user.id,
          avatar: req.user.avatar,
        };
        writeFileSkins(forverify, "verification.json");
        await updateUser({ pid: req.user.pid }, { $set: { requested: true } });
        return res.json({ status: true, message: "success" });
        break;

      case 0x2: // accept
      case 0x3: // decline
        if (check("target", req.body)) throw new Error("error");
        if (check("admin", req.user.role) || req.user.role.admin !== true) {
          return res.json({ status: false, message: "Access denied" });
        }
        delete forverify[req.body.target];
        writeFileSkins(forverify, "verification.json");
        await updateUser({ pid: req.body.target }, { $set: { verified: type === 0x2 } });
        return res.json({ status: true, message: "success" });
        break;
      default:
        throw new Error("error");
    }
  } catch (e) {
    res.json({ status: false, message: "something went wrong" });
  }
});

app.post("/change_property", async (_req, res) => {
  let req: any = _req,
    check = (target: string, object: any) => !(target in object);
  try {
    if (
      check("user", req) ||
      check("type", req.body) ||
      check("pid", req.body) ||
      check("value", req.body)
    ) {
      throw new Error("params error");
    }

    if (check("admin", req.user.role) || req.user.role.admin !== true) {
      throw new Error("Access denied");
    }

    var propertys = readFileSkins("global.json");
    if (check("propertysAllowed", propertys)) {
      throw new Error("error");
    }

    propertys = propertys.propertysAllowed;

    if (propertys.indexOf(req.body.type) >= 0) {
      let type = req.body.type;
      var user: any = await fetchUser({ pid: req.body.pid });
      if (!user || check(type, user) || typeof user[type] === "object") {
        throw new Error("error with type");
      }
      if (type === "pid") {
        User.findOne({ pid: req.body.value }, async (error: any, result: any) => {
          if (!error && result) {
            throw new Error("that's pid is already registered try another");
          }
          if (user.clan) {
            let clan: any = await fetchClan({ pid: user.clan });
            if (!clan) throw new Error("error on clan");
            if (user.pid in clan.users) {
              let userdataInClan = {
                idowner: clan.idowner === user.pid ? req.body.value : clan.idowner,
                users: Object.assign({}, clan.users, { [req.body.value]: clan.users[user.pid] }),
              };
              delete userdataInClan.users[user.pid];
              await updateClan({ idowner: user.pid }, { $set: userdataInClan });
            }
          }
        });
      }
      await updateUser(
        { pid: req.body.pid },
        {
          $set: {
            [type]: req.body.value,
          },
        },
      );
      return res.json({ status: true, message: `${type} has been saved succussfully` });
    } else throw new Error("Access denied with this type");
  } catch (e) {
    return res.json({ status: false, message: String(e) });
  }
});

export const routesMe = app;
