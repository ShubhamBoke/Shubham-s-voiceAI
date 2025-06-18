'use server';
/**
 * @fileOverview An AI agent chat completion flow.
 *
 * - aiAgentChatCompletion - A function that sends transcribed text to an AI agent and returns the agent's response.
 * - AiAgentChatCompletionInput - The input type for the aiAgentChatCompletion function.
 * - AiAgentChatCompletionOutput - The return type for the aiAgentChatCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

import { readFileSync } from 'fs';
import path from 'path';

const AiAgentChatCompletionInputSchema = z.object({
  transcribedText: z.string().describe('The current transcribed text from the user.'),
  history: z.array(z.object({
    type: z.union([z.literal('user'), z.literal('ai')]).describe('The type of the message (user or ai).'),
    text: z.string().describe('The text content of the message.'),
    // Include other relevant message properties if needed for context
  })).describe('The conversation history as an array of messages.'),

});
export type AiAgentChatCompletionInput = z.infer<typeof AiAgentChatCompletionInputSchema>;

const AiAgentChatCompletionOutputSchema = z.object({
  agentResponse: z.string().describe('The AI agent’s response to the transcribed text.'),
});
export type AiAgentChatCompletionOutput = z.infer<typeof AiAgentChatCompletionOutputSchema>;

export async function aiAgentChatCompletion(input: AiAgentChatCompletionInput): Promise<AiAgentChatCompletionOutput> {
  return aiAgentChatCompletionFlow(input);
}

// Define the path to the instructions file
const instructionsFilePath = 'src/ai/flows/agent_instructions.txt';
console.log(__dirname);

// Read the instructions from the file
const agentInstructionsTemplate = readFileSync(instructionsFilePath, 'utf-8');

const prompt = ai.definePrompt({
  name: 'aiAgentChatCompletionPrompt',
  input: {schema: AiAgentChatCompletionInputSchema},
  output: {schema: AiAgentChatCompletionOutputSchema},
  prompt: async (input: AiAgentChatCompletionInput) => {
    const conversationHistory = input.history.map(msg => `${msg.type}: ${msg.text}`).join('\n');

    return {
      text: `${agentInstructionsTemplate}\n\nConversation History:\n${conversationHistory}\n\nUser Input: ${input.transcribedText}\n\nYour Response:`,
      custom: {},
      metadata: {},
    };
  },
});

const aiAgentChatCompletionFlow = ai.defineFlow(
  {
    name: 'aiAgentChatCompletionFlow',
    inputSchema: AiAgentChatCompletionInputSchema,
    outputSchema: AiAgentChatCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
