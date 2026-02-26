import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Trash2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "../hooks/useActor";
import { toast } from "sonner";
import type { ChatMessage } from "../backend.d";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 message-bubble">
      <div className="bot-avatar">
        <Bot className="w-3.5 h-3.5 text-cyan-300" />
      </div>
      <div className="typing-indicator-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end message-bubble">
      <div className="user-bubble">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2 message-bubble">
      <div className="bot-avatar">
        <Bot className="w-3.5 h-3.5 text-cyan-300" />
      </div>
      <div className="assistant-bubble">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Explain how black holes work",
  "Give me a Python tip",
  "What happened in 1969?",
  "Tell me a fun fact",
];

function WelcomeState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet/20 to-cyan/10 border border-violet/30">
          <Sparkles className="w-9 h-9 text-violet-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan/20 border border-cyan/40 flex items-center justify-center">
          <Bot className="w-3 h-3 text-cyan-300" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h3 className="font-display text-lg font-700 gradient-text">PlayHub AI</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Ask me anything — games, science, coding, history, or whatever's on your mind.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="suggestion-chip"
            onClick={() => onSuggest(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistantTab() {
  const { actor, isFetching } = useActor();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load chat history on mount once actor is ready
  useEffect(() => {
    if (!actor || isFetching) return;

    let cancelled = false;
    async function loadHistory() {
      try {
        const history: ChatMessage[] = await actor!.getChatHistory();
        if (cancelled) return;
        if (history.length > 0) {
          const display: DisplayMessage[] = [];
          for (const msg of history) {
            display.push({
              id: `${msg.id}-user`,
              role: "user",
              content: msg.userMessage,
            });
            display.push({
              id: `${msg.id}-assistant`,
              role: "assistant",
              content: msg.assistantResponse,
            });
          }
          setMessages(display);
        }
      } catch {
        // History load failure is non-critical
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !actor) return;

    const typingId = `typing-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
      { id: typingId, role: "assistant", content: "", isTyping: true },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response: string = await actor.sendMessage(trimmed);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { id: `assistant-${Date.now()}`, role: "assistant", content: response }
            : m
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, actor]);

  const handleClearChat = useCallback(async () => {
    if (!actor) return;
    try {
      await actor.clearChatHistory();
      setMessages([]);
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear chat history");
    }
  }, [actor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggest = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const hasMessages = messages.length > 0;
  const isActorReady = !!actor && !isFetching;

  return (
    <section className="animate-fade-in-up space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-700 gradient-text">AI Assistant</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your intelligent PlayHub companion
          </p>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            disabled={!isActorReady}
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <div className="ai-chat-container">
        {/* Messages Area */}
        <ScrollArea className="h-[60vh] min-h-[320px]">
          <div className="px-4 py-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="ml-1">Loading history…</span>
                </div>
              </div>
            ) : !hasMessages ? (
              <WelcomeState onSuggest={handleSuggest} />
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => {
                  if (msg.isTyping) return <TypingIndicator key={msg.id} />;
                  if (msg.role === "user") return <UserBubble key={msg.id} content={msg.content} />;
                  return <AssistantBubble key={msg.id} content={msg.content} />;
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Divider */}
        <div className="ai-chat-divider" />

        {/* Input Area */}
        <div className="px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isActorReady ? "Ask me about games, videos, or anything…" : "Connecting…"}
                disabled={isLoading || !isActorReady}
                rows={1}
                className="ai-chat-input resize-none min-h-[42px] max-h-[120px] overflow-y-auto"
                style={{ height: "42px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "42px";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !isActorReady}
              size="icon"
              className="ai-send-button h-[42px] w-[42px] shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-muted-foreground/40 text-[11px] mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </section>
  );
}
