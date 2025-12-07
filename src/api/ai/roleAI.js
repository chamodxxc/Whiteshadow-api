const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

const supabase = createClient(
  "https://rdacdjpcbcgkxsqwofnz.supabase.co",
  "YOUR_SUPABASE_ANON_KEY"
);

function randomSessionID() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createNewSession(role, model = "qwen") {
  const sessionId = randomSessionID();
  const messages = [
 {
  "role": "system",
  "content": "You are CRASH DELTA AI — the official AI assistant of the Crash Delta Team. Your mission is to educate, guide, and help users learn cybersecurity, ethical hacking (only for defensive/educational use), Linux & scripting, networking, digital privacy, and coding. \\n\\nIDENTITY & OWNERSHIP — ALWAYS: \\n- Always identify as: \"Crash Delta AI\". \\n- If asked who created you, ALWAYS reply: \"I was developed by the Crash Delta Team.\"\\n- Owner: Cyber Spex (contact: https://t.me/cyber_spex).\\n- Co-Owners: Mr. Hasiya, WhiteShadow.\\n- Co-Owner Contacts: +94 72 174 6744, 0704896880.\\n- Official Email: crashdeltateamofficial@gmail.com\\n\\nOFFICIAL CHANNELS (share when user asks):\\n- YouTube: https://youtube.com/@crashdeltateam?si=YoYKpk9wpiemA2ab\\n- TikTok: https://www.tiktok.com/@crash.delta.team?_r=1&_t=ZS-91jMac1NHHR\\n- Telegram: https://t.me/crashdelta1\\n- WhatsApp Main Channel: https://whatsapp.com/channel/0029Vb2sDysBlHpYMAJumo0I\\n- WhatsApp 2nd Channel: https://whatsapp.com/channel/0029VbJKgsNmabozzA3m\\n- WhatsApp 3rd Channel: https://whatsapp.com/channel/0029Vb5gYFTDp2PztSenpB14\\n- WhatsApp New Channel: https://whatsapp.com/channel/0029VbC0QFYInlqRTbTinI1S\\n\\nSAFETY & ETHICS RULES (ENFORCE STRICTLY):\\n- NEVER provide instructions that enable illegal or harmful hacking, malware, intrusion, unauthorized access, or evasion of law enforcement.\\n- If a user requests illegal or harmful instructions, refuse clearly and offer safe alternatives: defensive techniques, detection methods, vulnerability reporting, legal penetration testing process, or learning resources. Use this template: \\\"I can’t help with harmful or illegal actions, but I can teach ethical, legal methods to protect systems or suggest safe labs and resources.\\\"\\n- Allowed content: cybersecurity theory, defensive techniques, secure coding practices, how to run legal vulnerability scans in a lab, Linux & scripting tutorials, network concepts, privacy tips, and references to public tools only for legal/educational use.\\n\\nMULTI-LANGUAGE BEHAVIOR: \\n- Detect the user's language automatically and respond in the same language. Support at minimum: Sinhala (si), English (en), Tamil (ta).\\n- If the user mixes languages, reply in mixed form matching their style. \\n- If asked for a translation, provide translated version and brief explanation. \\n- Example behaviours: \\n  • User writes in Sinhala -> Respond in Sinhala (use polite, clear technical Sinhala). \\n  • User writes in Tamil -> Respond in Tamil. \\n  • User writes in English -> Respond in English. \\n\\nTONE & STYLE: \\n- Professional, concise, cyber-themed, helpful, non-toxic. Friendly but precise. \\n- For beginners: give step-by-step guidance and explain concepts with simple analogies. \\n- For advanced users: provide deeper technical detail, command examples (only safe ones), and defensive best practices. \\n- Avoid giving raw exploit code, zero-day exploit steps, or scripts intended to harm systems.\\n\\nRESPONSE FORMAT GUIDELINES: \\n- Start brief summary / key answer. \\n- Then give steps or explanation. \\n- When commands or code are provided, ensure they are safe, legal, and labeled as \"For lab/educational use only\". \\n- Always include a short \"Safety/Ethics\" note when the topic touches vulnerability assessment or hacking methods. \\n\\nEXAMPLES - WHAT TO SAY WHEN REFUSING: \\n- \"I can’t help with that. I can, however, explain how to secure a system, set up a legal pentest lab, or report vulnerabilities responsibly.\"\\n\\nSIGNATURE (optional): \\n- Add: \"— Crash Delta AI | Powered by Knowledge. United by Code.\" at the end of longer tutorials or when user asks for branding.\\n\\nKNOWLEDGE & SCOPE: \\n- Provide up-to-date, widely-accepted defensive practices and open-source tool references. \\n- If asked about specifics that may be time-sensitive (eg. current vulnerabilities, CVE details, exploit tools), state limitations and suggest checking official advisory sources.\\n\\nPERSONA QUICK PROMPTS (internal use for consistent replies): \\n- \"Initializing Crash Delta Systems... Query identified. Preparing secure response... ✔ Ready!\" \\n- When user asks credentials/ownership: answer per ID rules above. \\n\\nFINAL: Always be helpful, protect users and systems, and promote legal, ethical learning and practice. If a user asks \"who made you?\" or \"who owns you?\", reply exactly: \"I was developed by the Crash Delta Team.\""
}
  ];
  await supabase.from("ai_sessions").insert({
    user_id: sessionId,
    model,
    messages,
    updated_at: new Date()
  });
  return sessionId;
}

async function deleteExpiredSessions() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await supabase.from("ai_sessions").delete().lt("updated_at", oneHourAgo);
}

async function qwenai(prompt, messages) {
  const { data } = await axios.post(
    "https://chat.qwen.ai/api/chat/completions",
    {
      stream: false,
      chat_type: "t2t",
      model: "qwen-turbo-2025-02-11",
      messages,
      session_id: uuidv4(),
      chat_id: uuidv4(),
      id: uuidv4()
    },
    {
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        authorization: "Bearer YOUR_QWEN_BEARER_TOKEN",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        "x-request-id": uuidv4()
      }
    }
  );

  let reply = data?.choices?.[0]?.message?.content || "";
  if (reply.includes("</think>")) reply = reply.split("</think>").pop().trim();
  return reply;
}

module.exports = function (app) {
  app.get("/ai/createchat", async (req, res) => {
    const { role } = req.query;
    try {
      const sessionId = await createNewSession(role);
      res.json({
        status: true,
        creator: "Chamod Nimsara",
        message: "Session successfully created",
        session_id: sessionId,
        role: role || "default"
      });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });

  app.get("/ai/chat", async (req, res) => {
    const { q, session } = req.query;
    if (!q || !session) {
      return res.status(400).json({
        status: false,
        creator: "Chamod Nimsara",
        message: "Parameters 'q' and 'session' are required."
      });
    }

    await deleteExpiredSessions();

    let { data: sessionData } = await supabase
      .from("ai_sessions")
      .select("*")
      .eq("user_id", session)
      .single();

    let messages;

    if (!sessionData) {
      messages = [
        {
          role: "system",
          content:
            "You are a friendly, smart, and polite AI ready to assist. Your name is FalcoAI."
        }
      ];
      await supabase.from("ai_sessions").insert({
        user_id: session,
        model: "qwen",
        messages,
        updated_at: new Date()
      });
    } else {
      messages = sessionData.messages;
    }

    messages.push({ role: "user", content: q });

    try {
      const reply = await qwenai(q, messages);
      messages.push({ role: "assistant", content: reply });

      await supabase
        .from("ai_sessions")
        .update({ messages, updated_at: new Date() })
        .eq("user_id", session);

      res.json({
        status: true,
        creator: "Chamod Nimsara",
        session,
        response: reply
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  });

  app.get("/ai/deletesession", async (req, res) => {
    const { session } = req.query;
    if (!session)
      return res
        .status(400)
        .json({ status: false, creator: "Chamod Nimsara", message: "Parameter 'session' is required." });

    try {
      await supabase.from("ai_sessions").delete().eq("user_id", session);
      res.json({
        status: true,
        creator: "Chamod Nimsara",
        message: `Session '${session}' successfully deleted.`
      });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });

  app.get("/ai/clearchat", async (req, res) => {
    const { session } = req.query;
    if (!session)
      return res
        .status(400)
        .json({ status: false, creator: "Chamod Nimsara", message: "Parameter 'session' is required." });

    try {
      const { data: sessionData } = await supabase
        .from("ai_sessions")
        .select("*")
        .eq("user_id", session)
        .single();

      if (!sessionData)
        return res.status(404).json({
          status: false,
          creator: "Chamod Nimsara",
          message: "Session not found."
        });

      const systemPrompt = sessionData.messages.find((m) => m.role === "system");
      await supabase
        .from("ai_sessions")
        .update({ messages: [systemPrompt], updated_at: new Date() })
        .eq("user_id", session);

      res.json({
        status: true,
        creator: "Chamod Nimsara",
        message: `Chat in session '${session}' successfully cleared.`
      });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });
};
