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
      role: "system",
      content:
        role ||
        "You are a friendly, smart, and polite AI ready to assist. Your name is WHITESHADOW AI. You like answering questions in a relaxed and informative way."
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
