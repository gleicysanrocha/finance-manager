// Dados Padrão (Mock Data) para inicialização do sistema
// Permite que o sistema já inicie preenchido e com dados que simulam
// perfeitamente a imagem fornecida pelo usuário, mas de forma dinâmica.

const DEFAULT_CARDS = [
  {
    id: "card-1",
    name: "Pagamento por foto",
    type: "credit",
    brand: "MASTERCARD",
    digits: "8046",
    limit: 3227.00,
    closingDay: 3,
    dueDay: 10,
    color: "linear-gradient(135deg, #097d52 0%, #0fb77a 100%)"
  }
];

const DEFAULT_EXPENSES = [
  {
    id: "exp-1",
    description: "Mensalidade Academia",
    value: 120.00,
    category: "🏥 Saúde & Estética",
    status: "Pagas",
    date: "2026-05-02",
    paymentDate: "2026-05-02",
    cardId: "card-1"
  },
  {
    id: "exp-2",
    description: "Jantar Restaurante",
    value: 230.50,
    category: "🍔 Alimentação",
    status: "Pagas",
    date: "2026-05-05",
    paymentDate: "2026-05-05",
    cardId: "card-1"
  },
  {
    id: "exp-3",
    description: "Supermercado Semanal",
    value: 258.18,
    category: "🛒 Supermercado",
    status: "Pagas",
    date: "2026-05-08",
    paymentDate: "2026-05-08",
    cardId: "card-1"
  },
  {
    id: "exp-4",
    description: "Notebook Dell (Comprometido)",
    value: 3074.00,
    category: "📦 Outros",
    status: "Comprometido",
    date: "2026-05-12",
    cardId: "card-1"
  }
];

const DEFAULT_REVENUES = [
  {
    id: "rev-1",
    description: "Desenvolvimento Web Freelance",
    value: 4500.00,
    category: "Recebido",
    date: "2026-05-05"
  },
  {
    id: "rev-2",
    description: "Consultoria Mensal TI",
    value: 1500.00,
    category: "Pendente",
    date: "2026-05-25"
  }
];

const DEFAULT_ORDERS = [
  {
    id: "os-1",
    customer: "Clínica Exemplo",
    service: "Desenvolvimento de Site Institucional",
    value: 2400.00,
    status: "Concluído",
    date: "2026-05-10"
  },
  {
    id: "os-2",
    customer: "Supermercado Ideal",
    service: "Integração de APIs de Pagamento",
    value: 3200.00,
    status: "Pendente",
    date: "2026-05-24"
  }
];

const DEFAULT_ACCOUNTS = [
  {
    id: "acc-1",
    type: "CONTA DIGITAL",
    name: "Nubank Conta",
    logo: "Nu",
    balance: 2450.00,
    agency: "0001",
    accountNumber: "145025-8",
    color: "linear-gradient(135deg, #4f1d7a 0%, #830ad1 100%)",
    shadow: "rgba(131, 10, 209, 0.2)"
  },
  {
    id: "acc-2",
    type: "CONTA CORRENTE",
    name: "Itaú Uniclass",
    logo: "i",
    balance: 5800.00,
    agency: "3822",
    accountNumber: "04987-9",
    color: "linear-gradient(135deg, #e05e00 0%, #ec8b16 100%)",
    shadow: "rgba(236, 139, 22, 0.25)"
  },
  {
    id: "acc-3",
    type: "CARTEIRA PRINCIPAL",
    name: "Reserva CDB",
    logo: "💰",
    balance: 10000.00,
    agency: "100% CDI Liquidez",
    accountNumber: "Nubank Asset",
    color: "linear-gradient(135deg, #02594a 0%, #0d9488 100%)",
    shadow: "rgba(13, 148, 136, 0.2)"
  }
];

// Salva no escopo global para acesso facilitado
const DEFAULT_RECURRING = [
  {
    id: "rec-1",
    description: "Aluguel Residencial",
    cardId: "boleto",
    frequency: "Mensal",
    category: "🏠 Moradia",
    date: "2026-06-10",
    value: 1500.00
  },
  {
    id: "rec-2",
    description: "Netflix Premium",
    cardId: "card-1",
    frequency: "Mensal",
    category: "🍿 Lazer & Viagem",
    date: "2026-06-03",
    value: 55.90
  },
  {
    id: "rec-3",
    description: "Spotify Premium",
    cardId: "card-1",
    frequency: "Mensal",
    category: "🍿 Lazer & Viagem",
    date: "2026-06-05",
    value: 34.90
  },
  {
    id: "rec-4",
    description: "Internet Residencial",
    cardId: "pix",
    frequency: "Mensal",
    category: "💳 Assinaturas & Serviços",
    date: "2026-06-15",
    value: 100.00
  }
];

const DEFAULT_GOALS = [
  {
    id: "goal-1",
    icon: "🛡️",
    name: "Reserva de Emergência",
    saved: 10000.00,
    target: 20000.00,
    notes: "Alocado no CDB 100% CDI de Liquidez Diária."
  },
  {
    id: "goal-2",
    icon: "✈️",
    name: "Viagem de Férias",
    saved: 3450.00,
    target: 5000.00,
    notes: "Mantido nas Caixinhas Nubank."
  },
  {
    id: "goal-3",
    icon: "💻",
    name: "Novo Computador / Setup",
    saved: 0.00,
    target: 10000.00,
    notes: "Planejado para início de poupança no próximo mês."
  }
];

const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    icon: "🛏️",
    name: "Reforma do Quarto",
    budget: 5000.00,
    description: "Reforma completa do quarto principal, incluindo pintura, móveis planejados e materiais.",
    color: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    expenses: [
      {
        id: "pe-1",
        description: "Lata de Tinta Acrílica Suvinil",
        value: 280.00,
        quantity: 2,
        category: "Material",
        date: "2026-05-10"
      },
      {
        id: "pe-2",
        description: "Pincéis e Rolos de Pintura",
        value: 65.50,
        quantity: 1,
        category: "Acessórios",
        date: "2026-05-11"
      },
      {
        id: "pe-3",
        description: "Mão de Obra do Pintor",
        value: 1200.00,
        quantity: 1,
        category: "Serviço",
        date: "2026-05-15"
      },
      {
        id: "pe-4",
        description: "Interruptores e Fiação nova",
        value: 150.00,
        quantity: 1,
        category: "Elétrica",
        date: "2026-05-12"
      }
    ]
  }
];

window.DEFAULT_CARDS = DEFAULT_CARDS;
window.DEFAULT_EXPENSES = DEFAULT_EXPENSES;
window.DEFAULT_REVENUES = DEFAULT_REVENUES;
window.DEFAULT_ORDERS = DEFAULT_ORDERS;
window.DEFAULT_ACCOUNTS = DEFAULT_ACCOUNTS;
window.DEFAULT_RECURRING = DEFAULT_RECURRING;
window.DEFAULT_GOALS = DEFAULT_GOALS;
window.DEFAULT_PROJECTS = DEFAULT_PROJECTS;


