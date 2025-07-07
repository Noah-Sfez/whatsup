const admin = require("firebase-admin");
const serviceAccount = require("./whatsapp-key.json"); // adapte le chemin si besoin

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = db;
