const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "..", "uploads", "images");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Seuls les fichiers image sont autorisés!"));
        }
    },
});

module.exports = upload;
