// This file is generated by Firebase Studio.
'use server';
/**
 * @fileOverview Converts the AI agent's text response into audio using text-to-speech.
 *
 * - textToSpeechResponse - A function that handles the text-to-speech conversion process.
 * - TextToSpeechResponseInput - The input type for the textToSpeechResponse function.
 * - TextToSpeechResponseOutput - The return type for the textToSpeechResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextToSpeechResponseInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechResponseInput = z.infer<typeof TextToSpeechResponseInputSchema>;

const TextToSpeechResponseOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio data URI of the converted text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // keep the backslashes, to prevent the AI from thinking the quote ends early.
    ),
});
export type TextToSpeechResponseOutput = z.infer<typeof TextToSpeechResponseOutputSchema>;

// Define the Murf.ai API key (replace with your actual key)
const MURF_AI_API_KEY = "ap2_93211557-da4b-45d9-9033-78ccad53e0a1"; // Replace with your actual API key
const MURF_AI_API_URL = "https://api.murf.ai/v1/speech/generate";

export async function textToSpeechResponse(input: TextToSpeechResponseInput): Promise<TextToSpeechResponseOutput> {
  return textToSpeechResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textToSpeechResponsePrompt',
  input: {schema: TextToSpeechResponseInputSchema},
  output: {schema: TextToSpeechResponseOutputSchema},
  prompt: `Convert the following text to speech and return the audio data URI.

Text: {{{text}}}`, //triple brace.
  model: 'googleai/gemini-2.0-flash-exp',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

export async function textToSpeechResponseFlow(input: TextToSpeechResponseInput): Promise<TextToSpeechResponseOutput> {
  try {
    const response = await fetch(MURF_AI_API_URL, {
      method: "POST",
      headers: {
        "Api-Key": MURF_AI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "text": input.text,
        "voice_id":"en-IN-rohan",
        "rate": 20
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Murf.ai API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const body = await response.json();

    if (!body.audioFile) {
       throw new Error("Murf.ai API response did not contain an audioFile URL.");
    }

    // Murf.ai returns a direct audio file URL, not a data URI.
    // Return the URL directly to the frontend to be used by the AudioPlayer.
    return { audioDataUri: body.audioFile };

  } catch (error: any) {
    console.error("Error in textToSpeechResponse:", error);
    throw new Error(`Failed to synthesize speech: ${error.message}`);
  }
}
