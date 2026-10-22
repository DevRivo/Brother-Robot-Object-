document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.getElementById('menuToggle');
  const navigation = document.getElementById('navigation');
  const yearElement = document.getElementById('year');

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.textContent = isOpen ? '✕' : '☰';
      menuButton.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('open');
        menuButton.textContent = '☰';
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const robot = document.getElementById('robotAssistant');
  const robotBubble = document.getElementById('robotBubble');

  if (robot && robotBubble) {
    const phrases = [
      'أهلًا! أنا تمتم، جاهز لأساعدك اليوم.',
      'يمكنني مساعدتك في القراءة أو التوضيح أو التنظيم.',
      'يُمكن أن نبدأ بأي سؤال أو فكرة تحتاجها.',
      'أنا هنا لسهل لك الرحلة في برو.',
      'تقدر تفتح أي قسم وتجربه مباشرة.'
    ];

    let currentIndex = 0;

    const speak = () => {
      robotBubble.textContent = phrases[currentIndex];
      currentIndex = (currentIndex + 1) % phrases.length;
      robot.classList.remove('is-speaking');
      void robot.offsetWidth;
      robot.classList.add('is-speaking');
      window.setTimeout(() => robot.classList.remove('is-speaking'), 420);
    };

    robot.addEventListener('click', speak);
    robot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        speak();
      }
    });
  }

  const chatForm = document.getElementById('chatForm');
  const chatMessages = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');

  if (chatForm && chatMessages && messageInput) {
    const helloMessage = {
      sender: 'bot',
      text: 'أنا تمتم، أستطيع مساعدتك في شرح الدروس، الإجابة على الأسئلة، أو توجيهك إلى الأقسام المناسبة.'
    };

    const appendMessage = (sender, text) => {
      const message = document.createElement('div');
      message.className = `message ${sender}`;

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = text;

      message.appendChild(bubble);
      chatMessages.appendChild(message);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const botReply = (rawText) => {
      const value = rawText.toLowerCase();

      if (value.includes('درس') || value.includes('تعليم') || value.includes('رياضيات') || value.includes('علوم')) {
        return 'يمكننا تقسيم الموضوع إلى أجزاء صغيرة، ثم نبدأ بشرح أساسي ثم أمثلة سهلة لفهمه بشكل أفضل.';
      }

      if (value.includes('أماكن') || value.includes('مصر') || value.includes('مدينة') || value.includes('قريب')) {
        return 'أقترح أن تبدأ باختيار المدينة أو المنطقة المراد استكشافها، ثم نراجع أبرز الأماكن المهمة والتجارب المناسبة لها.';
      }

      if (value.includes('دين') || value.includes('إسلام') || value.includes('معلومة')) {
        return 'أعطيك معلومة دينية عامة بشكل مبسط، مع التأكيد على أهمية الرجوع إلى مصادر موثوقة ومعتمدة عند الحاجة إلى التأويل أو الأحكام.';
      }

      return 'حسنًا، أستطيع أن أساعدك في تنظيم الفكرة أو شرح الموضوع خطوة بخطوة، فقط اكتب سؤالك بوضوح.';
    };

    appendMessage(helloMessage.sender, helloMessage.text);

    chatForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const value = messageInput.value.trim();
      if (!value) {
        return;
      }

      appendMessage('user', value);
      messageInput.value = '';

      window.setTimeout(() => {
        appendMessage('bot', botReply(value));
      }, 500);
    });

    document.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.value || chip.textContent.trim();
        messageInput.value = value;
        messageInput.focus();
      });
    });
  }
});
