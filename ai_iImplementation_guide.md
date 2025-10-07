# **AI Implementation Guide: Integrating Gemini into FPL Manager (Consolidated)**

This document provides a step-by-step technical guide for implementing the AI-powered features discussed in the "AI Integration Strategy" document. All necessary code and instructions are consolidated here.

## **Step 1: Set Up the Gemini API Service**

First, create a dedicated service file to handle all communication with the Gemini API. This centralizes your API logic and makes it reusable across components.

**Create New File:** client/src/lib/gemini-api.ts

// A basic structure for your Gemini API service file

const API\_KEY \= ""; // Keep this empty; it will be handled by the environment  
const API\_URL \= \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API\_KEY}\`;

interface GeminiResponse {  
  candidates: {  
    content: {  
      parts: { text: string }\[\];  
    };  
    groundingMetadata?: {  
      groundingAttributions: {  
        web: {  
          uri: string;  
          title: string;  
        };  
      }\[\];  
    };  
  }\[\];  
}

/\*\*  
 \* Generates content using the Gemini API.  
 \* @param {string} prompt The user's prompt.  
 \* @param {boolean} useSearchGrounding Whether to enable Google Search grounding.  
 \* @param {object|null} responseSchema Optional JSON schema for structured responses.  
 \* @returns {Promise\<any\>} The generated content.  
 \*/  
export async function generateContent(prompt: string, useSearchGrounding: boolean \= false, responseSchema: object | null \= null): Promise\<any\> {  
  const payload: any \= {  
    contents: \[{ parts: \[{ text: prompt }\] }\],  
  };

  if (useSearchGrounding) {  
    payload.tools \= \[{ "google\_search": {} }\];  
  }  
    
  if (responseSchema) {  
    payload.generationConfig \= {  
      responseMimeType: "application/json",  
      responseSchema,  
    };  
  }

  try {  
    // Implement exponential backoff for retries  
    let response;  
    let attempts \= 0;  
    const maxAttempts \= 5;  
    let delay \= 1000;

    while (attempts \< maxAttempts) {  
      response \= await fetch(API\_URL, {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify(payload),  
      });

      if (response.ok) {  
        break; // Success  
      }

      attempts++;  
      if (attempts \>= maxAttempts) {  
        throw new Error(\`API call failed after ${maxAttempts} attempts with status: ${response.status}\`);  
      }  
        
      await new Promise(res \=\> setTimeout(res, delay));  
      delay \*= 2;  
    }

    if (\!response) {  
       throw new Error("API call failed after multiple retries.");  
    }

    const result: GeminiResponse \= await response.json();  
    const candidate \= result.candidates?.\[0\];

    if (\!candidate?.content?.parts?.\[0\]?.text) {  
      throw new Error("Invalid response structure from Gemini API");  
    }

    const text \= candidate.content.parts\[0\].text;  
      
    if (responseSchema) {  
        return JSON.parse(text);  
    }

    const sources \= candidate.groundingMetadata?.groundingAttributions  
      ?.map(attr \=\> ({ uri: attr.web.uri, title: attr.web.title }))  
      .filter(source \=\> source.uri && source.title) || \[\];

    return { text, sources };

  } catch (error) {  
    console.error("Gemini API call error:", error);  
    return { text: "Sorry, I couldn't process that request. Please try again.", sources: \[\] };  
  }  
}

## **Step 2: Implement the Floating "Ask Your AI Analyst"**

This feature will be a floating action button on TeamPage.tsx that opens a chat drawer, complete with suggested prompts.

### **2.1 Update the AIAnalystChat Component**

Modify this component to be the content *inside* the drawer and add the suggestion buttons.

**Modify File:** client/src/components/AIAnalystChat.tsx

import React, { useState, useRef, useEffect } from 'react';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { Input } from '@/components/ui/input';  
import { Button } from '@/components/ui/button';  
import { ScrollArea } from '@/components/ui/scroll-area';  
import { Skeleton } from '@/components/ui/skeleton';  
import { Sparkles } from 'lucide-react';  
import { generateContent } from '@/lib/gemini-api';  
import { Team, Player } from '@/types/fpl';

interface Message {  
  sender: 'user' | 'ai';  
  text: string;  
  sources?: { uri: string; title: string }\[\];  
}

interface AIAnalystChatProps {  
  userTeam: Team;  
  allPlayers: Player\[\];  
}

const suggestedPrompts \= \[  
  "Analyze my team's weaknesses",  
  "Suggest one transfer for this week",  
  "Who are my best captaincy options?",  
  "Should I consider playing my wildcard soon?",  
\];

export function AIAnalystChat({ userTeam, allPlayers }: AIAnalystChatProps) {  
  const \[messages, setMessages\] \= useState\<Message\[\]\>(\[\]);  
  const \[input, setInput\] \= useState('');  
  const \[isLoading, setIsLoading\] \= useState(false);  
  const scrollAreaRef \= useRef\<HTMLDivElement\>(null);

  useEffect(() \=\> {  
    // Auto-scroll to the bottom when new messages are added  
    if (scrollAreaRef.current) {  
        const viewport \= scrollAreaRef.current.querySelector('div');  
        if (viewport) {  
            viewport.scrollTop \= viewport.scrollHeight;  
        }  
    }  
  }, \[messages\]);

  const handleSendMessage \= async (promptText \= input) \=\> {  
    if (\!promptText.trim()) return;

    const userMessage: Message \= { sender: 'user', text: promptText };  
    setMessages(prev \=\> \[...prev, userMessage\]);  
    setInput('');  
    setIsLoading(true);

    const userSquadNames \= userTeam.picks.map(pick \=\> {  
      const player \= allPlayers.find(p \=\> p.id \=== pick.element);  
      return player ? \`${player.web\_name} (£${(player.now\_cost / 10).toFixed(1)}m)\` : '';  
    }).join(', ');  
      
    const fullPrompt \= \`  
      You are an expert Fantasy Premier League (FPL) analyst.  
      My current FPL team is: ${userSquadNames}.  
      My bank is £${(userTeam.transfers.bank / 10).toFixed(1)}m.  
      I have ${userTeam.transfers.limit} free transfers.

      My question is: "${promptText}"

      Provide a concise, expert-level FPL analysis. Use real-time data if necessary to answer. Format your response clearly.  
    \`;

    const aiResponse \= await generateContent(fullPrompt, true);  
      
    const aiMessage: Message \= { sender: 'ai', text: aiResponse.text, sources: aiResponse.sources };  
    setMessages(prev \=\> \[...prev, aiMessage\]);  
    setIsLoading(false);  
  };

  return (  
    \<div className="flex flex-col h-full"\>  
      \<CardHeader\>  
        \<CardTitle className="flex items-center gap-2"\>  
          \<Sparkles className="text-primary" /\>  
          AI FPL Analyst  
        \</CardTitle\>  
      \</CardHeader\>  
      \<CardContent className="flex-1 flex flex-col gap-4"\>  
          \<ScrollArea className="flex-1 p-4 border rounded-md" ref={scrollAreaRef}\>  
            \<div className="space-y-4"\>  
              {messages.length \=== 0 && \!isLoading && (  
                 \<div className="p-4 space-y-4 text-center"\>  
                    \<p className="text-sm font-medium text-muted-foreground"\>Ask me anything about your FPL team or try a suggestion.\</p\>  
                    \<div className="grid grid-cols-2 gap-2"\>  
                        {suggestedPrompts.map(prompt \=\> (  
                            \<Button key={prompt} variant="outline" size="sm" onClick={() \=\> handleSendMessage(prompt)}\>  
                                {prompt}  
                            \</Button\>  
                        ))}  
                    \</div\>  
                \</div\>  
              )}  
              {messages.map((msg, index) \=\> (  
                \<div key={index} className={\`flex ${msg.sender \=== 'user' ? 'justify-end' : 'justify-start'}\`}\>  
                  \<div className={\`p-3 rounded-lg max-w-\[90%\] ${msg.sender \=== 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}\`}\>  
                    \<p className="text-sm whitespace-pre-wrap"\>{msg.text}\</p\>  
                    {msg.sources && msg.sources.length \> 0 && (  
                      \<div className="mt-2 text-xs"\>  
                        \<p className="font-semibold"\>Sources:\</p\>  
                        \<ul className="list-disc pl-4"\>  
                          {msg.sources.map((source, i) \=\> (  
                            \<li key={i}\>\<a href={source.uri} target="\_blank" rel="noopener noreferrer" className="underline"\>{source.title}\</a\>\</li\>  
                          ))}  
                        \</ul\>  
                      \</div\>  
                    )}  
                  \</div\>  
                \</div\>  
              ))}  
              {isLoading && (  
                \<div className="flex justify-start"\>  
                    \<Skeleton className="h-16 w-3/4 rounded-lg" /\>  
                \</div\>  
              )}  
            \</div\>  
          \</ScrollArea\>  
          \<div className="flex gap-2"\>  
            \<Input  
              value={input}  
              onChange={(e) \=\> setInput(e.target.value)}  
              onKeyPress={(e) \=\> e.key \=== 'Enter' && handleSendMessage()}  
              placeholder="Ask about transfers, captains..."  
              disabled={isLoading}  
            /\>  
            \<Button onClick={() \=\> handleSendMessage()} disabled={isLoading}\>  
              Send  
            \</Button\>  
          \</div\>  
      \</CardContent\>  
    \</div\>  
  );  
}

### **2.2 Create the Floating Trigger Component**

This new component will house the floating button and the Drawer that contains the chat interface.

**Create New File:** client/src/components/FloatingAIAnalyst.tsx

import React from 'react';  
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";  
import { Button } from "@/components/ui/button";  
import { Sparkles } from "lucide-react";  
import { AIAnalystChat } from "./AIAnalystChat";  
import { Team, Player } from '@/types/fpl';

interface FloatingAIAnalystProps {  
  userTeam: Team;  
  allPlayers: Player\[\];  
}

export function FloatingAIAnalyst({ userTeam, allPlayers }: FloatingAIAnalystProps) {  
    return (  
        \<Drawer\>  
            \<DrawerTrigger asChild\>  
                \<Button className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-50 animate-pulse"\>  
                    \<Sparkles className="h-8 w-8" /\>  
                \</Button\>  
            \</DrawerTrigger\>  
            \<DrawerContent className="h-\[75vh\] bg-card"\>  
                \<AIAnalystChat userTeam={userTeam} allPlayers={allPlayers} /\>  
            \</DrawerContent\>  
        \</Drawer\>  
    );  
}

### **2.3 Integrate into TeamPage.tsx**

Replace the old embedded chat component with the new floating one.

**Modify File:** client/src/pages/TeamPage.tsx

// ... imports  
// REMOVE: import { AIAnalystChat } from "../components/AIAnalystChat";  
import { FloatingAIAnalyst } from '../components/FloatingAIAnalyst';

export default function TeamPage() {  
  // ... existing hooks and logic

  if (isLoadingTeam || isLoadingPlayers || isLoadingBootstrap || isLoadingFixtures) {  
    // ... loading skeleton  
    return \<div className="p-6"\>...\</div\>  
  }

  if (\!team || \!players || \!bootstrapData || \!fixtures) {  
    // ... error alert  
    return \<div className="p-6"\>...\</div\>  
  }

  // ... rest of the component logic

  return (  
    \<div className="p-6"\>  
      \<div className="space-y-8"\>  
        {/\* ... existing header, captain suggestions, pitch, etc. ... \*/}  
        {/\* REMOVE the old AIAnalystChat Card from here \*/}  
      \</div\>

      {/\* NEW Floating AI Analyst Trigger \*/}  
      \<FloatingAIAnalyst userTeam={team} allPlayers={players} /\>  
    \</div\>  
  );  
}

## **Step 3: Implement AI-Powered Player Scouting Reports**

This implementation remains the same. You will modify the player dialog in PlayersPage.tsx to include an AI-generated report.

**Modify File:** client/src/pages/PlayersPage.tsx

// Add these imports at the top  
import { generateContent } from "@/lib/gemini-api";  
import { Sparkles } from "lucide-react";

export default function PlayersPage() {  
  // Add these new states inside the component  
  const \[aiReport, setAiReport\] \= useState\<string | null\>(null);  
  const \[isReportLoading, setIsReportLoading\] \= useState(false);

  // Add this function inside the component  
  const handleGenerateReport \= async (player: Player) \=\> {  
    setIsReportLoading(true);  
    setAiReport(null);

    const playerData \= {  
      name: player.web\_name,  
      teamId: player.team,  
      form: player.form,  
      ep\_next: player.ep\_next,  
      total\_points: player.total\_points,  
      cost: player.now\_cost / 10,  
      ict\_index: player.ict\_index,  
      goals: player.goals\_scored,  
      assists: player.assists,  
    };  
      
    const prompt \= \`  
      You are an expert Fantasy Premier League analyst.   
      Generate a concise, single-paragraph scouting report for the following player based on the provided data.  
      Focus on their FPL prospects, form, upcoming fixtures, and value.  
        
      Player Data: ${JSON.stringify(playerData)}  
    \`;

    const response \= await generateContent(prompt);  
    setAiReport(response.text);  
    setIsReportLoading(false);  
  };

  // Find the Player Comparison Dialog (\<Dialog open={showComparisonDialog} ...\>) and add the new AI Report section  
  // ... inside your return statement ...  
  return (  
    // ...  
    \<Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}\>  
      \<DialogContent className="max-w-4xl"\>  
        {selectedPlayer && comparisonPlayer && (  
          \<\>  
            {/\* ... existing DialogTitle, Description, and PlayerComparison component ... \*/}  
              
            {/\* NEW AI Report Section \*/}  
            \<div className="mt-4"\>  
              \<Button onClick={() \=\> handleGenerateReport(selectedPlayer)} disabled={isReportLoading}\>  
                \<Sparkles className="mr-2 h-4 w-4" /\>  
                {isReportLoading ? 'Generating...' : \`Generate AI Report for ${selectedPlayer.web\_name}\`}  
              \</Button\>  
                
              {isReportLoading && \<Skeleton className="h-24 mt-2" /\>}  
              {aiReport && (  
                \<Card className="mt-2"\>  
                  \<CardHeader\>  
                    \<CardTitle\>AI Scouting Report\</CardTitle\>  
                  \</CardHeader\>  
                  \<CardContent\>  
                    \<p className="text-sm whitespace-pre-wrap"\>{aiReport}\</p\>  
                  \</CardContent\>  
                \</Card\>  
              )}  
            \</div\>  
          \</\>  
        )}  
      \</DialogContent\>  
    \</Dialog\>  
    // ...  
  );  
}  
