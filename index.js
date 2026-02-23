const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ===== BASIC MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.enable("trust proxy");
app.set("json spaces", 2);

// ===== SIMPLE RATE LIMIT (SERVERLESS SAFE) =====
const rateLimit = {};

app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (!rateLimit[ip]) {
    rateLimit[ip] = { count: 1, time: Date.now() };
    return next();
  }

  if (Date.now() - rateLimit[ip].time > 1000) {
    rateLimit[ip] = { count: 1, time: Date.now() };
    return next();
  }

  rateLimit[ip].count++;

  if (rateLimit[ip].count > 10) {
    return res.status(429).json({
      status: false,
      message: "Too many requests"
    });
  }

  next();
});

// ===== SETTINGS LOAD SAFE =====
let settings = {};
try {
  const settingsPath = path.join(__dirname, "./assets/settings.json");
  settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
} catch (e) {
  settings = {
    apiSettings: {
      creator: "WhiteShadow",
      apikey: "FREE"
    }
  };
}

global.apikey = settings.apiSettings.apikey;

// ===== RESPONSE WRAPPER =====
app.use((req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (typeof data === "object") {
      return originalJson.call(this, {
        creator: settings.apiSettings.creator || "WhiteShadow",
        ...data
      });
    }
    return originalJson.call(this, data);
  };

  next();
});

// ===== STATIC =====
app.use("/", express.static(path.join(__dirname, "api-page")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use("/src", (req, res) => {
  res.status(403).json({ error: "Forbidden" });
});

// ===== LOAD ROUTES =====
const apiFolder = path.join(__dirname, "./src/api");

if (fs.existsSync(apiFolder)) {
  fs.readdirSync(apiFolder).forEach((folder) => {
    const folderPath = path.join(apiFolder, folder);

    if (fs.statSync(folderPath).isDirectory()) {
      fs.readdirSync(folderPath).forEach((file) => {
        if (file.endsWith(".js")) {
          require(path.join(folderPath, file))(app);
        }
      });
    }
  });
}

// ===== INDEX =====
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "WhiteShadow API Running 🚀"
  });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route Not Found"
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    status: false,
    message: "Internal Server Error"
  });
});

// ❗ REMOVE app.listen()
// EXPORT ONLY
module.exports = app;
