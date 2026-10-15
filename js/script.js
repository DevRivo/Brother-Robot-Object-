document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✕' : '☰';
    });
  }

  document.querySelectorAll('.local-form').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const result = form.querySelector('.result');
      if (!result) return;
      const data = new FormData(form);
      const kind = form.dataset.kind;

      if (kind === 'places') {
        const place = String(data.get('place') || '').trim();
        const area = String(data.get('area') || '').trim();
        const q = encodeURIComponent(`${place} ${area}`.trim());
        result.replaceChildren();
        const p = document.createElement('p');
        p.textContent = `نتائج البحث عن «${place}» ${area ? `في «${area}»` : ''}:`;
        const a = document.createElement('a');
        a.href = `https://www.google.com/search?q=${q}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'فتح نتائج البحث في جوجل';
        result.append(p, a);
        result.classList.add('show');
        return;
      }

      if (kind === 'plan') {
        const minutes = Math.max(10, Number(data.get('hours')) || 0);
        const focus = Math.max(5, Math.round(minutes * 0.7));
        result.textContent = `خطة مبدئية لمدة ${minutes} دقيقة: ${focus} دقيقة مذاكرة، ثم 10 دقائق راحة، واستخدم الوقت المتبقي للمراجعة.`;
        result.classList.add('show');
        return;
      }

      if (kind === 'education' || kind === 'religion') {
        const question = kind === 'education'
          ? `اشرح لي الموضوع التالي بطريقة واضحة ومناسبة للطالب: ${String(data.get('subject') || '').trim()}`
          : String(data.get('question') || data.get('subject') || '').trim();
        if (!question) {
          result.textContent = 'اكتب سؤالك أولًا.';
          result.classList.add('show');
          return;
        }
        result.replaceChildren();
        const p = document.createElement('p');
        p.textContent = 'جاري إرسال سؤالك إلى بوبوت...';
        result.appendChild(p);
        result.classList.add('show');
        askAssistant(question, kind === 'religion' ? 'religion' : 'education')
          .then(answer => { result.textContent = answer; })
          .catch(error => { result.textContent = error.message; });
      }
    });
  });

  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener('submit', async event => {
      event.preventDefault();
      const question = chatInput.value.trim();
      if (!question) return;
      appendMessage('أنت', question, 'user-message');
      chatInput.value = '';
      const waiting = appendMessage('بوبوت', 'جاري التفكير والبحث عن إجابة...', 'bot-message');
      const button = chatForm.querySelector('button[type="submit"], button:not([type])');
      if (button) button.disabled = true;
      try {
        const answer = await askAssistant(question, 'general');
        waiting.querySelector('p').textContent = answer;
      } catch (error) {
        waiting.querySelector('p').textContent = error.message;
      } finally {
        if (button) button.disabled = false;
        chatInput.focus();
      }
    });
  }

  async function askAssistant(question, mode) {
    const apiUrl = window.BRO_CONFIG && window.BRO_CONFIG.apiUrl;
    if (!apiUrl) {
      throw new Error('بوبوت لم يُربط بالخدمة بعد. انشر ملف worker.js على Cloudflare Workers، ثم ضع رابط الخدمة في js/config.js. لن تعمل الإجابات الحقيقية قبل إتمام الربط.');
    }
    let response;
    try {
      response = await fetch(apiUrl.replace(/\/$/, '') + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, mode })
      });
    } catch {
      throw new Error('تعذّر الاتصال بالخدمة. تأكد من رابط الخادم واتصال الإنترنت.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'الخدمة لم تستطع معالجة السؤال الآن. جرّب مرة أخرى.');
    }
    if (!data.answer) throw new Error('وصل رد غير مكتمل من الخدمة. جرّب مرة أخرى.');
    return data.answer;
  }

  function appendMessage(name, text, className) {
    const item = document.createElement('div');
    item.className = `message ${className}`;
    const title = document.createElement('strong');
    title.textContent = name;
    const body = document.createElement('p');
    body.textContent = text;
    item.append(title, body);
    chatMessages.appendChild(item);
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return item;
  }
});
