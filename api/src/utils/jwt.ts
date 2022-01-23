import { sign, verify } from "jsonwebtoken";
import { User } from "./mongoSchemas";

const secret: string = process.env.SQ || "0dsf62sdf60f6s5df635140";

export function tokenBuilder(id: string | undefined, pid: string): any {
  if (!id) throw new Error("no username provided");
  if (!secret) throw new Error("invalid secret");
  const token: string = sign({ id, pid }, secret, { expiresIn: "4d" });
  return token;
}

export async function authenticateJWT(req: any, res: any, next: any) {
  let token = req.headers.authorization,
    failedObject = { status: false, message: "Access Denied / Unauthorized request" };
  if (!token) return res.json(failedObject);
  try {
    token = token.split(" ")[1];
    if (token === "null" || !token) return res.json(failedObject);
    const verifyCode: any = await verify(token, secret);
    if (!verifyCode) return res.json(failedObject);
    if (Object.prototype.hasOwnProperty.call(verifyCode, "id")) {
      if (!verifyCode.id) return res.json({ status: false, message: "invalid token" });
      User.findOne({ id: verifyCode.id }, (err: any, result: any) => {
        if (!err && result) {
          req.user = Object.prototype.hasOwnProperty.call(result, "_doc") ? result._doc : result;
          next();
        } else res.json({ status: false, message: "your ID does not exists on our server" });
      });
    }
  } catch (error) {
    res.json({ status: false, message: "Invalid Token" });
  }
}
