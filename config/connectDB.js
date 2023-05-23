const { default: mongoose } = require("mongoose");

const connectdb = async (DATABASE_URL) => {
  try {
    const DB_OPTIONS = {
      dbName: "instademo",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    const connection = await mongoose.connect(DATABASE_URL, DB_OPTIONS);
    console.log("DataBase Connected Successfully...");
    const db = mongoose.connection;
    const userCollection = db.collection("User");
    const postCollection = db.collection("Post");
    const likeCollection = db.collection("Like");
  } catch (error) {
    console.log("DataBase Not Connected");
  }
};

module.exports = connectdb;
