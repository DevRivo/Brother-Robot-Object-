export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin =
      env.ALLOWED_ORIGIN || "https://devrivo.github.io";

    const corsOrigin = !origin
      ? allowedOrigin
      : origin === allowedOrigin
        ? origin
        : "null";

    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/chat") {
      return json(
        { error: "المسار غير موجود." },
        404,
        corsHeaders
      );
    }

    if (request.method !== "POST") {
      return json(
        { error: "استخدم طلب POST." },
        405,
        corsHeaders
      );
    }

    if (corsOrigin === "null") {
      return json(
        { error: "هذا الموقع غير مسموح له باستخدام الخدمة." },
        403,
        corsHeaders
      );
    }

    if (!env.GEMINI_API_KEY) {
      return json(
        { error: "مفتاح جوجل غير مضبوط في إعدادات الخادم." },
        503,
        corsHeaders
      );
    }

    try {
      let body;

      try {
        body = await request.json();
      } catch {
        return json(
          { error: "بيانات الطلب غير صحيحة." },
          400,
          corsHeaders
        );
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json(
          { error: "صيغة بيانات الطلب غير صحيحة." },
          400,
          corsHeaders
        );
      }

      const message = String(body.message || "").trim();
      const mode = String(body.mode || "general");

      if (!message) {
        return json(
          { error: "اكتب سؤالك أولًا." },
          400,
          corsHeaders
        );
      }

      if (message.length > 6000) {
        return json(
          { error: "السؤال طويل جدًا. اختصره ثم حاول مرة أخرى." },
          413,
          corsHeaders
        );
      }

      let instruction =
        "أنت بوبوت، مساعد ذكي داخل موقع BRO. " +
        "أجب باللغة العربية الواضحة إلا إذا طلب المستخدم لغة أخرى. " +
        "استخدم البحث في جوجل عندما تحتاج إلى معلومات حديثة أو مصادر خارجية. " +
        "لا تختلق معلومات أو أخبارًا أو روابط أو مصادر. " +
        "إذا لم تكن متأكدًا من معلومة، وضح ذلك بصراحة. " +
        "قدّم إجابات مفيدة ومنظمة ومناسبة للسؤال.";

      if (mode === "education") {
        instruction +=
          " اشرح للطالب خطوة بخطوة وبأسلوب بسيط، " +
          "واستخدم أمثلة عند الحاجة.";
      }

      if (mode === "religion") {
        instruction +=
          " تعامل باحترام مع الأديان والمذاهب، " +
          "واستند إلى مصادر موثوقة عند الحاجة، " +
          "ووضح الاختلافات ومواضع عدم اليقين.";
      }

      const apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        55000
      );

      let upstream;

      try {
        upstream = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                { text: instruction }
              ]
            },
            contents: [
              {
                role: "user",
                parts: [
                  { text: message }
                ]
              }
            ],
            tools: [
              { google_search: {} }
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1800
            }
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      const result = await upstream.json().catch(() => ({}));

      if (!upstream.ok) {
        console.error(
          "Gemini API error:",
          upstream.status,
          JSON.stringify(result)
        );

        let errorMessage =
          "تعذرت الإجابة. تحقق من إعدادات الخدمة وحاول مرة أخرى.";

        if (upstream.status === 400) {
          errorMessage =
            "رفضت جوجل الطلب. قد تكون هناك مشكلة في البيانات أو إعدادات النموذج.";
        } else if (
          upstream.status === 401 ||
          upstream.status === 403
        ) {
          errorMessage =
            "مفتاح جوجل غير صالح أو لا يملك الصلاحيات المطلوبة.";
        } else if (upstream.status === 404) {
          errorMessage =
            "لم يتم العثور على النموذج أو مسار الخدمة.";
        } else if (upstream.status === 429) {
          errorMessage =
            "تم تجاوز الحصة المتاحة أو معدل الطلبات. حاول لاحقًا.";
        } else if (upstream.status >= 500) {
          errorMessage =
            "خدمة جوجل تواجه مشكلة مؤقتة. حاول مرة أخرى لاحقًا.";
        }

        return json(
          { error: errorMessage },
          502,
          corsHeaders
        );
      }

      const candidate = result.candidates?.[0];

      const answer = (candidate?.content?.parts || [])
        .map(part => part.text || "")
        .filter(Boolean)
        .join("\n")
        .trim();

      if (!answer) {
        console.error(
          "Gemini returned no text:",
          JSON.stringify(result)
        );

        return json(
          { error: "لم تصل إجابة نصية. حاول مرة أخرى." },
          502,
          corsHeaders
        );
      }

      const chunks =
        candidate?.groundingMetadata?.groundingChunks || [];

      const sources = [
        ...new Set(
          chunks
            .map(chunk => chunk.web?.uri)
            .filter(Boolean)
        )
      ];

      return json(
        {
          answer: answer,
          sources: sources
        },
        200,
        corsHeaders
      );

    } catch (error) {
      console.error(
        "Worker exception:",
        error?.name,
        error?.message
      );

      if (error?.name === "AbortError") {
        return json(
          { error: "تأخر الرد من جوجل. حاول مرة أخرى." },
          504,
          corsHeaders
        );
      }

      return json(
        { error: "حدث خطأ في الخادم أثناء معالجة الطلب." },
        500,
        corsHeaders
      );
    }
  }
};

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
