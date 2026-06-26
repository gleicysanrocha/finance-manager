// ===========================================================================
// CONFIGURAÇÃO DO FIREBASE E NUVEM
// ===========================================================================

// Variáveis Globais de Nuvem e Autenticação
var auth = null;
var db = null;
var isCloudEnabled = false;
var currentUser = null;
var isCompletingSignup = false;

const CLOUD_ICONS = {
  offline: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.333-7.258 3.749 3.749 0 0 0-.258-2.628A5.25 5.25 0 0 0 8.877 6.512a5.25 5.25 0 0 0-3.32 4.1A4.5 4.5 0 0 0 2.25 15Z" /></svg>`,
  syncing: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;" class="syncing"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`,
  online: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>`
};

function updateSyncIndicator(status) {
  const btn = document.getElementById("sync-status-btn");
  if (!btn) return;
  
  btn.className = "control-btn sync-indicator " + status;
  btn.innerHTML = CLOUD_ICONS[status] || CLOUD_ICONS.offline;
  
  if (status === "online") {
    btn.title = "Sincronizado na Nuvem (Clique para forçar sync)";
  } else if (status === "syncing") {
    btn.title = "Sincronizando com a Nuvem...";
  } else if (status === "error") {
    btn.title = "Erro na sincronização (Clique para tentar novamente)";
  } else {
    btn.title = "Modo Local (Offline) - Clique para conectar";
  }
}

async function getCloudConfig() {
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
    return window.FIREBASE_CONFIG;
  }
  
  try {
    const configScript = await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "js/config.js";
      script.onload = () => resolve(window.FIREBASE_CONFIG || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
    if (configScript && configScript.apiKey) {
      return configScript;
    }
  } catch (e) {
    console.log("Sem config.js local");
  }

  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data.apiKey) {
        return data;
      }
    }
  } catch (e) {
    console.warn("API de configuração não disponível. Rodando no modo local.");
  }
  return null;
}

async function initFirebase() {
  const config = await getCloudConfig();
  if (!config) {
    console.log("Firebase não configurado. Continuando no modo local (offline).");
    updateSyncIndicator("offline");
    showAuthOverlay();
    return false;
  }
  
  try {
    firebase.initializeApp(config);
    auth = firebase.auth();
    db = firebase.firestore();
    isCloudEnabled = true;
    console.log("Firebase inicializado com sucesso!");
    
    auth.onAuthStateChanged(async (user) => {
      const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");
      if (user) {
        const isNewUser = !currentUser || currentUser.uid !== user.uid;
        currentUser = user;
        updateSyncIndicator("online");
        updateCloudUI(true, currentUser.email);
        if (dropdownLogoutBtn) {
          dropdownLogoutBtn.innerHTML = `<span>🚪</span> Sair da Conta`;
        }
        if (isNewUser && !isCompletingSignup) {
          await loadState();
        }
        if (!isCompletingSignup) {
          hideAuthOverlay();
        }
      } else {
        currentUser = null;
        updateSyncIndicator("offline");
        updateCloudUI(false, "");
        if (dropdownLogoutBtn) {
          dropdownLogoutBtn.innerHTML = `<span>🔑</span> Entrar / Conectar`;
        }
        await loadState();
        showAuthOverlay();
      }
      
      if (window.updateAdminUI) {
        window.updateAdminUI();
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erro ao inicializar Firebase:", err);
    updateSyncIndicator("error");
    showAuthOverlay();
    return false;
  }
}
window.initFirebase = initFirebase;

