
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioDataUri: string;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioDataUri, autoPlay = false, onPlaybackEnd, className }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current; // Store the current ref value in a variable

    if (audio) {
      audio.src = audioDataUri;

      const setAudioData = () => {
        if (audioRef.current) { // Still good to check inside callbacks
 setDuration(audioRef.current.duration);

          // Trigger playback here after data is loaded
          if (autoPlay && !hasAutoPlayed) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              setHasAutoPlayed(true);
            }).catch(error => console.error("Error attempting to autoplay:", error));
        }
 setDuration(audioRef.current.duration);
        }
      };

      const setAudioTime = () => {
        if (audioRef.current) { // Still good to check inside callbacks
 setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      const handleEnded = () => {
        if (audioRef.current) { // Still good to check inside callbacks
 setIsPlaying(false);
 onPlaybackEnd?.();
        }
      };

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleEnded);
    }
  }, [audioDataUri, autoPlay, hasAutoPlayed, onPlaybackEnd]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className={cn("flex items-center gap-2 p-1 rounded-md bg-white/50 h-8", className)} role="group" aria-label="Audio player controls">
      <audio ref={audioRef} />
      <Button variant="ghost" size="icon" onClick={togglePlayPause} className="text-accent hover:text-accent-foreground hover:bg-accent/20 active:scale-95 transition-transform w-6 h-6" aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>
      <Slider
        value={[currentTime]}
        max={duration || 0}
        step={0.1}
        onValueChange={handleTimeSliderChange}
        className="flex-1 [&>span]:bg-secondary h-1" // Hide the thumb using browser-specific pseudo-elements
        aria-label="Volume"
      />
    </div>
  );
};

export default AudioPlayer;
