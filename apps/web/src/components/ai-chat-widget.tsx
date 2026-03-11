"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  content:
    "Hi! I'm the Scripts Pay AI debugger. Paste an error or describe your integration issue and I'll analyze your recent API logs.",
  createdAt: new Date(0).toISOString(),
};

const QUICK_PROMPTS = [
  "Why did my webhook retry 5 times?",
  "Check why 50,408 VND is still pending",
  "Explain a 401 in the payment intent flow",
];

const STORAGE_KEY = "scripts-ai-chat-history";

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (parsed.length > 0) {
        setMessages([WELCOME_MESSAGE, ...parsed]);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const persisted = messages.filter((message) => message.id !== WELCOME_MESSAGE.id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [messages]);

  function buildMessage(role: ChatMessage["role"], content: string): ChatMessage {
    return {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
    setIsOpen(true);
  }

  function clearConversation() {
    setMessages([WELCOME_MESSAGE]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg = buildMessage("user", query);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiClient<{ answer: string }>("/v1/ai/debug", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      setMessages((prev) => [...prev, buildMessage("ai", data.answer)]);
    } catch {
      toast.error("AI service unavailable", {
        description: "Could not reach the AI debugger. Please try again.",
      });
      setMessages((prev) => [
        ...prev,
        buildMessage(
          "ai",
          "Sorry, I couldn't process your request right now. Please try again in a moment.",
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <Card className="mb-3 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] border-white/70 bg-white/90 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.4)] backdrop-blur-xl">
          <div className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                  <Bot className="h-4 w-4 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Debugger</p>
                  <p className="text-xs text-slate-300">Reads your latest merchant activity before answering</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearConversation}
                  className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Clear chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.4),rgba(255,255,255,0.95))] p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "ai" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-[22px] px-4 py-3 text-sm whitespace-pre-wrap shadow-sm",
                    msg.role === "user"
                      ? "bg-slate-950 text-white"
                      : "border border-white bg-white text-slate-700",
                  )}
                >
                  {msg.content}
                  {msg.id !== WELCOME_MESSAGE.id && (
                    <div
                      className={cn(
                        "mt-2 text-[11px]",
                        msg.role === "user" ? "text-slate-300" : "text-slate-400",
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="rounded-[20px] border border-white bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-white/90 p-3"
          >
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Ask about auth, webhooks, timeout scenarios, or payment intent failures.
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Describe your issue..."
                className="h-12 flex-1 rounded-2xl border-white bg-slate-100/70 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                variant="default"
                className="h-12 w-12 rounded-2xl bg-slate-950 hover:bg-slate-800"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-slate-950 shadow-[0_22px_40px_-18px_rgba(15,23,42,0.65)] hover:bg-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
