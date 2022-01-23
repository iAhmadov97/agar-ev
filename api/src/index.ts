import cors from "cors";
require("dotenv").config();
import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { fetchUser, createUser, updateUser } from "./utils/actions";
import { connect } from "./utils/mongoConnect";
import { routes } from "./routes/routes";
import { Strategy } from "passport-discord";
import multer from "multer";
import bodyParser from "body-parser";
import passport from "passport";
import { WebSocketHandler } from "./middlewares/WebSocketHandler";
import { ClientHandler } from "./middlewares/ClientWsHandler";

const app = express();

app.use(
  cors({
    origin: ["https://agar-ev.xyz", "http://localhost:8080"],
  }),
);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new ClientHandler();

(process as any).clients = clients;

setInterval(clients.optimize, 20 * 60 * 1000);

passport.use(
  new Strategy(
    {
      clientID: "855462305994113055",
      clientSecret: "7mL_Oluu_Wp7an1ASQyV65FXOFx-B9IT",
      callbackURL: process.env.endpoint + "/auth/discord/callback",
      scope: ["identify", "email"],
    },
    async (_accessToken, _refreshToken, profile, cb) => {
      let userPlayer = null;
      if (typeof profile === "object" && "id" in profile && profile.id) {
        try {
          const user: any = await fetchUser({ id: profile.id });
          if (user) {
            let newDetails = {};
            if ("avatar" in profile) {
              try {
                const userUpdateDetails = await updateUser(
                  { id: profile.id },
                  (newDetails = {
                    username: profile.username,
                    avatar: user.avatar.match(/^(https?)/g) ? user.avatar : profile.avatar,
                  }),
                );
                if (!userUpdateDetails) newDetails = {};
              } catch (e) {}
            }
            userPlayer = Object.assign({}, "_doc" in user ? user._doc : user, newDetails);
          } else throw new Error("there's no account");
        } catch (e) {
          try {
            let id = String(profile.id);
            const newAUser = await createUser({
              id: id,
              pid: String(~~(Math.random() * parseInt(id.slice(id.length / 2, id.length / 2 + 4)))),
              email: profile.email || null,
              username: profile.username,
              createdAt: new Date().getTime(),
              balance: 0,
              avatar: profile.avatar,
              role: {
                name: "player",
                permissionCount: 0,
                admin: false,
              },
              requested: false,
              verified: false,
              banned: {
                banned: false,
              },
              xp: {
                lastScore: 0,
                currentXP: 0,
                totalXP: 3e2,
              },
              level: 0,
              playerDetails: {
                muted: {
                  muted: false,
                },
                name: String,
                skinImgurCode: String,
                skinsSaved: [],
              },
            });
            if (newAUser && typeof newAUser === "object") {
              userPlayer = newAUser;
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
      cb(null, userPlayer);
    },
  ),
);

app.use(passport.initialize());

passport.serializeUser(function (user: any, done: any) {
  done(null, user);
});

passport.deserializeUser(function (user: any, done: any) {
  done(null, user);
});

app.use(multer().any());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/v1", routes);

app.get("/l", (req, res) => {
  let keyaccess = "cairbyte71_";
  let keyAccessQuery = req.query.key ?? "";
  if (keyAccessQuery === keyaccess) {
    res.json({
      status: true,
      content: clients.clients,
    });
  } else {
    res.json({status: false, message: "Access denied"});
  }
});

connect().then(() => {
  wss.on("connection", (ws: any) => WebSocketHandler(ws, clients));
  let port = 8088;
  server.listen(port, () => {
    console.log(`Server started on port ${port} :)`);
  });
});
