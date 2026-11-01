import mongoose from "mongoose";

const connection = async () => {
  if (!process.env.DB_URI) {
    throw new Error("DB_URI is not configured");
  }

  const con = await mongoose.connect(process.env.DB_URI);
  console.log(`Mongoose successfully connected with HOST: ${con.connection.host}`);
};

export default connection;
