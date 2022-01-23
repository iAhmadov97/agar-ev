import { BinaryWriter } from "../utils/BinaryPacket";

export class ClientHandler {
  public clients: {
    time?: number;
    ws?: any;
    [key: string]: any;
  };

  constructor() {
    this.clients = {};
    this.addClient = this.addClient.bind(this);
    this.removeClient = this.removeClient.bind(this);
  }
  public addClient(clientPid: string, ws: any, cb?: () => void) {
    if (clientPid && typeof clientPid === "string" && ws) {
      this.clients[clientPid] = {
        time: Date.now(),
        ws: ws,
      };
      if (cb) cb();
    }
  }
  public removeClient(pid: string) {
    if (pid && typeof pid === "string" && pid in this.clients) {
      delete this.clients[pid];
    }
  }
  public getClients(pid?: string) {
    if (pid) {
      if (pid in this.clients) {
        return this.clients[pid];
      } else return null;
    }
    return this.clients;
  }

  public optimize() {
    // for optimizing clients list of ws
    for (let pidUser in this.clients) {
      let user = this.clients[pidUser];
      let anHourAgo = Date.now() - 3600000;
      if (user.time <= anHourAgo) {
        this.removeClient(pidUser);
      }
    }
  }
  public awaiterThenSend(pid: string, object: any, time: number) {
    if (pid in this.clients && typeof object === "object" && typeof time === "number" && time > 0) {
      setTimeout(() => {
        // content invalid yet
        if (!pid || !(pid in this.clients) || typeof this.clients[pid] !== "object") return; // double check
        if ("ws" in this.clients[pid]) {
          this.clients[pid].ws.send(new Uint8Array([object.packetId]).buffer, { binary: true });
        }
      }, time);
    }
  }
}
