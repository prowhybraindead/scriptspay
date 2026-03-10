"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "ai",
  content:
    "Hi! I'm the Scripts Pay AI debugger. Paste an error or describe your integration issue and I'll analyze your recent API logs.",
};

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiClient<{ answer: string }>("/v1/ai/debug", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch {
      toast.error("AI service unavailable", {
        description: "Could not reach the AI debugger. Please try again.",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Sorry, I couldn't process your request right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {isOpen && (
        <Card className="mb-3 flex h-[480px] w-[380px] flex-col overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">
                AI Support
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-primary-foreground/80 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
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
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t bg-card p-3"
          >
            <Input
              placeholder="Describe your issue..."
              className="flex-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              variant="default"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}

      {/* Floating bubble */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
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
