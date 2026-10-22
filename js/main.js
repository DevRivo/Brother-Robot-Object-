document.addEventListener("DOMContentLoaded", function () {
  // قائمة الموقع
  const menuButton = document.getElementById("menuToggle");
  const navigation = document.getElementById("navigation");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", function () {
      const isOpen = navigation.classList.toggle("open");

      menuButton.textContent = isOpen ? "✕" : "☰";
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "إغلاق القائمة" : "فتح القائمة"
      );
    });

    navigation.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navigation.classList.remove("open");
        menuButton.textContent = "☰";
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  // تحديث السنة تلقائيًا
  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // تفاعل الروبوت تمتم
  const robot = document.querySelector(".robot-placeholder");
  const speechBubble = document.querySelector(".speech-bubble");

  if (robot && speechBubble) {
    const phrases = [
      "أهلًا بيك! أنا تمتم، مساعدك في برو 🤖",
      "تقدر تستكشف خدمات برو من الأزرار اللي قدامك.",
      "أنا لسه بتطور، وهدفنا نخلي برو مفيد للجميع!",
      "عندك سؤال؟ جرّب قسم الدردشة لما يكون جاهز.",
      "يلا نكتشف برو مع بعض!"
    ];

    let phraseIndex = 0;

    function makeRobotSpeak() {
      speechBubble.textContent = phrases[phraseIndex];
      phraseIndex = (phraseIndex + 1) % phrases.length;

      robot.classList.add("robot-active");

      window.setTimeout(function () {
        robot.classList.remove("robot-active");
      }, 350);
    }

    robot.style.cursor = "pointer";
    robot.setAttribute("role", "button");
    robot.setAttribute("tabindex", "0");
    robot.setAttribute("aria-label", "اضغط للتحدث مع تمتم");

    robot.addEventListener("click", makeRobotSpeak);

    robot.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        makeRobotSpeak();
      }
    });
  }
});
