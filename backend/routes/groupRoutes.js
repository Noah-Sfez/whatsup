const express = require("express");
const groupController = require("../controllers/groupController");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

// Routes des groupes
router.post("/", authenticateToken, groupController.createGroup);
router.get("/", authenticateToken, groupController.getGroups);
router.post("/:groupId/join", authenticateToken, groupController.joinGroup);
router.get(
    "/:groupId/messages",
    authenticateToken,
    groupController.getGroupMessages
);

module.exports = router;
