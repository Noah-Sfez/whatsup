const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const handleSocketConnection = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("authenticate", async (token) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                socket.userId = decoded.userId;
                socket.username = decoded.username;
                await supabase
                    .from("users")
                    .update({ is_online: true })
                    .eq("id", socket.userId);
                socket.emit("authenticated", {
                    userId: socket.userId,
                    username: socket.username,
                });
            } catch (error) {
                socket.emit("auth_error", "Invalid token");
            }
        });

        socket.on("join_conversation", async (conversationId) => {
            const { data: participant } = await supabase
                .from("conversation_participants")
                .select("id")
                .eq("conversation_id", conversationId)
                .eq("user_id", socket.userId)
                .single();
            if (participant) {
                socket.join(conversationId);
                socket.emit("joined_conversation", conversationId);
            } else {
                socket.emit("error", "Not a participant of this conversation");
            }
        });

        socket.on("send_message", async (data) => {
            try {
                const { conversationId, content } = data;
                if (!conversationId || !content) {
                    socket.emit("error", "Missing conversationId or content");
                    return;
                }

                const { data: participant } = await supabase
                    .from("conversation_participants")
                    .select("id")
                    .eq("conversation_id", conversationId)
                    .eq("user_id", socket.userId)
                    .single();

                if (!participant) {
                    socket.emit(
                        "error",
                        "Not a participant of this conversation"
                    );
                    return;
                }

                const { data: message, error } = await supabase
                    .from("messages")
                    .insert([
                        {
                            id: uuidv4(),
                            conversation_id: conversationId,
                            user_id: socket.userId,
                            sender_id: socket.userId,
                            content: content.trim(),
                            created_at: new Date().toISOString(),
                        },
                    ])
                    .select(`*, users:user_id(username, email)`)
                    .single();

                if (error) {
                    socket.emit("error", error.message);
                    return;
                }

                io.to(conversationId).emit("new_message", message);
            } catch (error) {
                socket.emit("error", error.message);
            }
        });

        socket.on("disconnect", async () => {
            if (socket.userId) {
                await supabase
                    .from("users")
                    .update({ is_online: false })
                    .eq("id", socket.userId);
            }
        });
    });
};

module.exports = handleSocketConnection;
