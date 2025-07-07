-- Création des tables pour le système de messagerie WhatsUp

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des groupes
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT false
);

-- Table des conversations privées
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    is_group BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres de groupe
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Table des participants des conversations
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Pour les conversations privées
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    image_url TEXT,
    image_name VARCHAR(255),
    image_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    CONSTRAINT message_destination_required CHECK (
        (group_id IS NOT NULL AND conversation_id IS NULL) OR
        (group_id IS NULL AND conversation_id IS NOT NULL)
    ),
    CONSTRAINT content_or_image_required CHECK (
        (message_type = 'text' AND content IS NOT NULL) OR
        (message_type = 'image' AND image_url IS NOT NULL) OR
        (message_type = 'file' AND image_url IS NOT NULL)
    )
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Politiques pour les groupes
CREATE POLICY "Users can view groups they belong to" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

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

-- Politiques pour les membres de groupe
CREATE POLICY "Users can view group members of their groups" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join groups" ON group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour les participants de conversations
CREATE POLICY "Users can view participants of leurs conversations" ON conversation_participants
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
DROP POLICY "Users can view messages from their groups" ON messages;
DROP POLICY "Users can send messages to leurs groupes" ON messages;

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

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at sur les messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur les conversations
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
