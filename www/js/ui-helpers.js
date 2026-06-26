// ===========================================================================
// AUXILIARES DE INTERFACE (UI HELPERS)
// ===========================================================================

// Diálogos Personalizados Elegantes (Substitutos de alert e confirm)
function customAlert(message, title = "Aviso") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="custom-dialog-title">
          <span>🔔</span> ${title}
        </div>
        <div class="custom-dialog-message">${message}</div>
        <div class="custom-dialog-actions">
          <button class="custom-dialog-btn custom-dialog-btn-primary" id="custom-alert-ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    const okBtn = document.getElementById("custom-alert-ok");
    okBtn.focus();
    okBtn.addEventListener("click", () => {
      overlay.remove();
      resolve();
    });
  });
}

function customConfirm(message, title = "Confirmar Ação") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="custom-dialog-title">
          <span>⚠️</span> ${title}
        </div>
        <div class="custom-dialog-message">${message}</div>
        <div class="custom-dialog-actions">
          <button class="custom-dialog-btn custom-dialog-btn-secondary" id="custom-confirm-cancel">Cancelar</button>
          <button class="custom-dialog-btn custom-dialog-btn-primary" id="custom-confirm-ok">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    const cancelBtn = document.getElementById("custom-confirm-cancel");
    cancelBtn.focus();
    
    document.getElementById("custom-confirm-ok").addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
    
    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
  });
}

// Expor globalmente para ser usado por outros scripts
window.customAlert = customAlert;
window.customConfirm = customConfirm;

// Gerenciamento de abas responsivas (Top Nav e Bottom Nav)
function switchTab(tabId) {
  // Ocultar todas as views de aba
  document.querySelectorAll(".tab-view").forEach((view) => {
    view.style.display = "none";
    view.classList.remove("active");
  });
  
  // Exibir a view correspondente
  const targetView = document.getElementById("view-" + tabId);
  if (targetView) {
    targetView.style.display = "block";
    targetView.classList.add("active");
  }
  
  // Sincronizar classes de ativo na barra superior
  document.querySelectorAll(".main-nav .nav-item").forEach((item) => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Sincronizar classes de ativo na barra inferior
  document.querySelectorAll(".bottom-nav-item").forEach((item) => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

window.switchTab = switchTab;

// Helper para verificar ambiente nativo do Capacitor
function isNativeApp() {
  return typeof window !== "undefined" && !!window.Capacitor;
}
window.isNativeApp = isNativeApp;
