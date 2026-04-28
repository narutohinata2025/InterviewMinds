import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Live2DAvatar, { Live2DAvatarHandle } from "../components/Live2DAvatar";
import UserCamera from "../components/UserCamera";
import ChatPanel, { ChatMessage } from "../components/ChatPanel";
import CodeEditor from "../components/CodeEditor";
import VADWaveform from "../components/VADWaveform";
import ProctoringHUD from "../components/ProctoringHUD";
import { useContinuousSpeech } from "../hooks/useContinuousSpeech";
import { useAvatarLipSync } from "../hooks/useAvatarLipSync";
import { useProctoring } from "../hooks/useProctoring";
import { sendMessage, endInterview } from "../services/api";

export default function InterviewRoom() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId") || "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const messagesRef = useRef<ChatMessage[]>([]);
  const avatarRef = useRef<Live2DAvatarHandle>(null);
  const isProcessingRef = useRef(false);

  const proctoring = useProctoring(true);

  const lipSync = useAvatarLipSync({
    onSpeechStart: () => setIsAISpeaking(true),
    onSpeechEnd: () => {
      setIsAISpeaking(false);
      isProcessingRef.current = false;
      speech.resumeAfterAI();
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const model = avatarRef.current?.getModel();
      if (model) {
        lipSync.setModel(model);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lipSync]);

  const handleTranscriptReady = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || isProcessingRef.current) return;

      isProcessingRef.current = true;
      speech.pauseForAI();

      const userMsg: ChatMessage = { role: "user", content: transcript };
      messagesRef.current = [...messagesRef.current, userMsg];
      setMessages([...messagesRef.current]);
      setIsThinking(true);

      try {
        const { reply } = await sendMessage(sessionId, transcript);
        const aiMsg: ChatMessage = { role: "assistant", content: reply };
        messagesRef.current = [...messagesRef.current, aiMsg];
        setMessages([...messagesRef.current]);
        setIsThinking(false);

        await lipSync.speak(reply);
      } catch (error) {
        console.error("Chat error:", error);
        setIsThinking(false);
        isProcessingRef.current = false;
        speech.resumeAfterAI();
      }
    },
    [sessionId]
  );

  const speech = useContinuousSpeech({
    onTranscriptReady: handleTranscriptReady,
    silenceTimeout: 1500,
    enabled: true,
  });

  // Auto-start everything on room entry — no manual controls
  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    window.speechSynthesis?.getVoices();

    const startInterview = async () => {
      // Auto-start mic + VAD immediately
      await speech.start();

      // Send initial greeting automatically
      try {
        speech.pauseForAI();
        setIsThinking(true);
        const { reply } = await sendMessage(sessionId, "Hello, I'm ready for the interview.");
        const aiMsg: ChatMessage = { role: "assistant", content: reply };
        messagesRef.current = [aiMsg];
        setMessages([aiMsg]);
        setIsThinking(false);
        await lipSync.speak(reply);
      } catch (error) {
        console.error("Init error:", error);
        setIsThinking(false);
        speech.resumeAfterAI();
      }
    };

    const timerId = setTimeout(startInterview, 1500);
    return () => clearTimeout(timerId);
  }, [sessionId]);

  const handleEndInterview = useCallback(async () => {
    if (messagesRef.current.length < 1) return;

    setIsEnding(true);
    speech.stop();
    lipSync.cancelSpeech();

    try {
      const result = await endInterview(sessionId);
      sessionStorage.setItem("interviewResult", JSON.stringify(result));
      navigate("/feedback");
    } catch (error) {
      console.error("End interview error:", error);
      setIsEnding(false);
    }
  }, [sessionId, navigate, speech, lipSync]);

  const lastAiMessage =
    messagesRef.current.length > 0 &&
    messagesRef.current[messagesRef.current.length - 1]?.role === "assistant"
      ? messagesRef.current[messagesRef.current.length - 1].content
      : "";

  return (
    <div className="interview-room">
      {/* Left Panel — Avatar */}
      <div className="avatar-panel">
        <div className="avatar-header">
          <div className="interviewer-info">
            <div className="interviewer-avatar-badge">A</div>
            <div>
              <div className="interviewer-name">Aria</div>
              <div className="interviewer-status">
                {isAISpeaking ? "Speaking..." : isThinking ? "Thinking..." : "Listening"}
              </div>
            </div>
          </div>
        </div>

        <Live2DAvatar ref={avatarRef} isSpeaking={isAISpeaking} />

        <div className={`avatar-glow ${isAISpeaking ? "speaking" : ""}`} />

        {isAISpeaking && lastAiMessage && (
          <div className="speech-bubble">
            {lastAiMessage.substring(0, 160)}
            {lastAiMessage.length > 160 ? "..." : ""}
          </div>
        )}
      </div>

      {/* Right Panel — Camera, Chat, VAD, Controls */}
      <div className="right-panel" style={{ position: "relative" }}>
        <UserCamera />

        <ChatPanel
          messages={messages}
          isThinking={isThinking}
          currentTranscript={speech.transcript}
        />

        {/* Subtle VAD indicator — no manual controls */}
        <div className="vad-section">
          <VADWaveform
            volume={speech.volume}
            isListening={speech.isListening}
            isSpeaking={speech.isSpeaking}
            isAISpeaking={isAISpeaking}
          />
          <span className={`vad-status ${speech.isListening ? "listening" : ""} ${isAISpeaking ? "speaking" : ""}`}>
            {isAISpeaking
              ? "Aria is speaking..."
              : speech.isSpeaking
              ? "Listening to you..."
              : speech.isListening
              ? "Ready — speak naturally"
              : "Initializing..."}
          </span>
        </div>

        {/* Controls */}
        <div className="interview-controls">
          <ProctoringHUD
            tabSwitchCount={proctoring.tabSwitchCount}
            isTabVisible={proctoring.isTabVisible}
            duration={proctoring.formatDuration(proctoring.interviewDuration)}
          />
          <div className="controls-right">
            <button
              className="btn-secondary"
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              style={{ fontSize: "13px", padding: "8px 16px" }}
            >
              {showCodeEditor ? "Close Editor" : "Code Editor"}
            </button>
            <button
              className="btn-danger"
              onClick={handleEndInterview}
              disabled={messagesRef.current.length < 1 || isEnding}
              style={{ fontSize: "13px", padding: "8px 16px" }}
            >
              {isEnding ? "Generating Report..." : "End Interview"}
            </button>
          </div>
        </div>

        {showCodeEditor && (
          <CodeEditor onClose={() => setShowCodeEditor(false)} />
        )}
      </div>
    </div>
  );
}
