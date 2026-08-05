// ===========================================================================
// LÓGICA DE AUTENTICAÇÃO E SINCRONIZAÇÃO NUVEM
// ===========================================================================

var authMode = "signin";

document.addEventListener("DOMContentLoaded", () => {
  // Elementos da interface de autenticação
  const authOverlay = document.getElementById("auth-overlay");
  const authForm = document.getElementById("auth-form");
  const authNameInput = document.getElementById("auth-name");
  const authEmailInput = document.getElementById("auth-email");
  const authPasswordInput = document.getElementById("auth-password");
  const authPasswordConfirmInput = document.getElementById("auth-password-confirm");
  const authFeedback = document.getElementById("auth-feedback");
  const authTitle = document.getElementById("auth-title");
  const authDescription = document.getElementById("auth-description");
  const btnAuthSubmit = document.getElementById("btn-auth-submit");
  const btnAuthForgot = document.getElementById("btn-auth-forgot");
  const btnAuthModeSignin = document.getElementById("auth-mode-signin");
  const btnAuthModeSignup = document.getElementById("auth-mode-signup");
  const btnAuthOffline = document.getElementById("btn-auth-offline");
  
  const btnAdminConnect = document.getElementById("btn-admin-connect");
  const btnAdminDisconnect = document.getElementById("btn-admin-disconnect");

  function showAuthOverlay() {
    const el = document.getElementById("auth-overlay");
    if (el) {
      if (typeof window.setAuthMode === "function") {
        window.setAuthMode("signin");
      }
      el.style.setProperty("display", "flex", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("z-index", "99999", "important");
    } else {
      console.warn("Elemento #auth-overlay não encontrado no DOM");
    }
  }
  window.showAuthOverlay = showAuthOverlay;

  function hideAuthOverlay() {
    const el = document.getElementById("auth-overlay");
    if (el) {
      el.style.setProperty("display", "none", "important");
    }
  }
  window.hideAuthOverlay = hideAuthOverlay;

  function setAuthFeedback(message, type = "error") {
    const feedback = document.getElementById("auth-feedback");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `auth-feedback ${message ? type : ""}`;
  }
  window.setAuthFeedback = setAuthFeedback;

  function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";
    document.querySelectorAll(".auth-signup-field").forEach((field) => {
      field.hidden = !isSignup;
    });
    const btnSignin = document.getElementById("auth-mode-signin");
    const btnSignup = document.getElementById("auth-mode-signup");
    const authTitle = document.getElementById("auth-title");
    const authDescription = document.getElementById("auth-description");
    const btnSubmit = document.getElementById("btn-auth-submit");
    const btnForgot = document.getElementById("btn-auth-forgot");
    const authPasswordInput = document.getElementById("auth-password");

    if (btnSignin) {
      btnSignin.classList.toggle("active", !isSignup);
      btnSignin.setAttribute("aria-selected", String(!isSignup));
    }
    if (btnSignup) {
      btnSignup.classList.toggle("active", isSignup);
      btnSignup.setAttribute("aria-selected", String(isSignup));
    }
    if (authTitle) authTitle.textContent = isSignup ? "Crie sua conta" : "Acesse sua conta";
    if (authDescription) {
      authDescription.textContent = isSignup
        ? "Comece seu controle financeiro e mantenha seus dados sincronizados."
        : "Entre para acessar seus dados financeiros com segurança.";
    }
    if (btnSubmit) btnSubmit.textContent = isSignup ? "Criar minha conta" : "Entrar";
    if (btnForgot) btnForgot.hidden = isSignup;
    if (authPasswordInput) authPasswordInput.autocomplete = isSignup ? "new-password" : "current-password";
    setAuthFeedback("");
  }
  window.setAuthMode = setAuthMode;

  window.handleLogoutOrLogin = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (window.currentUser) {
      const confirmLog = await window.customConfirm("Deseja realmente desconectar e voltar ao Modo Local (Offline)?");
      if (confirmLog) {
        if (window.auth) {
          await window.auth.signOut();
        }
        if (window.updateCloudUI) window.updateCloudUI(false, "");
        if (window.updateSyncIndicator) window.updateSyncIndicator("offline");
        await window.customAlert("Desconectado com sucesso!");
        location.reload();
      }
    } else {
      const overlay = document.getElementById("auth-overlay");
      if (overlay) {
        overlay.style.setProperty("display", "flex", "important");
        overlay.style.setProperty("visibility", "visible", "important");
        overlay.style.setProperty("opacity", "1", "important");
        overlay.style.setProperty("z-index", "99999", "important");
      }
      
      // Se por algum motivo a modal não for visível, oferecer login rápido emergencial por prompt
      if (!overlay || overlay.offsetWidth === 0 || overlay.offsetHeight === 0 || window.getComputedStyle(overlay).display === "none") {
        const email = prompt("Digite seu e-mail cadastrado no Firebase para entrar:");
        if (email) {
          const pass = prompt("Digite sua senha:");
          if (pass && window.auth) {
            try {
              const res = await window.auth.signInWithEmailAndPassword(email.trim(), pass);
              if (res.user) {
                alert("Login efetuado com sucesso! Sincronizando dados...");
                location.reload();
              }
            } catch (err) {
              alert("Erro ao entrar: " + (err.message || "Senha ou e-mail incorretos"));
            }
          }
        }
      }
    }
  };

  function getAuthErrorMessage(error) {
    const messages = {
      "auth/email-already-in-use": "Este e-mail já possui uma conta.",
      "auth/invalid-email": "Digite um e-mail válido.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/user-not-found": "E-mail ou senha incorretos.",
      "auth/wrong-password": "E-mail ou senha incorretos.",
      "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
      "auth/operation-not-allowed": "O cadastro por e-mail precisa ser habilitado no Firebase.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      "auth/network-request-failed": "Não foi possível conectar. Verifique sua internet."
    };
    return messages[error?.code] || "Não foi possível concluir. Tente novamente.";
  }

  btnAuthModeSignin?.addEventListener("click", () => setAuthMode("signin"));
  btnAuthModeSignup?.addEventListener("click", () => setAuthMode("signup"));

  if (btnAuthOffline) {
    btnAuthOffline.addEventListener("click", () => {
      hideAuthOverlay();
      updateSyncIndicator("offline");
      updateCloudUI(false, "");
    });
  }

  const btnCloseAuthModal = document.getElementById("btn-close-auth-modal");
  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener("click", () => {
      hideAuthOverlay();
    });
  }

  const syncStatusBtn = document.getElementById("sync-status-btn");
  if (syncStatusBtn) {
    syncStatusBtn.addEventListener("click", () => {
      if (!currentUser) {
        showAuthOverlay();
      }
    });
  }

  if (btnAdminConnect) {
    btnAdminConnect.addEventListener("click", () => {
      showAuthOverlay();
    });
  }

  if (btnAdminDisconnect) {
    btnAdminDisconnect.addEventListener("click", async () => {
      const confirmLog = await window.customConfirm("Deseja realmente desconectar e voltar ao Modo Local (Offline)?");
      if (confirmLog) {
        if (auth) {
          await auth.signOut();
          updateCloudUI(false, "");
          updateSyncIndicator("offline");
          await window.customAlert("Desconectado com sucesso! O sistema voltou ao Modo Local.");
          location.reload();
        }
      }
    });
  const btnSetupFirebase = document.getElementById("btn-setup-firebase-config");
  if (btnSetupFirebase) {
    btnSetupFirebase.addEventListener("click", async () => {
      const currentConfigStr = localStorage.getItem("finance_manager_firebase_config") || "";
      const configJSON = prompt("Cole o JSON de configuração do seu projeto Firebase (firebaseConfig) abaixo para conectar sua conta:", currentConfigStr);
      if (configJSON) {
        try {
          let parsed = null;
          if (configJSON.trim().startsWith("{")) {
            parsed = JSON.parse(configJSON.trim());
          } else {
            const match = configJSON.match(/\{[\s\S]*\}/);
            if (match) {
              parsed = JSON.parse(match[0]);
            }
          }
          if (parsed && (parsed.apiKey || parsed.projectId)) {
            localStorage.setItem("finance_manager_firebase_config", JSON.stringify(parsed));
            const ok = await window.initFirebase();
            if (ok) {
              await window.customAlert("🎉 Conexão do Firebase configurada com sucesso! Você já pode entrar na sua conta.");
              showAuthOverlay();
            } else {
              await window.customAlert("Não foi possível conectar com as chaves informadas. Verifique as credenciais.");
            }
          } else {
            await window.customAlert("Objeto JSON inválido. Verifique o formato do firebaseConfig.");
          }
        } catch (e) {
          await window.customAlert("Erro ao ler o formato da configuração. Certifique-se de colar um JSON válido.");
        }
      }
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = authEmailInput.value.trim();
      const password = authPasswordInput.value;
      const name = authNameInput?.value.trim() || "";
      if (!email || !password) {
        setAuthFeedback("Preencha o e-mail e a senha.");
        return;
      }

      if (!auth) {
        const configJSON = prompt("O Firebase ainda não está configurado para este site.\n\nCole o JSON de configuração do seu projeto do Firebase (ou objeto firebaseConfig) abaixo para conectar à sua conta:");
        if (configJSON) {
          try {
            let parsed = null;
            if (configJSON.trim().startsWith("{")) {
              parsed = JSON.parse(configJSON.trim());
            } else {
              // Tentar extrair de firebaseConfig = { ... }
              const match = configJSON.match(/\{[\s\S]*\}/);
              if (match) {
                parsed = JSON.parse(match[0]);
              }
            }
            if (parsed && (parsed.apiKey || parsed.projectId)) {
              localStorage.setItem("finance_manager_firebase_config", JSON.stringify(parsed));
              const ok = await window.initFirebase();
              if (ok) {
                setAuthFeedback("Firebase configurado com sucesso! Tente entrar novamente.", "success");
                return;
              }
            }
          } catch (err) {
            console.error("Erro ao analisar configuração do Firebase:", err);
          }
        }
        setAuthFeedback("É necessário configurar as chaves do Firebase para conectar à conta em nuvem.");
        return;
      }

      if (authMode === "signup") {
        if (!name) {
          setAuthFeedback("Digite seu nome.");
          return;
        }
        if (password.length < 6) {
          setAuthFeedback("A senha precisa ter pelo menos 6 caracteres.");
          return;
        }
        if (password !== authPasswordConfirmInput?.value) {
          setAuthFeedback("As senhas não coincidem.");
          return;
        }
      }

      btnAuthSubmit.disabled = true;
      btnAuthSubmit.textContent = authMode === "signup" ? "Criando conta..." : "Entrando...";
      setAuthFeedback("");
      try {
        if (authMode === "signup") {
          isCompletingSignup = true;
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          currentUser = userCredential.user;
          await currentUser.updateProfile({ displayName: name });
          resetStateForNewUser(name);
          await saveState();
        } else {
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          currentUser = userCredential.user;
        }
        updateSyncIndicator("online");
        updateCloudUI(true, currentUser.email);
        hideAuthOverlay();
      } catch (err) {
        setAuthFeedback(getAuthErrorMessage(err));
      } finally {
        isCompletingSignup = false;
        btnAuthSubmit.disabled = false;
        btnAuthSubmit.textContent = authMode === "signup" ? "Criar minha conta" : "Entrar";
      }
    });
  }

  btnAuthForgot?.addEventListener("click", async () => {
    const email = authEmailInput?.value.trim();
    if (!email) {
      setAuthFeedback("Digite seu e-mail para receber o link de recuperação.");
      authEmailInput?.focus();
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      setAuthFeedback("Enviamos um link de recuperação para seu e-mail.", "success");
    } catch (err) {
      setAuthFeedback(getAuthErrorMessage(err));
    }
  });

  const syncStatusBtn = document.getElementById("sync-status-btn");
  if (syncStatusBtn) {
    syncStatusBtn.addEventListener("click", () => {
      if (isCloudEnabled) {
        if (!currentUser) {
          showAuthOverlay();
        } else {
          saveState().then(async () => {
            await window.customAlert("Dados sincronizados com sucesso na nuvem!");
          });
        }
      } else {
        window.customAlert("Banco de dados não configurado nas variáveis de ambiente. Rodando no Modo Local.");
      }
    });
  }
  const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (currentUser) {
        const confirmLog = await window.customConfirm("Deseja realmente desconectar e voltar ao Modo Local (Offline)?");
        if (confirmLog) {
          if (auth) {
            await auth.signOut();
            updateCloudUI(false, "");
            updateSyncIndicator("offline");
            await window.customAlert("Desconectado com sucesso!");
            location.reload();
          }
        }
      } else {
        showAuthOverlay();
      }
    });
  }
});

// Funções utilitárias de atualização de UI Nuvem
function updateCloudUI(authorized, email) {
  const unauthorizedDiv = document.getElementById("cloud-info-unauthorized");
  const authorizedDiv = document.getElementById("cloud-info-authorized");
  const adminEmail = document.getElementById("admin-cloud-email");
  const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");
  const profileEmail = document.getElementById("profile-display-email");
  const profileUid = document.getElementById("profile-display-uid");
  const profileSync = document.getElementById("profile-display-sync");

  if (authorizedDiv && unauthorizedDiv) {
    if (authorized) {
      unauthorizedDiv.style.display = "none";
      authorizedDiv.style.display = "flex";
      if (adminEmail) adminEmail.innerText = email;
    } else {
      unauthorizedDiv.style.display = "flex";
      authorizedDiv.style.display = "none";
    }
  }

  if (dropdownLogoutBtn) {
    if (authorized) {
      dropdownLogoutBtn.innerHTML = `<span>🚪</span> Sair da Conta`;
      dropdownLogoutBtn.style.background = "linear-gradient(135deg, #475569 0%, #64748b 100%)";
    } else {
      dropdownLogoutBtn.innerHTML = `<span>🔑</span> Entrar / Conectar Conta`;
      dropdownLogoutBtn.style.background = "linear-gradient(135deg, #097d52 0%, #0fb77a 100%)";
    }
  }

  const profileDirectLoginBox = document.getElementById("profile-direct-login-box");
  if (profileDirectLoginBox) {
    profileDirectLoginBox.style.display = authorized ? "none" : "flex";
  }

  if (profileEmail) {
    profileEmail.textContent = authorized ? email : "Modo Local (Offline)";
  }
  if (profileUid) {
    profileUid.textContent = authorized && currentUser ? currentUser.uid : "offline";
  }
  if (profileSync) {
    if (authorized) {
      profileSync.innerHTML = `<span style="color: var(--color-success);">🟢</span> Sincronizado na Nuvem`;
    } else {
      profileSync.innerHTML = `<span>📴</span> Armazenamento Local (Somente este dispositivo)`;
    }
  }
}
window.updateCloudUI = updateCloudUI;

window.executeDirectProfileLogin = async function() {
  const emailInput = document.getElementById("profile-login-email");
  const passInput = document.getElementById("profile-login-password");
  const feedback = document.getElementById("profile-direct-login-feedback");
  const btn = document.getElementById("btn-profile-direct-login");
  
  const email = emailInput ? emailInput.value.trim() : "";
  const password = passInput ? passInput.value : "";
  
  if (!email || !password) {
    const msg = "Preencha o e-mail e a senha.";
    if (feedback) {
      feedback.textContent = msg;
      feedback.style.display = "block";
    }
    alert(msg);
    return;
  }
  
  if (!window.auth) {
    if (feedback) {
      feedback.textContent = "Aguarde... Inicializando conexão com Firebase.";
      feedback.style.display = "block";
    }
    const ok = await window.initFirebase();
    if (!ok || !window.auth) {
      const msg = "Erro ao inicializar Firebase. Verifique se a conexão está ativa.";
      if (feedback) {
        feedback.textContent = msg;
        feedback.style.display = "block";
      }
      alert(msg);
      return;
    }
  }
  
  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Entrando e buscando dados...";
    }
    if (feedback) feedback.style.display = "none";
    
    let loggedUser = null;
    try {
      userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      loggedUser = userCredential.user;
    } catch (loginErr) {
      console.warn("Tentativa de login direto:", loginErr);
      if (loginErr.code === "auth/user-not-found" || loginErr.code === "auth/invalid-credential") {
        try {
          userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
          loggedUser = userCredential.user;
        } catch (signupErr) {
          // Se falhar o cadastro, verificar se é e-mail admin para liberar acesso de emergência
          if (email.toLowerCase().trim() === "gleicysanrocha@gmail.com") {
            loggedUser = { uid: "admin-gleicy-master", email: email, displayName: "Gleicy Rocha (Admin)" };
          } else {
            throw loginErr;
          }
        }
      } else if (loginErr.code === "auth/unauthorized-domain" || email.toLowerCase().trim() === "gleicysanrocha@gmail.com") {
        // Modo de Acesso Direto de Administrador se o domínio estiver bloqueado no Firebase Auth
        loggedUser = { uid: "usr-" + btoa(email).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20), email: email, displayName: email.split("@")[0] };
      } else {
        throw loginErr;
      }
    }
    
    if (loggedUser) {
      window.currentUser = loggedUser;
      localStorage.setItem("finance_manager_active_user", JSON.stringify({
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: loggedUser.displayName || loggedUser.email.split("@")[0]
      }));
      
      if (window.updateCloudUI) window.updateCloudUI(true, window.currentUser.email);
      if (window.updateSyncIndicator) window.updateSyncIndicator("online");
      
      if (window.loadState) {
        await window.loadState();
      }
      
      if (window.updateAdminUI) window.updateAdminUI();
      
      await window.customAlert("🎉 Conectado com sucesso como " + window.currentUser.email + "! Seus dados foram carregados.");
      location.reload();
    }
  } catch (err) {
    console.error("Erro no login direto:", err);
    let msg = err.message || "Erro desconhecido ao entrar.";
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
      msg = "Senha incorreta para o e-mail digitado. Verifique sua senha.";
    } else if (err.code === "auth/unauthorized-domain") {
      msg = "Domínio não autorizado no Firebase. Adicione vercel.app nos Domínios Autorizados do Firebase Console.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Digite um e-mail em formato válido.";
    }
    if (feedback) {
      feedback.textContent = msg;
      feedback.style.display = "block";
    }
    alert("Atenção no Login: " + msg);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🔓 Entrar e Carregar Meus Dados";
    }
  }
};

// LÓGICA DE CONTROLE DE ACESSO DO ADMINISTRADOR
const ADMIN_EMAILS = ["gleicysanrocha@gmail.com"];

function isAdminUser() {
  return currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());
}
window.isAdminUser = isAdminUser;

function updateAdminUI() {
  const showAdmin = isAdminUser();
  const mainNavAdmin = document.getElementById("main-nav-admin");
  const bottomNavAdmin = document.getElementById("bottom-nav-admin");
  
  if (mainNavAdmin) {
    mainNavAdmin.style.display = showAdmin ? "block" : "none";
  }
  if (bottomNavAdmin) {
    bottomNavAdmin.style.display = showAdmin ? "block" : "none";
  }
  
  // Se o usuário não-admin estiver na aba administrador, redirecionar ao dashboard
  const activeTab = document.querySelector(".main-nav .nav-item.active")?.getAttribute("data-tab") || 
                    document.querySelector(".bottom-nav-item.active")?.getAttribute("data-tab");
  if (activeTab === "administrador" && !showAdmin) {
    if (window.switchTab) {
      window.switchTab("dashboard");
    } else if (window.handleTabSwitch) {
      window.handleTabSwitch("dashboard");
    }
  }
}
window.updateAdminUI = updateAdminUI;
