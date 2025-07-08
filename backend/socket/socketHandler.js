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

        // Rejoindre une conversation
        socket.on("join_conversation", async (conversationId) => {
            try {
                console.log(
                    `Utilisateur ${socket.userId} tente de rejoindre la conversation ${conversationId}`
                );

                // Vérifier si l'utilisateur est participant de la conversation
                const { data: participant } = await supabase
                    .from("conversation_participants")
                    .select("id")
                    .eq("conversation_id", conversationId)
                    .eq("user_id", socket.userId)
                    .single();

                if (participant) {
                    socket.join(conversationId);
                    socket.emit("joined_conversation", conversationId);
                    console.log(
                        `✅ Utilisateur ${socket.userId} a rejoint la conversation ${conversationId}`
                    );

                    // Log des utilisateurs dans cette room
                    const roomSockets =
                        io.sockets.adapter.rooms.get(conversationId);
                    console.log(
                        `📍 Utilisateurs dans la conversation ${conversationId}:`,
                        roomSockets ? roomSockets.size : 0
                    );
                } else {
                    console.log(
                        `❌ Utilisateur ${socket.userId} n'est pas participant de la conversation ${conversationId}`
                    );
                    socket.emit(
                        "error",
                        "Not a participant of this conversation"
                    );
                }
            } catch (error) {
                console.error(`Erreur lors du join_conversation:`, error);
                socket.emit("error", error.message);
            }
        });

        // Envoyer un message
        socket.on("send_message", async (data) => {
            try {
                const {
                    groupId,
                    conversationId,
                    content,
                    messageType = "text",
                    imageUrl,
                    imageName,
                    imageSize,
                    skipSave = false,
                } = data;

                // Si skipSave est true, ne faire que diffuser le message existant
                if (skipSave) {
                    const roomId = conversationId || groupId;
                    if (roomId) {
                        const broadcastMessage = {
                            id: uuidv4(),
                            conversation_id: conversationId || null,
                            group_id: groupId || null,
                            user_id: socket.userId,
                            sender_id: socket.userId,
                            content: content,
                            message_type: messageType,
                            created_at: new Date().toISOString(),
                            users: { username: socket.username, email: null },
                        };

                        // Remplace socket.to par io.to pour émettre à tous, y compris l'émetteur
                        io.to(roomId).emit("new_message", broadcastMessage);
                        console.log(
                            `Message diffusé dans room ${roomId} aux autres utilisateurs (pas l'expéditeur)`
                        );
                    }
                    return;
                }

                // Reste du code existant pour sauvegarder...

                // Déterminer si c'est un groupe ou une conversation
                const isGroup = groupId && !conversationId;
                const isConversation = conversationId && !groupId;

                if (!isGroup && !isConversation) {
                    socket.emit(
                        "error",
                        "Either groupId or conversationId must be provided"
                    );
                    return;
                }

                // Vérifier les permissions selon le type
                let roomId;
                if (isGroup) {
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
                    roomId = groupId;
                } else {
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
                    roomId = conversationId;
                }

                // Préparer les données du message selon le type
                const messageData = {
                    id: uuidv4(),
                    user_id: socket.userId,
                    message_type: messageType,
                    created_at: new Date().toISOString(),
                };

                // Ajouter les IDs selon le type
                if (isGroup) {
                    messageData.group_id = groupId;
                } else {
                    messageData.conversation_id = conversationId;
                    messageData.sender_id = socket.userId;
                }

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
            users(username, email)
          `
                    )
                    .single();

                if (error) {
                    socket.emit("error", error.message);
                    return;
                }

                // Diffuser le message à tous les membres du groupe/conversation
                io.to(roomId).emit("new_message", message);
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
