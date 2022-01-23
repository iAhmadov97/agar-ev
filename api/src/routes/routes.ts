import axios from "axios";
import { routesMe } from "./me";
import passport from "passport";
import FormData from "form-data";
import { Router } from "express";
import { readFileSkins } from "../utils/actions";
import { User } from "../utils/mongoSchemas";
import { authenticateJWT, tokenBuilder } from "../utils/jwt";

const app = Router();


app.get("/auth/discord", passport.authenticate("discord"));

app.use("/me", authenticateJWT, routesMe);

app.get("/skin/:code", (req, res) => {
  try {
    if (!("code" in req.params) || !req.params.code) {
      throw new Error("Invalid code image");
    }
    const skins = readFileSkins()[
      "way" in req.query && req.query.way === "clan" ? "clansSkins" : "skins"
    ];
    const code = req.params.code;
    if (skins && code in skins && skins[code]) {
      res.json({ status: true, url: skins[code].url });
    } else throw new Error("Invalid code image");
  } catch (e) {
    res.json({ status: false, message: "something went wrong" });
  }
});

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/",
  }),
  async function (_req, res) {
    let req = _req as any;
    console.log(req.user);
    try {
      if (
        "user" in req &&
        typeof req.user === "object" &&
        "id" in req.user &&
        req.user.id &&
        "pid" in req.user &&
        req.user.pid
      ) {
        const token = (await tokenBuilder(req.user.id as string, req.user.pid as string)) || null;
        if (token) {
          return res.redirect(process.env.client + "/?t=" + encodeURIComponent(token));
        } else throw new Error("error token is invalid");
      } else throw new Error("error while parsing the params");
    } catch (e) {
      res.json({ status: false, message: "An error occurred sorry - " + String(e) });
    }
  },
);

app.post("/upload", async (req, res) => {
  let check = (t: string | number, o: any) => !(t in o);
  try {
    let file: any = req.files && "0" in req.files ? req.files[0] : null;
    if (!file) throw new Error("error");
    let data = new FormData();
    data.append("image", file.buffer.toString("base64"));
    const urlImage = await axios.request({
      method: "post",
      url: "https://api.imgur.com/3/image",
      headers: {
        Authorization: "Client-ID 7d037bebf021137",
        ...data.getHeaders(),
      },
      data: data,
    });
    if (!urlImage || check("success", urlImage.data) || urlImage.data.success !== true)
      throw new Error("error");
    res.json({ status: true, data: urlImage.data.data });
  } catch (e) {
    res.json({ status: false, message: "something went wrong" });
  }
});

app.get("/global", (_req, res) => {
  try {
    let global = readFileSkins("global.json");
    res.json({ status: true, content: global });
  } catch (e) {
    res.json({ status: false });
  }
});

app.post("/getleaders", async (_req, res) => {
  try {
    let leadersReal = await User.find().sort({ level: -1 }).limit(10);
    let leaders: any = [];
    for (let leader of leadersReal) {
      leaders.push({
        name: leader.username,
        id: leader.id,
        avatar: leader.avatar,
        level: leader.level,
        pid: leader.pid,
      });
    }
    res.json({ status: true, content: leaders });
  } catch (e) {
    res.json({ status: false });
  }
});

export const routes = app;
