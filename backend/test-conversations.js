const supabase = require("./config/database");

// Script de test pour vérifier les conversations
async function testConversations() {
    try {
        console.log(
            "🔍 Test de la création et récupération des conversations..."
        );

        // Test 1: Vérifier l'existence des tables
        console.log("\n1. Vérification des tables...");

        const { data: tables, error: tablesError } = await supabase
            .from("information_schema.tables")
            .select("table_name")
            .eq("table_schema", "public")
            .in("table_name", ["conversations", "conversation_participants"]);

        if (tablesError) {
            console.error(
                "❌ Erreur lors de la vérification des tables:",
                tablesError
            );
            return;
        }

        console.log(
            "✅ Tables trouvées:",
            tables.map((t) => t.table_name)
        );

        // Test 2: Vérifier la structure des tables
        console.log("\n2. Vérification de la structure des tables...");

        const { data: conversationColumns, error: convError } = await supabase
            .from("information_schema.columns")
            .select("column_name, data_type")
            .eq("table_name", "conversations");

        if (convError) {
            console.error(
                "❌ Erreur lors de la vérification des colonnes:",
                convError
            );
            return;
        }

        console.log(
            "✅ Colonnes de la table conversations:",
            conversationColumns
        );

        // Test 3: Tester l'insertion d'une conversation (nécessite un utilisateur authentifié)
        console.log("\n3. Test d'insertion d'une conversation...");
        console.log(
            "⚠️  Pour ce test, vous devez avoir un utilisateur authentifié."
        );
        console.log(
            "   Utilisez Postman ou votre frontend pour tester la création de conversations."
        );

        console.log("\n✅ Tests terminés avec succès!");
    } catch (error) {
        console.error("❌ Erreur lors des tests:", error);
    }
}

// Test de la connexion à la base de données
async function testConnection() {
    try {
        console.log("🔍 Test de la connexion à la base de données...");

        const { data, error } = await supabase
            .from("users")
            .select("count")
            .single();

        if (error) {
            console.error("❌ Erreur de connexion:", error);
            return false;
        }

        console.log("✅ Connexion à la base de données réussie");
        return true;
    } catch (error) {
        console.error("❌ Erreur lors du test de connexion:", error);
        return false;
    }
}

// Exécuter les tests
async function runTests() {
    console.log("🚀 Démarrage des tests...\n");

    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.log(
            "❌ Impossible de continuer sans connexion à la base de données"
        );
        return;
    }

    await testConversations();

    console.log("\n🎉 Tests terminés!");
    console.log("\n📋 Prochaines étapes:");
    console.log(
        "1. Exécutez le script migration_conversations.sql dans votre console Supabase"
    );
    console.log("2. Testez la création de conversations via votre API");
    console.log(
        "3. Vérifiez les logs du serveur pour détecter d'éventuelles erreurs"
    );
}

// Exécuter si le script est appelé directement
if (require.main === module) {
    runTests();
}

module.exports = { testConversations, testConnection };
