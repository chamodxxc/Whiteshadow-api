const axios = require("axios");

const models = {
  chatgpt4: "https://chatbot.nazirganz.space/api/chatgpt4o-api?prompt=",
  deepseek: "https://chatbot.nazirganz.space/api/deepseek-api?prompt=",
  metaai: "https://chatbot.nazirganz.space/api/metaai-api?prompt="
};

async function chatBotAi(prompt, model) {
  if (!Object.keys(models).includes(model)) {
    return {
      status: false,
      creator: "Chamod Nimsara",
      message: `Available models: ${Object.keys(models).join(", ")}`
    };
  }
  try {
    const { data } = await axios.get(models[model] + encodeURIComponent(prompt));
    return {
      status: true,
      creator: "Chamod Nimsara",
      model,
      response: data.result || "-"
    };
  } catch (e) {
    return {
      status: false,
      creator: "Chamod Nimsara",
      message: "Failed to fetch response from AI model",
      error: e.message
    };
  }
}

module.exports = function (app) {
  app.get("/ai/chatbot", async (req, res) => {
    const { prompt, model } = req.query;
    if (!prompt || !model) {
      return res.status(400).json({
        status: false,
        creator: "Chamod Nimsara",
        message: "Parameters 'prompt' and 'model' are required"
      });
    }

    const result = await chatBotAi(prompt, model);
    res.json(result);
  });
};
