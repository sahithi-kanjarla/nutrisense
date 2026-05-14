import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@shared/schema";

export function ChatPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: conversations = [], isLoading: convLoading } = useQuery<Conversation[]>({ 
    queryKey: ["/api/conversations"] 
  });

  const { data: messages = [], isLoading: msgLoading } = useQuery<Message[]>({ 
    queryKey: [`/api/conversations/${activeConversationId}/messages`],
    enabled: !!activeConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setActiveConversationId(data.id);
    },
  });

  // Automatically select the first conversation or create one
  useEffect(() => {
    if (!convLoading) {
      if (conversations.length > 0 && !activeConversationId) {
        setActiveConversationId(conversations[0].id);
      } else if (conversations.length === 0 && !createConversation.isPending) {
        createConversation.mutate("NutriSense AI Assistant");
      }
    }
  }, [conversations, convLoading, activeConversationId, createConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConversationId || isStreaming) return;
    
    const userMsg = input.trim();
    setInput("");
    
    // Optimistically update the UI with user's message
    queryClient.setQueryData(
      [`/api/conversations/${activeConversationId}/messages`],
      (old: Message[] | undefined) => [
        ...(old || []),
        { id: Date.now(), role: "user", content: userMsg, conversationId: activeConversationId } as Message
      ]
    );

    setIsStreaming(true);
    setStreamedContent("");

    try {
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader available");

      let finalContent = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                finalContent += data.content;
                setStreamedContent(finalContent);
              }
              if (data.error) {
                toast({ title: "Error", description: data.error, variant: "destructive" });
              }
            } catch (e) {
              // ignore incomplete JSON chunk
            }
          }
        }
      }
      
      // Invalidate to get the saved messages
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${activeConversationId}/messages`] });
    } catch (e: any) {
      toast({ title: "Failed to send message", description: e.message, variant: "destructive" });
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
    }
  };

  return (
    <section className="relative w-full px-8 pt-12 pb-24 h-screen flex flex-col">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 flex-1 min-h-0">
        <header className="flex flex-col gap-2 shrink-0">
          <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">YOUR PERSONAL ASSISTANT</p>
          <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-tight text-[#31332c]">NutriSense AI</h2>
          <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">Ask anything about your health goals, pantry, or meal ideas.</p>
        </header>

        <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none flex-1 min-h-0 flex flex-col overflow-hidden">
          <CardContent className="p-8 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 pb-4">
              {messages.length === 0 && !msgLoading && !isStreaming && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                  <span className="text-5xl mb-4">✨</span>
                  <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-lg font-bold text-[#31332c]">How can I help you today?</p>
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058] max-w-md mt-2">
                    I have full context of your pantry, profile, and goals. Ask me for recipes, nutrition advice, or grocery lists!
                  </p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-[24px] px-6 py-4 text-sm [font-family:'Manrope',Helvetica] ${
                    msg.role === "user"
                      ? "bg-[#1c6d25] text-[#eaffe2]"
                      : "bg-white text-[#31332c] border border-[#e2e3d9]"
                  }`}>
                    {msg.role === "user" ? (
                       <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                    ) : (
                       // Simple formatting for AI response
                       <div className="whitespace-pre-line leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1" 
                            dangerouslySetInnerHTML={{ __html: msg.content.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') }} />
                    )}
                  </div>
                </div>
              ))}
              
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-[24px] px-6 py-4 text-sm [font-family:'Manrope',Helvetica] bg-white text-[#31332c] border border-[#e2e3d9]">
                    {streamedContent ? (
                       <div className="whitespace-pre-line leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1" 
                            dangerouslySetInnerHTML={{ __html: streamedContent.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') }} />
                    ) : (
                      <div className="flex gap-1.5 items-center h-5">
                        <span className="w-2 h-2 bg-[#1c6d25] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-[#1c6d25] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-[#1c6d25] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="pt-4 border-t border-[#b1b3a94c] shrink-0">
              <div className="relative flex items-center">
                <Input
                  placeholder="Ask NutriSense AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isStreaming && sendMessage()}
                  className="rounded-full border-0 bg-white shadow-sm pr-24 pl-6 h-14 text-base [font-family:'Manrope',Helvetica] focus-visible:ring-2 focus-visible:ring-[#1c6d25]"
                  disabled={isStreaming}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isStreaming || !input.trim()}
                  className="absolute right-2 rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20] h-10 px-6"
                >
                  Send
                </Button>
              </div>
              <p className="mt-3 text-center text-xs [font-family:'Manrope',Helvetica] text-[#b1b3a9]">
                NutriSense AI can make mistakes. Verify important dietary information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
