import path from "path";
import { User, Clans } from "../utils/mongoSchemas";
import { readFileSync, writeFileSync } from "fs";

export const fetchUser = (filter: any) => {
  return new Promise((resolve, reject) => {
    if (!filter) return reject(null);
    try {
      User.findOne(filter, (error: any, result: any) => {
        if (!error && result) {
          resolve("_doc" in result ? result._doc : result);
        } else {
          reject(null);
        }
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  });
};
export const deleteClan = (filter: any) => {
  return new Promise((resolve, reject) => {
    if (!filter) return reject(null);
    try {
      Clans.remove(filter, (error: any) => {
        if (!error) {
          resolve(true);
        } else {
          reject(null);
        }
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  });
};

export const fetchClan = (filter: any) => {
  return new Promise((resolve, reject) => {
    if (!filter) return reject(null);
    try {
      Clans.findOne(filter, (error: any, result: any) => {
        if (!error && result) {
          resolve("_doc" in result ? result._doc : result);
        } else {
          reject(null);
        }
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  });
};

export const updateUser = (filter: any, data: any) => {
  return new Promise((resolve, reject) => {
    if (!filter || !data) return reject(null);
    try {
      User.updateOne(filter, data, null, (error: any, result: any) => {
        if (!error && result) {
          resolve(result);
        } else {
          reject("invalid result of update " + JSON.stringify(filter));
        }
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  });
};

export const updateClan = (filter: any, data: any) => {
  return new Promise((resolve, reject) => {
    if (!filter || !data) return reject(null);
    try {
      Clans.updateOne(filter, data, null, (error: any, result: any) => {
        if (!error && result) {
          if ("skin" in data && "pid" in filter) {
            try {
              let skins = readFileSkins();
              if (skins) {
                let pidC = data.skin.substring(data.skin.lastIndexOf("/") + 1).replace(/\./g, "");
                let skin = skins.clansSkins[pidC];
                skins.clansSkins[pidC] = Object.assign(skin ? skin : {}, { url: data.skin });
                writeFileSkins(skins);
              }
            } catch (e) {
              console.log("Failed to update skin URL");
            }
          }
          resolve(result);
        } else {
          reject("invalid result of update " + JSON.stringify(filter));
        }
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  });
};

export const createUser = (profile: any) => {
  return new Promise<typeof profile>((resolve, reject) => {
    if (!profile) return;
    try {
      const player = new User(profile);
      player.save((err: any) => {
        if (!err) {
          resolve(profile);
        } else reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const createClan = (profile: any) => {
  return new Promise<typeof profile>((resolve, reject) => {
    if (!profile) return;

    try {
      const clan = new Clans(profile);
      clan.save((err: any) => {
        if (!err) {
          if ("skin" in profile && "pid" in profile) {
            try {
              let skins = readFileSkins();
              if (skins) {
                let pidC = profile.skin.substring(profile.skin.lastIndexOf("/") + 1).replace(/\./g, "");
                let skin = pidC in skins.clansSkins ? skins.clansSkins[pidC] : null;
                skins.clansSkins[pidC] = Object.assign(skin ? skin : {}, {
                  url: profile.skin,
                });
                writeFileSkins(skins);
              }
            } catch (e) {
              console.log("Failed to update skin URL");
            }
          }
          resolve(profile);
        } else reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const readFileSkins = (file: string = "skins.json") => {
  return JSON.parse(readFileSync(path.join(__dirname, "../../common/" + file), "utf-8"));
};

export const writeFileSkins = (object: any, file: string = "skins.json") => {
  if (!object) return;
  writeFileSync(path.join(__dirname, "../../common/" + file), JSON.stringify(object, null, 2));
};
