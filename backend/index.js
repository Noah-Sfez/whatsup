const express = require("express");
const db = require("./firebase"); // <-- import ton instance db
const app = express();
app.use(express.json());

// Exemple POST
app.post("/messages", async (req, res) => {
    const { content } = req.body;
    const docRef = await db.collection("messages").add({
        content,
        createdAt: new Date(),
    });
    res.json({ id: docRef.id });
});

// Exemple GET
app.get("/messages", async (req, res) => {
    const snapshot = await db
        .collection("messages")
        .orderBy("createdAt", "desc")
        .get();
    const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    res.json(messages);
});

app.post("/messages", async (req, res) => {
    const { content, userId, groupId, receiverId } = req.body;
    if (!content || !userId)
        return res.status(400).json({ error: "content et userId requis" });

    const data = {
        content,
        userId,
        createdAt: new Date(),
    };
    if (groupId) data.groupId = groupId; // message de groupe
    if (receiverId) data.receiverId = receiverId; // DM privé

    const docRef = await db.collection("messages").add(data);
    res.json({ id: docRef.id });
});


app.get("/users/:userId/messages", async (req, res) => {
    const { userId } = req.params;
    const snapshot = await db
        .collection("messages")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
    const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    res.json(messages);
});

app.get("/groups/:groupId/messages", async (req, res) => {
    const { groupId } = req.params;
    const snapshot = await db
        .collection("messages")
        .where("groupId", "==", groupId)
        .orderBy("createdAt", "desc")
        .get();
    const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    res.json(messages);
});
  
app.get("/users/:userId/messages/private/:receiverId", async (req, res) => {
    const { userId, receiverId } = req.params;
    // On prend tous les messages où userId a envoyé à receiverId OU receiverId a envoyé à userId
    const snapshot = await db
        .collection("messages")
        .where("receiverId", "in", [userId, receiverId])
        .where("userId", "in", [userId, receiverId])
        .orderBy("createdAt", "desc")
        .get();
    const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    // Filtre pour ne garder que la vraie conversation entre les 2
    const filtered = messages.filter(
        (m) =>
            (m.userId === userId && m.receiverId === receiverId) ||
            (m.userId === receiverId && m.receiverId === userId)
    );
    res.json(filtered);
});
  

app.listen(3001, () => console.log("API démarrée sur http://localhost:3001"));
