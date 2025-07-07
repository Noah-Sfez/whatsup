const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const handleSocketConnection = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Authentifier l'utilisateur via Socket.IO
        socket.on("authenticate", async (token) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                socket.userId = decoded.userId;
                socket.username = decoded.username;

                // Mettre à jour le statut en ligne
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

        // Rejoindre un groupe
        socket.on("join_group", async (groupId) => {
            try {
                // Vérifier si l'utilisateur est membre du groupe
                const { data: member } = await supabase
                    .from("group_members")
                    .select("id")
                    .eq("group_id", groupId)
                    .eq("user_id", socket.userId)
                    .single();

                if (member) {
                    socket.join(groupId);
                    socket.emit("joined_group", groupId);
                } else {
                    socket.emit("error", "Not a member of this group");
                }
            } catch (error) {
                socket.emit("error", error.message);
            }
        });

        // Envoyer un message
        socket.on("send_message", async (data) => {
            try {
                const {
                    groupId,
                    content,
                    messageType = "text",
                    imageUrl,
                    imageName,
                    imageSize,
                } = data;

                // Vérifier si l'utilisateur est membre du groupe
                const { data: member } = await supabase
                    .from("group_members")
                    .select("id")
                    .eq("group_id", groupId)
                    .eq("user_id", socket.userId)
                    .single();

                if (!member) {
                    socket.emit("error", "Not a member of this group");
                    return;
                }

                // Préparer les données du message selon le type
                const messageData = {
                    id: uuidv4(),
                    group_id: groupId,
                    user_id: socket.userId,
                    message_type: messageType,
                    created_at: new Date().toISOString(),
                };

                // Ajouter le contenu selon le type de message
                if (messageType === "text") {
                    messageData.content = content;
                } else if (messageType === "image") {
                    messageData.image_url = imageUrl;
                    messageData.image_name = imageName;
                    messageData.image_size = imageSize;
                    messageData.content = content || ""; // Description optionnelle
                }

                // Sauvegarder le message dans la base de données
                const { data: message, error } = await supabase
                    .from("messages")
                    .insert([messageData])
                    .select(
                        `
            *,
            users(username)
          `
                    )
                    .single();

                if (error) {
                    socket.emit("error", error.message);
                    return;
                }

                // Diffuser le message à tous les membres du groupe
                io.to(groupId).emit("new_message", message);
            } catch (error) {
                socket.emit("error", error.message);
            }
        });

        // Utilisateur qui tape
        socket.on("typing", (data) => {
            socket.to(data.groupId).emit("user_typing", {
                userId: socket.userId,
                username: socket.username,
            });
        });

        socket.on("stop_typing", (data) => {
            socket.to(data.groupId).emit("user_stop_typing", {
                userId: socket.userId,
            });
        });

        // Déconnexion
        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);

            if (socket.userId) {
                // Mettre à jour le statut hors ligne
                await supabase
                    .from("users")
                    .update({ is_online: false })
                    .eq("id", socket.userId);
            }
        });
    });
};

module.exports = handleSocketConnection;
