// Cloudflare Worker for BRO. Deploy this file as a Worker.
// Add GEMINI_API_KEY as a secret in Worker settings.
// Optionally set ALLOWED_ORIGIN to the exact GitHub Pages origin, e.g. https://YOURNAME.github.io
// Do not put the API key in any public HTML/JS file.

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsOrigin = allowedOrigin === "*" || origin === allowedOrigin ? (allowedOrigin === "*" ? "*" : origin) : "null";
    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const url = new URL(request.url);
    if (url.pathname !== "/chat") return json({ error: "المسار غير موجود." }, 404, corsHeaders);
    if (request.method !== "POST") return json({ error: "استخدم طلب POST." }, 405, corsHeaders);
    if (corsOrigin === "null") return json({ error: "هذا الموقع غير مسموح له باستخدام الخدمة." }, 403, corsHeaders);
    if (!env.GEMINI_API_KEY) return json({ error: "لم يتم إعداد مفتاح الذكاء الاصطناعي في إعدادات الخادم." }, 503, corsHeaders);

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();
      const mode = String(body.mode || "general");
      if (!message) return json({ error: "اكتب سؤالك أولًا." }, 400, corsHeaders);
      if (message.length > 6000) return json({ error: "السؤال طويل جدًا. اختصره ثم أرسله مرة أخرى." }, 413, corsHeaders);

      let instruction = "أنت بوبوت، مساعد عربي داخل موقع BRO. أجب باللغة العربية الواضحة، وكن صريحًا بشأن عدم اليقين. لا تخترع مصادر أو روابط.";
      if (mode === "education") instruction += " اشرح للطالب خطوة بخطوة وبأسلوب بسيط، واذكر مثالًا عند الحاجة.";
      if (mode === "religion") instruction += " تعامل باحترام مع اختلاف الأديان والمذاهب. ميّز بين المعلومة العامة والرأي، ولا تصدر أحكامًا قطعية في المسائل الدقيقة. إذا لم تكن متأكدًا فقل ذلك، ووجّه المستخدم لمصدر موثوق أو مختص.";
      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: instruction }] },
            contents: [{ role: "user", parts: [{ text: message }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 1800 }
          })
        }
      );
      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return json({ error: result.error?.message || "تعذّر على خدمة الذكاء الاصطناعي إكمال الطلب. راجع إعدادات المفتاح والحصة." }, 502, corsHeaders);
      }
      const answer = (result.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!answer) return json({ error: "لم تصل إجابة نصية. حاول صياغة السؤال بطريقة أخرى." }, 502, corsHeaders);
      return json({ answer }, 200, corsHeaders);
    } catch {
      return json({ error: "حدث خطأ في معالجة الطلب. تحقق من الإعدادات وحاول مرة أخرى." }, 500, corsHeaders);
    }
  }
};

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}
