const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/database");

const groupController = {
    // Créer un groupe
    createGroup: async (req, res) => {
        try {
            const { name, description } = req.body;
            const groupId = uuidv4();

            // Créer le groupe
            const { data: group, error } = await supabase
                .from("groups")
                .insert([
                    {
                        id: groupId,
                        name,
                        description,
                        created_by: req.user.userId,
                        created_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // Ajouter le créateur comme membre du groupe
            await supabase.from("group_members").insert([
                {
                    group_id: groupId,
                    user_id: req.user.userId,
                    joined_at: new Date().toISOString(),
                    role: "admin",
                },
            ]);

            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Récupérer les groupes
    getGroups: async (req, res) => {
        try {
            const { data: groups, error } = await supabase
                .from("groups")
                .select(
                    `
          *,
          group_members!inner(user_id),
          users!groups_created_by_fkey(username)
        `
                )
                .eq("group_members.user_id", req.user.userId);

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Rejoindre un groupe
    joinGroup: async (req, res) => {
        try {
            const { groupId } = req.params;

            // Vérifier si l'utilisateur est déjà membre
            const { data: existingMember } = await supabase
                .from("group_members")
                .select("id")
                .eq("group_id", groupId)
                .eq("user_id", req.user.userId)
                .single();

            if (existingMember) {
                return res.status(400).json({ error: "Already a member" });
            }

            // Ajouter l'utilisateur au groupe
            const { error } = await supabase.from("group_members").insert([
                {
                    group_id: groupId,
                    user_id: req.user.userId,
                    joined_at: new Date().toISOString(),
                    role: "member",
                },
            ]);

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json({ message: "Joined group successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Récupérer les messages d'un groupe
    getGroupMessages: async (req, res) => {
        try {
            const { groupId } = req.params;

            // Vérifier si l'utilisateur est membre du groupe
            const { data: member } = await supabase
                .from("group_members")
                .select("id")
                .eq("group_id", groupId)
                .eq("user_id", req.user.userId)
                .single();

            if (!member) {
                return res
                    .status(403)
                    .json({ error: "Not a member of this group" });
            }

            // Récupérer les messages
            const { data: messages, error } = await supabase
                .from("messages")
                .select(
                    `
          *,
          users(username)
        `
                )
                .eq("group_id", groupId)
                .order("created_at", { ascending: true });

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = groupController;
