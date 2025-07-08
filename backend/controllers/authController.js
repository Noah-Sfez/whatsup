const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            const { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .eq("email", email)
                .single();

            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const { data: user, error } = await supabase
                .from("users")
                .insert([
                    {
                        id: uuidv4(),
                        username,
                        email,
                        password: hashedPassword,
                        created_at: new Date().toISOString(),
                        is_online: false,
                    },
                ])
                .select()
                .single();

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username, email: user.email },
                JWT_SECRET,
                { expiresIn: "24h" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const { data: user, error } = await supabase
                .from("users")
                .select("*")
                .eq("email", email)
                .single();

            if (error || !user) {
                return res.status(400).json({ error: "Invalid credentials" });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return res.status(400).json({ error: "Invalid credentials" });
            }


            await supabase
                .from("users")
                .update({ is_online: true })
                .eq("id", user.id);

            const token = jwt.sign(
                { userId: user.id, username: user.username, email: user.email },
                JWT_SECRET,
                { expiresIn: "24h" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = authController;
