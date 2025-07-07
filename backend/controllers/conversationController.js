const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/database");

const conversationController = {
    // Créer une conversation
    createConversation: async (req, res) => {
        try {
            const { participants, name, is_group } = req.body;
            const conversationId = uuidv4();

            // Créer la conversation
            const { data: conversation, error } = await supabase
                .from("conversations")
                .insert([
                    {
                        id: conversationId,
                        name: name || null,
                        is_group: is_group || false,
                        created_by: req.user.userId,
                        created_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // Ajouter les participants
            const participantInserts = participants.map((participantId) => ({
                conversation_id: conversationId,
                user_id: participantId,
                joined_at: new Date().toISOString(),
            }));

            // Ajouter aussi le créateur s'il n'est pas déjà dans la liste
            if (!participants.includes(req.user.userId)) {
                participantInserts.push({
                    conversation_id: conversationId,
                    user_id: req.user.userId,
                    joined_at: new Date().toISOString(),
                });
            }

            const { error: participantError } = await supabase
                .from("conversation_participants")
                .insert(participantInserts);

            if (participantError) {
                return res
                    .status(500)
                    .json({ error: participantError.message });
            }

            res.json(conversation);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Récupérer les conversations
    getConversations: async (req, res) => {
        try {
            const { data: conversations, error } = await supabase
                .from("conversations")
                .select(
                    `
          *,
          conversation_participants!inner(user_id),
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

    // Récupérer les messages d'une conversation
    getMessages: async (req, res) => {
        try {
            const { conversationId } = req.params;

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

            // Récupérer les messages
            const { data: messages, error } = await supabase
                .from("messages")
                .select(
                    `
          *,
          users(username, email)
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
                        sender_id: req.user.userId,
                        content: content.trim(),
                        created_at: new Date().toISOString(),
                    },
                ])
                .select(
                    `
          *,
          users(username, email)
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
