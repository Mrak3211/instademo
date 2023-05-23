const express = require("express");
const { default: mongoose } = require("mongoose");
const app = express();
const userRoutes = require("./routes/userRoutes.js");
const postRoutes = require("./routes/postRoutes.js");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const connectdb = require("./config/connectDB.js");
connectdb(DATABASE_URL);
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const cors = require("cors");
const path = require("path");
app.use(cors());

app.use(
  "/files",
  express.static(path.resolve(__dirname, "..", "uploads", "resized"))
);

app.use("/user", userRoutes);
app.use("/post", postRoutes);

app.use("/", userRoutes);
app.use("/", postRoutes);

app.listen(port, () => {
  console.log(`Server is Running on http://localhost/${port}`);
});
