-- Script de migration simple pour les conversations privées
-- Copiez-collez ce script dans votre console Supabase SQL

-- 1. Créer les tables pour les conversations privées (si elles n'existent pas)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    is_group BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 2. Modifier la table messages pour supporter les conversations privées
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. Modifier la contrainte sur group_id (permettre NULL pour les conversations privées)
ALTER TABLE messages ALTER COLUMN group_id DROP NOT NULL;

-- 4. Ajouter une contrainte pour s'assurer qu'un message appartient soit à un groupe soit à une conversation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'message_destination_required'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT message_destination_required CHECK (
            (group_id IS NOT NULL AND conversation_id IS NULL) OR
            (group_id IS NULL AND conversation_id IS NOT NULL)
        );
    END IF;
END $$;

-- 5. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- 6. Activer la sécurité au niveau des lignes (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques de sécurité pour les conversations
DO $$
BEGIN
    -- Politique pour voir les conversations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversations' 
        AND policyname = 'Users can view their conversations'
    ) THEN
        CREATE POLICY "Users can view their conversations" ON conversations
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM conversation_participants 
                    WHERE conversation_participants.conversation_id = conversations.id 
                    AND conversation_participants.user_id = auth.uid()
                )
            );
    END IF;

    -- Politique pour créer des conversations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversations' 
        AND policyname = 'Users can create conversations'
    ) THEN
        CREATE POLICY "Users can create conversations" ON conversations
            FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

-- 8. Créer les politiques pour les participants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversation_participants' 
        AND policyname = 'Users can view participants of their conversations'
    ) THEN
        CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM conversation_participants cp 
                    WHERE cp.conversation_id = conversation_participants.conversation_id 
                    AND cp.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversation_participants' 
        AND policyname = 'Users can join conversations'
    ) THEN
        CREATE POLICY "Users can join conversations" ON conversation_participants
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 9. Mettre à jour les politiques des messages
DROP POLICY IF EXISTS "Users can view messages from their groups" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their groups" ON messages;
DROP POLICY IF EXISTS "Users can view messages from their groups and conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their groups and conversations" ON messages;

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

-- 10. Créer le trigger pour updated_at sur les conversations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_conversations_updated_at'
    ) THEN
        CREATE TRIGGER update_conversations_updated_at
            BEFORE UPDATE ON conversations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Migration terminée avec succès !
SELECT 'Migration des conversations privées terminée avec succès!' as status;
