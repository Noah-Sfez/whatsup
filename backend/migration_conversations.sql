-- Migration pour ajouter les tables de conversations privées
-- Exécuter ce script dans votre console Supabase SQL

-- Créer la table des conversations privées
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    is_group BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des participants des conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Modifier la table des messages pour supporter les conversations privées
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Supprimer l'ancienne contrainte NOT NULL sur group_id
ALTER TABLE messages ALTER COLUMN group_id DROP NOT NULL;

-- Ajouter les nouvelles contraintes
ALTER TABLE messages 
ADD CONSTRAINT message_destination_required CHECK (
    (group_id IS NOT NULL AND conversation_id IS NULL) OR
    (group_id IS NULL AND conversation_id IS NOT NULL)
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Activer RLS pour les nouvelles tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Politiques pour les conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_participants.conversation_id = conversations.id 
            AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Politiques pour les participants des conversations
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mettre à jour les politiques des messages pour inclure les conversations
DROP POLICY IF EXISTS "Users can view messages from their groups" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their groups" ON messages;

CREATE POLICY "Users can view messages from their groups and conversations" ON messages
    FOR SELECT USING (
        -- Messages de groupe
        (group_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = messages.group_id 
            AND group_members.user_id = auth.uid()
        )) OR
        -- Messages de conversation privée
        (conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
            AND conversation_participants.user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can send messages to their groups and conversations" ON messages
    FOR INSERT WITH CHECK (
        -- Messages de groupe
        (group_id IS NOT NULL AND auth.uid() = user_id AND
         EXISTS (
             SELECT 1 FROM group_members 
             WHERE group_members.group_id = messages.group_id 
             AND group_members.user_id = auth.uid()
         )) OR
        -- Messages de conversation privée
        (conversation_id IS NOT NULL AND auth.uid() = sender_id AND
         EXISTS (
             SELECT 1 FROM conversation_participants 
             WHERE conversation_participants.conversation_id = messages.conversation_id 
             AND conversation_participants.user_id = auth.uid()
         ))
    );

-- Créer un trigger pour mettre à jour updated_at sur les conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
