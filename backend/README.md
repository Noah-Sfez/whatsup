# WhatsUp - Système de Messagerie en Temps Réel

## Configuration du Backend

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Copiez l'URL du projet et la clé anonyme
3. Exécutez le script SQL `supabase_setup.sql` dans l'éditeur SQL de Supabase
4. Configurez le fichier `.env` avec vos valeurs :

```env
# Configuration Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# JWT Secret (générez une clé sécurisée)
JWT_SECRET=your-super-secret-jwt-key-here

# Port
PORT=3001
```

### 3. Lancement du backend

```bash
npm start
# ou pour le développement avec auto-reload
npm run dev
```

## API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Groupes

- `GET /api/groups` - Lister les groupes de l'utilisateur
- `POST /api/groups` - Créer un nouveau groupe
- `POST /api/groups/:groupId/join` - Rejoindre un groupe
- `GET /api/groups/:groupId/messages` - Récupérer les messages d'un groupe

## Événements Socket.IO

### Côté Client

- `authenticate` - Authentifier l'utilisateur avec un token JWT
- `join_group` - Rejoindre un groupe pour recevoir les messages
- `send_message` - Envoyer un message à un groupe
- `typing` - Indiquer que l'utilisateur tape
- `stop_typing` - Arrêter l'indication de frappe

### Côté Serveur

- `authenticated` - Confirmation d'authentification
- `joined_group` - Confirmation de participation au groupe
- `new_message` - Nouveau message reçu
- `user_typing` - Un utilisateur tape
- `user_stop_typing` - Un utilisateur arrête de taper
- `error` - Erreur

## Structure de la Base de Données

### Tables principales :

- `users` - Utilisateurs
- `groups` - Groupes de discussion
- `group_members` - Membres des groupes
- `messages` - Messages

### Fonctionnalités :

- Authentification JWT
- Groupes de discussion
- Messages en temps réel
- Statut en ligne/hors ligne
- Indicateur de frappe
- Sécurité RLS (Row Level Security)

## Utilisation avec Socket.IO

### Exemple côté client :

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:3001");

// Authentification
socket.emit("authenticate", "your-jwt-token");

// Rejoindre un groupe
socket.emit("join_group", "group-id");

// Envoyer un message
socket.emit("send_message", {
  groupId: "group-id",
  content: "Hello world!",
});

// Écouter les nouveaux messages
socket.on("new_message", (message) => {
  console.log("Nouveau message:", message);
});
```

## Sécurité

- Authentification JWT
- Validation des tokens
- Vérification des permissions de groupe
- Hashage des mots de passe avec bcrypt
- Politiques de sécurité RLS Supabase
