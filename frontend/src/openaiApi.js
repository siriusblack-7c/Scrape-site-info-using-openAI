import axios from "axios";
// WARNING: This approach is for LOCAL TESTING ONLY. Never use your API key in frontend code for production!

const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export async function callOpenAI(prompt) {
    try {
        const response = await axios.post(
            `${backendUrl}/openai-proxy`,
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
                    "Content-Type": "application/json"
                },
            }
        );
        return response.data;
    } catch (error) {
        throw new Error("OpenAI API error: " + (error.response?.data?.error?.message || error.message));
    }
} 