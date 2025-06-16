
"use client";

import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import AudioRecorder from '@/components/AudioRecorder';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-to-text';
import { aiAgentChatCompletion } from '@/ai/flows/ai-agent-chat-completion';
import { textToSpeechResponse } from '@/ai/flows/text-to-speech-response';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  timestamp: string; // ISO string for easy sorting/parsing
  autoPlay?: boolean; // For auto-playing new AI audio responses
}

export default function VoiceFlowPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // General processing flag (transcription, AI, TTS)
  const { toast } = useToast();

  // Effect to scroll to bottom or manage focus can be added here if ChatInterface doesn't handle it sufficiently.

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'> & { id?: string }) => {
    const newMessage: Message = {
      id: message.id || `${message.type}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...message,
    };
    setMessages(prev => [...prev.map(m => ({ ...m, autoPlay: false })), newMessage]); // Ensure only latest can autoplay
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => msg.id === id ? { ...msg, ...updates, autoPlay: updates.autoPlay !== undefined ? updates.autoPlay : msg.autoPlay } : {...msg, autoPlay: false})
    );
  };

  const handleAudioRecorded = async (audioDataUri: string) => {
    setIsProcessing(true);

    const userMessageId = addMessage({ type: 'user', text: "🎤 Processing your audio..." });

    try {
      // 1. Transcribe Audio
      updateMessage(userMessageId, { text: "🎤 Transcribing..." });
      const transcriptionResult = await transcribeAudio({ audioDataUri });
      const userText = transcriptionResult.transcription;
      if (!userText.trim()) {
        updateMessage(userMessageId, { text: "🎤 Couldn't hear anything. Try again?" });
        setIsProcessing(false);
        return;
      }
      updateMessage(userMessageId, { text: userText });

      // 2. AI Agent Chat Completion
      const aiMessageId = addMessage({ type: 'ai', text: "🤖 Thinking..." });
      const aiCompletionResult = await aiAgentChatCompletion({ transcribedText: userText });
      const aiText = aiCompletionResult.agentResponse;
      updateMessage(aiMessageId, { text: aiText });

      // 3. Text-to-Speech Response
      updateMessage(aiMessageId, { text: `${aiText}\n\n🔊 Synthesizing audio...` });
      const ttsResult = await textToSpeechResponse({ text: aiText });
      updateMessage(aiMessageId, { text: aiText, audioUrl: ttsResult.audioDataUri, autoPlay: true });

    } catch (error: any) {
      console.error("VoiceFlow AI Error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: error.message || "Failed to process your request. Please try again.",
      });
      // Update messages to reflect error state
      updateMessage(userMessageId, { text: messages.find(m=>m.id === userMessageId)?.text.startsWith("🎤") ? "Error processing audio." : messages.find(m=>m.id === userMessageId)?.text });
      const currentAiMessage = messages.find(m => m.type === 'ai' && m.text === "🤖 Thinking...");
      if (currentAiMessage) {
        updateMessage(currentAiMessage.id, { text: "Sorry, I couldn't process that." });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border flex justify-between items-center shadow-sm bg-card sticky top-0 z-10">
        <h1 className="text-2xl font-headline font-semibold tracking-tight">
          VoiceFlow <span className="text-accent">AI</span>
        </h1>
        <ConfigurationPanel />
      </header>

      <main className="flex-1 overflow-hidden relative">
        <ChatInterface messages={messages} />
        {isProcessing && !isRecording && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-xl">
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <p className="text-lg font-medium text-foreground">Processing your request...</p>
              <p className="text-sm text-muted-foreground">Please wait a moment.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 border-t border-border bg-card shadow-md_ sticky bottom-0 z-10">
        <AudioRecorder
          onRecordingComplete={handleAudioRecorded}
          isParentRecording={isRecording}
          setIsParentRecording={setIsRecording}
          disabled={isProcessing && !isRecording}
        />
      </footer>
    </div>
  );
}
