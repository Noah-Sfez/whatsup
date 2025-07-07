# Fix pour les Conversations Privées

## Problème identifié

Les tables `conversations` et `conversation_participants` n'existaient pas dans la base de données, ce qui empêchait l'enregistrement des conversations privées.

## Solution mise en place

### 1. 📋 Nouvelles tables ajoutées

-   **conversations** : Pour stocker les conversations privées et de groupe
-   **conversation_participants** : Pour gérer les participants des conversations

### 2. 🔧 Modifications apportées

#### Tables créées :

```sql
-- Table des conversations privées
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    is_group BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants des conversations
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);
```

#### Table messages mise à jour :

-   Ajout de `conversation_id` (pour les messages de conversations privées)
-   Ajout de `sender_id` (pour identifier l'expéditeur dans les conversations privées)
-   Modification de `group_id` (plus obligatoire, NULL pour les conversations privées)

### 3. 🛡️ Politiques de sécurité (RLS)

-   Politiques pour les conversations
-   Politiques pour les participants
-   Mise à jour des politiques des messages

### 4. 🔍 Amélioration du debugging

-   Ajout de logs détaillés dans le controller
-   Validation des données d'entrée
-   Meilleure gestion des erreurs

## 🚀 Étapes pour appliquer le fix

### 1. Exécuter la migration

```bash
# Dans votre console Supabase SQL, exécutez le contenu du fichier :
migration_conversations.sql
```

### 2. Tester la connexion

```bash
# Dans le dossier backend
node test-conversations.js
```

### 3. Redémarrer le serveur

```bash
# Dans le dossier backend
npm start
```

### 4. Tester via API

```bash
# Exemple avec curl (remplacez TOKEN par votre token JWT)
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "participants": ["user-id-1", "user-id-2"],
    "name": "Conversation Test",
    "is_group": false
  }'
```

## 📊 Vérification que tout fonctionne

1. **Les logs du serveur** doivent afficher :

    ```
    Création de conversation avec: {...}
    Conversation créée avec succès: {...}
    Participants ajoutés avec succès
    ```

2. **La réponse API** doit retourner la conversation créée :

    ```json
    {
        "id": "uuid-conversation",
        "name": "Conversation Test",
        "is_group": false,
        "created_by": "user-id",
        "created_at": "2025-01-07T...",
        "updated_at": "2025-01-07T..."
    }
    ```

3. **En base de données**, vérifiez :
    - Table `conversations` : nouvelle ligne ajoutée
    - Table `conversation_participants` : participants ajoutés

## 🔧 Debugging

Si vous avez encore des problèmes :

1. **Vérifiez les logs du serveur** pour les erreurs détaillées
2. **Vérifiez que les tables existent** dans Supabase
3. **Vérifiez les permissions** (RLS) dans Supabase
4. **Testez avec Postman** pour isoler le problème

## 📝 Fichiers modifiés

-   `supabase_setup.sql` - Schema complet mis à jour
-   `migration_conversations.sql` - Script de migration
-   `controllers/conversationController.js` - Amélioration du debugging
-   `test-conversations.js` - Script de test

## 🎯 Prochaines étapes

Une fois les conversations privées fonctionnelles, vous pourrez :

-   Implémenter l'envoi de messages dans les conversations privées
-   Ajouter la gestion des notifications
-   Améliorer l'interface utilisateur pour les conversations privées
