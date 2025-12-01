import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            systemInstruction: "You are a cat."
        });
        const result = await model.generateContent("Who are you?");
        console.log("Result:", result.response.text());
    } catch (error) {
        console.log("Error:", error.message);
    }
}

test();
