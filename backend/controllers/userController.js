const supabase = require("../config/database");

const userController = {
    getAllUsers: async (req, res) => {
        try {
            const { data: users, error } = await supabase
                .from("users")
                .select("id, username, email, is_online, created_at")
                .order("username", { ascending: true });

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    searchUserByEmail: async (req, res) => {
        try {
            const { email } = req.query;

            if (!email) {
                return res
                    .status(400)
                    .json({ error: "Email parameter is required" });
            }

            const { data: users, error } = await supabase
                .from("users")
                .select("id, username, email, is_online")
                .eq("email", email.toLowerCase())
                .single();

            console.log("Utilisateur trouvé :", users);

            if (error) {
                if (error.code === "PGRST116") {
                    return res.status(404).json({ error: "User not found" });
                }
                return res.status(500).json({ error: error.message });
            }

            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    checkUsers: async (req, res) => {
        try {
            const { emails } = req.body;

            if (!emails || !Array.isArray(emails)) {
                return res
                    .status(400)
                    .json({ error: "Emails array is required" });
            }

            const { data: users, error } = await supabase
                .from("users")
                .select("id, username, email, is_online")
                .in(
                    "email",
                    emails.map((email) => email.toLowerCase())
                );

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const results = emails.map((email) => {
                const user = users.find(
                    (u) => u.email.toLowerCase() === email.toLowerCase()
                );
                return {
                    email: email,
                    exists: !!user,
                    user: user
                        ? {
                              id: user.id,
                              username: user.username,
                              email: user.email,
                              is_online: user.is_online,
                          }
                        : null,
                };
            });

            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = userController;
