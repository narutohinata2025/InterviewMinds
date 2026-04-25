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

  const proctoring = useProctoring(true);

  const lipSync = useAvatarLipSync({
    onSpeechStart: () => setIsAISpeaking(true),
    onSpeechEnd: () => {
      setIsAISpeaking(false);
      speech.resumeAfterAI();
    },
  });

  // Set model for lip-sync when avatar loads
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
      if (!transcript.trim() || isThinking) return;

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

        // Speak the response with lip-sync
        speech.pauseForAI();
        await lipSync.speak(reply);
      } catch (error) {
        console.error("Chat error:", error);
        setIsThinking(false);
        speech.resumeAfterAI();
      }
    },
    [sessionId, isThinking]
  );

  const speech = useContinuousSpeech({
    onTranscriptReady: handleTranscriptReady,
    silenceTimeout: 1500,
    enabled: true,
  });

  // Start VAD and send initial greeting
  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    // Load voices
    window.speechSynthesis?.getVoices();

    const startInterview = async () => {
      // Start listening
      await speech.start();

      // Send initial greeting
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

    // Small delay for avatar to load
    setTimeout(startInterview, 2000);
  }, [sessionId]);

  const handleEndInterview = useCallback(async () => {
    if (messagesRef.current.length < 1) return;

    setIsEnding(true);
    speech.stop();
    lipSync.cancelSpeech();

    try {
      const result = await endInterview(sessionId);
      // Store result for feedback page
      sessionStorage.setItem("interviewResult", JSON.stringify(result));
      navigate("/feedback");
    } catch (error) {
      console.error("End interview error:", error);
      setIsEnding(false);
    }
  }, [sessionId, navigate, speech, lipSync]);

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

        {/* Speech bubble showing latest AI message */}
        {isAISpeaking && messagesRef.current.length > 0 && (
          <div className="speech-bubble">
            {messagesRef.current[messagesRef.current.length - 1]?.role === "assistant"
              ? messagesRef.current[messagesRef.current.length - 1].content.substring(0, 150) +
                (messagesRef.current[messagesRef.current.length - 1].content.length > 150 ? "..." : "")
              : ""}
          </div>
        )}
      </div>

      {/* Right Panel — Camera, Chat, Controls */}
      <div className="right-panel" style={{ position: "relative" }}>
        <UserCamera />

        <ChatPanel
          messages={messages}
          isThinking={isThinking}
          currentTranscript={speech.transcript}
        />

        <VADWaveform
          volume={speech.volume}
          isListening={speech.isListening}
          isSpeaking={speech.isSpeaking}
          isAISpeaking={isAISpeaking}
        />

        <ProctoringHUD
          tabSwitchCount={proctoring.tabSwitchCount}
          isTabVisible={proctoring.isTabVisible}
          duration={proctoring.formatDuration(proctoring.interviewDuration)}
        />

        <div className="interview-controls" style={{ borderTop: "none", paddingTop: 0 }}>
          <div className="controls-right" style={{ marginLeft: 0, width: "100%" }}>
            <button
              className="btn-secondary"
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              style={{ flex: 1 }}
            >
              {showCodeEditor ? "Hide Code Editor" : "Code Editor"}
            </button>
            <button
              className="btn-danger"
              onClick={handleEndInterview}
              disabled={messagesRef.current.length < 1 || isEnding}
              style={{ flex: 1 }}
            >
              {isEnding ? "Generating Report..." : "End Interview"}
            </button>
          </div>
        </div>

        {/* Code Editor Overlay */}
        {showCodeEditor && (
          <CodeEditor onClose={() => setShowCodeEditor(false)} />
        )}
      </div>
    </div>
  );
}
