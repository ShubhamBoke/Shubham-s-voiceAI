import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio-to-text.ts';
import '@/ai/flows/text-to-speech-response.ts';
import '@/ai/flows/ai-agent-chat-completion.ts';