// ===========================================================================
// CONFIGURAÇÃO DO FIREBASE E NUVEM
// ===========================================================================

// API Key do Firebase para chamadas REST diretas (independente de domínio autorizado)
var FIREBASE_API_KEY = "AIzaSyDDwdVRHEDw7QO3dZZt3iW37eCZFYwy_6A";
var FIREBASE_PROJECT_ID = "financas-gley";

// Variáveis Globais de Nuvem e Autenticação
var auth = null;
var db = null;
var isCompletingSignup = false;

// Restaurar usuário ativo sincronicamente do localStorage
var _storedActiveUser = null;
try {
  const _rawUser = localStorage.getItem("finance_manager_active_user");
  if (_rawUser) _storedActiveUser = JSON.parse(_rawUser);
} catch(e) {}

var currentUser = _storedActiveUser || null;
var isCloudEnabled = !!_storedActiveUser;

window.currentUser = currentUser;
window.isCloudEnabled = isCloudEnabled;

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

// ============================================================================
// FIREBASE AUTH via REST API — Não depende de domínio autorizado no Console
// ============================================================================
window.firebaseSignIn = async function(email, password) {
  const url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + FIREBASE_API_KEY;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) {
    throw { code: data.error?.message || "auth/unknown", message: data.error?.message || "Erro de autenticação" };
  }
  return {
    user: {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName || email.split("@")[0],
      idToken: data.idToken,
      refreshToken: data.refreshToken
    }
  };
};

window.firebaseSignUp = async function(email, password) {
  const url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + FIREBASE_API_KEY;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) {
    throw { code: data.error?.message || "auth/unknown", message: data.error?.message || "Erro ao criar conta" };
  }
  return {
    user: {
      uid: data.localId,
      email: data.email,
      displayName: email.split("@")[0],
      idToken: data.idToken,
      refreshToken: data.refreshToken
    }
  };
};

// ============================================================================
// FIRESTORE via REST API — Não depende do Firebase SDK Auth
// ============================================================================
window.firestoreGet = async function(docPath) {
  const token = currentUser && currentUser.idToken ? currentUser.idToken : null;
  const url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID + "/databases/(default)/documents/" + docPath + (token ? "" : "?key=" + FIREBASE_API_KEY);
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Firestore GET error " + res.status);
  }
  const json = await res.json();
  return json;
};

window.firestoreSet = async function(docPath, data) {
  const token = currentUser && currentUser.idToken ? currentUser.idToken : null;
  if (!token) { console.warn("Sem token para escrever no Firestore"); return; }
  const url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID + "/databases/(default)/documents/" + docPath;
  const headers = { "Content-Type": "application/json", "Authorization": "Bearer " + token };
  // Converter objeto JS para formato Firestore
  function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === "boolean") return { booleanValue: val };
    if (typeof val === "number") return { integerValue: String(Math.round(val)) };
    if (typeof val === "string") return { stringValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
    if (typeof val === "object") {
      const fields = {};
      for (const k of Object.keys(val)) fields[k] = toFirestoreValue(val[k]);
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }
  const fields = {};
  for (const k of Object.keys(data)) fields[k] = toFirestoreValue(data[k]);
  const res = await fetch(url + "?updateMask.fieldPaths=" + Object.keys(data).join("&updateMask.fieldPaths="), {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Firestore SET error " + res.status + ": " + err);
  }
  return await res.json();
};

// Converter resposta Firestore para objeto JS simples
window.fromFirestoreDoc = function(doc) {
  if (!doc || !doc.fields) return null;
  function fromVal(v) {
    if (v.nullValue !== undefined) return null;
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.integerValue !== undefined) return Number(v.integerValue);
    if (v.doubleValue !== undefined) return Number(v.doubleValue);
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.arrayValue) return (v.arrayValue.values || []).map(fromVal);
    if (v.mapValue) {
      const obj = {};
      for (const k of Object.keys(v.mapValue.fields || {})) obj[k] = fromVal(v.mapValue.fields[k]);
      return obj;
    }
    return null;
  }
  const obj = {};
  for (const k of Object.keys(doc.fields)) obj[k] = fromVal(doc.fields[k]);
  return obj;
};

async function getCloudConfig() {
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) return window.FIREBASE_CONFIG;
  const storedConfig = localStorage.getItem("finance_manager_firebase_config");
  if (storedConfig) {
    try {
      const parsed = JSON.parse(storedConfig);
      if (parsed && parsed.apiKey) return parsed;
    } catch (e) {}
  }
  return null;
}

async function initFirebase() {
  const config = await getCloudConfig();
  if (!config) {
    console.log("Firebase não configurado. Continuando no Modo Local.");
    updateSyncIndicator("offline");
    if (window.loadState) await window.loadState();
    return false;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    // Inicializar db para compatibilidade com código existente
    db = firebase.firestore();
    isCloudEnabled = true;

    // Usar REST API para auth — não depende de domínio autorizado
    // Se já temos currentUser do localStorage, carregar dados diretamente
    if (currentUser && currentUser.uid) {
      updateSyncIndicator("online");
      if (window.updateCloudUI) window.updateCloudUI(true, currentUser.email);
      const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");
      if (dropdownLogoutBtn) {
        dropdownLogoutBtn.innerHTML = `<span>🚪</span> Sair da Conta`;
      }
      if (window.updateAdminUI) window.updateAdminUI();
      await loadState();
      return true;
    }

    // Se não temos usuário ainda, tentar auth listener do SDK (pode funcionar se domínio OK)
    auth = firebase.auth();
    try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e) {}

    auth.onAuthStateChanged(async (user) => {
      const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          idToken: await user.getIdToken()
        };
        localStorage.setItem("finance_manager_active_user", JSON.stringify(currentUser));
        updateSyncIndicator("online");
        if (window.updateCloudUI) window.updateCloudUI(true, currentUser.email);
        if (dropdownLogoutBtn) {
          dropdownLogoutBtn.innerHTML = `<span>🚪</span> Sair da Conta`;
        }
        if (window.hideAuthOverlay) window.hideAuthOverlay();
        if (window.updateAdminUI) window.updateAdminUI();
        window.currentUser = currentUser;
        window.isCloudEnabled = true;
        await loadState();
      } else {
        // onAuthStateChanged retornou null — manter usuário do localStorage se existir
        if (currentUser && currentUser.uid) {
          // Já temos usuário restaurado — não sobrescrever
          return;
        }
        currentUser = null;
        window.currentUser = null;
        window.isCloudEnabled = false;
        updateSyncIndicator("offline");
        if (window.updateCloudUI) window.updateCloudUI(false, "");
        if (dropdownLogoutBtn) {
          dropdownLogoutBtn.innerHTML = `<span>🔑</span> Entrar / Conectar Conta`;
        }
        await loadState();
      }
    });

    return true;
  } catch (err) {
    console.error("Erro ao inicializar Firebase:", err);
    updateSyncIndicator("error");
    if (window.loadState) await window.loadState();
    return false;
  }
}
window.initFirebase = initFirebase;
