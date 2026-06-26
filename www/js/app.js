// ===========================================================================
// LÓGICA CENTRAL - GERENCIADOR FINANCEIRO PREMIUM
// ===========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. ESTADO GLOBAL DO APLICATIVO
  const state = {
    cards: [],
    expenses: [],
    revenues: [],
    orders: [],
    accounts: [],
    recurring: [],
    goals: [],
    userName: "Usuário",
    tagline: "Não se trata de quanto você ganha, mas de como você gerencia.",
    theme: "light",
    selectedMonth: 4, // Maio (0-indexed: 4)
    selectedYear: 2026,
    currentTab: "despesas",
    searchQuery: "",
    selectedCardId: "card-1",
    tier: "free"
  };

  // Frases financeiras rotativas para o Tagline
  const MOTIVATIONAL_PHRASES = [
    "Não se trata de quanto você ganha, mas de como você gerencia.",
    "O melhor investimento que você pode fazer é no seu controle financeiro.",
    "Planejar hoje é colher a estabilidade financeira amanhã.",
    "Poupe com inteligência, invista com sabedoria, viva com tranquilidade.",
    "Riqueza não é o que você compra, é o que você poupa e investe.",
    "Cada centavo economizado é um tijolo na sua liberdade financeira."
  ];

  // ==========================================================================
  // 2. INICIALIZADOR DE ÍCONES E COMPONENTES STATIC
  // ==========================================================================
  function injectSVGIcons() {
    const iconMappings = {
      "logo-icon-svg": ICONS.walletFilled,
      "nav-icon-budget": ICONS.budget,
      "nav-icon-recurring": ICONS.recurring,
      "nav-icon-goal": ICONS.goal,
      "nav-icon-account": ICONS.account,
      "nav-icon-report": ICONS.report,
      "nav-icon-profile": ICONS.user,
      "nav-icon-admin": ICONS.admin,
      "bottom-icon-budget": ICONS.budget,
      "bottom-icon-recurring": ICONS.recurring,
      "bottom-icon-goal": ICONS.goal,
      "bottom-icon-account": ICONS.account,
      "bottom-icon-report": ICONS.report,
      "bottom-icon-profile": ICONS.user,
      "bottom-icon-admin": ICONS.admin,
      "auth-logo-svg": ICONS.walletFilled,
      "calendar-icon-svg": ICONS.calendar,
      "icon-despesa-svg": ICONS.expense,
      "icon-pagas-svg": ICONS.paid,
      "icon-pendentes-svg": ICONS.pending,
      "icon-receitas-svg": ICONS.income,
      "icon-limite-svg": ICONS.limit,
      "icon-apagar-svg": ICONS.payment,
      "icon-ar-svg": ICONS.ar,
      "act-icon-exp": ICONS.plus,
      "act-icon-os": ICONS.plus,
      "act-icon-card": ICONS.card,
      "act-icon-inc": ICONS.plus,
      "title-icon-card": ICONS.card,
      "title-icon-report": ICONS.report,
      "title-icon-health": ICONS.report,
      "title-icon-upcoming": ICONS.calendar,
      "title-icon-advisor": ICONS.goal,
      "tab-icon-exp": ICONS.expense,
      "tab-icon-os": ICONS.recurring,
      "tab-icon-saldo": ICONS.income,
      "tab-icon-ar-tab": ICONS.ar,
      "empty-exp-svg": ICONS.expense,
      "empty-os-svg": ICONS.recurring,
      "empty-saldo-svg": ICONS.income,
      "empty-ar-svg": ICONS.ar
    };

    for (const [id, svgString] of Object.entries(iconMappings)) {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = svgString;
      }
    }

    // Alternar ícone de tema baseado no estado inicial
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.innerHTML = state.theme === "dark" ? ICONS.sun : ICONS.moon;
    }
  }

  // Rotacionar frase motivacional a cada clique na logo
  function rotateMotivationPhrase() {
    const textEl = document.getElementById("motivation-text");
    if (textEl) {
      const index = Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length);
      textEl.innerText = MOTIVATIONAL_PHRASES[index];
    }
  }

  const logoArea = document.getElementById("logo-area-btn");
  if (logoArea) {
    logoArea.addEventListener("click", rotateMotivationPhrase);
  }

  // ==========================================================================
  // 3. PERSISTÊNCIA DE ESTADO (LOCALSTORAGE)
  // ==========================================================================
  // ==========================================================================
  // 3b. ATUALIZADOR DE PERFIL DO USUÁRIO E SLOGAN
  // ==========================================================================
  function updateProfileUI() {
    const userGreeting = document.getElementById("display-user-greeting");
    if (userGreeting) {
      userGreeting.innerText = state.userName;
    }
    const profileName = document.querySelector(".user-profile-badge .user-name");
    if (profileName) {
      profileName.innerText = state.userName;
    }
    const taglineText = document.getElementById("motivation-text");
    if (taglineText) {
      taglineText.innerText = state.tagline;
    }
    
    // Preencher campos do formulário administrativo se existirem
    const adminNameInput = document.getElementById("admin-user-name");
    if (adminNameInput) {
      adminNameInput.value = state.userName;
    }
    const adminTaglineInput = document.getElementById("admin-user-tagline");
    if (adminTaglineInput) {
      adminTaglineInput.value = state.tagline;
    }
  }

  // ==========================================================================
  // 3a. CONEXÃO E GERENCIAMENTO DO BANCO DE DADOS EM NUVEM (FIREBASE)
  // ==========================================================================
  let isCloudEnabled = false;
  let currentUser = null;
  let db = null;
  let auth = null;
  let authMode = "signin";
  let isCompletingSignup = false;

  const DEFAULT_TAGLINE = "Não se trata de quanto você ganha, mas de como você gerencia.";
  // Nota: A configuração do Firebase, Cloud Icons e Lógica de Autenticação
  // foi movida para os arquivos js/firebase-config.js e js/auth-logic.js.

  function getLocalStorageKey(suffix) {
    const owner = currentUser?.uid || "offline";
    return `finance-manager-${owner}-${suffix}`;
  }

  function getLocalValue(suffix) {
    const newKey = getLocalStorageKey(suffix);
    const scopedValue = localStorage.getItem(newKey);
    if (scopedValue !== null) return scopedValue;

    // Fallback de migração automática
    const owner = currentUser?.uid || "offline";
    const oldKey = `gley-finance-${owner}-${suffix}`;
    const oldScopedValue = localStorage.getItem(oldKey);
    if (oldScopedValue !== null) {
      localStorage.setItem(newKey, oldScopedValue);
      localStorage.removeItem(oldKey);
      return oldScopedValue;
    }

    if (!currentUser) {
      const oldGlobalKey = `gley-finance-${suffix}`;
      const oldGlobalValue = localStorage.getItem(oldGlobalKey);
      if (oldGlobalValue !== null) {
        const newGlobalKey = `finance-manager-${suffix}`;
        localStorage.setItem(newGlobalKey, oldGlobalValue);
        localStorage.removeItem(oldGlobalKey);
        return oldGlobalValue;
      }
      return localStorage.getItem(`finance-manager-${suffix}`);
    }
    return null;
  }

  function clearCurrentLocalData() {
    [
      "cards",
      "expenses",
      "revenues",
      "orders",
      "accounts",
      "recurring",
      "goals",
      "username",
      "tagline",
      "theme",
      "profilePhoto"
    ].forEach((suffix) => {
      localStorage.removeItem(getLocalStorageKey(suffix));
      const owner = currentUser?.uid || "offline";
      localStorage.removeItem(`gley-finance-${owner}-${suffix}`);
      if (!currentUser) {
        localStorage.removeItem(`gley-finance-${suffix}`);
        localStorage.removeItem(`finance-manager-${suffix}`);
      }
    });
  }

  async function loadState() {
    const storedTheme = getLocalValue("theme");
    if (storedTheme) {
      state.theme = storedTheme;
      document.body.className = `theme-${storedTheme}`;
    }

    const storedTier = getLocalValue("tier");
    state.tier = storedTier || "free";

    const storedCards = getLocalValue("cards");
    const storedExpenses = getLocalValue("expenses");
    const storedRevenues = getLocalValue("revenues");
    const storedOrders = getLocalValue("orders");
    const storedAccounts = getLocalValue("accounts");
    const storedRecurring = getLocalValue("recurring");
    const storedGoals = getLocalValue("goals");
    const storedUserName = getLocalValue("username");
    const storedTagline = getLocalValue("tagline");
    if (storedCards && storedExpenses && storedRevenues && storedOrders) {
      state.cards = JSON.parse(storedCards);
      state.expenses = JSON.parse(storedExpenses);
      state.revenues = JSON.parse(storedRevenues);
      state.orders = JSON.parse(storedOrders);
    } else {
      state.cards = [];
      state.expenses = [];
      state.revenues = [];
      state.orders = [];
    }

    state.accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
    state.recurring = storedRecurring ? JSON.parse(storedRecurring) : [];
    state.goals = storedGoals ? JSON.parse(storedGoals) : [];
    state.userName = storedUserName || currentUser?.displayName || (currentUser ? "Usuário" : "Usuário");
    state.tagline = storedTagline || DEFAULT_TAGLINE;

    const storedProfilePhoto = getLocalValue("profilePhoto");
    state.profilePhoto = storedProfilePhoto || "";

    updateProfileUI();
    updateTierUI();
    updateProfilePhotoUI();

    if (isCloudEnabled && currentUser) {
      updateSyncIndicator("syncing");
      try {
        const docRef = db.collection("financial_data").doc(currentUser.uid);
        const doc = await docRef.get();

        if (doc.exists) {
          const docData = doc.data();
          const cloudState = docData.state || {};
          
          state.cards = cloudState.cards || [];
          state.expenses = cloudState.expenses || [];
          state.revenues = cloudState.revenues || [];
          state.orders = cloudState.orders || [];
          state.accounts = cloudState.accounts || [];
          state.recurring = cloudState.recurring || [];
          state.goals = cloudState.goals || [];
          state.userName = cloudState.userName || currentUser.displayName || "Usuário";
          state.tagline = cloudState.tagline || "";
          state.profilePhoto = cloudState.profilePhoto || "";
          state.tier = docData.tier || cloudState.tier || "free";
          localStorage.setItem(getLocalStorageKey("tier"), state.tier);
          
          if (cloudState.theme) {
            state.theme = cloudState.theme;
            document.body.className = `theme-${state.theme}`;
            updateThemeIcon();
          }
          updateProfileUI();
          updateTierUI();
          updateProfilePhotoUI();
          updateSyncIndicator("online");
        } else {
          const hasLocalData = [
            state.cards,
            state.expenses,
            state.revenues,
            state.orders,
            state.accounts,
            state.recurring,
            state.goals
          ].some((items) => items.length > 0);
          if (hasLocalData && await window.customConfirm("Deseja enviar os dados deste dispositivo para esta conta?")) {
            await saveState();
          } else {
            resetStateForNewUser(currentUser.displayName || "Usuário");
            await saveState();
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Firebase Firestore:", err);
        updateSyncIndicator("error");
      }
    }

    const monthSelect = document.getElementById("select-month");
    const yearSelect = document.getElementById("select-year");
    if (monthSelect) state.selectedMonth = parseInt(monthSelect.value);
    if (yearSelect) state.selectedYear = parseInt(yearSelect.value);
    
    updateAllDashboard();

    // Verificar retornos de checkout (Stripe ou Mock)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("upgrade") === "success") {
      await window.customAlert("Parabéns! Sua assinatura Premium foi processada. Suas funcionalidades avançadas já estão liberadas! 🚀");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("upgrade") === "cancel") {
      await window.customAlert("A assinatura foi cancelada. Você pode tentar novamente a qualquer momento!");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("mock_checkout") === "true") {
      const mockUserId = urlParams.get("userId");
      if (currentUser && currentUser.uid === mockUserId) {
        state.tier = "premium";
        await saveState();
        await window.customAlert("Checkout de Simulação concluído com sucesso! Plano Premium ativo na conta. 🚀");
      } else if (!currentUser) {
        state.tier = "premium";
        localStorage.setItem(getLocalStorageKey("tier"), "premium");
        await window.customAlert("Checkout de Simulação concluído! Plano Premium ativo localmente. 🚀");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      updateTierUI();
      updateAllDashboard();
    }
  }

  async function saveState() {
    localStorage.setItem(getLocalStorageKey("cards"), JSON.stringify(state.cards));
    localStorage.setItem(getLocalStorageKey("expenses"), JSON.stringify(state.expenses));
    localStorage.setItem(getLocalStorageKey("revenues"), JSON.stringify(state.revenues));
    localStorage.setItem(getLocalStorageKey("orders"), JSON.stringify(state.orders));
    localStorage.setItem(getLocalStorageKey("accounts"), JSON.stringify(state.accounts));
    localStorage.setItem(getLocalStorageKey("recurring"), JSON.stringify(state.recurring));
    localStorage.setItem(getLocalStorageKey("goals"), JSON.stringify(state.goals));
    localStorage.setItem(getLocalStorageKey("username"), state.userName);
    localStorage.setItem(getLocalStorageKey("tagline"), state.tagline);
    localStorage.setItem(getLocalStorageKey("theme"), state.theme);
    localStorage.setItem(getLocalStorageKey("tier"), state.tier);
    localStorage.setItem(getLocalStorageKey("profilePhoto"), state.profilePhoto || "");

    updateTierUI();

    if (isCloudEnabled && currentUser) {
      try {
        updateSyncIndicator("syncing");
        const payload = {
          cards: state.cards,
          expenses: state.expenses,
          revenues: state.revenues,
          orders: state.orders,
          accounts: state.accounts,
          recurring: state.recurring,
          goals: state.goals,
          userName: state.userName,
          tagline: state.tagline,
          theme: state.theme,
          tier: state.tier,
          profilePhoto: state.profilePhoto || ""
        };

        const docRef = db.collection("financial_data").doc(currentUser.uid);
        await docRef.set({
          state: payload,
          tier: state.tier,
          updated_at: new Date().toISOString()
        }, { merge: true });

        updateSyncIndicator("online");
      } catch (err) {
        console.error("Erro ao sincronizar dados na nuvem com Firestore:", err);
        updateSyncIndicator("error");
      }
    }
  }

  function resetStateForNewUser(name) {
    state.cards = [];
    state.expenses = [];
    state.revenues = [];
    state.orders = [];
    state.accounts = [];
    state.recurring = [];
    state.goals = [];
    state.userName = name;
    state.tagline = DEFAULT_TAGLINE;
    state.selectedCardId = "";
    updateProfileUI();
  }

  // Expor funções e estado para integração com Firebase Config e Auth Logic
  window.loadState = loadState;
  window.saveState = saveState;
  window.resetStateForNewUser = resetStateForNewUser;
  window.updateAllDashboard = updateAllDashboard;
  window.appState = state;

  // Alternador de tema Light/Dark
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.className = `theme-${state.theme}`;
      updateThemeIcon();
      saveState();
      // Recriar o gráfico para ajustar cores no novo tema
      renderSVGChart();
    });
  }

  // ==========================================================================
  // 4. RENDERIZADOR DE MOEDA BRASILEIRA (BRL)
  // ==========================================================================
  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  function formatDateBR(dateString) {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  }

  function addMonthsKeepingDay(date, months) {
    const result = new Date(date);
    const originalDay = result.getDate();
    result.setMonth(result.getMonth() + months, 1);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
  }

  function getRecurringOccurrenceDates(recurringItem, month, year) {
    const start = new Date(recurringItem.date + "T00:00:00");
    if (Number.isNaN(start.getTime())) return [];

    const end = recurringItem.endDate ? new Date(recurringItem.endDate + "T23:59:59") : null;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    if (monthEnd < start || (end && monthStart > end)) return [];

    const dates = [];
    const pad = (value) => String(value).padStart(2, "0");
    const toDateString = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const isInsideSelectedMonth = (date) => {
      return date.getMonth() === month && date.getFullYear() === year && (!end || date <= end);
    };

    if ((recurringItem.frequency || "Mensal") === "Semanal") {
      const occurrence = new Date(start);
      while (occurrence < monthStart) {
        occurrence.setDate(occurrence.getDate() + 7);
      }
      while (occurrence <= monthEnd && (!end || occurrence <= end)) {
        dates.push(toDateString(occurrence));
        occurrence.setDate(occurrence.getDate() + 7);
      }
      return dates;
    }

    const intervalByFrequency = {
      Mensal: 1,
      Bimestral: 2,
      Semestral: 6,
      Anual: 12
    };
    const interval = intervalByFrequency[recurringItem.frequency || "Mensal"] || 1;
    let occurrence = new Date(start);
    while (occurrence <= monthEnd && (!end || occurrence <= end)) {
      if (isInsideSelectedMonth(occurrence)) {
        dates.push(toDateString(occurrence));
      }
      occurrence = addMonthsKeepingDay(occurrence, interval);
    }
    return dates;
  }

  // Helper para obter despesas do mês selecionado, mesclando despesas reais e recorrentes virtuais
  function getMonthlyExpenses(month, year) {
    // 1. Filtrar despesas reais deste mês/ano
    const realExpenses = state.expenses.filter(e => {
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });

    // 2. Processar despesas recorrentes
    const virtualRecurring = [];
    state.recurring.forEach(r => {
      const occurrenceDates = getRecurringOccurrenceDates(r, month, year);
      occurrenceDates.forEach((occurrenceDateStr) => {
        // Verificar se já existe uma ocorrência materializada (real) na lista de despesas
        const alreadyMaterialized = state.expenses.some(e => {
          return e.parentRecurringId === r.id && e.date === occurrenceDateStr;
        });

        if (!alreadyMaterialized) {
          virtualRecurring.push({
            id: `virtual-rec-${r.id}-${year}-${month + 1}-${occurrenceDateStr.slice(-2)}`,
            description: r.description,
            value: r.value,
            date: occurrenceDateStr,
            cardId: r.cardId,
            category: r.category,
            status: (r.cardId && r.cardId.startsWith("card-")) ? "Comprometido" : "Pendentes",
            isVirtual: true,
            parentRecurringId: r.id
          });
        }
      });
    });

    return [...realExpenses, ...virtualRecurring];
  }

  // Renderiza o relatório de despesas por categoria de forma dinâmica
  function materializeVirtualRecurringExpense(id, status) {
    const recItem = state.recurring.find(r => id.includes(`virtual-rec-${r.id}-`));
    if (!recItem) return null;

    const parts = id.split("-");
    const initialStatus = status || ((recItem.cardId && recItem.cardId.startsWith("card-")) ? "Comprometido" : "Pendentes");
    let occurrenceDateStr = "";

    if (parts.length >= 4 && /^\d{4}$/.test(parts[parts.length - 3])) {
      const targetYear = parseInt(parts[parts.length - 3]);
      const targetMonthIndex = parseInt(parts[parts.length - 2]) - 1;
      const targetDay = String(parseInt(parts[parts.length - 1])).padStart(2, "0");
      occurrenceDateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${targetDay}`;
    } else {
      const targetYear = parseInt(parts[parts.length - 2]);
      const targetMonthIndex = parseInt(parts[parts.length - 1]) - 1;
      occurrenceDateStr = getRecurringOccurrenceDates(recItem, targetMonthIndex, targetYear)[0];
    }

    if (!occurrenceDateStr) return null;

    const existingExpense = state.expenses.find(exp => {
      return exp.parentRecurringId === recItem.id && exp.date === occurrenceDateStr;
    });
    if (existingExpense) return existingExpense;

    const newRealExpense = {
      id: `rec-instance-${recItem.id}-${occurrenceDateStr}`,
      description: recItem.description,
      value: recItem.value,
      date: occurrenceDateStr,
      cardId: recItem.cardId,
      category: recItem.category,
      status: initialStatus,
      parentRecurringId: recItem.id
    };

    if (initialStatus === "Pagas") {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      newRealExpense.paymentDate = `${yyyy}-${mm}-${dd}`;
    }

    state.expenses.push(newRealExpense);
    return newRealExpense;
  }

  function renderCategoryReport() {
    const container = document.getElementById("reports-categories-container");
    if (!container) return;

    const month = state.selectedMonth;
    const year = state.selectedYear;
    const monthExpenses = getMonthlyExpenses(month, year);

    if (monthExpenses.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem; text-align: center; padding: 2rem 0;">Nenhuma despesa registrada neste mês.</p>`;
      return;
    }

    const total = monthExpenses.reduce((sum, e) => sum + e.value, 0);
    const categoryTotals = {};
    monthExpenses.forEach(e => {
      const cat = e.category || "📦 Outros";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.value;
    });

    // Ordenar categorias por valor descendente
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const colors = [
      "var(--color-expense)",
      "var(--color-warning)",
      "var(--color-success)",
      "var(--color-limit)",
      "var(--color-income)",
      "var(--color-apagar)",
      "var(--text-muted)"
    ];

    let html = "";
    sortedCategories.forEach(([cat, val], index) => {
      const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
      const color = colors[index % colors.length];
      html += `
        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: var(--text-main);">
            <span>${cat}</span>
            <span>${formatCurrency(val)} (${percentage}%)</span>
          </div>
          <div class="progress-bar-bg" style="height: 6px; background-color: var(--border-color); border-radius: 4px; overflow: hidden;">
            <div class="progress-bar-fill" style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Atualiza a tabela resumo anual e títulos de relatório de forma dinâmica
  function updateReportSummary() {
    renderAnnualReport();
  }

  // Nova Função: Renderiza o Relatório e BI Anual Completo de forma dinâmica
  function renderAnnualReport() {
    const reportYearSelect = document.getElementById("select-report-year");
    const selectedReportYear = reportYearSelect ? parseInt(reportYearSelect.value) : state.selectedYear;

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // 1. Calcular receita e despesa para todos os 12 meses do ano selecionado
    let annualIncome = 0;
    let annualExpense = 0;
    const monthlyData = [];

    for (let m = 0; m < 12; m++) {
      // Receitas do mês m e ano selecionado
      const monthRevenues = state.revenues.filter(r => {
        const d = new Date(r.date + "T00:00:00");
        return d.getMonth() === m && d.getFullYear() === selectedReportYear;
      });
      const totalRevenues = monthRevenues.reduce((sum, r) => sum + r.value, 0);

      // Despesas do mês m e ano selecionado
      const monthExpenses = getMonthlyExpenses(m, selectedReportYear);
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.value, 0);

      const netFlow = totalRevenues - totalExpenses;
      
      annualIncome += totalRevenues;
      annualExpense += totalExpenses;

      monthlyData.push({
        monthIndex: m,
        monthName: monthNames[m],
        revenues: totalRevenues,
        expenses: totalExpenses,
        net: netFlow
      });
    }

    const annualBalance = annualIncome - annualExpense;
    const savingRate = annualIncome > 0 ? ((annualBalance / annualIncome) * 100) : 0;

    // 2. Preencher os Cards de Métricas Anuais
    const valAnnualIncome = document.getElementById("val-annual-income");
    const valAnnualExpense = document.getElementById("val-annual-expense");
    const valAnnualBalance = document.getElementById("val-annual-balance");
    const valAnnualSavingRate = document.getElementById("val-annual-saving-rate");

    if (valAnnualIncome) valAnnualIncome.innerText = formatCurrency(annualIncome);
    if (valAnnualExpense) valAnnualExpense.innerText = formatCurrency(annualExpense);
    
    if (valAnnualBalance) {
      valAnnualBalance.innerText = (annualBalance >= 0 ? "+ " : "- ") + formatCurrency(Math.abs(annualBalance));
      valAnnualBalance.className = annualBalance >= 0 ? "metric-value text-success" : "metric-value text-danger";
    }
    
    if (valAnnualSavingRate) {
      valAnnualSavingRate.innerText = `${savingRate.toFixed(1)}%`;
      valAnnualSavingRate.className = savingRate >= 0 ? "metric-value text-primary" : "metric-value text-danger";
    }

    // 3. Renderizar a Tabela de Fluxo de Caixa Anual
    const tableBody = document.getElementById("reports-annual-table-body");
    if (tableBody) {
      let tableHtml = "";
      monthlyData.forEach(data => {
        const isCurrentMonth = data.monthIndex === state.selectedMonth && selectedReportYear === state.selectedYear;
        const rowStyle = isCurrentMonth ? `style="background: rgba(37, 99, 235, 0.08); font-weight: 600;"` : "";
        const netClass = data.net >= 0 ? "text-success" : "text-danger";
        const netSign = data.net >= 0 ? "+" : "-";

        tableHtml += `
          <tr ${rowStyle}>
            <td>${data.monthName} / ${selectedReportYear} ${isCurrentMonth ? '<span style="font-size: 0.75rem; color: var(--color-primary); margin-left: 0.25rem;">(Atual)</span>' : ''}</td>
            <td class="text-success">${formatCurrency(data.revenues)}</td>
            <td class="text-danger">${formatCurrency(data.expenses)}</td>
            <td class="${netClass}" style="font-weight: 700;">${netSign} ${formatCurrency(Math.abs(data.net))}</td>
          </tr>
        `;
      });
      tableBody.innerHTML = tableHtml;
    }

    // 4. Renderizar o Gráfico de Barras SVG Comparativo de 12 Meses
    const chartContainer = document.getElementById("svg-annual-chart-container");
    if (chartContainer) {
      // Encontrar maior valor mensal (para definir o topo da escala Y do gráfico de barras)
      const maxVal = Math.max(...monthlyData.map(d => Math.max(d.revenues, d.expenses)), 1000);

      // Dimensões do SVG
      const svgWidth = 720;
      const svgHeight = 220;
      const paddingLeft = 55;
      const paddingRight = 20;
      const paddingTop = 20;
      const paddingBottom = 30;

      const chartWidth = svgWidth - paddingLeft - paddingRight;
      const chartHeight = svgHeight - paddingTop - paddingBottom;

      const isDark = document.body.classList.contains("theme-dark") || document.documentElement.getAttribute("data-theme") === "dark";
      const textThemeColor = isDark ? "#94a3b8" : "#64748b";
      const gridThemeColor = isDark ? "rgba(55, 65, 81, 0.4)" : "rgba(226, 232, 240, 0.8)";

      // Iniciar a construção do SVG
      let svgHtml = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" style="font-family: inherit;">
          <!-- Linhas de Grade e Escala Y -->
      `;

      // 4 linhas de grade
      for (let i = 0; i <= 4; i++) {
        const gridVal = (maxVal * i) / 4;
        const y = paddingTop + chartHeight - (i / 4) * chartHeight;
        svgHtml += `
          <line x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" stroke="${gridThemeColor}" stroke-dasharray="3,3" stroke-width="1" />
          <text x="${paddingLeft - 8}" y="${y + 4}" fill="${textThemeColor}" font-size="9" text-anchor="end">${formatCurrencyShort(gridVal)}</text>
        `;
      }

      // Renderizar as barras dos 12 meses
      const numMonths = 12;
      const monthGroupWidth = chartWidth / numMonths;
      const barWidth = (monthGroupWidth * 0.7) / 2; // Espaço para duas barras (receita e despesa)
      const gap = monthGroupWidth * 0.15; // Margem nas bordas de cada grupo

      monthlyData.forEach((data, i) => {
        const groupX = paddingLeft + i * monthGroupWidth;
        const xRevenues = groupX + gap;
        const xExpenses = xRevenues + barWidth + 2;

        const hRevenues = (data.revenues / maxVal) * chartHeight;
        const hExpenses = (data.expenses / maxVal) * chartHeight;

        const yRevenues = paddingTop + chartHeight - hRevenues;
        const yExpenses = paddingTop + chartHeight - hExpenses;

        // Barra de Receita (Sucesso)
        const rectRevColor = "var(--color-success, #10b981)";
        // Barra de Despesa (Vermelho)
        const rectExpColor = "var(--color-expense, #ef4444)";

        svgHtml += `
          <!-- Grupo do Mês ${i} -->
          <g>
            <!-- Barra Receita -->
            <rect x="${xRevenues}" y="${yRevenues}" width="${barWidth}" height="${hRevenues}" fill="${rectRevColor}" rx="2" style="transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
              <title>${data.monthName}: Receita de ${formatCurrency(data.revenues)}</title>
            </rect>
            <!-- Barra Despesa -->
            <rect x="${xExpenses}" y="${yExpenses}" width="${barWidth}" height="${hExpenses}" fill="${rectExpColor}" rx="2" style="transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
              <title>${data.monthName}: Despesa de ${formatCurrency(data.expenses)}</title>
            </rect>
            <!-- Rótulo do Mês -->
            <text x="${groupX + monthGroupWidth / 2}" y="${paddingTop + chartHeight + 16}" fill="${textThemeColor}" font-size="9" text-anchor="middle">
              ${data.monthName.substring(0, 3)}
            </text>
          </g>
        `;
      });

      svgHtml += `</svg>`;
      chartContainer.innerHTML = svgHtml;
    }

    // 5. Renderizar as Categorias de Despesas do Mês Atual (para manter o layout lateral atualizado)
    renderCategoryReport();
    
    // Atualizar título da categoria lateral de acordo com o ano/mês selecionado
    const catTitle = document.getElementById("rep-categories-title");
    if (catTitle) {
      catTitle.innerText = `Despesas por Categoria (${monthNames[state.selectedMonth]}/${state.selectedYear})`;
    }
  }

  // Função Auxiliar: Formatar moeda de forma abreviada para o gráfico (ex: 2.5k)
  function formatCurrencyShort(val) {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + "k";
    }
    return val.toFixed(0);
  }

  // Função de exportação para CSV
  function exportReportToCSV() {
    const reportYearSelect = document.getElementById("select-report-year");
    const selectedReportYear = reportYearSelect ? parseInt(reportYearSelect.value) : state.selectedYear;
    
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel compatibility
    csvContent += "Mês;Receitas;Despesas;Saldo Líquido\r\n";

    for (let m = 0; m < 12; m++) {
      const monthRevenues = state.revenues.filter(r => {
        const d = new Date(r.date + "T00:00:00");
        return d.getMonth() === m && d.getFullYear() === selectedReportYear;
      });
      const totalRevenues = monthRevenues.reduce((sum, r) => sum + r.value, 0);

      const monthExpenses = getMonthlyExpenses(m, selectedReportYear);
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.value, 0);
      const netFlow = totalRevenues - totalExpenses;

      csvContent += `${monthNames[m]} / ${selectedReportYear};${totalRevenues.toFixed(2).replace(".", ",")};${totalExpenses.toFixed(2).replace(".", ",")};${netFlow.toFixed(2).replace(".", ",")}\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_fluxo_caixa_${selectedReportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function renderFinancialInsights() {
    const monthExpenses = getMonthlyExpenses(state.selectedMonth, state.selectedYear);
    const monthRevenues = state.revenues.filter(r => {
      const d = new Date(r.date + "T00:00:00");
      return d.getMonth() === state.selectedMonth && d.getFullYear() === state.selectedYear;
    });

    const totalRevenues = monthRevenues.reduce((sum, r) => sum + r.value, 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.value, 0);
    const pendingExpenses = monthExpenses
      .filter(e => e.status === "Pendentes" || e.status === "Comprometido")
      .reduce((sum, e) => sum + e.value, 0);
    const pendingRevenues = monthRevenues
      .filter(r => r.category === "Pendente")
      .reduce((sum, r) => sum + r.value, 0);
    const paidExpenses = monthExpenses
      .filter(e => e.status === "Pagas")
      .reduce((sum, e) => sum + e.value, 0);

    const netFlow = totalRevenues - totalExpenses;
    const commitmentRatio = totalRevenues > 0 ? Math.min((totalExpenses / totalRevenues) * 100, 999) : 0;
    const totalGoals = state.goals.reduce((sum, g) => sum + g.target, 0);
    const savedGoals = state.goals.reduce((sum, g) => sum + g.saved, 0);
    const goalsRatio = totalGoals > 0 ? Math.min((savedGoals / totalGoals) * 100, 100) : 0;

    let score = 55;
    if (totalRevenues > 0) {
      score += netFlow >= 0 ? 18 : -18;
      score += commitmentRatio <= 60 ? 14 : commitmentRatio <= 85 ? 4 : -12;
    }
    score += goalsRatio >= 50 ? 10 : goalsRatio > 0 ? 4 : 0;
    score += pendingExpenses <= pendingRevenues && pendingExpenses > 0 ? 4 : 0;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const scoreBadge = document.getElementById("health-score-badge");
    const scoreValue = document.getElementById("health-score-value");
    const ring = document.getElementById("health-ring");
    const title = document.getElementById("health-status-title");
    const copy = document.getElementById("health-status-copy");
    const netFlowEl = document.getElementById("insight-net-flow");
    const commitmentEl = document.getElementById("insight-commitment");
    const goalsEl = document.getElementById("insight-goals");

    if (scoreBadge) scoreBadge.innerText = `${score} pts`;
    if (scoreValue) scoreValue.innerText = score.toString();
    if (ring) ring.style.setProperty("--score", score);
    if (netFlowEl) {
      netFlowEl.innerText = (netFlow >= 0 ? "+ " : "- ") + formatCurrency(Math.abs(netFlow));
      netFlowEl.className = netFlow >= 0 ? "text-success" : "text-danger";
    }
    if (commitmentEl) commitmentEl.innerText = totalRevenues > 0 ? `${Math.round(commitmentRatio)}%` : "Sem receita";
    if (goalsEl) goalsEl.innerText = totalGoals > 0 ? `${Math.round(goalsRatio)}%` : "Sem metas";

    if (title && copy) {
      if (score >= 80) {
        title.innerText = "Mês em ótima rota";
        copy.innerText = "Seu fluxo está positivo e os compromissos cabem bem na receita prevista.";
      } else if (score >= 60) {
        title.innerText = "Controle saudável";
        copy.innerText = "O mês está administrável, mas vale observar pendências e gastos comprometidos.";
      } else {
        title.innerText = "Atenção ao caixa";
        copy.innerText = "Os gastos estão pressionando o saldo previsto. Priorize pagamentos e entradas pendentes.";
      }
    }

    const upcoming = monthExpenses
      .filter(e => e.status !== "Pagas")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    const upcomingCount = document.getElementById("upcoming-count");
    const upcomingList = document.getElementById("upcoming-list");
    if (upcomingCount) upcomingCount.innerText = upcoming.length.toString();
    if (upcomingList) {
      if (upcoming.length === 0) {
        upcomingList.innerHTML = `
          <div class="upcoming-item">
            <div class="upcoming-date-pill">OK</div>
            <div>
              <strong>Nenhum vencimento pendente neste mês</strong>
              <span>As despesas do período estão liquidadas ou ainda não foram registradas.</span>
            </div>
          </div>
        `;
      } else {
        upcomingList.innerHTML = upcoming.map(item => {
          const day = item.date.split("-")[2] || "--";
          return `
            <div class="upcoming-item">
              <div class="upcoming-date-pill">Dia ${day}</div>
              <div>
                <strong>${item.description}</strong>
                <span>${formatCurrency(item.value)} · ${item.status === "Comprometido" ? "Fatura" : "Pendente"}</span>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    const recommendations = [];
    if (netFlow < 0) {
      recommendations.push({ tone: "danger", title: "Reduza ou reprograme gastos", detail: `Faltam ${formatCurrency(Math.abs(netFlow))} para fechar o mês no azul.` });
    } else {
      recommendations.push({ tone: "success", title: "Direcione o saldo positivo", detail: `Há ${formatCurrency(netFlow)} previstos para reserva, metas ou quitação antecipada.` });
    }
    if (pendingRevenues > 0) {
      recommendations.push({ tone: "warning", title: "Acompanhe valores a receber", detail: `${formatCurrency(pendingRevenues)} ainda dependem de confirmação.` });
    }
    if (paidExpenses > totalExpenses * 0.75 && totalExpenses > 0) {
      recommendations.push({ tone: "success", title: "Boa liquidação de despesas", detail: "A maior parte das despesas do mês já está marcada como paga." });
    } else if (pendingExpenses > 0) {
      recommendations.push({ tone: "warning", title: "Priorize pendências próximas", detail: `${formatCurrency(pendingExpenses)} seguem pendentes ou comprometidos.` });
    }

    const advisorList = document.getElementById("advisor-list");
    if (advisorList) {
      advisorList.innerHTML = recommendations.slice(0, 3).map(item => `
        <div class="advisor-item">
          <span class="advisor-dot ${item.tone}"></span>
          <div>
            <strong>${item.title}</strong>
            <span>${item.detail}</span>
          </div>
        </div>
      `).join("");
    }
  }

  // ==========================================================================
  // 5. CÁLCULO E RENDERIZAÇÃO DAS MÉTRICAS FINANCEIRAS
  // ==========================================================================
  function calculateMetrics() {
    const month = state.selectedMonth;
    const year = state.selectedYear;

    // Obter todas as despesas (reais + recorrentes virtuais) do mês atual
    const currentMonthExpenses = getMonthlyExpenses(month, year);

    const currentMonthRevenues = state.revenues.filter(r => {
      const d = new Date(r.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });

    // 1. Total Despesas (inclui pagas, pendentes e comprometidas)
    const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.value, 0);

    // 2. Pagas (Líquido)
    const paidExpenses = currentMonthExpenses
      .filter(e => e.status === "Pagas")
      .reduce((sum, e) => sum + e.value, 0);

    // 3. Pendentes
    const pendingExpenses = currentMonthExpenses
      .filter(e => e.status === "Pendentes")
      .reduce((sum, e) => sum + e.value, 0);

    // 4. Receitas totais e contagens
    const totalRevenues = currentMonthRevenues.reduce((sum, r) => sum + r.value, 0);
    const concRevenues = currentMonthRevenues.filter(r => r.category === "Recebido");
    const pendRevenues = currentMonthRevenues.filter(r => r.category === "Pendente");

    // 5. Limite dos cartões (seletor dinâmico ou soma total)
    const activeCard = state.cards.find(c => c.id === state.selectedCardId) || state.cards[0];
    const totalLimit = activeCard ? activeCard.limit : 0;

    // Calcular valores específicos da fatura do cartão ativo
    const activeCardExpenses = currentMonthExpenses.filter(e => {
      return e.cardId === (activeCard ? activeCard.id : "");
    });

    const activeCardFatura = activeCardExpenses
      .filter(e => e.status === "Pagas")
      .reduce((sum, e) => sum + e.value, 0);

    const activeCardComprometido = activeCardExpenses
      .filter(e => e.status === "Comprometido")
      .reduce((sum, e) => sum + e.value, 0);

    const activeCardDisp = totalLimit - activeCardFatura - activeCardComprometido;

    // 6. A Pagar (Contas pendentes que não são no cartão, ou boletos a vencer)
    // Para simplificar e bater com a regra visual, mostramos a soma de despesas pendentes no geral
    const totalAPagar = pendingExpenses;

    // 7. Contas a Receber (A.R): receitas pendentes de qualquer data (global)
    const totalAR = state.revenues
      .filter(r => r.category === "Pendente")
      .reduce((sum, r) => sum + r.value, 0);

    // --- ATUALIZAR OS TEXTOS NO DOM ---
    document.getElementById("val-despesas").innerText = formatCurrency(totalExpenses);
    document.getElementById("val-pagas").innerText = formatCurrency(paidExpenses);
    document.getElementById("val-pendentes").innerText = formatCurrency(pendingExpenses);
    
    document.getElementById("val-receitas").innerText = formatCurrency(totalRevenues);
    document.getElementById("sub-receitas").innerText = `${pendRevenues.length} pend. - ${concRevenues.length} conc.`;

    document.getElementById("val-limite").innerText = formatCurrency(totalLimit);
    document.getElementById("sub-limite").innerText = `Disp: ${formatCurrency(activeCardDisp)}`;

    document.getElementById("val-apagar").innerText = formatCurrency(totalAPagar);
    document.getElementById("val-ar").innerText = formatCurrency(totalAR);

    return {
      activeCard,
      totalLimit,
      activeCardFatura,
      activeCardComprometido,
      activeCardDisp
    };
  }

  // ==========================================================================
  // 6. RENDERIZAÇÃO DO CARTÃO DE CRÉDITO 3D DINÂMICO
  // ==========================================================================
  function renderCreditCards(cardMetrics) {
    const container = document.getElementById("cards-list-container");
    if (!container) return;

    if (state.cards.length === 0) {
      container.innerHTML = `
        <div class="empty-state-container" style="padding: 2rem 1rem;">
          <div class="empty-illustration" style="width: 50px; height: 50px; opacity: 0.3;">${ICONS.card}</div>
          <p style="margin-top: 0.5rem;">Nenhum cartão cadastrado.</p>
        </div>`;
      document.getElementById("cards-count").innerText = "0";
      return;
    }

    document.getElementById("cards-count").innerText = state.cards.length.toString();

    const { activeCard, totalLimit, activeCardFatura, activeCardComprometido, activeCardDisp } = cardMetrics;

    if (!activeCard) return;

    // Calcular percentual de limite usado
    const totalUsed = activeCardFatura + activeCardComprometido;
    const usedPercentage = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

    // Classe de cor da porcentagem de uso
    let progressColorClass = "text-white";
    if (usedPercentage > 100) progressColorClass = "text-danger";
    else if (usedPercentage > 85) progressColorClass = "text-warning";

    // Caixa disponível cor
    let dispBoxClass = "";
    if (activeCardDisp < 0) dispBoxClass = "danger";
    else if (activeCardDisp < 300) dispBoxClass = "warning";

    // Seletor de cartões (pills) caso tenha mais de 1 cartão cadastrado
    let pillsHTML = "";
    if (state.cards.length > 1) {
      pillsHTML = `<div class="card-selector-pills" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; overflow-x: auto; padding-bottom: 0.25rem; width: 100%;">`;
      state.cards.forEach(c => {
        const isActive = c.id === activeCard.id;
        pillsHTML += `
          <button class="card-pill" data-id="${c.id}" style="padding: 0.35rem 0.75rem; border-radius: 20px; font-family: var(--font-sans); font-size: 0.75rem; font-weight: 700; border: 1px solid ${isActive ? 'transparent' : 'var(--border-color)'}; background: ${isActive ? c.color : 'var(--bg-secondary)'}; color: ${isActive ? 'white' : 'var(--text-muted)'}; cursor: pointer; transition: var(--transition-fast); white-space: nowrap; box-shadow: ${isActive ? 'var(--shadow-sm)' : 'none'};">
            ${c.name} (${c.digits})
          </button>
        `;
      });
      pillsHTML += `</div>`;
    }

    const cardHTML = `
      ${pillsHTML}
      <div class="credit-card-wrapper">
        <div class="credit-card" style="background: ${activeCard.color};" id="active-credit-card">
          <!-- Topo do Cartão -->
          <div class="card-top">
            <div class="card-brand-info">
              <span class="card-brand">${activeCard.brand} • CRÉDITO</span>
              <span class="card-name">${activeCard.name}</span>
            </div>
            
            <div class="card-chip-container" style="display: flex; align-items: center; gap: 0.65rem;">
              <button class="delete-card-btn" data-id="${activeCard.id}" title="Excluir este cartão" style="background: rgba(255, 255, 255, 0.15); border: none; border-radius: 6px; color: rgba(255, 255, 255, 0.85); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 24px; padding: 0.35rem; transition: var(--transition-fast);">
                <!-- Carregar ícone lixeira dinamicamente -->
              </button>
              <div class="card-chip"></div>
            </div>
          </div>

          <!-- Número Ocultado do Cartão -->
          <div class="card-number">•••• •••• •••• ${activeCard.digits}</div>

          <!-- Barra de Progresso do Limite -->
          <div class="card-progress-wrapper">
            <div class="progress-info">
              <span>usado</span>
              <span class="${progressColorClass}">${usedPercentage}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${Math.min(usedPercentage, 100)}%; background-color: ${usedPercentage > 100 ? '#ef4444' : 'white'};"></div>
            </div>
          </div>

          <!-- Grade de Detalhes dos Gastos -->
          <div class="card-details-grid">
            <div class="detail-box">
              <span class="detail-label">Limite</span>
              <span class="detail-value">${formatCurrency(totalLimit)}</span>
            </div>
            <div class="detail-box ${dispBoxClass}">
              <span class="detail-label">Disponível</span>
              <span class="detail-value">${formatCurrency(activeCardDisp)}</span>
            </div>
            <div class="detail-box danger">
              <span class="detail-label">Fatura</span>
              <span class="detail-value">${formatCurrency(activeCardFatura)}</span>
            </div>
            <div class="detail-box orange">
              <span class="detail-label">Comprometido</span>
              <span class="detail-value">${formatCurrency(activeCardComprometido)}</span>
            </div>
          </div>

          <!-- Rodapé do Cartão (Vencimento) -->
          <div class="card-footer">
            <span>Data dia ${activeCard.closingDay}</span>
            <span>Vence dia ${activeCard.dueDay}</span>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = cardHTML;

    // Injetar o ícone da lixeira no botão de exclusão
    const delBtn = container.querySelector(".delete-card-btn");
    if (delBtn) {
      delBtn.innerHTML = ICONS.trash;
    }

    // Adicionar Efeito 3D Tilt físico nas coordenadas do mouse
    const cardElement = document.getElementById("active-credit-card");
    if (cardElement) {
      cardElement.addEventListener("mousemove", (e) => {
        const rect = cardElement.getBoundingClientRect();
        const x = e.clientX - rect.left; // coordenada x dentro do elemento
        const y = e.clientY - rect.top;  // coordenada y dentro do elemento

        // Calcular rotação baseada na posição do mouse
        const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * 12; // limite de 12deg
        const rotateY = -(((rect.width / 2 - x) / (rect.width / 2)) * 12);

        cardElement.style.transform = `translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      cardElement.addEventListener("mouseleave", () => {
        cardElement.style.transform = "translateY(0) rotateX(0) rotateY(0)";
      });
    }

    // Listener para excluir cartão
    if (delBtn) {
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const cardId = delBtn.getAttribute("data-id");
        const cardName = state.cards.find(c => c.id === cardId)?.name || "este cartão";

        if (await window.customConfirm(`Tem certeza que deseja excluir o cartão "${cardName}"?\nAs despesas vinculadas a este cartão continuarão registradas, mas passarão para "Sem cartão associado".`)) {
          // Desvincular despesas
          state.expenses.forEach(exp => {
            if (exp.cardId === cardId) {
              exp.cardId = "";
            }
          });

          // Excluir do array
          state.cards = state.cards.filter(c => c.id !== cardId);

          // Se excluiu o ativo, mudar o foco
          if (state.selectedCardId === cardId) {
            state.selectedCardId = state.cards.length > 0 ? state.cards[0].id : "";
          }

          saveState();
          updateAllDashboard();
        }
      });
    }

    // Listeners para os botões seletores de cartão (pills)
    container.querySelectorAll(".card-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const cardId = pill.getAttribute("data-id");
        state.selectedCardId = cardId;
        updateAllDashboard();
      });
    });
  }

  // ==========================================================================
  // 6b. RENDERIZADOR DE CONTAS BANCÁRIAS DINÂMICAS
  // ==========================================================================
  function renderBankAccounts() {
    const container = document.getElementById("bank-accounts-container");
    if (!container) return;

    if (state.accounts.length === 0) {
      container.innerHTML = `
        <div class="empty-state-container" style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; width: 100%;">
          <div class="empty-illustration" style="width: 50px; height: 50px; opacity: 0.3; margin: 0 auto 1rem;">${ICONS.walletFilled}</div>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Nenhuma conta bancária vinculada.</p>
        </div>`;
      return;
    }

    let accountsHTML = "";
    state.accounts.forEach(acc => {
      accountsHTML += `
        <div class="glass-effect" style="padding: 1.5rem; background: ${acc.color}; color: white; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: 0 10px 20px ${acc.shadow || 'rgba(0,0,0,0.1)'}; position: relative; overflow: hidden; border-radius: var(--radius-lg); transition: var(--transition);" id="acc-card-${acc.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; opacity: 0.85;">${acc.type.toUpperCase()}</span>
              <h4 style="font-size: 1.2rem; font-weight: 700; margin-top: 0.1rem;">${acc.name}</h4>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button class="edit-account-btn" data-id="${acc.id}" title="Editar esta conta" style="background: rgba(255, 255, 255, 0.15); border: none; border-radius: 6px; color: rgba(255, 255, 255, 0.85); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0.35rem; transition: var(--transition-fast);">
                ${ICONS.edit}
              </button>
              <button class="delete-account-btn" data-id="${acc.id}" title="Excluir esta conta" style="background: rgba(255, 255, 255, 0.15); border: none; border-radius: 6px; color: rgba(255, 255, 255, 0.85); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0.35rem; transition: var(--transition-fast);">
                ${ICONS.trash}
              </button>
              <span style="font-size: 1.35rem; font-weight: 800; margin-left: 0.25rem;">${acc.logo}</span>
            </div>
          </div>
          <div>
            <span style="font-size: 0.68rem; opacity: 0.85;">Saldo Disponível</span>
            <div style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px;">${formatCurrency(acc.balance)}</div>
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 0.5rem; font-size: 0.72rem; display: flex; justify-content: space-between; opacity: 0.8;">
            <span>${acc.agency}</span>
            <span>${acc.accountNumber}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = accountsHTML;

    // Adicionar eventos para excluir conta
    container.querySelectorAll(".delete-account-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const account = state.accounts.find(a => a.id === id);
        const accountName = account ? account.name : "esta conta";

        if (await window.customConfirm(`Tem certeza que deseja excluir a conta "${accountName}"?`)) {
          const card = document.getElementById(`acc-card-${id}`);
          if (card) {
            card.style.opacity = "0";
            card.style.transform = "scale(0.9) translateY(10px)";
            setTimeout(() => {
              state.accounts = state.accounts.filter(a => a.id !== id);
              saveState();
              updateAllDashboard();
            }, 300);
          } else {
            state.accounts = state.accounts.filter(a => a.id !== id);
            saveState();
            updateAllDashboard();
          }
        }
      });
    });

    // Adicionar eventos para editar conta
    container.querySelectorAll(".edit-account-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const account = state.accounts.find(a => a.id === id);
        if (account) {
          document.getElementById("acc-id").value = account.id;
          document.getElementById("acc-name").value = account.name;
          document.getElementById("acc-type").value = account.type;
          document.getElementById("acc-logo").value = account.logo;
          document.getElementById("acc-balance").value = account.balance;
          document.getElementById("acc-agency").value = account.agency;
          document.getElementById("acc-number").value = account.accountNumber;
          document.getElementById("acc-color").value = account.color;

          document.getElementById("modal-conta-title").innerText = "Editar Conta Bancária";

          const modal = document.getElementById("modal-conta-dialog");
          if (modal) modal.showModal();
        }
      });
    });
  }

  // ==========================================================================
  // 6c. RENDERIZADOR DE DESPESAS RECORRENTES
  // ==========================================================================
  function renderRecurring() {
    const tbody = document.getElementById("tbody-recorrentes");
    if (!tbody) return;

    if (state.recurring.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔁</div>
            Nenhuma despesa recorrente cadastrada.
          </td>
        </tr>`;
      document.getElementById("val-recorrentes-total").innerText = formatCurrency(0);
      document.getElementById("val-recorrentes-assinaturas").innerText = formatCurrency(0);
      document.getElementById("val-recorrentes-fixos").innerText = formatCurrency(0);
      return;
    }

    // Calcular métricas considerando apenas recorrentes ativas no mês selecionado
    const activeRecurring = state.recurring.map(r => {
      const occurrences = getRecurringOccurrenceDates(r, state.selectedMonth, state.selectedYear).length;
      return { ...r, occurrences };
    }).filter(r => r.occurrences > 0);
    const totalRecorrente = activeRecurring.reduce((sum, r) => sum + (r.value * r.occurrences), 0);
    
    // Assinaturas: Categoria "🍿 Lazer & Viagem"
    const totalAssinaturas = activeRecurring
      .filter(r => r.category === "🍿 Lazer & Viagem")
      .reduce((sum, r) => sum + (r.value * r.occurrences), 0);
      
    // Custos Fixos: Outras categorias (Moradia, Assinaturas & Serviços, etc. que não são Lazer & Viagem)
    const totalFixos = activeRecurring
      .filter(r => r.category !== "🍿 Lazer & Viagem")
      .reduce((sum, r) => sum + (r.value * r.occurrences), 0);

    // Atualizar no DOM
    const totalEl = document.getElementById("val-recorrentes-total");
    const assinaturasEl = document.getElementById("val-recorrentes-assinaturas");
    const fixosEl = document.getElementById("val-recorrentes-fixos");

    if (totalEl) totalEl.innerText = formatCurrency(totalRecorrente);
    if (assinaturasEl) assinaturasEl.innerText = formatCurrency(totalAssinaturas);
    if (fixosEl) fixosEl.innerText = formatCurrency(totalFixos);

    // Renderizar tabela
    let tbodyHTML = "";
    state.recurring.forEach(r => {
      const associatedCard = state.cards.find(c => c.id === r.cardId);
      let cardName = "Nenhum";
      let cardColor = "#e2e8f0";
      let cardText = "var(--text-muted)";

      if (associatedCard) {
        cardName = associatedCard.name;
        cardColor = associatedCard.color;
        cardText = "white";
      } else {
        if (r.cardId === "pix") {
          cardName = "⚡ Pix";
          cardColor = "rgba(16, 185, 129, 0.15)";
          cardText = "var(--color-success)";
        } else if (r.cardId === "boleto") {
          cardName = "📄 Boleto";
          cardColor = "rgba(59, 130, 246, 0.15)";
          cardText = "var(--color-limit)";
        } else if (r.cardId === "dinheiro") {
          cardName = "💵 Dinheiro";
          cardColor = "rgba(245, 158, 11, 0.15)";
          cardText = "var(--color-warning)";
        } else if (r.cardId === "debito") {
          cardName = "💳 Débito";
          cardColor = "rgba(139, 92, 246, 0.15)";
          cardText = "var(--color-income)";
        } else {
          cardName = "📄 Pix/Boleto";
          cardColor = "rgba(148, 163, 184, 0.15)";
          cardText = "var(--text-muted)";
        }
      }

      const endDateHTML = r.endDate
        ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem;">Até ${formatDateBR(r.endDate)}</div>`
        : `<div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem;">Sem prazo final</div>`;

      tbodyHTML += `
        <tr id="row-rec-${r.id}">
          <td><strong>${r.description}</strong></td>
          <td>
            <span class="card-mini-tag" style="background: ${cardColor}; color: ${cardText}; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.05);">
              ${cardName}
            </span>
          </td>
          <td style="font-weight: 600;">${r.frequency}</td>
          <td style="font-weight: 600;">${r.category}</td>
          <td>${formatDateBR(r.date)}${endDateHTML}</td>
          <td class="text-danger" style="font-weight: 700;">${formatCurrency(r.value)}</td>
          <td class="text-right">
            <div class="row-actions">
              <button class="table-action-btn edit" data-id="${r.id}" title="Editar Recorrente">
                ${ICONS.edit}
              </button>
              <button class="table-action-btn delete" data-id="${r.id}" title="Excluir Recorrente">
                ${ICONS.trash}
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = tbodyHTML;

    attachTableEventListeners("recurring");
  }

  // ==========================================================================
  // 6d. RENDERIZADOR DE METAS DE POUPANÇA
  // ==========================================================================
  function renderGoals() {
    const container = document.getElementById("goals-container");
    if (!container) return;

    if (state.goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state-container" style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; width: 100%;">
          <div class="empty-illustration" style="width: 50px; height: 50px; opacity: 0.3; margin: 0 auto 1rem;">🎯</div>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Nenhum objetivo ou meta cadastrada.</p>
        </div>`;
      document.getElementById("val-metas-economizado").innerText = formatCurrency(0);
      document.getElementById("val-metas-global").innerText = formatCurrency(0);
      document.getElementById("val-metas-evolucao").innerText = "0.0%";
      return;
    }

    // Calcular métricas
    const totalEconomizado = state.goals.reduce((sum, g) => sum + g.saved, 0);
    const metaGlobal = state.goals.reduce((sum, g) => sum + g.target, 0);
    const evolucaoGlobal = metaGlobal > 0 ? (totalEconomizado / metaGlobal) * 100 : 0;

    // Atualizar no DOM
    const economizadoEl = document.getElementById("val-metas-economizado");
    const globalEl = document.getElementById("val-metas-global");
    const evolucaoEl = document.getElementById("val-metas-evolucao");

    if (economizadoEl) economizadoEl.innerText = formatCurrency(totalEconomizado);
    if (globalEl) globalEl.innerText = formatCurrency(metaGlobal);
    if (evolucaoEl) evolucaoEl.innerText = evolucaoGlobal.toFixed(1) + "%";

    // Renderizar cartões
    let goalsHTML = "";
    state.goals.forEach(g => {
      const progressPercentage = g.target > 0 ? Math.min(Math.round((g.saved / g.target) * 100), 100) : 0;

      // Estilizar badge baseado no progresso
      let badgeBg = "rgba(59, 130, 246, 0.1)";
      let badgeColor = "var(--color-limit)";
      let progressGradient = "var(--color-limit)";
      
      if (progressPercentage >= 100) {
        badgeBg = "rgba(16, 185, 129, 0.1)";
        badgeColor = "var(--color-success)";
        progressGradient = "linear-gradient(90deg, #097d52 0%, #10b981 100%)";
      } else if (progressPercentage >= 50) {
        badgeBg = "rgba(139, 92, 246, 0.1)";
        badgeColor = "var(--color-income)";
        progressGradient = "linear-gradient(90deg, #6d28d9 0%, #8b5cf6 100%)";
      } else if (progressPercentage > 0) {
        badgeBg = "rgba(245, 158, 11, 0.1)";
        badgeColor = "var(--color-warning)";
        progressGradient = "linear-gradient(90deg, #d97706 0%, #f59e0b 100%)";
      }

      // Plano simulado
      let planText = "";
      const remaining = Math.max(g.target - g.saved, 0);
      if (remaining <= 0) {
        planText = `✨ Objetivo alcançado! Parabéns! 🎉`;
      } else {
        if (g.simMode === "time" && g.simMonths) {
          const monthly = remaining / g.simMonths;
          planText = `⏱️ Guardar <strong>${formatCurrency(monthly)}</strong>/mês por <strong>${g.simMonths} meses</strong>`;
        } else if (g.simMode === "value" && g.simMonthlyVal) {
          const months = Math.ceil(remaining / g.simMonthlyVal);
          const yearsText = months > 12 ? ` (${Math.floor(months/12)}a ${months%12}m)` : "";
          planText = `⏱️ Guardar <strong>${formatCurrency(g.simMonthlyVal)}</strong>/mês por <strong>${months} meses</strong>${yearsText}`;
        }
      }

      const planHTML = planText ? `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
          ${planText}
        </div>
      ` : "";

      goalsHTML += `
        <div class="glass-effect" id="goal-card-${g.id}" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: var(--transition); position: relative; border-radius: var(--radius-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.35rem;">
              <span>${g.icon}</span> <span>${g.name}</span>
            </span>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <button class="goal-action-btn edit" data-id="${g.id}" title="Editar Objetivo" style="background: rgba(59, 130, 246, 0.1); border: none; border-radius: 6px; color: var(--color-limit); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 0.35rem; transition: var(--transition-fast);">
                <!-- Injetado por JS -->
              </button>
              <button class="goal-action-btn delete" data-id="${g.id}" title="Excluir Objetivo" style="background: rgba(239, 68, 68, 0.1); border: none; border-radius: 6px; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 0.35rem; transition: var(--transition-fast);">
                <!-- Injetado por JS -->
              </button>
              <span style="font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 50px; background: ${badgeBg}; color: ${badgeColor}; white-space: nowrap;">${progressPercentage}% Concluído</span>
            </div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 800; color: ${progressPercentage >= 100 ? 'var(--color-success)' : 'var(--text-main)'};">
            ${formatCurrency(g.saved)} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">/ ${formatCurrency(g.target)}</span>
          </div>
          <div class="progress-bar-bg" style="height: 10px; background-color: var(--border-color); border-radius: 5px; overflow: hidden;">
            <div class="progress-bar-fill" style="width: ${progressPercentage}%; height: 100%; background: ${progressGradient}; border-radius: 5px; transition: width 0.5s ease-out-in;"></div>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin: 0;">${g.notes || ''}</p>
          ${planHTML}
        </div>
      `;
    });

    container.innerHTML = goalsHTML;

    // Injetar ícones SVG nos botões
    container.querySelectorAll(".goal-action-btn.edit").forEach(btn => {
      btn.innerHTML = ICONS.edit;
    });
    container.querySelectorAll(".goal-action-btn.delete").forEach(btn => {
      btn.innerHTML = ICONS.trash;
    });

    attachGoalEventListeners();
  }

  function attachGoalEventListeners() {
    // Excluir Objetivo
    document.querySelectorAll("#goals-container .goal-action-btn.delete").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const goal = state.goals.find(g => g.id === id);
        const goalName = goal ? goal.name : "este objetivo";

        if (await window.customConfirm(`Tem certeza que deseja excluir o objetivo "${goalName}"?`)) {
          const card = document.getElementById(`goal-card-${id}`);
          if (card) {
            card.style.opacity = "0";
            card.style.transform = "scale(0.9) translateY(10px)";
            setTimeout(() => {
              state.goals = state.goals.filter(g => g.id !== id);
              saveState();
              updateAllDashboard();
            }, 300);
          } else {
            state.goals = state.goals.filter(g => g.id !== id);
            saveState();
            updateAllDashboard();
          }
        }
      });
    });

    // Editar Objetivo
    document.querySelectorAll("#goals-container .goal-action-btn.edit").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const goal = state.goals.find(g => g.id === id);

        if (goal) {
          document.getElementById("goal-id").value = goal.id;
          document.getElementById("goal-icon").value = goal.icon;
          document.getElementById("goal-name").value = goal.name;
          document.getElementById("goal-saved").value = goal.saved;
          document.getElementById("goal-target").value = goal.target;
          document.getElementById("goal-notes").value = goal.notes || "";

          document.getElementById("modal-meta-title").innerText = "Editar Objetivo / Meta";
          
          // Sincronizar sugestão de emoji ativa ao editar
          const emojiButtons = document.querySelectorAll(".emoji-sug-btn");
          emojiButtons.forEach(btn => {
            if (btn.innerText === goal.icon) {
              btn.classList.add("active");
            } else {
              btn.classList.remove("active");
            }
          });
          
          // Carregar simulador ao editar
          const simMode = goal.simMode || "time";
          const radio = document.querySelector(`input[name="sim-mode"][value="${simMode}"]`);
          if (radio) radio.checked = true;
          
          const sMonths = document.getElementById("sim-months");
          const sMonthly = document.getElementById("sim-monthly-val");
          
          if (sMonths) sMonths.value = goal.simMonths || "";
          if (sMonthly) sMonthly.value = goal.simMonthlyVal || "";
          
          calculateSimulation();
          
          const modal = document.getElementById("modal-meta-dialog");
          if (modal) modal.showModal();
        }
      });
    });
  }

  // ==========================================================================
  // 7. RENDERIZADOR DE GRÁFICO SVG PERSONALIZADO E RESPONSIVO
  // ==========================================================================
  function renderSVGChart() {
    const container = document.getElementById("svg-chart-container");
    if (!container) return;

    const month = state.selectedMonth;
    const year = state.selectedYear;

    // Dividir o mês em 5 períodos para mostrar a evolução
    // P1: Dias 1-6, P2: Dias 7-12, P3: Dias 13-18, P4: Dias 19-24, P5: Dias 25-31
    const periods = [
      { label: "Dia 1-6", start: 1, end: 6 },
      { label: "Dia 7-12", start: 7, end: 12 },
      { label: "Dia 13-18", start: 13, end: 18 },
      { label: "Dia 19-24", start: 19, end: 24 },
      { label: "Dia 25+", start: 25, end: 31 }
    ];

    const incomeValues = [0, 0, 0, 0, 0];
    const expenseValues = [0, 0, 0, 0, 0];

    // Somar receitas por período
    state.revenues.forEach(r => {
      const d = new Date(r.date + "T00:00:00");
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        const pIndex = periods.findIndex(p => day >= p.start && day <= p.end);
        if (pIndex !== -1) incomeValues[pIndex] += r.value;
      }
    });

    // Somar despesas por período
    const monthExpenses = getMonthlyExpenses(month, year);
    monthExpenses.forEach(e => {
      const d = new Date(e.date + "T00:00:00");
      const day = d.getDate();
      const pIndex = periods.findIndex(p => day >= p.start && day <= p.end);
      if (pIndex !== -1) expenseValues[pIndex] += e.value;
    });

    // Encontrar o maior valor para definir o topo da escala Y do gráfico
    const maxVal = Math.max(...incomeValues, ...expenseValues, 1000); // Mínimo de R$ 1000 na escala

    // Configurações do SVG
    const svgWidth = 600;
    const svgHeight = 220;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Calcular coordenadas X e Y
    function getX(index) {
      return paddingLeft + (index / (periods.length - 1)) * chartWidth;
    }

    function getY(val) {
      return paddingTop + chartHeight - (val / maxVal) * chartHeight;
    }

    // Cores dinâmicas baseadas no tema
    const isDark = state.theme === "dark";
    const textThemeColor = isDark ? "#94a3b8" : "#64748b";
    const gridThemeColor = isDark ? "rgba(55, 65, 81, 0.4)" : "rgba(226, 232, 240, 0.8)";

    // Construir os pontos e linhas das Receitas (Roxo) e Despesas (Vermelho)
    let incomePoints = "";
    let expensePoints = "";
    let incomePath = "";
    let expensePath = "";

    incomeValues.forEach((val, i) => {
      const cx = getX(i);
      const cy = getY(val);
      
      incomePoints += `<circle cx="${cx}" cy="${cy}" class="chart-dot income" />`;
      if (i === 0) incomePath += `M ${cx} ${cy}`;
      else {
        // Criar uma curva suave Bézier entre os pontos
        const prevCx = getX(i - 1);
        const prevCy = getY(incomeValues[i - 1]);
        const cpX1 = prevCx + (cx - prevCx) / 2;
        const cpY1 = prevCy;
        const cpX2 = prevCx + (cx - prevCx) / 2;
        const cpY2 = cy;
        incomePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${cx} ${cy}`;
      }
    });

    expenseValues.forEach((val, i) => {
      const cx = getX(i);
      const cy = getY(val);

      expensePoints += `<circle cx="${cx}" cy="${cy}" class="chart-dot expense" />`;
      if (i === 0) expensePath += `M ${cx} ${cy}`;
      else {
        const prevCx = getX(i - 1);
        const prevCy = getY(expenseValues[i - 1]);
        const cpX1 = prevCx + (cx - prevCx) / 2;
        const cpY1 = prevCy;
        const cpX2 = prevCx + (cx - prevCx) / 2;
        const cpY2 = cy;
        expensePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${cx} ${cy}`;
      }
    });

    // Gerar linhas horizontais de grade (Grid Lines)
    let gridLinesHTML = "";
    const gridDivisions = 4;
    for (let i = 0; i <= gridDivisions; i++) {
      const fraction = i / gridDivisions;
      const y = paddingTop + fraction * chartHeight;
      const labelVal = maxVal * (1 - fraction);
      gridLinesHTML += `
        <line x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" stroke="${gridThemeColor}" stroke-width="1" stroke-dasharray="4 4" />
        <text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-text" fill="${textThemeColor}">${formatCurrency(labelVal).replace("R$", "")}</text>
      `;
    }

    // Gerar textos do eixo X
    let xAxisHTML = "";
    periods.forEach((p, i) => {
      const x = getX(i);
      xAxisHTML += `
        <text x="${x}" y="${svgHeight - 10}" text-anchor="middle" class="chart-axis-text" fill="${textThemeColor}">${p.label}</text>
      `;
    });

    // Montar SVG Final
    const svgHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <!-- Grades e Eixos -->
        ${gridLinesHTML}
        ${xAxisHTML}

        <!-- Caminho Preenchido com Gradiente para Receitas -->
        <defs>
          <linearGradient id="gradient-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-income)" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="var(--color-income)" stop-opacity="0.00"/>
          </linearGradient>
          <linearGradient id="gradient-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-expense)" stop-opacity="0.20"/>
            <stop offset="100%" stop-color="var(--color-expense)" stop-opacity="0.00"/>
          </linearGradient>
        </defs>
        
        <!-- Preenchimento sob a curva de Receita -->
        <path d="${incomePath} L ${getX(periods.length - 1)} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z" fill="url(#gradient-income)" />
        
        <!-- Preenchimento sob a curva de Despesa -->
        <path d="${expensePath} L ${getX(periods.length - 1)} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z" fill="url(#gradient-expense)" />

        <!-- Linhas Principais -->
        <path d="${incomePath}" class="chart-svg-line income" />
        <path d="${expensePath}" class="chart-svg-line expense" />

        <!-- Pontos com Tooltip Visual -->
        ${incomePoints}
        ${expensePoints}
      </svg>
    `;

    container.innerHTML = svgHTML;
  }

  // ==========================================================================
  // 8. FILTRO E LISTAGEM DAS TRANSAÇÕES (TABELA DINÂMICA)
  // ==========================================================================
  function renderTransactions() {
    const month = state.selectedMonth;
    const year = state.selectedYear;
    const search = state.searchQuery.toLowerCase();

    // 1. Obter e filtrar despesas do mês
    const monthExpenses = getMonthlyExpenses(month, year);
    const filteredExpenses = monthExpenses.filter(e => e.description.toLowerCase().includes(search));
    const countDespesasEl = document.getElementById("count-despesas");
    if (countDespesasEl) countDespesasEl.innerText = filteredExpenses.length.toString();

    // 2. Filtrar ordens de serviço do mês
    const filteredOrders = state.orders.filter(os => {
      const d = new Date(os.date + "T00:00:00");
      const matchesDate = d.getMonth() === month && d.getFullYear() === year;
      const matchesSearch = os.customer.toLowerCase().includes(search) || os.service.toLowerCase().includes(search);
      return matchesDate && matchesSearch;
    });
    const countOSEl = document.getElementById("count-os");
    if (countOSEl) countOSEl.innerText = filteredOrders.length.toString();

    // 3. Filtrar receitas do mês por status
    const monthRevenues = state.revenues.filter(rev => {
      const d = new Date(rev.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year && rev.description.toLowerCase().includes(search);
    });
    const filteredSaldoConta = monthRevenues.filter(rev => (rev.category || "Recebido") === "Recebido");
    const filteredAReceber = monthRevenues.filter(rev => rev.category === "Pendente");

    const countSaldoEl = document.getElementById("count-saldo-conta");
    if (countSaldoEl) countSaldoEl.innerText = filteredSaldoConta.length.toString();
    const countAReceberEl = document.getElementById("count-a-receber");
    if (countAReceberEl) countAReceberEl.innerText = filteredAReceber.length.toString();

    if (state.currentTab === "despesas") {
      const tbody = document.getElementById("tbody-despesas");
      const emptyState = document.getElementById("empty-despesas");
      if (!tbody) return;

      if (filteredExpenses.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "flex";
        return;
      }

      emptyState.style.display = "none";

      let tbodyHTML = "";
      filteredExpenses.forEach(e => {
        const associatedCard = state.cards.find(c => c.id === e.cardId);
        let cardName = "Nenhum";
        let cardColor = "#e2e8f0";
        let cardText = "var(--text-muted)";

        if (associatedCard) {
          cardName = associatedCard.name;
          cardColor = associatedCard.color;
          cardText = "white";
        } else {
          // Map standard payment methods
          if (e.cardId === "pix") {
            cardName = "⚡ Pix";
            cardColor = "rgba(16, 185, 129, 0.15)";
            cardText = "var(--color-success)";
          } else if (e.cardId === "boleto") {
            cardName = "📄 Boleto";
            cardColor = "rgba(59, 130, 246, 0.15)";
            cardText = "var(--color-limit)";
          } else if (e.cardId === "dinheiro") {
            cardName = "💵 Dinheiro";
            cardColor = "rgba(245, 158, 11, 0.15)";
            cardText = "var(--color-warning)";
          } else if (e.cardId === "debito") {
            cardName = "💳 Débito";
            cardColor = "rgba(139, 92, 246, 0.15)";
            cardText = "var(--color-income)";
          } else {
            cardName = "📄 Pix/Boleto";
            cardColor = "rgba(148, 163, 184, 0.15)";
            cardText = "var(--text-muted)";
          }
        }

        let statusClass = "pendente";
        let statusLabel = e.status || "Pendente";
        if (e.status === "Pagas") {
          statusClass = "pago";
          statusLabel = "Pago";
        } else if (e.status === "Comprometido") {
          statusClass = "comprometido";
          statusLabel = "Comprometido";
        } else if (e.status === "Pendentes") {
          statusClass = "pendente";
          statusLabel = "Pendente";
        }

        let dateHTML = formatDateBR(e.date);
        if (e.status === "Pagas" && e.paymentDate) {
          dateHTML += `<div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; margin-top: 0.15rem; white-space: nowrap;">Pago em: ${formatDateBR(e.paymentDate)}</div>`;
        }

        tbodyHTML += `
          <tr id="row-exp-${e.id}">
            <td>${e.description}</td>
            <td>${dateHTML}</td>
            <td>
              <span class="card-mini-tag" style="background: ${cardColor}; color: ${cardText}; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.05);">
                ${cardName}
              </span>
            </td>
            <td style="font-weight: 600;">${e.category || "🍔 Alimentação"}</td>
            <td>
              <span class="badge-status ${statusClass}">${statusLabel}</span>
            </td>
            <td class="text-danger" style="font-weight: 700;">${formatCurrency(e.value)}</td>
            <td class="text-right">
              <div class="row-actions">
                <button class="table-action-btn toggle-pay" data-id="${e.id}" title="Alternar Pago/Pendente">
                  ${ICONS.paid}
                </button>
                <button class="table-action-btn edit" data-id="${e.id}" title="Editar Despesa">
                  ${ICONS.edit}
                </button>
                <button class="table-action-btn delete" data-id="${e.id}" title="Excluir Despesa">
                  ${ICONS.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = tbodyHTML;
      attachTableEventListeners("expenses");

    } else if (state.currentTab === "os") {
      const tbody = document.getElementById("tbody-os");
      const emptyState = document.getElementById("empty-os");
      if (!tbody) return;

      if (filteredOrders.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "flex";
        return;
      }

      emptyState.style.display = "none";

      let tbodyHTML = "";
      filteredOrders.forEach(os => {
        let statusClass = "pendente";
        if (os.status === "Concluído") statusClass = "pago";

        tbodyHTML += `
          <tr id="row-os-${os.id}">
            <td><strong>${os.customer}</strong></td>
            <td>${os.service}</td>
            <td>${formatDateBR(os.date)}</td>
            <td>
              <span class="badge-status ${statusClass}">${os.status}</span>
            </td>
            <td class="text-success">${formatCurrency(os.value)}</td>
            <td class="text-right">
              <div class="row-actions">
                <button class="table-action-btn toggle-pay" data-id="${os.id}" title="Alternar Concluído/Pendente">
                  ${ICONS.paid}
                </button>
                <button class="table-action-btn edit" data-id="${os.id}" title="Editar OS">
                  ${ICONS.edit}
                </button>
                <button class="table-action-btn delete" data-id="${os.id}" title="Excluir OS">
                  ${ICONS.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = tbodyHTML;
      attachTableEventListeners("os");

    } else if (state.currentTab === "saldo-conta") {
      const tbody = document.getElementById("tbody-saldo-conta");
      const emptyState = document.getElementById("empty-saldo-conta");
      if (!tbody) return;

      if (filteredSaldoConta.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "flex";
        return;
      }
      emptyState.style.display = "none";

      let tbodyHTML = "";
      filteredSaldoConta.forEach(rev => {
        tbodyHTML += `
          <tr id="row-rev-${rev.id}">
            <td><strong>${rev.description}</strong></td>
            <td>${formatDateBR(rev.date)}</td>
            <td class="text-success" style="font-weight: 700;">${formatCurrency(rev.value)}</td>
            <td class="text-right">
              <div class="row-actions">
                <button class="table-action-btn toggle-pay" data-id="${rev.id}" title="Marcar como Pendente">
                  ${ICONS.paid}
                </button>
                <button class="table-action-btn edit" data-id="${rev.id}" title="Editar">
                  ${ICONS.edit}
                </button>
                <button class="table-action-btn delete" data-id="${rev.id}" title="Excluir">
                  ${ICONS.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = tbodyHTML;
      attachTableEventListeners("saldo-conta");

    } else if (state.currentTab === "a-receber") {
      const tbody = document.getElementById("tbody-a-receber");
      const emptyState = document.getElementById("empty-a-receber");
      if (!tbody) return;

      if (filteredAReceber.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "flex";
        return;
      }
      emptyState.style.display = "none";

      let tbodyHTML = "";
      filteredAReceber.forEach(rev => {
        tbodyHTML += `
          <tr id="row-rev-${rev.id}">
            <td><strong>${rev.description}</strong></td>
            <td>${formatDateBR(rev.date)}</td>
            <td class="text-warning" style="font-weight: 700;">${formatCurrency(rev.value)}</td>
            <td class="text-right">
              <div class="row-actions">
                <button class="table-action-btn toggle-pay" data-id="${rev.id}" title="Marcar como Recebido">
                  ${ICONS.paid}
                </button>
                <button class="table-action-btn edit" data-id="${rev.id}" title="Editar">
                  ${ICONS.edit}
                </button>
                <button class="table-action-btn delete" data-id="${rev.id}" title="Excluir">
                  ${ICONS.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = tbodyHTML;
      attachTableEventListeners("a-receber");
    }
  }

  // Ligar eventos nos botões de ação das tabelas (Pagar/Excluir/Editar)
  function attachTableEventListeners(type) {
    if (type === "expenses") {
      // Excluir despesa
      document.querySelectorAll("#tbody-despesas .table-action-btn.delete").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = btn.getAttribute("data-id");
          const row = document.getElementById(`row-exp-${id}`);
          
          if (id.startsWith("virtual-rec-")) {
            const recItem = state.recurring.find(r => id.includes(`virtual-rec-${r.id}-`));
            if (recItem) {
              if (await window.customConfirm(`Deseja excluir a despesa recorrente "${recItem.description}" permanentemente de todos os meses?`)) {
                if (row) {
                  row.style.opacity = "0";
                  row.style.transform = "translateX(20px)";
                  setTimeout(() => {
                    state.recurring = state.recurring.filter(r => r.id !== recItem.id);
                    state.expenses = state.expenses.filter(exp => exp.parentRecurringId !== recItem.id);
                    saveState();
                    updateAllDashboard();
                  }, 300);
                } else {
                  state.recurring = state.recurring.filter(r => r.id !== recItem.id);
                  state.expenses = state.expenses.filter(exp => exp.parentRecurringId !== recItem.id);
                  saveState();
                  updateAllDashboard();
                }
              }
            }
            return;
          }

          const expense = state.expenses.find(exp => exp.id === id);
          if (expense && expense.parentRecurringId) {
            const recItem = state.recurring.find(r => r.id === expense.parentRecurringId);
            const recName = recItem ? recItem.description : "despesa recorrente";
            if (await window.customConfirm(`Esta despesa faz parte da recorrente "${recName}".\nDeseja excluir a recorrente permanentemente de todos os meses? (Se escolher Cancelar, excluirá apenas esta ocorrência de ${formatDateBR(expense.date)})`)) {
              if (row) {
                row.style.opacity = "0";
                row.style.transform = "translateX(20px)";
                setTimeout(() => {
                  state.recurring = state.recurring.filter(r => r.id !== expense.parentRecurringId);
                  state.expenses = state.expenses.filter(exp => exp.parentRecurringId !== expense.parentRecurringId);
                  saveState();
                  updateAllDashboard();
                }, 300);
              }
            } else {
              if (row) {
                row.style.opacity = "0";
                row.style.transform = "translateX(20px)";
                setTimeout(() => {
                  state.expenses = state.expenses.filter(exp => exp.id !== id);
                  saveState();
                  updateAllDashboard();
                }, 300);
              }
            }
            return;
          }

          if (row) {
            row.style.opacity = "0";
            row.style.transform = "translateX(20px)";
            setTimeout(() => {
              state.expenses = state.expenses.filter(exp => exp.id !== id);
              saveState();
              updateAllDashboard();
            }, 300);
          }
        });
      });

      // Alternar status de pagamento
      document.querySelectorAll("#tbody-despesas .table-action-btn.toggle-pay").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          let expense = state.expenses.find(exp => exp.id === id);
          
          if (!expense && id.startsWith("virtual-rec-")) {
            // Materializar a despesa recorrente virtual para esta data específica
            expense = materializeVirtualRecurringExpense(id, "Pagas");
          } else if (expense) {
            if (expense.status === "Pagas") {
              expense.status = "Pendentes";
              expense.paymentDate = "";
            } else {
              expense.status = "Pagas";
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, "0");
              const dd = String(today.getDate()).padStart(2, "0");
              expense.paymentDate = `${yyyy}-${mm}-${dd}`;
            }
          }

          if (expense) {
            saveState();
            updateAllDashboard();
          }
        });
      });

      // Editar despesa
      document.querySelectorAll("#tbody-despesas .table-action-btn.edit").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          let exp = state.expenses.find(e => e.id === id);
          
          if (!exp && id.startsWith("virtual-rec-")) {
            // Materializar a despesa recorrente virtual para esta data específica
            exp = materializeVirtualRecurringExpense(id);
            if (exp) saveState();
          }

          if (exp) {
            document.getElementById("exp-id").value = exp.id;
            document.getElementById("exp-desc").value = exp.description;
            document.getElementById("exp-val").value = exp.value;
            document.getElementById("exp-date").value = exp.date;
            document.getElementById("exp-card").value = exp.cardId || "pix";
            document.getElementById("exp-category").value = exp.category || "🍔 Alimentação";
            document.getElementById("exp-status").value = exp.status || "Pendentes";

            const payDateGroup = document.getElementById("group-exp-pay-date");
            const payDateInput = document.getElementById("exp-pay-date");

            if (exp.status === "Pagas") {
              if (payDateGroup) payDateGroup.style.display = "flex";
              if (payDateInput) payDateInput.value = exp.paymentDate || exp.date;
            } else {
              if (payDateGroup) payDateGroup.style.display = "none";
              if (payDateInput) payDateInput.value = "";
            }

            document.getElementById("modal-despesa-title").innerText = "Editar Despesa";
            
            const modal = document.getElementById("modal-despesa-dialog");
            if (modal) modal.showModal();
          }
        });
      });

    } else if (type === "os") {
      // Excluir OS
      document.querySelectorAll("#tbody-os .table-action-btn.delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = btn.getAttribute("data-id");
          const row = document.getElementById(`row-os-${id}`);
          if (row) {
            row.style.opacity = "0";
            row.style.transform = "translateX(20px)";
            setTimeout(() => {
              state.orders = state.orders.filter(os => os.id !== id);
              saveState();
              updateAllDashboard();
            }, 300);
          }
        });
      });

      // Alternar status da OS
      document.querySelectorAll("#tbody-os .table-action-btn.toggle-pay").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const os = state.orders.find(item => item.id === id);
          if (os) {
            os.status = os.status === "Concluído" ? "Pendente" : "Concluído";
            saveState();
            updateAllDashboard();
          }
        });
      });

      // Editar OS
      document.querySelectorAll("#tbody-os .table-action-btn.edit").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const os = state.orders.find(item => item.id === id);
          if (os) {
            document.getElementById("os-id").value = os.id;
            document.getElementById("os-customer").value = os.customer;
            document.getElementById("os-service").value = os.service;
            document.getElementById("os-val").value = os.value;
            document.getElementById("os-date").value = os.date;
            document.getElementById("os-status").value = os.status || "Pendente";

            document.getElementById("modal-os-title").innerText = "Editar Ordem de Serviço (OS)";
            
            const modal = document.getElementById("modal-os-dialog");
            if (modal) modal.showModal();
          }
        });
      });
      
    } else if (type === "recurring") {
      // Excluir Recorrente
      document.querySelectorAll("#tbody-recorrentes .table-action-btn.delete").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = btn.getAttribute("data-id");
          const row = document.getElementById(`row-rec-${id}`);
          const recName = state.recurring.find(r => r.id === id)?.description || "esta despesa recorrente";
          
          if (await window.customConfirm(`Tem certeza que deseja excluir a despesa recorrente "${recName}"?`)) {
            if (row) {
              row.style.opacity = "0";
              row.style.transform = "translateX(20px)";
              setTimeout(() => {
                state.recurring = state.recurring.filter(rec => rec.id !== id);
                saveState();
                updateAllDashboard();
              }, 300);
            } else {
              state.recurring = state.recurring.filter(rec => rec.id !== id);
              saveState();
              updateAllDashboard();
            }
          }
        });
      });

      // Editar Recorrente
      document.querySelectorAll("#tbody-recorrentes .table-action-btn.edit").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const rec = state.recurring.find(r => r.id === id);
          if (rec) {
            document.getElementById("rec-id").value = rec.id;
            document.getElementById("rec-desc").value = rec.description;
            document.getElementById("rec-val").value = rec.value;
            document.getElementById("rec-date").value = rec.date;
            document.getElementById("rec-end-date").value = rec.endDate || "";
            document.getElementById("rec-duration-months").value = "";
            document.getElementById("rec-card").value = rec.cardId || "pix";
            document.getElementById("rec-frequency").value = rec.frequency || "Mensal";
            document.getElementById("rec-category").value = rec.category || "🏠 Moradia";

            document.getElementById("modal-recorrente-title").innerText = "Editar Despesa Recorrente";
            
            const modal = document.getElementById("modal-recorrente-dialog");
            if (modal) modal.showModal();
          }
        });
      });
    } else if (type === "saldo-conta" || type === "a-receber") {
      const tbodyId = type === "saldo-conta" ? "#tbody-saldo-conta" : "#tbody-a-receber";

      // Excluir Receita
      document.querySelectorAll(`${tbodyId} .table-action-btn.delete`).forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const row = document.getElementById(`row-rev-${id}`);
          if (row) {
            row.style.opacity = "0";
            row.style.transform = "translateX(20px)";
            setTimeout(() => {
              state.revenues = state.revenues.filter(rev => rev.id !== id);
              saveState();
              updateAllDashboard();
            }, 300);
          }
        });
      });

      // Alternar status da Receita
      document.querySelectorAll(`${tbodyId} .table-action-btn.toggle-pay`).forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const rev = state.revenues.find(item => item.id === id);
          if (rev) {
            rev.category = rev.category === "Recebido" ? "Pendente" : "Recebido";
            saveState();
            updateAllDashboard();
          }
        });
      });

      // Editar Receita
      document.querySelectorAll(`${tbodyId} .table-action-btn.edit`).forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const rev = state.revenues.find(item => item.id === id);
          if (rev) {
            document.getElementById("rev-id").value = rev.id;
            document.getElementById("rev-desc").value = rev.description;
            document.getElementById("rev-val").value = rev.value;
            document.getElementById("rev-date").value = rev.date;
            document.getElementById("rev-category").value = rev.category || "Recebido";
            document.getElementById("modal-receita-title").innerText = "Editar Receita";
            const modal = document.getElementById("modal-receita-dialog");
            if (modal) modal.showModal();
          }
        });
      });
    }
  }

  // ==========================================================================
  // 8. ATUALIZADOR COMPLETO DO ECOSSISTEMA DO DASHBOARD
  // ==========================================================================
  function updateAllDashboard() {
    const cardMetrics = calculateMetrics();
    renderCreditCards(cardMetrics);
    renderSVGChart();
    renderTransactions();
    populateCardDropdowns();
    renderBankAccounts();
    renderRecurring();
    renderGoals();
    renderCategoryReport();
    updateReportSummary();
    renderFinancialInsights();
  }

  // Preencher seletores de cartões nos formulários
  function populateCardDropdowns() {
    const cardSelect = document.getElementById("exp-card");
    const recCardSelect = document.getElementById("rec-card");
    if (!cardSelect && !recCardSelect) return;

    // Métodos padrões de pagamento
    let optionsHTML = `
      <option value="pix" selected>⚡ Pix</option>
      <option value="boleto">📄 Boleto Bancário</option>
      <option value="dinheiro">💵 Dinheiro (Espécie)</option>
      <option value="debito">💳 Cartão de Débito</option>
    `;
    
    // Adicionar cartões de crédito dinâmicos
    state.cards.forEach(c => {
      optionsHTML += `<option value="${c.id}">💳 ${c.name} (${c.digits})</option>`;
    });
    
    if (cardSelect) cardSelect.innerHTML = optionsHTML;
    if (recCardSelect) recCardSelect.innerHTML = optionsHTML;
  }

  // ==========================================================================
  // 9. CONTROLE DE ABAS E EVENT LISTENERS DE FILTROS
  // ==========================================================================
  
  // Abas de Transações (Despesas / OS / Saldo em Conta / Valor a Receber)
  const tabDespesasBtn = document.getElementById("tab-despesas");
  const tabOSBtn = document.getElementById("tab-os");
  const tabSaldoContaBtn = document.getElementById("tab-saldo-conta");
  const tabAReceberBtn = document.getElementById("tab-a-receber");
  const panelDespesas = document.getElementById("panel-despesas");
  const panelOS = document.getElementById("panel-os");
  const panelSaldoConta = document.getElementById("panel-saldo-conta");
  const panelAReceber = document.getElementById("panel-a-receber");

  const allTabBtns = [tabDespesasBtn, tabOSBtn, tabSaldoContaBtn, tabAReceberBtn].filter(Boolean);
  const allPanels = [panelDespesas, panelOS, panelSaldoConta, panelAReceber].filter(Boolean);

  function activateTab(tabBtn, panel, tabName) {
    allTabBtns.forEach(b => b.classList.remove("active"));
    allPanels.forEach(p => p.classList.remove("active"));
    if (tabBtn) tabBtn.classList.add("active");
    if (panel) panel.classList.add("active");
    state.currentTab = tabName;
    renderTransactions();
  }

  if (tabDespesasBtn) tabDespesasBtn.addEventListener("click", () => activateTab(tabDespesasBtn, panelDespesas, "despesas"));
  if (tabOSBtn) tabOSBtn.addEventListener("click", () => activateTab(tabOSBtn, panelOS, "os"));
  if (tabSaldoContaBtn) tabSaldoContaBtn.addEventListener("click", () => activateTab(tabSaldoContaBtn, panelSaldoConta, "saldo-conta"));
  if (tabAReceberBtn) tabAReceberBtn.addEventListener("click", () => activateTab(tabAReceberBtn, panelAReceber, "a-receber"));

  // Filtros de Data
  const selectMonth = document.getElementById("select-month");
  const selectYear = document.getElementById("select-year");

  if (selectMonth && selectYear) {
    selectMonth.addEventListener("change", () => {
      state.selectedMonth = parseInt(selectMonth.value);
      updateAllDashboard();
    });
    selectYear.addEventListener("change", () => {
      state.selectedYear = parseInt(selectYear.value);
      updateAllDashboard();
    });
  }

  // Caixa de Busca
  const searchInput = document.getElementById("search-transactions");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderTransactions();
    });
  }

  // ==========================================================================
  // 10. NAVEGAÇÃO PRINCIPAL DO HEADER (Orçamentos, Recorrentes, Metas, etc.)
  // ==========================================================================

  // Selecionar todos os links de navegação e todas as views
  const navItems = document.querySelectorAll(".main-nav .nav-item");
  const bottomNavItems = document.querySelectorAll(".bottom-nav-item");
  const allTabViews = document.querySelectorAll(".tab-view");

  function updateProfileTab() {
    const displayName = document.getElementById("profile-display-name");
    const displayEmail = document.getElementById("profile-display-email");
    const displayUid = document.getElementById("profile-display-uid");
    const displaySync = document.getElementById("profile-display-sync");
    
    if (displayName) displayName.innerText = state.userName;
    if (displayEmail) displayEmail.innerText = currentUser ? currentUser.email : "Modo Local (Offline)";
    if (displayUid) displayUid.innerText = currentUser ? currentUser.uid : "offline";
    
    if (displaySync) {
      if (currentUser) {
        displaySync.innerHTML = `<span style="color: var(--color-success)">🟢</span> Nuvem Sincronizada (Firebase)`;
      } else {
        displaySync.innerHTML = `<span style="color: var(--color-warning)">📴</span> Armazenamento Local (Somente este dispositivo)`;
      }
    }

    const tierBadge = document.getElementById("profile-tier-badge");
    const tierLimits = document.getElementById("profile-tier-limits");
    const upgradeAction = document.getElementById("profile-upgrade-action-container");

    if (tierBadge) {
      if (state.tier === "premium") {
        tierBadge.innerText = "👑 PLANO PREMIUM ATIVO";
        tierBadge.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      } else {
        tierBadge.innerText = "🔒 PLANO GRATUITO";
        tierBadge.style.background = "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)";
      }
    }

    if (tierLimits) {
      if (state.tier === "premium") {
        tierLimits.innerHTML = `
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            <li>✅ <strong>Cartões de Crédito:</strong> Ilimitados</li>
            <li>✅ <strong>Contas Bancárias:</strong> Ilimitadas</li>
            <li>✅ <strong>Metas & Objetivos:</strong> Ilimitados</li>
            <li>✅ <strong>Relatórios & BI:</strong> Totalmente Liberados</li>
            <li>✅ <strong>Lançamentos mensais:</strong> Ilimitados</li>
            <li>✅ <strong>Sincronização Nuvem:</strong> Ativa em tempo real</li>
          </ul>
        `;
      } else {
        tierLimits.innerHTML = `
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            <li>⚠️ <strong>Cartões de Crédito:</strong> Limite de 1 cadastrado</li>
            <li>⚠️ <strong>Contas Bancárias:</strong> Limite de 1 cadastrada</li>
            <li>⚠️ <strong>Metas & Objetivos:</strong> Limite de 2 cadastrados</li>
            <li>❌ <strong>Relatórios & BI:</strong> Bloqueados no plano gratuito</li>
            <li>⚠️ <strong>Lançamentos mensais:</strong> Máximo de 10 transações</li>
            <li>ℹ️ <em>Faça o upgrade para remover todas as limitações e ativar relatórios avançados!</em></li>
          </ul>
        `;
      }
    }

    if (upgradeAction) {
      if (state.tier === "premium") {
        upgradeAction.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 1rem; border-radius: 8px; text-align: center; color: var(--color-success); font-weight: 700; font-size: 0.88rem;">
            🎉 Você possui acesso vitalício e ilimitado a todos os recursos do Finance Manager. Obrigado pelo apoio!
          </div>
        `;
      } else {
        upgradeAction.innerHTML = `
          <button type="button" class="btn-upgrade-action" id="btn-profile-upgrade" style="width: 100%; border: none; padding: 0.75rem; font-size: 0.9rem; border-radius: var(--radius-md); font-weight: 700; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: white; cursor: pointer; transition: var(--transition-fast);">
            Obter Licença Premium 🚀
          </button>
        `;
        const profileUpgradeBtn = document.getElementById("btn-profile-upgrade");
        if (profileUpgradeBtn) {
          profileUpgradeBtn.addEventListener("click", () => {
            showUpgradeModal("Obtenha a licença Premium e libere todos os recursos sem limites!");
          });
        }
      }
    }
  }
  window.updateProfileTab = updateProfileTab;

  function updateProfilePhotoUI() {
    const headerAvatar = document.getElementById("user-avatar-svg");
    const tabAvatar = document.getElementById("profile-photo-container");

    const imgHTML = state.profilePhoto 
      ? `<img src="${state.profilePhoto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
      : ICONS.user;

    if (headerAvatar) {
      headerAvatar.innerHTML = imgHTML;
    }
    if (tabAvatar) {
      tabAvatar.innerHTML = state.profilePhoto 
        ? `<img src="${state.profilePhoto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
        : `<div style="font-size: 1.85rem; opacity: 0.5;">👤</div>`;
    }
  }
  window.updateProfilePhotoUI = updateProfilePhotoUI;

  function setupProfilePhoto() {
    const inputPhoto = document.getElementById("input-profile-photo");
    const btnChangePhoto = document.getElementById("btn-change-photo");
    const photoContainer = document.getElementById("profile-photo-container");

    if (btnChangePhoto && inputPhoto) {
      btnChangePhoto.addEventListener("click", () => inputPhoto.click());
    }
    if (photoContainer && inputPhoto) {
      photoContainer.addEventListener("click", () => inputPhoto.click());
    }

    if (inputPhoto) {
      inputPhoto.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 512 * 1024) { // 500KB limit
          window.customAlert("A foto precisa ser menor que 500KB para sincronização na nuvem.");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          state.profilePhoto = reader.result;
          saveState();
          updateProfilePhotoUI();
          window.customAlert("Foto de perfil atualizada com sucesso!", "Perfil");
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function handleTabSwitch(targetTab) {
    if (targetTab === "perfil") {
      updateProfileTab();
    }

    // Impedir acesso à aba administrador por não-admins
    if (targetTab === "administrador" && !(window.isAdminUser && window.isAdminUser())) {
      handleTabSwitch("dashboard");
      return;
    }

    const targetView = document.getElementById("view-" + targetTab);
    if (!targetView) return;

    // 1. Sincronizar classes de ativo na barra superior
    navItems.forEach(item => {
      if (item.getAttribute("data-tab") === targetTab) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // 2. Sincronizar classes de ativo na barra inferior
    bottomNavItems.forEach(item => {
      if (item.getAttribute("data-tab") === targetTab) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // 3. Esconder todas as views
    allTabViews.forEach(view => {
      view.classList.remove("active");
      view.style.display = "none";
    });

    // 4. Mostrar a view correspondente com animação
    targetView.style.display = "block";
    targetView.offsetHeight;
    targetView.classList.add("active");

    // 5. Se voltou para o Dashboard, atualizar os dados
    if (targetTab === "dashboard") {
      updateAllDashboard();
    }
  }

  // Expor globalmente para controle de redirecionamento de abas
  window.handleTabSwitch = handleTabSwitch;

  navItems.forEach(navLink => {
    navLink.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = navLink.getAttribute("data-tab");

      if (targetTab === "relatorios" && state.tier !== "premium") {
        showUpgradeModal("A aba de Relatórios & BI está bloqueada no Plano Gratuito! Faça o upgrade para o Plano Premium para liberar relatórios consolidados e BI.");
        return;
      }

      if (targetTab === "administrador" && !(window.isAdminUser && window.isAdminUser())) {
        return;
      }

      handleTabSwitch(targetTab);
    });
  });

  bottomNavItems.forEach(navLink => {
    navLink.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = navLink.getAttribute("data-tab");

      if (targetTab === "relatorios" && state.tier !== "premium") {
        showUpgradeModal("A aba de Relatórios & BI está bloqueada no Plano Gratuito! Faça o upgrade para o Plano Premium para liberar relatórios consolidados e BI.");
        return;
      }

      if (targetTab === "administrador" && !(window.isAdminUser && window.isAdminUser())) {
        return;
      }

      handleTabSwitch(targetTab);
    });
  });

  // ==========================================================================
  // 11. MODAIS - CONTROLE DE ABERTURA E FECHAMENTO
  // ==========================================================================
  
  // Elementos do Modal de Despesa
  const modalDespesa = document.getElementById("modal-despesa-dialog");
  const btnNovaDespesa = document.getElementById("btn-nova-despesa");
  const closeDespesa = document.getElementById("close-modal-despesa");
  const cancelDespesa = document.getElementById("btn-cancelar-despesa");

  // Elementos do Modal de OS
  const modalOS = document.getElementById("modal-os-dialog");
  const btnNovaOS = document.getElementById("btn-nova-os");
  const closeOS = document.getElementById("close-modal-os");
  const cancelOS = document.getElementById("btn-cancelar-os");

  // Elementos do Modal de Cartão
  const modalCartao = document.getElementById("modal-cartao-dialog");
  const btnNovoCartao = document.getElementById("btn-novo-cartao");
  const closeCartao = document.getElementById("close-modal-cartao");
  const cancelCartao = document.getElementById("btn-cancelar-cartao");

  // Elementos do Modal de Receita
  const modalReceita = document.getElementById("modal-receita-dialog");
  const btnNovaReceita = document.getElementById("btn-nova-receita");
  const closeReceita = document.getElementById("close-modal-receita");
  const cancelReceita = document.getElementById("btn-cancelar-receita");

  // Elementos do Modal de Conta
  const modalConta = document.getElementById("modal-conta-dialog");
  const btnNovaConta = document.getElementById("btn-nova-conta");
  const closeConta = document.getElementById("close-modal-conta");
  const cancelConta = document.getElementById("btn-cancelar-conta");

  // Elementos do Modal de Recorrente
  const modalRecorrente = document.getElementById("modal-recorrente-dialog");
  const btnNovoRecorrente = document.getElementById("btn-novo-recorrente");
  const closeRecorrente = document.getElementById("close-modal-recorrente");
  const cancelRecorrente = document.getElementById("btn-cancelar-recorrente");

  // Elementos do Modal de Metas
  const modalMeta = document.getElementById("modal-meta-dialog");
  const btnNovoObjetivo = document.getElementById("btn-nova-meta");
  const closeMeta = document.getElementById("close-modal-meta");
  const cancelMeta = document.getElementById("btn-cancelar-meta");

  // Mapeamento Helper para abrir e fechar modais dialog
  function setupModal(trigger, modal, closeBtn, cancelBtn, formId) {
    if (!trigger || !modal) return;
    
    trigger.addEventListener("click", () => {
      // Validar limites do Plano Gratuito
      if (state.tier !== "premium") {
        if (formId === "form-novo-cartao" && state.cards.length >= 1) {
          showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar apenas 1 cartão de crédito.");
          return;
        }
        if (formId === "form-nova-conta" && state.accounts.length >= 1) {
          showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar apenas 1 conta bancária.");
          return;
        }
        if (formId === "form-nova-meta" && state.goals.length >= 2) {
          showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar apenas 2 metas/objetivos.");
          return;
        }
        if ((formId === "form-nova-despesa" || formId === "form-nova-receita" || formId === "form-nova-os") && getCurrentMonthTransactionCount() >= 10) {
          showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar até 10 lançamentos (despesas/receitas/OS) por mês.");
          return;
        }
      }

      if (formId === "form-nova-conta") {
        const idField = document.getElementById("acc-id");
        if (idField) idField.value = "";
        const titleField = document.getElementById("modal-conta-title");
        if (titleField) titleField.innerText = "Vincular Nova Conta";
      }

      // Definir data de hoje por padrão nos inputs correspondentes
      const dateInput = modal.querySelector("input[type='date']");
      if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        dateInput.value = `${yyyy}-${mm}-${dd}`;
      }
      modal.showModal();
    });

    const closeHandler = () => {
      const form = document.getElementById(formId);
      if (form) form.reset();
      modal.close();
    };

    if (closeBtn) closeBtn.addEventListener("click", closeHandler);
    if (cancelBtn) cancelBtn.addEventListener("click", closeHandler);
  }

  setupModal(btnNovaDespesa, modalDespesa, closeDespesa, cancelDespesa, "form-nova-despesa");
  setupModal(btnNovaOS, modalOS, closeOS, cancelOS, "form-nova-os");
  setupModal(btnNovoCartao, modalCartao, closeCartao, cancelCartao, "form-novo-cartao");
  setupModal(btnNovaReceita, modalReceita, closeReceita, cancelReceita, "form-nova-receita");
  setupModal(btnNovaConta, modalConta, closeConta, cancelConta, "form-nova-conta");
  setupModal(btnNovoRecorrente, modalRecorrente, closeRecorrente, cancelRecorrente, "form-novo-recorrente");
  setupModal(btnNovoObjetivo, modalMeta, closeMeta, cancelMeta, "form-nova-meta");

  // Lógica de cálculo do simulador de metas
  function calculateSimulation() {
    const saved = parseFloat(document.getElementById("goal-saved").value) || 0;
    const target = parseFloat(document.getElementById("goal-target").value) || 0;
    const remaining = Math.max(target - saved, 0);

    const mode = document.querySelector('input[name="sim-mode"]:checked')?.value || "time";

    const groupTime = document.getElementById("sim-group-time");
    const groupValue = document.getElementById("sim-group-value");

    if (mode === "time") {
      if (groupTime) groupTime.style.display = "grid";
      if (groupValue) groupValue.style.display = "none";

      const months = parseInt(document.getElementById("sim-months").value) || 0;
      const calcMonthlyInput = document.getElementById("sim-calc-monthly");
      if (calcMonthlyInput) {
        if (remaining <= 0) {
          calcMonthlyInput.value = "Meta alcançada! 🎉";
        } else {
          const monthly = months > 0 ? (remaining / months) : 0;
          calcMonthlyInput.value = formatCurrency(monthly);
        }
      }
    } else {
      if (groupTime) groupTime.style.display = "none";
      if (groupValue) groupValue.style.display = "grid";

      const monthlyVal = parseFloat(document.getElementById("sim-monthly-val").value) || 0;
      const calcMonthsInput = document.getElementById("sim-calc-months");
      if (calcMonthsInput) {
        if (remaining <= 0) {
          calcMonthsInput.value = "Meta alcançada! 🎉";
        } else {
          const months = monthlyVal > 0 ? Math.ceil(remaining / monthlyVal) : 0;
          if (months === 0) {
            calcMonthsInput.value = "0 meses";
          } else {
            const y = Math.floor(months / 12);
            const m = months % 12;
            const yearsText = months > 12 ? ` (${y}a ${m}m)` : "";
            calcMonthsInput.value = `${months} meses${yearsText}`;
          }
        }
      }
    }
  }

  // Lógica de sugestão de emojis no modal de metas
  const emojiButtons = document.querySelectorAll(".emoji-sug-btn");
  const iconInput = document.getElementById("goal-icon");
  
  if (iconInput) {
    emojiButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        iconInput.value = btn.innerText;
        emojiButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Ouvir mudanças manuais no input para sincronizar a classe active
    iconInput.addEventListener("input", () => {
      const val = iconInput.value.trim();
      emojiButtons.forEach(btn => {
        if (btn.innerText === val) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    });
  }

  // Vincular eventos do simulador para calcular em tempo real
  const simModeRadios = document.querySelectorAll('input[name="sim-mode"]');
  const simMonthsInput = document.getElementById("sim-months");
  const simMonthlyInput = document.getElementById("sim-monthly-val");
  const goalSavedInput = document.getElementById("goal-saved");
  const goalTargetInput = document.getElementById("goal-target");

  const simInputs = [simMonthsInput, simMonthlyInput, goalSavedInput, goalTargetInput];
  simInputs.forEach(input => {
    if (input) input.addEventListener("input", calculateSimulation);
  });

  simModeRadios.forEach(radio => {
    radio.addEventListener("change", calculateSimulation);
  });

  if (btnNovoObjetivo) {
    btnNovoObjetivo.addEventListener("click", () => {
      document.getElementById("modal-meta-title").innerText = "Novo Objetivo / Meta";
      document.getElementById("goal-id").value = "";
      if (iconInput) {
        iconInput.value = "🎯";
        emojiButtons.forEach(btn => {
          if (btn.innerText === "🎯") btn.classList.add("active");
          else btn.classList.remove("active");
        });
      }

      // Resetar simulador
      const radioTime = document.querySelector('input[name="sim-mode"][value="time"]');
      if (radioTime) radioTime.checked = true;
      
      const sMonths = document.getElementById("sim-months");
      const sMonthly = document.getElementById("sim-monthly-val");
      const calcMonthly = document.getElementById("sim-calc-monthly");
      const calcMonths = document.getElementById("sim-calc-months");
      
      if (sMonths) sMonths.value = "";
      if (sMonthly) sMonthly.value = "";
      if (calcMonthly) calcMonthly.value = "R$ 0,00";
      if (calcMonths) calcMonths.value = "0 meses";
      
      calculateSimulation();
    });
  }

  if (btnNovaDespesa) {
    btnNovaDespesa.addEventListener("click", () => {
      document.getElementById("modal-despesa-title").innerText = "Nova Despesa";
      document.getElementById("exp-id").value = "";
      const payDateGroup = document.getElementById("group-exp-pay-date");
      const payDateInput = document.getElementById("exp-pay-date");
      if (payDateGroup) payDateGroup.style.display = "none";
      if (payDateInput) payDateInput.value = "";
    });
  }

  // Monitorar status de pagamento para mostrar/esconder campo de data de pagamento
  const expStatusSelect = document.getElementById("exp-status");
  const expPayDateGroup = document.getElementById("group-exp-pay-date");
  const expPayDateInput = document.getElementById("exp-pay-date");
  if (expStatusSelect && expPayDateGroup) {
    expStatusSelect.addEventListener("change", () => {
      if (expStatusSelect.value === "Pagas") {
        expPayDateGroup.style.display = "flex";
        if (!expPayDateInput.value) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          const dd = String(today.getDate()).padStart(2, "0");
          expPayDateInput.value = `${yyyy}-${mm}-${dd}`;
        }
      } else {
        expPayDateGroup.style.display = "none";
      }
    });
  }

  if (btnNovaOS) {
    btnNovaOS.addEventListener("click", () => {
      document.getElementById("modal-os-title").innerText = "Nova Ordem de Serviço (OS)";
      document.getElementById("os-id").value = "";
    });
  }

  if (btnNovoRecorrente) {
    btnNovoRecorrente.addEventListener("click", () => {
      document.getElementById("modal-recorrente-title").innerText = "Nova Despesa Recorrente";
      document.getElementById("rec-id").value = "";
      document.getElementById("rec-end-date").value = "";
      document.getElementById("rec-duration-months").value = "";
    });
  }

  const recDateInput = document.getElementById("rec-date");
  const recEndDateInput = document.getElementById("rec-end-date");
  const recDurationSelect = document.getElementById("rec-duration-months");
  function updateRecurringEndDateFromDuration() {
    if (!recDateInput || !recEndDateInput || !recDurationSelect) return;
    const duration = parseInt(recDurationSelect.value);
    if (!duration) return;
    const start = new Date(recDateInput.value + "T00:00:00");
    if (Number.isNaN(start.getTime())) return;
    const end = addMonthsKeepingDay(start, duration - 1);
    const yyyy = end.getFullYear();
    const mm = String(end.getMonth() + 1).padStart(2, "0");
    const dd = String(end.getDate()).padStart(2, "0");
    recEndDateInput.value = `${yyyy}-${mm}-${dd}`;
  }
  if (recDurationSelect) {
    recDurationSelect.addEventListener("change", updateRecurringEndDateFromDuration);
  }
  if (recDateInput) {
    recDateInput.addEventListener("change", updateRecurringEndDateFromDuration);
  }
  if (recEndDateInput) {
    recEndDateInput.addEventListener("input", () => {
      if (recDurationSelect) recDurationSelect.value = "";
    });
  }

  if (btnNovaReceita) {
    btnNovaReceita.addEventListener("click", () => {
      document.getElementById("modal-receita-title").innerText = "Nova Receita";
      document.getElementById("rev-id").value = "";
    });
  }

  // ==========================================================================
  // 11. SUBMISSÕES DE FORMULÁRIOS (CADASTRAR ITENS)
  // ==========================================================================
  
  // 1. Cadastrar/Editar Despesa
  const formDespesa = document.getElementById("form-nova-despesa");
  if (formDespesa) {
    formDespesa.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const id = document.getElementById("exp-id").value;
      if (!id && state.tier !== "premium" && getCurrentMonthTransactionCount() >= 10) {
        showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar até 10 lançamentos (despesas/receitas/OS) por mês.");
        return;
      }
      const description = document.getElementById("exp-desc").value;
      const value = parseFloat(document.getElementById("exp-val").value);
      const date = document.getElementById("exp-date").value;
      const cardId = document.getElementById("exp-card").value;
      const category = document.getElementById("exp-category").value;
      const status = document.getElementById("exp-status").value;
      const paymentDate = status === "Pagas" ? document.getElementById("exp-pay-date").value : "";

      if (id) {
        const exp = state.expenses.find(e => e.id === id);
        if (exp) {
          exp.description = description;
          exp.value = value;
          exp.date = date;
          exp.cardId = cardId;
          exp.category = category;
          exp.status = status;
          exp.paymentDate = paymentDate;
        }
      } else {
        const newExpense = {
          id: "exp-" + Date.now(),
          description,
          value,
          date,
          cardId,
          category,
          status,
          paymentDate
        };
        state.expenses.push(newExpense);
      }
      saveState();
      updateAllDashboard();
      
      formDespesa.reset();
      modalDespesa.close();
    });
  }

  // 2. Cadastrar/Editar Ordem de Serviço (OS)
  const formOS = document.getElementById("form-nova-os");
  if (formOS) {
    formOS.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("os-id").value;
      if (!id && state.tier !== "premium" && getCurrentMonthTransactionCount() >= 10) {
        showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar até 10 lançamentos (despesas/receitas/OS) por mês.");
        return;
      }
      const customer = document.getElementById("os-customer").value;
      const service = document.getElementById("os-service").value;
      const value = parseFloat(document.getElementById("os-val").value);
      const date = document.getElementById("os-date").value;
      const status = document.getElementById("os-status").value;

      if (id) {
        const os = state.orders.find(item => item.id === id);
        if (os) {
          os.customer = customer;
          os.service = service;
          os.value = value;
          os.date = date;
          os.status = status;
        }
      } else {
        const newOS = {
          id: "os-" + Date.now(),
          customer,
          service,
          value,
          date,
          status
        };
        state.orders.push(newOS);
      }
      saveState();
      updateAllDashboard();

      formOS.reset();
      modalOS.close();
    });
  }

  // 3. Cadastrar Cartão de Crédito
  const formCartao = document.getElementById("form-novo-cartao");
  if (formCartao) {
    formCartao.addEventListener("submit", (e) => {
      e.preventDefault();

      if (state.tier !== "premium" && state.cards.length >= 1) {
        showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar apenas 1 cartão de crédito.");
        return;
      }

      const name = document.getElementById("card-name").value;
      const brand = document.getElementById("card-brand").value;
      const digits = document.getElementById("card-digits").value;
      const limit = parseFloat(document.getElementById("card-limit").value);
      const color = document.getElementById("card-color").value;
      const closingDay = parseInt(document.getElementById("card-closing").value);
      const dueDay = parseInt(document.getElementById("card-due").value);

      const newCard = {
        id: "card-" + Date.now(),
        name,
        type: "credit",
        brand,
        digits,
        limit,
        closingDay,
        dueDay,
        color
      };

      state.cards.push(newCard);
      // Focar no novo cartão criado automaticamente
      state.selectedCardId = newCard.id;
      
      saveState();
      updateAllDashboard();

      formCartao.reset();
      modalCartao.close();
    });
  }

  // 4. Cadastrar/Editar Receita
  const formReceita = document.getElementById("form-nova-receita");
  if (formReceita) {
    formReceita.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("rev-id").value;
      if (!id && state.tier !== "premium" && getCurrentMonthTransactionCount() >= 10) {
        showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar até 10 lançamentos (despesas/receitas/OS) por mês.");
        return;
      }
      const description = document.getElementById("rev-desc").value;
      const value = parseFloat(document.getElementById("rev-val").value);
      const date = document.getElementById("rev-date").value;
      const category = document.getElementById("rev-category").value;

      if (id) {
        const rev = state.revenues.find(item => item.id === id);
        if (rev) {
          rev.description = description;
          rev.value = value;
          rev.date = date;
          rev.category = category;
        }
      } else {
        const newRevenue = {
          id: "rev-" + Date.now(),
          description,
          value,
          date,
          category
        };
        state.revenues.push(newRevenue);
      }
      saveState();
      updateAllDashboard();

      formReceita.reset();
      modalReceita.close();
    });
  }

  // 5. Cadastrar/Editar Conta Bancária
  const formConta = document.getElementById("form-nova-conta");
  if (formConta) {
    formConta.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("acc-id").value;
      if (!id && state.tier !== "premium" && state.accounts.length >= 1) {
        showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar apenas 1 conta bancária.");
        return;
      }

      const name = document.getElementById("acc-name").value;
      const type = document.getElementById("acc-type").value;
      const logo = document.getElementById("acc-logo").value;
      const balance = parseFloat(document.getElementById("acc-balance").value);
      const agency = document.getElementById("acc-agency").value;
      const accountNumber = document.getElementById("acc-number").value;
      const color = document.getElementById("acc-color").value;

      // Mapear sombras baseadas na cor/gradiente para ficar com efeito premium
      let shadow = "rgba(0, 0, 0, 0.15)";
      if (color.includes("#830ad1")) shadow = "rgba(131, 10, 209, 0.2)";
      else if (color.includes("#ec8b16")) shadow = "rgba(236, 139, 22, 0.25)";
      else if (color.includes("#0d9488")) shadow = "rgba(13, 148, 136, 0.2)";
      else if (color.includes("#3b82f6")) shadow = "rgba(59, 130, 246, 0.2)";
      else if (color.includes("#334155")) shadow = "rgba(51, 65, 85, 0.2)";
      else if (color.includes("#f43f5e")) shadow = "rgba(244, 63, 94, 0.2)";

      if (id) {
        const acc = state.accounts.find(a => a.id === id);
        if (acc) {
          acc.name = name;
          acc.type = type;
          acc.logo = logo;
          acc.balance = balance;
          acc.agency = agency;
          acc.accountNumber = accountNumber;
          acc.color = color;
          acc.shadow = shadow;
        }
      } else {
        const newAccount = {
          id: "acc-" + Date.now(),
          name,
          type,
          logo,
          balance,
          agency,
          accountNumber,
          color,
          shadow
        };
        state.accounts.push(newAccount);
      }

      saveState();
      updateAllDashboard();

      formConta.reset();
      modalConta.close();
    });
  }

  // 6. Cadastrar/Editar Despesa Recorrente
  const formRecorrente = document.getElementById("form-novo-recorrente");
  if (formRecorrente) {
    formRecorrente.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("rec-id").value;
      const description = document.getElementById("rec-desc").value;
      const value = parseFloat(document.getElementById("rec-val").value);
      const date = document.getElementById("rec-date").value;
      const endDate = document.getElementById("rec-end-date").value;
      const cardId = document.getElementById("rec-card").value;
      const frequency = document.getElementById("rec-frequency").value;
      const category = document.getElementById("rec-category").value;

      if (endDate && endDate < date) {
        await window.customAlert("A data de término precisa ser igual ou posterior ao primeiro vencimento.");
        return;
      }

      if (id) {
        const rec = state.recurring.find(r => r.id === id);
        if (rec) {
          rec.description = description;
          rec.value = value;
          rec.date = date;
          rec.endDate = endDate;
          rec.cardId = cardId;
          rec.frequency = frequency;
          rec.category = category;
        }
      } else {
        const newRecurring = {
          id: "rec-" + Date.now(),
          description,
          value,
          date,
          endDate,
          cardId,
          frequency,
          category
        };
        state.recurring.push(newRecurring);
      }
      saveState();
      updateAllDashboard();

      formRecorrente.reset();
      modalRecorrente.close();
    });
  }

  // 7. Cadastrar/Editar Objetivo/Meta
  const formMeta = document.getElementById("form-nova-meta");
  if (formMeta) {
    formMeta.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("goal-id").value;
      if (!id && state.tier !== "premium" && state.goals.length >= 2) {
        showUpgradeModal("Limite do Plano Gratuito atingido! No plano gratuito você pode cadastrar apenas 2 metas/objetivos.");
        return;
      }

      const icon = document.getElementById("goal-icon").value || "🎯";
      const name = document.getElementById("goal-name").value;
      const saved = parseFloat(document.getElementById("goal-saved").value);
      const target = parseFloat(document.getElementById("goal-target").value);
      const notes = document.getElementById("goal-notes").value;

      const simMode = document.querySelector('input[name="sim-mode"]:checked')?.value || "time";
      const simMonths = parseInt(document.getElementById("sim-months").value) || 0;
      const simMonthlyVal = parseFloat(document.getElementById("sim-monthly-val").value) || 0;

      if (id) {
        const goal = state.goals.find(g => g.id === id);
        if (goal) {
          goal.icon = icon;
          goal.name = name;
          goal.saved = saved;
          goal.target = target;
          goal.notes = notes;
          goal.simMode = simMode;
          goal.simMonths = simMonths;
          goal.simMonthlyVal = simMonthlyVal;
        }
      } else {
        const newGoal = {
          id: "goal-" + Date.now(),
          icon,
          name,
          saved,
          target,
          notes,
          simMode,
          simMonths,
          simMonthlyVal
        };
        state.goals.push(newGoal);
      }

      saveState();
      updateAllDashboard();

      formMeta.reset();
      modalMeta.close();
    });
  }

  // ==========================================================================
  // 11b. ADMINISTRADOR - AÇÕES E CONFIGURAÇÕES
  // ==========================================================================
  // 1. Salvar Perfil
  const formAdminProfile = document.getElementById("form-admin-profile");
  if (formAdminProfile) {
    formAdminProfile.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const newName = document.getElementById("admin-user-name").value.trim();
      const newTagline = document.getElementById("admin-user-tagline").value.trim();
      
      if (newName) {
        state.userName = newName;
      }
      if (newTagline) {
        state.tagline = newTagline;
      }
      
      saveState();
      updateProfileUI();
      await window.customAlert("Configurações do perfil salvas com sucesso!");
    });
  }

  // 1b. Alternar Plano Premium (Admin)
  const btnAdminToggleTier = document.getElementById("btn-admin-toggle-tier");
  if (btnAdminToggleTier) {
    btnAdminToggleTier.addEventListener("click", async () => {
      const nextTier = state.tier === "premium" ? "free" : "premium";
      const confirmMsg = nextTier === "premium"
        ? "Deseja ativar o Plano Premium para esta conta?"
        : "Deseja reverter esta conta para o Plano Gratuito?";
        
      if (await window.customConfirm(confirmMsg)) {
        state.tier = nextTier;
        await saveState();
        updateTierUI();
        await window.customAlert(`Plano atualizado com sucesso para ${nextTier === "premium" ? "Premium" : "Gratuito"}!`);
      }
    });
  }

  // 1c. Gerenciar Outro Usuário (Admin)
  const formAdminManageUser = document.getElementById("form-admin-manage-user");
  if (formAdminManageUser) {
    formAdminManageUser.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("manage-user-email").value.trim();
      const tier = document.getElementById("manage-user-tier").value;
      const adminSecret = document.getElementById("manage-admin-secret").value;
      const btnSubmit = document.getElementById("btn-submit-manage-user");

      if (!email || !tier || !adminSecret) {
        await window.customAlert("Todos os campos do formulário são obrigatórios.");
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = "Processando alteração...";

      try {
        const response = await fetch("/api/admin/set-tier", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, tier, adminSecret })
        });

        const data = await response.json();

        if (response.ok) {
          await window.customAlert(data.message || `Usuário ${email} atualizado com sucesso!`);
          formAdminManageUser.reset();
        } else {
          await window.customAlert(`Erro: ${data.error || "Não foi possível concluir a ação."}`);
        }
      } catch (err) {
        console.error("Erro ao gerenciar usuário:", err);
        await window.customAlert("Erro de conexão ao tentar atualizar o plano do usuário.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Atualizar Plano do Usuário 🚀";
      }
    });
  }

  // 2. Exportar dados em JSON
  const btnExportData = document.getElementById("btn-export-data");
  if (btnExportData) {
    btnExportData.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `financas_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // 3. Restaurar banco de dados
  const btnResetDb = document.getElementById("btn-reset-db");
  if (btnResetDb) {
    btnResetDb.addEventListener("click", async () => {
      if (await window.customConfirm("Tem certeza que deseja restaurar o banco de dados? Todos os seus dados cadastrados serão perdidos!")) {
        if (isCloudEnabled && currentUser) {
          try {
            const docRef = db.collection("financial_data").doc(currentUser.uid);
            await docRef.delete();
          } catch (err) {
            console.error("Erro ao limpar dados na nuvem:", err);
          }
        }
        clearCurrentLocalData();
        location.reload();
      }
    });
  }

  const dropdownResetBtn = document.getElementById("dropdown-reset-btn");
  const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");

  if (dropdownResetBtn) {
    dropdownResetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (await window.customConfirm("Tem certeza que deseja restaurar a ferramenta? Todos os seus dados cadastrados (offline e online) serão apagados permanentemente!")) {
        if (isCloudEnabled && currentUser) {
          try {
            const docRef = db.collection("financial_data").doc(currentUser.uid);
            await docRef.delete();
          } catch (err) {
            console.error("Erro ao limpar dados na nuvem:", err);
          }
        }
        clearCurrentLocalData();
        location.reload();
      }
    });
  }


  // ==========================================================================
  // 11b. MONETIZAÇÃO SAAS (FREE / PREMIUM & STRIPE INTEGRATION)
  // ==========================================================================
  
  function getCurrentMonthTransactionCount() {
    const month = state.selectedMonth;
    const year = state.selectedYear;
    
    // Contar despesas deste mês/ano
    const expenseCount = state.expenses.filter(e => {
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    // Contar receitas deste mês/ano
    const revenueCount = state.revenues.filter(r => {
      const d = new Date(r.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    // Contar OS deste mês/ano
    const osCount = state.orders.filter(o => {
      const d = new Date(o.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    return expenseCount + revenueCount + osCount;
  }

  function updateTierUI() {
    const relatoriosNavItem = document.querySelector('.main-nav .nav-item[data-tab="relatorios"]');
    if (relatoriosNavItem) {
      const oldLock = relatoriosNavItem.querySelector(".lock-indicator");
      if (oldLock) oldLock.remove();
      
      if (state.tier !== "premium") {
        const lock = document.createElement("span");
        lock.className = "lock-indicator";
        lock.style.marginLeft = "4px";
        lock.style.fontSize = "0.75rem";
        lock.textContent = "🔒";
        relatoriosNavItem.appendChild(lock);
      }
    }

    const userNameSpan = document.querySelector(".user-profile-badge .user-name");
    if (userNameSpan) {
      const oldCrown = userNameSpan.querySelector(".premium-crown");
      if (oldCrown) oldCrown.remove();
      
      if (state.tier === "premium") {
        const crown = document.createElement("span");
        crown.className = "premium-crown";
        crown.style.marginLeft = "4px";
        crown.textContent = "👑";
        crown.title = "Usuário Premium";
        userNameSpan.appendChild(crown);
      }
    }

    updateAdminSubscriptionCard();
    updateProfileTab();
  }

  function updateAdminSubscriptionCard() {
    const adminTierStatus = document.getElementById("admin-tier-status");
    const adminUserUid = document.getElementById("admin-user-uid");
    const btnAdminToggleTier = document.getElementById("btn-admin-toggle-tier");

    if (adminTierStatus) {
      adminTierStatus.innerHTML = state.tier === "premium" 
        ? '<span style="color: var(--color-success); font-weight: 800;">👑 PREMIUM (Ativo)</span>' 
        : '<span style="color: var(--text-muted);">🔒 GRATUITO</span>';
    }
    if (adminUserUid) {
      adminUserUid.textContent = currentUser ? currentUser.uid : "offline (Modo Visitante)";
    }
    if (btnAdminToggleTier) {
      btnAdminToggleTier.innerHTML = state.tier === "premium" 
        ? "🔒 Reverter para Plano Gratuito" 
        : "👑 Ativar Plano Premium (Admin)";
      btnAdminToggleTier.style.background = state.tier === "premium"
        ? "linear-gradient(135deg, #475569 0%, #64748b 100%)"
        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    }
  }

  const modalUpgrade = document.getElementById("modal-upgrade-premium");
  const closeUpgrade = document.getElementById("close-modal-upgrade");
  const btnSubscribeNow = document.getElementById("btn-subscribe-now");

  if (modalUpgrade) {
    if (closeUpgrade) {
      closeUpgrade.addEventListener("click", () => {
        modalUpgrade.close();
      });
    }
    
    // Fechar ao clicar fora (no backdrop)
    modalUpgrade.addEventListener("click", (e) => {
      const rect = modalUpgrade.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        modalUpgrade.close();
      }
    });
  }

  function showUpgradeModal(reason) {
    if (modalUpgrade) {
      const upgradeSub = modalUpgrade.querySelector(".upgrade-hero p");
      if (upgradeSub && reason) {
        upgradeSub.textContent = reason;
      }
      modalUpgrade.showModal();
    }
  }

  if (btnSubscribeNow) {
    btnSubscribeNow.addEventListener("click", async () => {
      // Se for app nativo, bloquear compra local e instruir o usuário
      if (window.isNativeApp && window.isNativeApp()) {
        await window.customAlert("As assinaturas Premium só podem ser adquiridas pelo site oficial do Finance Manager. Seus dados e status premium serão sincronizados automaticamente no aplicativo nativo após a compra!", "Compra indisponível no App Nativo");
        return;
      }

      if (!currentUser) {
        await window.customAlert("Para assinar o plano Premium e sincronizar seus dados, você precisa criar uma conta gratuita (ou fazer login) primeiro.");
        if (modalUpgrade) modalUpgrade.close();
        showAuthOverlay();
        setAuthMode("signup");
        return;
      }

      btnSubscribeNow.disabled = true;
      btnSubscribeNow.textContent = "Carregando checkout...";

      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId: currentUser.uid })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            await window.customAlert("Erro ao gerar sessão de pagamento. Tente novamente.");
          }
        } else {
          await window.customAlert("Erro de comunicação com o servidor de pagamento.");
        }
      } catch (err) {
        console.error("Erro no checkout:", err);
        await window.customAlert("Erro ao conectar com o serviço de assinaturas.");
      } finally {
        btnSubscribeNow.disabled = false;
        btnSubscribeNow.textContent = "Assinar Premium Agora 🚀";
      }
    });
  }

  // ==========================================================================
  // 12. BOOTSTRAP DO SISTEMA
  // ==========================================================================
  injectSVGIcons();
  updateProfilePhotoUI();
  setupProfilePhoto();
  initFirebase().then((cloudEnabled) => {
    if (!cloudEnabled) {
      loadState();
    }
  });

  // Configurar Filtros e Botões da Aba de Relatórios & BI
  const selectReportYear = document.getElementById("select-report-year");
  if (selectReportYear) {
    selectReportYear.addEventListener("change", () => {
      renderAnnualReport();
    });
  }

  const btnExportCSV = document.getElementById("btn-export-csv");
  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", () => {
      exportReportToCSV();
    });
  }

  const btnPrintReport = document.getElementById("btn-print-report");
  if (btnPrintReport) {
    btnPrintReport.addEventListener("click", () => {
      window.print();
    });
  }

  // Escutar redimensionamento da janela para redesenhar o gráfico responsivamente
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderSVGChart();
      renderAnnualReport();
    }, 150);
  });
});
