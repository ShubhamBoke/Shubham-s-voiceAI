
"use client";

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Cog } from 'lucide-react';

const ConfigurationPanel: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open configuration panel" className="text-foreground hover:bg-primary/20 active:scale-95 transition-transform">
          <Cog className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card text-card-foreground border-border">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Configuration</SheetTitle>
          <SheetDescription className="text-sm">
            Adjust VoiceFlow AI settings here. (Options coming soon!)
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Future settings might include:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>AI Model Selection</li>
            <li>Voice Options</li>
            <li>Language Preferences</li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConfigurationPanel;
