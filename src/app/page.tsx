"use client";
import { useCallback } from 'react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import AudioRecorder from '@/components/AudioRecorder';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-to-text';
import { aiAgentChatCompletion } from '@/ai/flows/ai-agent-chat-completion';
import { textToSpeechResponse } from '@/ai/flows/text-to-speech-response';
import { useToast } from "@/hooks/use-toast";
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaLinkedin, FaGithub, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  status: 'processing' | 'completed' | 'error';

  autoPlay?: boolean;
}


interface ChatMessageRef {
  stopAudio: () => void;
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mainRef = useRef<HTMLElement>(null); // Ref for the main scrollable element

  const messageRefs = React.useRef<Map<string, ChatMessageRef>>(new Map());
  // Effect to scroll to bottom or manage focus can be added here if ChatInterface doesn't handle it sufficiently.

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => msg.id === id ? { ...msg, ...updates, autoPlay: updates.autoPlay !== undefined ? updates.autoPlay : msg.autoPlay } : msg)
    );
  };

  // Add a new message and return its ID
  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const id = Date.now().toString(); // Simple unique ID
    const newMessage = { ...message, id };
    setMessages(prev => [...prev, newMessage]);
    return id;
  }, []);


  const [isProcessing, setIsProcessing] = useState<boolean>(false); // General processing flag (transcription, AI, TTS)
  const { toast } = useToast();


  // Effect to scroll to the latest message
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [messages]); // Scroll whenever messages change

  const stopAllAudio = () => {
    messageRefs.current.forEach((ref) => {
      if (ref && ref.stopAudio) {
        ref.stopAudio();
      }
    });
  };

  const handleAudioRecorded = async (audioDataUri: string) => {

    setIsProcessing(true); // Set processing to true at the very beginning    
    const userMessageId = addMessage({ type: 'user', text: "Processing...", status: 'processing' }); // Initial user message
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
      const aiCompletionResult = await aiAgentChatCompletion({
        transcribedText: userText,
        history: messages.map(msg => ({ type: msg.type, text: msg.text })), // Pass formatted history
      });
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
           // Handle cases where TTS failed or didn't return audioDataUri
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
        description: error instanceof Error ? error.message : "Failed to process your request. Please try again.",
      });
    }
     finally {
       setIsRecording(false); // Stop recording indicator
       setIsProcessing(false);
    }
  };

  const projects = useMemo(() => [
    {
      name: "Beat",
      shortDescription: "A rhythm-based 3D mobile game where you guide a glowing line through music-synced worlds.",
      longDescription: `Beat is a visually immersive 3D rhythm game built with Next.js and Three.js. Players control a glowing line, weaving through dynamic tracks that pulse and shift to the beat of the music.\n\nKey Features:\n- Procedural level generation based on music tracks\n- AI-powered 3D asset creation and placement\n- Real-time visual effects and smooth controls\n- Backend with Node, Prisma, and PostgreSQL for user data and leaderboards`,
      technologies: ["NextJS", "Three.js", "Node", "Prisma", "PostgreSQL"],
      link: "#",
    },
    {
      name: "Personalized AI Voice Chatbot",
      shortDescription: "A conversational AI chatbot with natural voice, built using Google Gemini Genkit and Murf AI.",
      longDescription: `This project is a smart voice-enabled chatbot web app. Users can chat naturally and receive instant, lifelike voice responses.\n\nHighlights:\n- Google Gemini Genkit for advanced conversational AI\n- Murf AI for expressive, human-like voice output\n- Modern Next.js frontend with seamless voice/text interaction`,
      technologies: ["NextJS", "Google Gemini Genkit", "Murf AI"],
      link: "#",
    },
    {
      name: "Tiffin Service Management System",
      shortDescription: "A full-stack PWA for automating tiffin bookings, subscriptions, and business management.",
      longDescription: `A robust web app that streamlines daily tiffin operations for both customers and admins.\n\nFeatures:\n- Customers: Book/cancel tiffins, manage subscriptions, view menus, track deliveries, and access billing history\n- Admins: Manage orders, update menus, track users, respond to queries, and view business analytics\n- Secure REST APIs (Spring Boot, JWT), MySQL database, and PWA support for offline use`,
      technologies: ["NextJS", "Spring Boot", "Spring Security", "JWT", "JPA Hibernate", "MySQL", "PWA"],
      link: "#",
    },
  ], []);
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-200">
      <header className="p-6 border-b border-gray-800 flex justify-between items-center shadow-xl bg-black bg-opacity-50 sticky top-0 z-20 backdrop-blur-sm">
        <h1 className="text-3xl font-headline font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Shubham&apos;s Portfolio
        </h1>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#profile" className="hover:text-blue-400 transition-colors">Profile</a></li>
            <li><a href="#experience" className="hover:text-blue-400 transition-colors">Experience</a></li>
            <li><a href="#qualification" className="hover:text-blue-400 transition-colors">Qualification</a></li>
            <li><a href="#projects" className="hover:text-blue-400 transition-colors">Projects</a></li>
            <li><a href="#voice-assistant" className="hover:text-blue-400 transition-colors">Voice AI</a></li>
            <li><a href="/Shubham_s_Resume.pdf" download="Shubham_s_Resume.pdf" type="application/pdf" className="hover:text-blue-400 transition-colors">Resume</a></li>
          </ul>
        </nav>
      </header>

      <main ref={mainRef} className="flex-1 overflow-x-hidden relative p-6 container mx-auto">
        {/* Profile Section */}
        <section id="profile" className="my-20 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg">
              <img
                src="/Photo.jpg"
                alt="Shubham"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black opacity-50"></div>
            </div>
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-5xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                Hi, I&apos;m Shubham
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-6">
                A passionate Software Engineer with a focus on creating innovative solutions and exploring the exciting world of AI and voice interfaces. I build robust and scalable applications with a keen eye for user experience and modern technologies.
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <a href="https://www.linkedin.com/in/shubham-boke" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <FaLinkedin size={40} color="#d1d5db" />
                </a>
                <a href="https://github.com/ShubhamBoke" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <FaGithub size={40} color="#d1d5db" />
                </a>
                <a href="mailto:shubhamboke.99@gmail.com" aria-label="Email">
                  <FaEnvelope size={40} color="#d1d5db" />
                </a>
                <a
                  href="https://wa.me/7218824832"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={40} color="#d1d5db" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-20 bg-gray-700 animate-fade-in" />

        {/* Experience Section */}
        <section id="experience" className="my-20 animate-fade-in text-left justify-left ml-12">
          <h2 className="text-4xl font-headline font-bold text-left text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12">Experience</h2>
          <div className="max-w-2xl text-gray-400 leading-relaxed">
            <p className="mb-4">
              <p className='text-xl text-white'>Software Engineer at <strong>RapidKen.AI</strong></p>

              Gained industry experience in Web Development, Python Flask, Spring Framework, and Google Cloud Platform. Improved product performance and reduced operational costs by optimizing backend services and implementing efficient data handling, while ensuring reliability through comprehensive testing.
            </p>
          </div>
        </section>

        <Separator className="my-20 bg-gray-700 animate-fade-in" />

        {/* Qualification Section */}
        <section id="qualification" className="my-20 animate-fade-in text-left ml-12">
          <h2 className="text-4xl font-headline font-bold text-left text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12">
            Qualification
          </h2>
          <div className="max-w-2xl text-gray-400 leading-relaxed">
            <p className='text-white'>
              <strong>B.Tech</strong> at College of Engineering Pune. Major in <strong>Computer Science Engineering</strong>.
            </p>
          </div>
        </section>

        <Separator className="my-20 bg-gray-700 animate-fade-in" />

        {/* Projects Section */}
        <section id="projects" className="my-20 animate-fade-in">
          <h2 className="text-4xl font-headline font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12">
            My Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
            {projects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>

        </section>
        <Separator className="my-20 bg-gray-700 animate-fade-in" />
        {/* Voice Assistant Section */}
        <section id="voice-assistant" className="my-20 animate-fade-in">
          <h2 className="text-4xl font-headline font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12">
            Interactive Voice Assistant
          </h2>
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gray-800 text-gray-200 border-gray-700">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-xl font-semibold text-blue-300">Chat with Shubham</CardTitle>
                <ConfigurationPanel />
              </CardHeader>
              <CardContent>
                 <ChatInterface 
                   messages={messages}
                 />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="p-6 border-t border-gray-800 bg-black bg-opacity-50 shadow-lg sticky bottom-0 z-10 backdrop-blur-sm flex justify-center items-center">
        <AudioRecorder
          onRecordingComplete={handleAudioRecorded}
          isParentRecording={isRecording}
          setIsParentRecording={setIsRecording}
          disabled={isProcessing && !isRecording}
        />
        <p className="ml-4 text-gray-400 text-sm">
          Speak with Me!
        </p>
      </footer>
    </div>
  );
}


// Expandable Project Card Component
function ProjectCard({ project }: { project: any }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Card
      className={`bg-gray-800 text-gray-200 border-gray-700 hover:border-blue-500 transition-colors duration-300 cursor-pointer ${expanded ? 'ring-2 ring-blue-400' : ''}`}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          {project.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 mb-2">
          {project.shortDescription}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech: string, techIndex: number) => (
            <Badge key={techIndex} variant="secondary" className="bg-gray-700 text-gray-300 hover:bg-gray-600">{tech}</Badge>
          ))}
        </div>
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${expanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'} text-gray-300 whitespace-pre-line`}
          style={{ willChange: 'max-height, opacity' }}
        >
          {project.longDescription}
        </div>
      </CardContent>
    </Card>
  );
}
