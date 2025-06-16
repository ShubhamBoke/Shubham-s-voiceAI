
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { cn } from '@/lib/utils';
import type { Message } from '@/app/page'; // Assuming Message type is exported from page.tsx

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div className={cn("flex items-end gap-2 my-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 self-start shadow-sm">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        "max-w-[75%] md:max-w-[60%] shadow-md transition-all duration-300 ease-out",
        isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-card-foreground rounded-tl-none"
      )}>
        <CardContent className="p-3">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          {!isUser && message.audioUrl && (
            <div className="mt-2">
              <AudioPlayer audioDataUri={message.audioUrl} autoPlay={!!message.autoPlay} />
            </div>
          )}
           <div className="text-xs mt-1 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8 self-start shadow-sm">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User size={20} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
