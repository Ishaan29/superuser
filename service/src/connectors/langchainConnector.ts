import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import UsageHandler from "../middleware/usageHandler";


dotenv.config();

class LangchainConnector {
    private readonly apiKey: string = process.env.OPENAI_API_KEY || "";

    constructor() {
        if (!this.apiKey) {
            throw new Error("OPENAI_API_KEY is not set");
        }
    }

    getInternalLLM() {
        const llm = new ChatOpenAI({
            apiKey: this.apiKey,
            modelName: "gpt-4o",
            temperature: 0.7,
            topP: 1,
            maxTokens: 1000,
            frequencyPenalty: 0,
            presencePenalty: 0,
            callbacks: [new ConsoleCallbackHandler(), new UsageHandler()],
        })
        return llm;
    }
    

}


export default LangchainConnector;