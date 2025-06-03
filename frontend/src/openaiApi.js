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
        console.log(response.data, "response.data");
        return response.data;
    } catch (error) {
        throw new Error("OpenAI API error: " + (error.response?.data?.error?.message || error.message));
    }
} 