import axios from "axios";
// WARNING: This approach is for LOCAL TESTING ONLY. Never use your API key in frontend code for production!
const OPENAI_API_KEY = "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"; // <-- Replace with your OpenAI API key

export async function callOpenAI(prompt) {
    try {
        const response = await axios.post(
            "https://corsproxy.io/?https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an expert WebSite Parser && QA automation engineer. Generate clear, specific test steps that can be automated." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        throw new Error("OpenAI API error: " + (error.response?.data?.error?.message || error.message));
    }
} 