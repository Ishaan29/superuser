// OpenAI Chat Completion Response Types

export interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  service_tier: string;
  system_fingerprint: string | null;
}

export interface Choice {
  index: number;
  message: Message;
  logprobs: LogProbs | null;
  finish_reason: string;
}

export interface Message {
  role: string;
  content: string;
  refusal: string | null;
  annotations: Annotation[];
}

export interface Annotation {
  // Define annotation properties as needed
  // This can be extended based on specific annotation types
  [key: string]: any;
}

export interface LogProbs {
  // Define log probabilities structure if needed
  [key: string]: any;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details: PromptTokensDetails;
  completion_tokens_details: CompletionTokensDetails;
}

export interface PromptTokensDetails {
  cached_tokens: number;
  audio_tokens: number;
}

export interface CompletionTokensDetails {
  reasoning_tokens: number;
  audio_tokens: number;
  accepted_prediction_tokens: number;
  rejected_prediction_tokens: number;
}

// Request types for sending to OpenAI
export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

// Utility type for extracting just the content from the response
export type ChatResponseContent = string; 