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
    if (authOverlay) authOverlay.style.display = "flex";
  }
  window.showAuthOverlay = showAuthOverlay;

  function hideAuthOverlay() {
    if (authOverlay) authOverlay.style.display = "none";
  }
  window.hideAuthOverlay = hideAuthOverlay;

  function setAuthFeedback(message, type = "error") {
    if (!authFeedback) return;
    authFeedback.textContent = message;
    authFeedback.className = `auth-feedback ${message ? type : ""}`;
  }

  function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";
    document.querySelectorAll(".auth-signup-field").forEach((field) => {
      field.hidden = !isSignup;
    });
    btnAuthModeSignin?.classList.toggle("active", !isSignup);
    btnAuthModeSignup?.classList.toggle("active", isSignup);
    btnAuthModeSignin?.setAttribute("aria-selected", String(!isSignup));
    btnAuthModeSignup?.setAttribute("aria-selected", String(isSignup));
    if (authTitle) authTitle.textContent = isSignup ? "Crie sua conta" : "Acesse sua conta";
    if (authDescription) {
      authDescription.textContent = isSignup
        ? "Comece seu controle financeiro e mantenha seus dados sincronizados."
        : "Entre para acessar seus dados financeiros com segurança.";
    }
    if (btnAuthSubmit) btnAuthSubmit.textContent = isSignup ? "Criar minha conta" : "Entrar";
    if (btnAuthForgot) btnAuthForgot.hidden = isSignup;
    if (authPasswordInput) authPasswordInput.autocomplete = isSignup ? "new-password" : "current-password";
    setAuthFeedback("");
  }

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
        setAuthFeedback("O serviço de acesso ainda não está disponível.");
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
}
window.updateCloudUI = updateCloudUI;

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
