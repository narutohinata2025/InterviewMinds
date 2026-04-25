import { useEffect, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isThinking: boolean;
  currentTranscript?: string;
}

export default function ChatPanel({ messages, isThinking, currentTranscript }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, currentTranscript]);

  return (
    <div className="chat-section">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role === "assistant" ? "ai" : "user"}`}>
            <div className="msg-role">
              {msg.role === "assistant" ? "Aria" : "You"}
            </div>
            {msg.content}
          </div>
        ))}

        {currentTranscript && (
          <div className="chat-msg user" style={{ opacity: 0.6 }}>
            <div className="msg-role">You (speaking...)</div>
            {currentTranscript}
          </div>
        )}

        {isThinking && (
          <div className="chat-msg thinking">
            <div className="msg-role">Aria</div>
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
