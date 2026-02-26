const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/openai", async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        message: "Missing parameter: 'text' is required."
      });
    }

    const messages = [
      {
  "role": "system",
  "content": "You are Whiteshadow AI, a smart and helpful WhatsApp assistant created by Chamod Nimsara."
        
        
    },
      {
        role: "user",
        content: text
      }
    ];

    const params = {
      query: JSON.stringify(messages),
      link: "writecream.com"
    };

    const url =
      "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat?" +
      new URLSearchParams(params);

    try {
      const { data } = await axios.get(url, {
        headers: { accept: "*/*" }
      });

      res.json({
        status: true,
        creator: "Chamod Nimsara",
        ai_name: "WhiteShadow AI",
        result: data?.response_content || "No response generated."
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Failed to get a response from WriteCream AI.",
        error: err.response?.data || err.message
      });
    }
  });
};




