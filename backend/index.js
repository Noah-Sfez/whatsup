require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const httpServer = createServer(app);

// Configuration CORS
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json());

// Configuration Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
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

    // Créer le token JWT
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
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Mettre à jour le statut en ligne
    await supabase.from("users").update({ is_online: true }).eq("id", user.id);

    // Créer le token JWT
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
});

// Routes pour les groupes
app.post("/api/groups", authenticateToken, async (req, res) => {
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
});

app.get("/api/groups", authenticateToken, async (req, res) => {
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
});

app.post("/api/groups/:groupId/join", authenticateToken, async (req, res) => {
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
});

// Routes pour les messages
app.get(
  "/api/groups/:groupId/messages",
  authenticateToken,
  async (req, res) => {
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
        return res.status(403).json({ error: "Not a member of this group" });
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
  }
);

// Gestion des connexions Socket.IO
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
      const { groupId, content } = data;

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

      // Sauvegarder le message dans la base de données
      const { data: message, error } = await supabase
        .from("messages")
        .insert([
          {
            id: uuidv4(),
            group_id: groupId,
            user_id: socket.userId,
            content,
            created_at: new Date().toISOString(),
          },
        ])
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Socket.IO server ready`);
});
