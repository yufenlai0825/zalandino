const path = require("path");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const multer = require("multer");
const multerS3 = require("multer-s3");
// use AWS v3 so it's compatiable with multer-s3
const { S3Client } = require("@aws-sdk/client-s3");
const { fromEnv } = require("@aws-sdk/credential-provider-env");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const fs = require("fs");
const env = require("dotenv");
env.config();

const errorController = require("./controllers/error");
const shopController = require("./controllers/shop");
const User = require("./models/user");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

// use S3 as image storage
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv() // pull from .env
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileStorage = multer({
  storage: multerS3({
    s3: s3,
    bucket: "zalandino-images",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, new Date().toISOString() + "-" + file.originalname);
    }
  }),
  fileFilter: fileFilter
});

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.set("view engine", "ejs");
app.set("views", "views");

if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://cdn.socket.io"
          ],
          frameSrc: ["'self'", "https://js.stripe.com"],
          imgSrc: [
            "'self'",
            "https://zalandino-images.s3.eu-north-1.amazonaws.com"
          ],
          objectSrc: ["'none'"]
        }
      }
    })
  );
  app.use(compression());
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  app.use(morgan("dev")); // read in terminal during dev
}

// files middleware
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(fileStorage.single("image"));

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  shopController.postStripeWebhook
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => next(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// check middleware err
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  next(err);
});

// error handling
app.get("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    isAuthenticated: req.session ? req.session.isLoggedIn : false
  });
});

mongoose
  .connect(MONGODB_URI, { ssl: true })
  .then((result) => {
    const server = app.listen(process.env.PORT || 3000);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      // console.log("Client connected!");
      socket.on("join", (role) => {
        if (role === "admin") {
          socket.join("admin");
        } else {
          socket.join("user");
        }
      });
    });
  })
  .catch((err) => {
    console.log("Database connection failed:", err);
  });
