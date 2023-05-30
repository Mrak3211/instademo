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
const ejs = require("ejs");
app.use(cors());
var cookieParser = require("cookie-parser");
const { PostController } = require("./controllers/postController.js");
const Post = require("./models/postModel.js");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  "/public/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);
app.use(
  "/files",
  express.static(path.resolve(__dirname, "..", "uploads", "resized"))
);
// view engine setup
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.json());

app.use("/user", userRoutes);
app.use("/post", postRoutes);

app.use("/", userRoutes);
app.use("/", postRoutes);

app.listen(port, () => {
  console.log(`Server is Running on http://localhost/${port}`);
});
