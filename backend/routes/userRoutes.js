const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

router.get("/", authenticateToken, userController.getAllUsers);
router.get("/search", authenticateToken, userController.searchUserByEmail);
router.post("/check", authenticateToken, userController.checkUsers);

module.exports = router;
