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

const prompt = ai.definePrompt({
  name: 'aiAgentChatCompletionPrompt',
  input: {schema: AiAgentChatCompletionInputSchema},
  output: {schema: AiAgentChatCompletionOutputSchema},
  prompt: `You are an AI agent that provides helpful, detailed, and informed answers to user questions. You are given the conversation history to help you understand the context.

  Conversation History:
  {{#each history}}
  {{this.type}}: {{this.text}}{{/each}}

  User Input: {{{transcribedText}}}

  Your Response:`,
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
