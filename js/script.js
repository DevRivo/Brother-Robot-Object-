const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const welcome = $("#welcome");
const chatArea = $("#chatArea");
const messages = $("#messages");
const input = $("#questionInput");
const toast = $("#toast");
const sidebar = $("#sidebar");
const authDialog = $("#authDialog");
let signedInName = "";
let activeSection = "chat";

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}
function startNewChat() {
  messages.replaceChildren();
  chatArea.classList.add("hidden");
  welcome.classList.remove("hidden");
  input.value = "";
  input.focus();
}
function setSection(section) {
  activeSection = section;
  const titles = {
    chat: ["أهلًا", "اسأل بوبوت عن أي حاجة"],
    education: ["التعليم والدراسة", "اكتب الدرس أو السؤال اللي محتاج مساعدة فيه"],
    knowledge: ["الدين والمعرفة", "اسأل مع الاهتمام بالمصادر والسياق"],
    places: ["الأماكن في مصر", "اكتب اسم المكان أو الخدمة والمحافظة"]
  };
  const title = titles[section] || titles.chat;
  $("#welcomeName").textContent = signedInName || "بيك";
  $$(".nav-link, .side-item").forEach(button => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  if (section !== "chat") {
    $("#welcome").querySelector("h1").innerHTML = `${title[0]}<br><span class="teal-text">مع بوبوت</span> 🤖`;
    $("#welcome").querySelector(".hero-copy > p").textContent = title[1];
  } else {
    $("#welcome").querySelector("h1").innerHTML = `أهلًا <span class="teal-text" id="welcomeName">${signedInName || "بيك"}</span>،<br>أنا <span class="teal-text">بوبوت</span> 🤖`;
    $("#welcome").querySelector(".hero-copy > p").textContent = "اسأل عن أي حاجة، وخلّيني أساعدك تفهمها وتوصل للمعلومة ومصدرها.";
  }
  sidebar.classList.remove("open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
}
function addMessage(text, who) {
  const row = document.createElement("div");
  row.className = `message ${who}`;
  if (who === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "message-bot";
    avatar.textContent = "🤖";
    avatar.setAttribute("aria-label", "بوبوت");
    row.append(avatar);
  }
  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;
  row.append(content);
  messages.append(row);
  chatArea.classList.remove("hidden");
  welcome.classList.add("hidden");
  row.scrollIntoView({behavior:"smooth", block:"nearest"});
}
function submitQuestion(text) {
  const question = (text || input.value).trim();
  if (!question) return;
  addMessage(question, "user");
  input.value = "";
  // This honest demo response avoids pretending an AI or live search API is connected.
  addMessage("وصل سؤالك! واجهة BRO جاهزة للتجربة، لكن بوبوت لم يتصل بعد بخدمة الذكاء الاصطناعي أو البحث المباشر. الخطوة التالية هي إعداد خادم آمن وربط واجهة البحث، مع عرض المصادر الحقيقية عند تفعيلها.", "assistant");
  showToast("تمت إضافة رسالتك إلى معاينة المحادثة");
}
$("#chatForm").addEventListener("submit", event => {
  event.preventDefault();
  submitQuestion();
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitQuestion();
  }
});
$$("[data-prompt]").forEach(button => button.addEventListener("click", () => {
  input.value = button.dataset.prompt;
  input.focus();
  input.scrollIntoView({behavior:"smooth", block:"center"});
}));
$$("[data-section]").forEach(button => button.addEventListener("click", () => setSection(button.dataset.section)));
$("#newChat").addEventListener("click", startNewChat);
$("#menuToggle").addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
});
$("#searchInfo").addEventListener("click", () => showToast("البحث التلقائي سيعمل بعد ربط خدمة البحث من الخادم."));
function openAuth(title) {
  $("#authTitle").textContent = title;
  authDialog.showModal();
}
$("#loginOpen").addEventListener("click", () => openAuth("تسجيل الدخول"));
$("#signupOpen").addEventListener("click", () => openAuth("إنشاء حساب"));
$("#authForm").addEventListener("submit", event => {
  event.preventDefault();
  signedInName = $("#userName").value.trim();
  if (!signedInName) return;
  $("#welcomeName").textContent = signedInName;
  authDialog.close();
  setSection(activeSection);
  showToast(`أهلًا يا ${signedInName}! دي معاينة فقط، مش حساب حقيقي.`);
});
// Start with the selected section and responsive controls ready.
setSection("chat");
// إدارة نافذة تسجيل الدخول وإنشاء الحساب
const authDialog = document.getElementById("authDialog");
const authForm = document.getElementById("authForm");

const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");

const nameField = document.getElementById("nameField");
const userName = document.getElementById("userName");

const authSwitch = document.getElementById("authSwitch");
const authSwitchText = document.getElementById("authSwitchText");
const authMessage = document.getElementById("authMessage");

let authMode = "login";

// تغيير وضع النافذة
function setAuthMode(mode) {
  authMode = mode;

  const isRegister = mode === "register";

  authTitle.textContent = isRegister
    ? "إنشاء حساب جديد"
    : "تسجيل الدخول";

  authDescription.textContent = isRegister
    ? "أنشئ حسابك وابدأ رحلتك مع بوبوت."
    : "أهلاً بعودتك! سجل دخولك للمتابعة.";

  authSubmit.textContent = isRegister
    ? "إنشاء الحساب"
    : "تسجيل الدخول";

  nameField.hidden = !isRegister;
  userName.required = isRegister;

  document.getElementById("userPassword").autocomplete =
    isRegister ? "new-password" : "current-password";

  authSwitchText.textContent = isRegister
    ? "لديك حساب بالفعل؟"
    : "ليس لديك حساب؟";

  authSwitch.textContent = isRegister
    ? "تسجيل الدخول"
    : "إنشاء حساب";

  authMessage.textContent = "";
}

// التنقل بين النافذتين
authSwitch.addEventListener("click", function () {
  setAuthMode(
    authMode === "login" ? "register" : "login"
  );
});

// فتح نافذة الحساب
// استدعِ هذه الدالة عند الضغط على زر الحساب في موقعك
function openAuth(mode = "login") {
  setAuthMode(mode);

  if (!authDialog.open) {
    authDialog.showModal();
  }
}

// منع الإرسال التجريبي دون ربط خدمة حسابات
authForm.addEventListener("submit", function (event) {
  event.preventDefault();

  authMessage.textContent =
    "الواجهة جاهزة، لكن يلزم ربط خدمة حسابات لتسجيل الدخول وإنشاء الحساب فعليًا.";
});
