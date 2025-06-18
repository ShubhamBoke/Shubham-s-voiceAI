
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onRecordingComplete: (audioDataUri: string) => void;
  isParentRecording: boolean;
  setIsParentRecording: (isRecording: boolean) => void;
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete, 
  isParentRecording, 
  setIsParentRecording,
  disabled = false 
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [permissionError, setPermissionError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Clean up MediaRecorder if component unmounts while recording
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setPermissionError(false);
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsParentRecording(true);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onRecordingComplete(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionError(true);
      setIsParentRecording(false);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to record audio.",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsParentRecording(false);
  };

  const isLoading = isInitializing || (isParentRecording && mediaRecorderRef.current?.state === "inactive");

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {permissionError && (
        <div className="flex items-center text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Microphone access denied. Please check browser permissions.
        </div>
      )}
      <Button
        onClick={isParentRecording ? stopRecording : startRecording}
        disabled={disabled || isInitializing}
        className="w-full max-w-xs text-lg py-6 rounded-xl shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-all duration-150 transform focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-live="polite"
        aria-label={isParentRecording ? "Stop Recording" : "Speak"}
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 mr-2 animate-spin" />
        ) : isParentRecording ? (
          <StopCircle className="w-8 h-8 mr-2 animate-pulse-opacity" />
        ) : (
          <Mic className="w-8 h-8 mr-2" />
        )}
        {isLoading ? "Initializing..." : isParentRecording ? "Stop Recording" : "Speak"}
      </Button>
      {isParentRecording && <p className="text-sm text-muted-foreground animate-pulse-opacity">Recording in progress...</p>}
    </div>
  );
};

export default AudioRecorder;
