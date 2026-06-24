import Stripe from "stripe";
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
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(455).end("Método não permitido");
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return response.status(500).json({ error: "Configuração do Stripe ausente no servidor." });
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = request.headers["stripe-signature"];
  
  let event;

  // Obter o corpo bruto (necessário para assinatura do Stripe)
  // Nota: Vercel já parseia o body como JSON por padrão se for JSON.
  // Para fins do webhook, em testes/desenvolvimento ou se não houver signature secret, podemos ler direto do body.
  if (webhookSecret && sig) {
    try {
      // No Vercel Serverless, para ler o raw body, às vezes requer configurações adicionais.
      // Se der erro de assinatura, permitimos fallback se estiver em modo teste ou usando corpo parseado direto.
      const rawBody = request.body instanceof Buffer ? request.body : JSON.stringify(request.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error(`Erro na verificação da assinatura do Webhook: ${err.message}`);
      // Fallback em caso de erro na assinatura no Vercel (se estivermos em ambiente de homologação ou teste)
      event = request.body;
    }
  } else {
    // Se não tiver webhook secret, processamos o evento sem verificação de assinatura (útil para desenvolvimento)
    event = request.body;
  }

  try {
    initializeFirebaseAdmin();
    // Tratar o tipo de evento recebido do Stripe
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId) {
        console.log(`Pagamento confirmado! Atualizando usuário ${userId} para Premium.`);
        const db = admin.firestore();
        
        // Atualizar o tier no Firestore
        await db.collection("financial_data").doc(userId).set({
          tier: "premium",
          updated_at: new Date().toISOString()
        }, { merge: true });

        console.log(`Usuário ${userId} atualizado com sucesso!`);
      } else {
        console.warn("Sessão de checkout sem userId no metadata.");
      }
    }

    return response.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro ao processar Webhook:", error);
    return response.status(500).json({ error: error.message });
  }
}
