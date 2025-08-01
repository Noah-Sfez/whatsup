const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/database");

const conversationController = {
    createConversation: async (req, res) => {
        try {
            const { participants, name, is_group } = req.body;

            if (
                !participants ||
                !Array.isArray(participants) ||
                participants.length === 0
            ) {
                return res.status(400).json({
                    error: "Participants array is required and must not be empty",
                });
            }

            console.log("Création de conversation avec:", {
                participants,
                name,
                is_group,
                userId: req.user.userId,
            });

            const conversationId = uuidv4();

            const { data: conversation, error } = await supabase
                .from("conversations")
                .insert([
                    {
                        id: conversationId,
                        name: name || null,
                        is_group: is_group || false,
                        created_by: req.user.userId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error(
                    "Erreur lors de la création de la conversation:",
                    error
                );
                return res.status(500).json({ error: error.message });
            }

            console.log("Conversation créée avec succès:", conversation);

            const participantInserts = participants.map((participantId) => ({
                conversation_id: conversationId,
                user_id: participantId,
                joined_at: new Date().toISOString(),
            }));

            if (!participants.includes(req.user.userId)) {
                participantInserts.push({
                    conversation_id: conversationId,
                    user_id: req.user.userId,
                    joined_at: new Date().toISOString(),
                });
            }

            console.log("Ajout des participants:", participantInserts);

            const { error: participantError } = await supabase
                .from("conversation_participants")
                .insert(participantInserts);

            if (participantError) {
                console.error(
                    "Erreur lors de l'ajout des participants:",
                    participantError
                );
                return res
                    .status(500)
                    .json({ error: participantError.message });
            }

            console.log("Participants ajoutés avec succès");

            res.json(conversation);
        } catch (error) {
            console.error("Erreur dans createConversation:", error);
            res.status(500).json({ error: error.message });
        }
    },

    getConversations: async (req, res) => {
        try {
            const { data: conversations, error } = await supabase
                .from("conversations")
                .select(
                    `
          *,
          conversation_participants!inner(
            user_id,
            users(id, username, email)
          ),
          users!conversations_created_by_fkey(username)
        `
                )
                .eq("conversation_participants.user_id", req.user.userId)
                .order("created_at", { ascending: false });

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json(conversations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getMessages: async (req, res) => {
        try {
            const { conversationId } = req.params;

            const { data: participant } = await supabase
                .from("conversation_participants")
                .select("id")
                .eq("conversation_id", conversationId)
                .eq("user_id", req.user.userId)
                .single();

            if (!participant) {
                return res
                    .status(403)
                    .json({ error: "Not a participant of this conversation" });
            }

            const { data: messages, error } = await supabase
                .from("messages")
                .select(
                    `
                *,
                users:user_id(username, email)
                `
                )
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Créer un message
    createMessage: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;

            if (!content || content.trim() === "") {
                return res
                    .status(400)
                    .json({ error: "Message content is required" });
            }

            // Vérifier si l'utilisateur est participant de la conversation
            const { data: participant } = await supabase
                .from("conversation_participants")
                .select("id")
                .eq("conversation_id", conversationId)
                .eq("user_id", req.user.userId)
                .single();

            if (!participant) {
                return res
                    .status(403)
                    .json({ error: "Not a participant of this conversation" });
            }

            // Créer le message
            const { data: message, error } = await supabase
                .from("messages")
                .insert([
                    {
                        id: uuidv4(),
                        conversation_id: conversationId,
                        user_id: req.user.userId,
                        sender_id: req.user.userId,
                        content: content.trim(),
                        created_at: new Date().toISOString(),
                    },
                ])
                .select(
                    `
                *,
                users:user_id(username, email)
                `
                )
                .single();

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json(message);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = conversationController;
