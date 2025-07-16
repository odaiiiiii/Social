
const multer = require("multer");
const path = require("path");

// يحفظ الملفات بمجلد ويعطيها أسماء جديدة عشان ما تتكرر
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
cb(null, "uploads/uploadsProfile");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
