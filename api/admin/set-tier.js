import admin from "firebase-admin";

// Inicializa o SDK do Firebase Admin se ainda não foi feito
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
  } catch (err) {
    console.error("Erro ao inicializar o Firebase Admin:", err);
  }
}

export default async function handler(request, response) {
  // Permitir CORS básico
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).end("Método não permitido");
  }

  const { email, tier, adminSecret } = request.body;

  if (!email || !tier || !adminSecret) {
    return response.status(400).json({ error: "Parâmetros 'email', 'tier' e 'adminSecret' são obrigatórios." });
  }

  const configuredSecret = process.env.ADMIN_SECRET_KEY;

  if (!configuredSecret) {
    return response.status(500).json({ error: "Configuração de chave secreta do Administrador ausente no servidor (ADMIN_SECRET_KEY)." });
  }

  if (adminSecret !== configuredSecret) {
    return response.status(401).json({ error: "Chave secreta de Administrador incorreta." });
  }

  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // Buscar o usuário pelo e-mail para obter o UID
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (authError) {
      if (authError.code === "auth/user-not-found") {
        return response.status(404).json({ error: `Usuário com o e-mail ${email} não foi encontrado no Firebase Auth.` });
      }
      throw authError;
    }

    const userId = userRecord.uid;

    // Atualizar o plano (tier) no Firestore
    await db.collection("financial_data").doc(userId).set({
      tier: tier,
      updated_at: new Date().toISOString()
    }, { merge: true });

    console.log(`[ADMIN] Usuário ${email} (${userId}) atualizado para o plano: ${tier}`);

    return response.status(200).json({ 
      success: true, 
      message: `Plano do usuário ${email} atualizado com sucesso para ${tier}!`,
      uid: userId
    });

  } catch (error) {
    console.error("Erro no processamento da ação do Admin:", error);
    return response.status(500).json({ error: error.message });
  }
}
