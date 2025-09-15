const {
  model,
  generationConfigTemp0_1,
  safetySettings,
} = require("./model.app");

const PROMPTS = require("./model.prompts");
const Menu = require("./menu.model");

const getFoodRecommendation = async ({ userRequest, history }) => {
  try {
    // Load menu items from MongoDB
    const menuItems = await Menu.find({});

    //  Build Gemini system prompt
    const systemPrompt = PROMPTS.getSystemPrompt(menuItems);

    //  Ensure history starts with user
    const cleanedHistory = [...history];
    while (cleanedHistory.length && cleanedHistory[0].role !== "user") {
      cleanedHistory.shift();
    }

    const formattedHistory = cleanedHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    //  Gemini chat session
    const chatSession = model.startChat({
      history: formattedHistory,
      generationConfig: generationConfigTemp0_1,
      safetySettings,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }],
      },
    });

    const resultMessage = await chatSession.sendMessage(userRequest);
    const response = await resultMessage.response;
    const text = await response.text();

    return text;
  } catch (error) {
    console.error(" Error in getFoodRecommendation:", error);
    throw error;
  }
};

module.exports = { getFoodRecommendation };
