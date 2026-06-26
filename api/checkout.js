import Stripe from "stripe";

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
  
  response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  // Pegar o userId e a origem da requisição
  const { userId } = request.query.userId ? request.query : request.body;
  const referrerOrigin = request.headers.referer 
    ? new URL(request.headers.referer).origin 
    : "http://localhost:3000";

  if (!userId) {
    return response.status(400).json({ error: "O parâmetro userId é obrigatório." });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  // FALLBACK PARA TESTES / DESENVOLVIMENTO LOCAL SEM CHAVE DO STRIPE
  if (!stripeSecretKey) {
    console.log("STRIPE_SECRET_KEY não encontrada. Retornando URL de simulação local.");
    // Retornamos uma URL de simulação local que o frontend tratará
    return response.status(200).json({
      id: "mock_session_" + Date.now(),
      url: `${referrerOrigin}/?mock_checkout=true&userId=${userId}`
    });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Finance Manager Premium 🚀",
              description: "Acesso total ilimitado, relatórios e BI sem restrições de uso.",
            },
            unit_amount: 990, // R$ 9,90 em centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${referrerOrigin}/?upgrade=success&userId=${userId}`,
      cancel_url: `${referrerOrigin}/?upgrade=cancel`,
      metadata: {
        userId: userId,
      },
    });

    return response.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão do Stripe:", error);
    return response.status(500).json({ error: error.message });
  }
}
