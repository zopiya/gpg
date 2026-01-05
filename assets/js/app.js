const I18N = {
  en: {
    page_title: "Secure Message Encryption | GPG Online",
    step0_title: "Recipient Public Key",
    step0_waiting: "WAITING...",
    btn_details: "View Details",
    btn_download: "Download Public Key",
    label_userid: "User ID:",
    label_fingerprint: "Full Fingerprint:",
    label_algo: "Algorithm:",
    step1_title: "Compose Secret Message",
    step1_archived: "Encrypted",
    placeholder_msg:
      "Enter content here, or drag and drop a text file...\nAll encryption is done locally.",
    btn_encrypt: "Encrypt Message",
    btn_encrypting: "Processing...",
    step2_title: "Encryption Complete",
    btn_copy: "Copy Ciphertext",
    btn_email: "Send via Email",
    link_reset: "Return to Edit or Rewrite",
    footer: "Powered by OpenPGP.js | Single-File Secure Tool",
    error_load_title: "Unable to Auto-load Public Key",
    error_load_desc:
      "May be due to missing file or local security policy (CORS). Please manually load the `public.asc` file.",
    btn_select_file: "Select File...",
    text_or_paste: "or paste into console",
    alert_no_openpgp: "openpgp.min.js dependency not found.",
    alert_invalid_key: "Invalid public key file: ",
    alert_encrypt_fail: "Encryption failed: ",
    alert_copy_fail: "Copy failed, please copy manually",
    btn_copied: "Copied",
    text_msg_encrypted: "Encrypted",
    alert_integrity_fail:
      "Security Warning: Public key file integrity check failed!",
  },
  zh: {
    page_title: "安全讯息加密",
    step0_title: "接收者公钥",
    step0_waiting: "等待加载...",
    btn_details: "查看详情",
    btn_download: "下载公钥",
    label_userid: "用户信息:",
    label_fingerprint: "完整指纹:",
    label_algo: "加密算法:",
    step1_title: "撰写信息",
    step1_archived: "已加密",
    placeholder_msg: "在此输入内容，或拖入文本文件...\n所有加密均在本地完成。",
    btn_encrypt: "执行加密",
    btn_encrypting: "处理中...",
    step2_title: "加密完成",
    btn_copy: "复制密文",
    btn_email: "发送邮件",
    link_reset: "返回修改或重新编写",
    footer: "由 OpenPGP.js 驱动",
    error_load_title: "无法自动加载公钥",
    error_load_desc:
      "可能由于文件缺失或本地安全策略限制。请手动加载 `public.asc` 文件。",
    btn_select_file: "📁 选择文件...",
    text_or_paste: "或直接粘贴到控制台",
    alert_no_openpgp: "找不到 openpgp.min.js 依赖文件。",
    alert_invalid_key: "无效的公钥文件: ",
    alert_encrypt_fail: "加密失败: ",
    alert_copy_fail: "复制失败，请手动复制",
    btn_copied: "已复制",
    text_msg_encrypted: "已加密",
    alert_integrity_fail: "安全警告：公钥文件完整性校验失败！",
  },
};

const INTEGRITY = {
  publicKey: "E/F+NeOddP9mNILlC0/AdlosHXs7DO84bJs03e61oDQ=",
};

let currentLang = "en";
let loadedPublicKey = null;

// DOM Elements IDs
const ids = {
  step1Card: "step-1-card",
  step2Card: "step-2-card",
  msgInput: "msg-input",
  encryptBtn: "encrypt-btn",
  resultOutput: "result-output",
  detailsPanel: "details-panel",
  mailtoBtn: "mailto-btn",
  manualLoadArea: "manual-load-area",
  keyContent: "key-content",
  elAlgoBadge: "key-algo-badge",
  elFingerprintMain: "key-fingerprint-main",
  elUserId: "key-userid",
  elFingerprintFull: "key-fingerprint-full",
  elAlgoDetail: "key-algo-detail",
  btnDetails: "details-btn",
  keyFileInput: "key-file-input",
  btnCopy: "btn-copy",
  linkReset: "link-reset",
  btnSelectFile: "btn-select-file",
};

function getEl(id) {
  return document.getElementById(id);
}

/**
 * Detect user browser language and set global currentLang
 */
function detectLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  if (lang && lang.toLowerCase().startsWith("zh")) {
    currentLang = "zh";
  } else {
    currentLang = "en";
  }
  updateUIStrings();
}

/**
 * Update UI text based on currentLang
 */
function updateUIStrings() {
  const data = I18N[currentLang];
  document.title = data.page_title;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (data[key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = data[key];
      } else {
        const icon = el.querySelector(".icon");
        if (icon) {
          let textNode = null;
          el.childNodes.forEach((node) => {
            if (
              node.nodeType === Node.TEXT_NODE &&
              node.textContent.trim().length > 0
            ) {
              textNode = node;
            }
          });

          if (textNode) {
            textNode.textContent = " " + data[key];
          } else {
            el.appendChild(document.createTextNode(" " + data[key]));
          }
        } else {
          el.textContent = data[key];
        }
      }
    }
  });
}

/**
 * Verify content integrity using Web Crypto API
 */
async function verifyContentHash(content, expectedHash) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    return hashBase64 === expectedHash;
  } catch (e) {
    console.error("Hash verification error:", e);
    return false;
  }
}

/**
 * Application Entry Point
 */
async function init() {
  detectLanguage();
  setupDragAndDrop();
  attachEventListeners();

  if (typeof openpgp === "undefined") {
    showError(I18N[currentLang].alert_no_openpgp);
    return;
  }

  try {
    const response = await fetch("./public.asc");
    if (!response.ok) {
      throw new Error(`Auto load failed: HTTP ${response.status}`);
    }
    const armoredKey = await response.text();
    if (!armoredKey || armoredKey.trim() === "")
      throw new Error("Empty key file");

    // Integrity Check for auto-loaded key
    if (INTEGRITY.publicKey) {
      const valid = await verifyContentHash(armoredKey, INTEGRITY.publicKey);
      if (!valid) {
        showError(I18N[currentLang].alert_integrity_fail);
        throw new Error("Integrity check failed");
      }
    }

    await processPublicKey(armoredKey);
  } catch (error) {
    console.warn("Auto-load failed or integrity check failed:", error);
    showManualLoadUI();
  }
}

function attachEventListeners() {
  const btnSelectFile = getEl(ids.btnSelectFile);
  if (btnSelectFile) {
    btnSelectFile.addEventListener("click", () => {
      getEl(ids.keyFileInput).click();
    });
  }

  const keyFileInput = getEl(ids.keyFileInput);
  if (keyFileInput) {
    keyFileInput.addEventListener("change", () =>
      handleFileSelect(keyFileInput)
    );
  }

  const btnDetails = getEl(ids.btnDetails);
  if (btnDetails) {
    btnDetails.addEventListener("click", toggleDetails);
  }

  const encryptBtn = getEl(ids.encryptBtn);
  if (encryptBtn) {
    encryptBtn.addEventListener("click", doEncrypt);
  }

  const btnCopy = getEl(ids.btnCopy);
  if (btnCopy) {
    btnCopy.addEventListener("click", () => copyResult(btnCopy));
  }

  const linkReset = getEl(ids.linkReset);
  if (linkReset) {
    linkReset.addEventListener("click", resetProcess);
  }
}

function showManualLoadUI() {
  const el = getEl(ids.manualLoadArea);
  if (el) el.style.display = "block";
  const input = getEl(ids.msgInput);
  if (input) input.placeholder = I18N[currentLang].step0_waiting;
}

function showError(msg) {
  const el = getEl(ids.manualLoadArea);
  if (el) {
    el.style.display = "block";
    el.innerHTML = `<div class="error-title" style="color:var(--text-error)">System Error</div><div class="error-desc">${msg}</div>`;
  }
}

async function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await processPublicKey(e.target.result);
      getEl(ids.manualLoadArea).style.display = "none";
    } catch (err) {
      alert(I18N[currentLang].alert_invalid_key + err.message);
    }
  };
  reader.readAsText(file);
}

/**
 * Parse and display public key information
 */
async function processPublicKey(armoredKey) {
  try {
    loadedPublicKey = await openpgp.readKey({ armoredKey });

    const fingerprint = loadedPublicKey.getFingerprint().toUpperCase();
    const primaryUser = await loadedPublicKey.getPrimaryUser();
    const userId = primaryUser.user.userID.userID;
    const algorithmInfo = loadedPublicKey.getAlgorithmInfo();

    const formattedFingerprint = fingerprint.replace(/(.{4})/g, "$1 ").trim();
    const fingerprintShort = formattedFingerprint
      .split(" ")
      .slice(-4)
      .join(" ");

    getEl(ids.elFingerprintMain).innerText = fingerprintShort;
    getEl(ids.elFingerprintFull).innerText = formattedFingerprint;
    getEl(ids.elUserId).innerText = userId;

    let algoText = algorithmInfo.algorithm;
    if (algorithmInfo.bits) {
      algoText += ` ${algorithmInfo.bits}`;
    }
    getEl(ids.elAlgoBadge).innerText = algoText.toUpperCase();
    getEl(
      ids.elAlgoDetail
    ).innerText = `${algoText} (${loadedPublicKey.keyPacket.algorithm})`;

    const keyContent = getEl(ids.keyContent);
    keyContent.style.opacity = "1";
    keyContent.style.pointerEvents = "auto";

    const msgInput = getEl(ids.msgInput);
    msgInput.placeholder = I18N[currentLang].placeholder_msg;
    msgInput.disabled = false;

    getEl(ids.encryptBtn).disabled = false;
    getEl(ids.btnDetails).disabled = false;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to parse public key.");
  }
}

function setupDragAndDrop() {
  const msgInput = getEl(ids.msgInput);
  if (!msgInput) return;

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    msgInput.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
  });

  msgInput.addEventListener(
    "dragenter",
    () => msgInput.classList.add("drag-active"),
    false
  );
  msgInput.addEventListener(
    "dragleave",
    () => msgInput.classList.remove("drag-active"),
    false
  );

  msgInput.addEventListener(
    "drop",
    (e) => {
      msgInput.classList.remove("drag-active");
      const file = e.dataTransfer.files[0];
      if (file && !msgInput.disabled) {
        const reader = new FileReader();
        reader.onload = (event) => {
          msgInput.value = event.target.result;
        };
        reader.readAsText(file);
      }
    },
    false
  );
}

function toggleDetails() {
  const panel = getEl(ids.detailsPanel);
  panel.classList.toggle("open");
  const isExpanded = panel.classList.contains("open");
  getEl(ids.btnDetails).setAttribute("aria-expanded", isExpanded);
}

/**
 * Execute local encryption using OpenPGP.js
 */
async function doEncrypt() {
  if (!loadedPublicKey) return;

  const msgInput = getEl(ids.msgInput);
  const text = msgInput.value.trim();
  if (!text) {
    msgInput.focus();
    return;
  }

  const encryptBtn = getEl(ids.encryptBtn);
  encryptBtn.innerText = I18N[currentLang].btn_encrypting;
  encryptBtn.disabled = true;
  msgInput.disabled = true;

  try {
    const message = await openpgp.createMessage({ text: text });
    const encryptedData = await openpgp.encrypt({
      message: message,
      encryptionKeys: loadedPublicKey,
    });

    getEl(ids.resultOutput).innerText = encryptedData;

    const userString = getEl(ids.elUserId).innerText;
    const emailMatch = userString.match(/<([^>]+)>/);
    const email = emailMatch ? emailMatch[1] : "";

    const subject = encodeURIComponent("Encrypted Message");
    const body = encodeURIComponent(encryptedData);
    getEl(
      ids.mailtoBtn
    ).href = `mailto:${email}?subject=${subject}&body=${body}`;

    getEl(ids.step1Card).classList.add("archived");
    getEl(ids.step2Card).style.display = "block";

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  } catch (err) {
    alert(I18N[currentLang].alert_encrypt_fail + err.message);
    msgInput.disabled = false;
    encryptBtn.disabled = false;
    updateUIStrings();
  }
}

function resetProcess() {
  getEl(ids.step2Card).style.display = "none";
  getEl(ids.step1Card).classList.remove("archived");

  const msgInput = getEl(ids.msgInput);
  msgInput.disabled = false;

  const encryptBtn = getEl(ids.encryptBtn);
  encryptBtn.disabled = false;

  updateUIStrings();

  setTimeout(() => msgInput.focus(), 100);
}

function copyResult(btn) {
  const text = getEl(ids.resultOutput).innerText;
  const originalContent = btn.innerHTML;
  const originalColor = btn.style.color;
  const originalBorder = btn.style.borderColor;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.style.borderColor = "var(--green-accent)";
      btn.style.color = "var(--green-accent)";
      btn.style.background = "var(--green-bg)";
      btn.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> ${I18N[currentLang].btn_copied}`;

      setTimeout(() => {
        btn.style.borderColor = originalBorder;
        btn.style.color = originalColor;
        btn.style.background = "";
        btn.innerHTML = originalContent;
      }, 2000);
    })
    .catch((err) => {
      alert(I18N[currentLang].alert_copy_fail);
    });
}

document.addEventListener("DOMContentLoaded", init);
