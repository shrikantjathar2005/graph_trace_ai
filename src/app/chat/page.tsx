"use client";

import React, { useState } from "react";
import { Send, Bot, User, Sparkles, ArrowRight, CornerDownRight, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiService } from "@/services/api";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  reasoningPath?: string[];
  confidence?: number;
}

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: "ai",
    text: "Welcome to the GraphTrace demo. Ask about a requirement or project topic to retrieve connected artifacts from the sample knowledge graph. Each response shows its graph evidence path.",
  },
];

const samplePrompts = [
  "Show tests mapped to payment processing",
  "Trace path from payment processing to audit ledger",
  "Which requirements are currently untested?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await apiService.queryNaturalLanguage(textToSend);
      if (res.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.data.answer,
          reasoningPath: res.data.reasoningPath,
          confidence: res.data.confidence,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <PageContainer
      title="GraphRAG AI Assistant & Path Explainability"
      description="Query your codebase using natural language. GraphTrace explains its reasoning with explicit graph traversal paths."
      breadcrumbs={[{ label: "FinTrack Banking Core" }, { label: "AI Reasoning" }]}
    >
      <div className="flex flex-col h-[calc(100vh-210px)] max-w-4xl mx-auto">
        {/* Sample Prompt Chips */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono text-zinc-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Suggestions:
          </span>
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 shrink-0 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg border border-zinc-800/80 bg-zinc-950/60 mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl space-y-2 p-3.5 rounded-lg leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "bg-zinc-900/80 text-zinc-200 border border-zinc-800/90 shadow-sm"
                }`}
              >
                <p>{msg.text}</p>

                {/* Graph Traversal Explainability Path */}
                {msg.reasoningPath && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-2">
                      <span className="font-semibold flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3" /> Graph Reasoning Traversal
                      </span>
                      {msg.confidence && (
                        <span className="text-zinc-400">
                          Confidence: {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 bg-zinc-950/70 p-2.5 rounded border border-zinc-800 font-mono text-[11px] text-zinc-300">
                      {msg.reasoningPath.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-zinc-600 text-[10px] w-3">{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 text-xs items-center text-zinc-500 font-mono">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Traversing knowledge graph and formulating reasoning path...</span>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask GraphTrace AI (e.g. 'What breaks if I change JWT expiration logic?')..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-sans"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Send className="w-3.5 h-3.5" />}
            disabled={!input.trim() || isTyping}
          >
            Ask
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
