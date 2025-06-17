"use client";
import React, { useState, useEffect, useRef } from 'react';
import AudioRecorder from '@/components/AudioRecorder';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-to-text';
import { aiAgentChatCompletion } from '@/ai/flows/ai-agent-chat-completion';
import { textToSpeechResponse } from '@/ai/flows/text-to-speech-response';
import { useToast } from "@/hooks/use-toast";
import ChatMessage, { ChatMessageRef } from '@/components/ChatMessage';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  timestamp: string; // ISO string for easy sorting/parsing
  autoPlay?: boolean; // For auto-playing new AI audio responses
  status?: 'idle' | 'processing' | 'completed' | 'error'; // Processing status for UI feedback
  // Add a ref for the ChatMessage component instance
  ref?: React.RefObject<ChatMessageRef>;
}

export default function VoiceFlowPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // General processing flag (transcription, AI, TTS)
  const { toast } = useToast();
  const mainRef = useRef<HTMLElement>(null); // Ref for the main scrollable element

  const messageRefs = React.useRef<Map<string, ChatMessageRef>>(new Map());
  // Effect to scroll to bottom or manage focus can be added here if ChatInterface doesn't handle it sufficiently.

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'> & { id?: string }) => {
    const newMessage: Message = {
      id: message.id || `${message.type}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'idle', // Default status
      ...message,
    };
 setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => msg.id === id ? { ...msg, ...updates, autoPlay: updates.autoPlay !== undefined ? updates.autoPlay : msg.autoPlay } : msg)
    );
  };
  
  const stopAllAudio = () => {
    messageRefs.current.forEach((ref) => {
      if (ref && ref.stopAudio) {
        ref.stopAudio();
      }
    });
  };
  
  const handleAudioRecorded = async (audioDataUri: string) => {
    setIsProcessing(true); // Set processing to true at the very beginning    
    const userMessageId = addMessage({ type: 'user', text: "Processing... asdasdas", status: 'processing' }); // Initial user message
    let aiMessageId: string | undefined;
    let aiText: string | undefined; // Declare aiText here so it's available in finally
    try {
      setIsProcessing(true);
      // 1. Transcribe Audio
      const transcriptionResult = await transcribeAudio({ audioDataUri });
      const userText = transcriptionResult.transcription;
      if (!userText.trim()) {
        updateMessage(userMessageId, { text: "Couldn't hear anything. Try again?", status: 'completed' }); // Or 'error'?
      }
      updateMessage(userMessageId, { text: userText, status: 'completed' });
      stopAllAudio(); // Stop any currently playing audio after successful transcription
      // 2. AI Agent Chat Completion
 aiMessageId = addMessage({ type: 'ai', text: "Thinking...", status: 'processing' });
      const aiCompletionResult = await aiAgentChatCompletion({ transcribedText: userText });
      aiText = aiCompletionResult.agentResponse;

      // Final AI message update after both text and audio are ready
      // Ensure aiText is defined before proceeding to TTS and final update
      if (aiText) {
        // 3. Text-to-Speech Response (depends on aiText)
        const ttsResult = await textToSpeechResponse({ text: aiText });

        // Final AI message update after both text and audio are ready
        if (aiMessageId && ttsResult && ttsResult.audioDataUri) { // Check for aiMessageId and ttsResult with audioDataUri
           updateMessage(aiMessageId, { text: aiText, audioUrl: ttsResult.audioDataUri, autoPlay: true, status: 'completed' });
        }  else {
           // Handle cases where TTS failed or didn\'t return audioDataUri
           console.error("TTS failed or did not return audio data.");
           // Update the AI message status to error
            if (aiMessageId) {
               updateMessage(aiMessageId, { text: aiText || "Sorry, I couldn't generate audio.", status: 'error' });
            }
        }
      } else {
         // Handle cases where AI completion did not return aiText
         console.error("AI completion did not return text.");
         if (aiMessageId) {
             updateMessage(aiMessageId, { text: "Sorry, I couldn't generate a response.", status: 'error' });
          }
      }
    } catch (error: any) {
      console.error("VoiceFlow AI Error:", error);
      updateMessage(userMessageId, { status: 'error', text: messages.find(m => m.id === userMessageId)?.status === 'processing' ? "Error processing audio." : messages.find(m => m.id === userMessageId)?.text });
 if (aiMessageId) updateMessage(aiMessageId, { status: 'error', text: messages.find(m => m.id === aiMessageId)?.status === 'processing' ? "Sorry, I couldn't process that." : messages.find(m => m.id === aiMessageId)?.text });

      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: error.message || "Failed to process your request. Please try again.",
      });
    }
     finally {
       setIsProcessing(false);
    }
  };

  // Effect to scroll to the latest message
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [messages]); // Scroll whenever messages change
 

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border flex justify-between items-center shadow-sm bg-card sticky top-0 z-10">
        <h1 className="text-2xl font-headline font-semibold tracking-tight">
          VoiceFlow <span className="text-accent">AI</span>
        </h1>
        <ConfigurationPanel />
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto relative">
        {messages.map((message) => (
           <ChatMessage
            key={message.id}
            message={message}
            // Pass a ref callback to store the ref in the Map
            ref={el => { if (el) messageRefs.current.set(message.id, el); else messageRefs.current.delete(message.id); }}
           />
        ))}
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
