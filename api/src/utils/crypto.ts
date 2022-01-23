import crypto from "crypto";

const algorithm: string = "aes-256-ctr";
const secretKey: string = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3";

const iv = crypto.randomBytes(16);

export function encrypt(text: any) {
  try {
    if (!text) return null;
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(Buffer.from(text, "utf-8").toString("base64")), cipher.final()]);
    const fullCode = `${iv.toString("hex")}Aei_${encrypted.toString("hex")}`;
    return fullCode;
  } catch (e) {
    return null;
  }
}

export function decrypt(hash: string) {
  try {
    if (!hash) return null;
    const decryptCode = hash.split("Aei_");
    if ("0" in decryptCode && "1" in decryptCode) {
      let ivF = decryptCode[0];
      let content = decryptCode[1];
      if (!ivF || !content) return null;

      const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivF, "hex"));
      const decrpyted = Buffer.concat([
        decipher.update(Buffer.from(content, "hex")),
        decipher.final(),
      ]);
      return decrpyted.toString();
    }
  } catch (e) {
    return null;
  }
}
