import Mongoose from "mongoose";

const DB_URI: string | undefined = process.env.mongoURI;

export const connect = () => {
  return new Promise(async (resolve, reject) => {
    const initConnection = async () => {
      console.log("🔄 Connecting to database ...");
      try {
        if (!DB_URI) throw new Error("invalid db_uri");
        await Mongoose.connect(DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
        console.log("📚 Connected to database");
        resolve(true);
      } catch (error) {
        console.log("⚠️ Error connecting to database");
        await initConnection();
        reject(error);
      }
    };
    await initConnection();
  });
};
