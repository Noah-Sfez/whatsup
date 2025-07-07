const express = require("express");
const uploadController = require("../controllers/uploadController");
const { authenticateToken } = require("../middlewares/auth");
const upload = require("../config/multer");

const router = express.Router();

// Routes d'upload
router.post(
    "/image",
    authenticateToken,
    upload.single("image"),
    uploadController.uploadImage
);

module.exports = router;
