import admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saVar) {
    throw new Error(
      "A variável de ambiente FIREBASE_SERVICE_ACCOUNT está ausente. " +
      "Por favor, configure as credenciais da conta de serviço do Firebase nas configurações do Vercel."
    );
  }

  try {
    let serviceAccount;
    const trimmed = saVar.trim();
    if (trimmed.startsWith("{")) {
      serviceAccount = JSON.parse(trimmed);
    } else {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error("Erro detalhado ao inicializar o Firebase Admin:", err);
    throw new Error("Falha ao inicializar o Firebase Admin: " + err.message);
  }
}

export default async function handler(request, response) {
  // Permitir CORS restrito a origens seguras e Capacitor (Android/iOS)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:8080",
    "capacitor://localhost",
    "http://localhost"
  ];
  
  const origin = request.headers.origin;
  
  // Adiciona permissão para subdomínios da Vercel ou localhost
  if (origin) {
    const isLocalhost = allowedOrigins.includes(origin);
    const isVercel = origin.endsWith(".vercel.app") || origin.includes("vercel.app");
    if (isLocalhost || isVercel) {
      response.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    // Se não tiver origin
    response.setHeader("Access-Control-Allow-Origin", "*");
  }
  
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
    initializeFirebaseAdmin();
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
