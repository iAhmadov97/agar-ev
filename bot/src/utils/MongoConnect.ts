import Mongoose from "mongoose";

const DB_URI: string = "mongodb+srv://cair71:amine22012004@agarev.sgxok.mongodb.net/agarev?retryWrites=true&w=majority";//"mongodb://127.0.0.1:27017/agarev";

export const connect = () => {
  return new Promise(async (resolve, reject) => {
    console.log("🔄 Connecting to database ...");
    try {
      await Mongoose.connect(DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
      console.log("📚 Connected to database");
      resolve(true);
    } catch (error) {
      console.log("⚠️ Error connecting to database");
      reject(error);
    }
  });
};
