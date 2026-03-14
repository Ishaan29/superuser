import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { LLMResult } from "@langchain/core/outputs";

class UsageHandler extends BaseCallbackHandler {
    name: string = "usage_handler";

    handleLLMEnd(output: LLMResult) {
        console.log(output);
    }
}

export default UsageHandler;