
"use client";

import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@/app/page'; // Assuming Message type is exported from page.tsx

interface ChatInterfaceProps {
  messages: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="h-full w-full p-4" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatInterface;
