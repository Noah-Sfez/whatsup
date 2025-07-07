const express = require("express");
const conversationController = require("../controllers/conversationController");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

// Routes des conversations
router.post("/", authenticateToken, conversationController.createConversation);
router.get("/", authenticateToken, conversationController.getConversations);
router.get(
    "/:conversationId/messages",
    authenticateToken,
    conversationController.getMessages
);
router.post(
    "/:conversationId/messages",
    authenticateToken,
    conversationController.createMessage
);

module.exports = router;
