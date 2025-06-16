
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
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioDataUri;

      const setAudioData = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
          setCurrentTime(audioRef.current.currentTime);
        }
      };

      const setAudioTime = () => {
        if (audioRef.current) {
         setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        onPlaybackEnd?.();
      };

      audioRef.current.addEventListener('loadeddata', setAudioData);
      audioRef.current.addEventListener('timeupdate', setAudioTime);
      audioRef.current.addEventListener('ended', handleEnded);
      
      if (autoPlay && !hasAutoPlayed) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setHasAutoPlayed(true);
        }).catch(error => console.error("Error attempting to autoplay:", error));
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadeddata', setAudioData);
          audioRef.current.removeEventListener('timeupdate', setAudioTime);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
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

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-md bg-secondary/50", className)} role="group" aria-label="Audio player controls">
      <audio ref={audioRef} />
      <Button variant="ghost" size="icon" onClick={togglePlayPause} className="text-accent hover:text-accent-foreground hover:bg-accent/20 active:scale-95 transition-transform" aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>
      <div className="text-xs w-10 text-muted-foreground">{formatTime(currentTime)}</div>
      <Slider
        value={[currentTime]}
        max={duration || 0}
        step={0.1}
        onValueChange={handleTimeSliderChange}
        className="flex-1 [&>span]:bg-accent"
        aria-label="Audio progress"
      />
      <div className="text-xs w-10 text-muted-foreground">{formatTime(duration)}</div>
      <Button variant="ghost" size="icon" onClick={toggleMute} className="text-accent hover:text-accent-foreground hover:bg-accent/20 active:scale-95 transition-transform" aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>
      <Slider
        value={[volume]}
        max={1}
        step={0.01}
        onValueChange={handleVolumeChange}
        className="w-20 [&>span]:bg-accent"
        aria-label="Volume"
      />
    </div>
  );
};

export default AudioPlayer;
