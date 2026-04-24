import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  PhoneOff,
  Sparkles,
  Code2,
  MessageSquare,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/CodeEditor";
import { OutputConsole } from "@/components/OutputConsole";
import { executeCode } from "@/services/compiler";
import { useSpeech } from "@/hooks/useSpeech";
import AIAvatar from "@/components/AIAvatar";
import { PERSONA_DETAILS, BOILERPLATES } from "@/lib/interviewConstants";
import { InterviewSetupModal } from "@/components/interview/InterviewSetupModal";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function InterviewPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "code">("chat");

  const [persona, setPersona] = useState("strict");
  const [difficulty, setDifficulty] = useState("medium");

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  const isProcessing = useRef(false);
  const hasInitialized = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    setTranscript,
  } = useSpeech();

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState<string | undefined>(
    BOILERPLATES["javascript"],
  );
  const [output, setOutput] = useState<string | null>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const getCurrentGender = () => PERSONA_DETAILS[persona]?.gender || "female";
  const getCurrentPersonaName = () =>
    PERSONA_DETAILS[persona]?.name || "Interviewer";

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) setTimeout(scrollToBottom, 100);
  }, [messages, isLoading]);

  useEffect(() => {
    setCode(BOILERPLATES[language] || "// Language not supported");
  }, [language]);

  useEffect(() => {
    if (!localStorage.getItem("resumeId")) {
      toast.error("No resume found. Please upload first.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleAIResponse = async (userMessage: string, isInit = false) => {
    const trimmedMsg = userMessage.trim();
    if (!trimmedMsg) return;
    if (isProcessing.current) return;
    isProcessing.current = true;
    setIsLoading(true);

    const resumeId = localStorage.getItem("resumeId");
    setMessages((prev) => [...prev, { role: "user", content: trimmedMsg }]);
    if (!isInit) {
      setInput("");
      setTranscript("");
    }

    try {
      const res = await api.post("/chat", {
        message: trimmedMsg,
        resumeId,
        history: messages.map((m) => ({
          role: m.role === "ai" ? "model" : "user",
          text: m.content,
        })),
        mode: persona,
        difficulty,
      });
      const aiReply = res.data.reply;
      setMessages((prev) => [...prev, { role: "ai", content: aiReply }]);
      speak(aiReply, getCurrentGender());
    } catch {
      toast.error("Failed to connect to AI.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isProcessing.current = false;
      }, 500);
    }
  };

  useEffect(() => {
    if (
      !isListening &&
      transcript.trim().length > 0 &&
      !isLoading &&
      !isProcessing.current
    ) {
      const timer = setTimeout(() => {
        if (!isProcessing.current) {
          handleAIResponse(transcript);
          setTranscript("");
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript, isLoading]);

  const handleStartInterview = () => {
    setShowSetup(false);
    setIsInterviewStarted(true);
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      handleAIResponse(
        "Start the technical interview based on my resume and the job description.",
        true,
      );
    }
  };

  // Spacebar mic toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isInput =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.getAttribute("contenteditable") === "true" ||
        el?.closest(".monaco-editor");
      if (isInput) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!isListening && !isLoading && !showSetup) startListening();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isInput =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.getAttribute("contenteditable") === "true" ||
        el?.closest(".monaco-editor");
      if (isInput) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isListening && !showSetup) stopListening();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isListening, isLoading, startListening, stopListening, showSetup]);

  const handleRunCode = async () => {
    if (!code) return;
    setIsCompiling(true);
    setOutput(null);
    setExecError(null);
    try {
      const result = await executeCode(language, code);
      if (result.run.code !== 0) setExecError(result.run.output);
      else setOutput(result.run.output);
      toast.success("Code executed!");
    } catch (err: unknown) {
      setExecError((err as Error).toString() || "Execution failed");
      toast.error("Execution failed");
    } finally {
      setIsCompiling(false);
    }
  };

  const endInterview = async () => {
    setIsSaving(true);
    cancelSpeech();
    setIsInterviewStarted(false);

    try {
      const resumeId = localStorage.getItem("resumeId");
      const res = await api.post("/interview/end", {
        resumeId,
        history: messages.map((m) => ({
          role: m.role === "ai" ? "model" : "user",
          text: m.content,
        })),
      });
      toast.success("Interview analysis complete!");
      navigate(`/feedback/${res.data.id}`);
    } catch {
      toast.error("Error ending session");
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-[#0a0a0a] text-white overflow-hidden relative">
      <InterviewSetupModal
        open={showSetup}
        onStart={handleStartInterview}
        onCancel={() => navigate("/")}
        persona={persona}
        setPersona={setPersona}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />

      {isSaving && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-xl font-semibold text-white">
            Analyzing your interview...
          </p>
          <p className="text-slate-400 mt-2">
            AI is generating your performance report
          </p>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">
            Interview with{" "}
            <span className="text-white font-bold">
              {getCurrentPersonaName()}
            </span>
          </span>
          {isInterviewStarted && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === "chat"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === "code"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code Editor
            </button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={endInterview}
            disabled={!isInterviewStarted || messages.length < 2}
            className="gap-1"
          >
            <PhoneOff className="w-4 h-4" />
            End Interview
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "chat" ? (
          <div className="flex-1 flex">
            {/* Avatar Panel */}
            <div className="w-[320px] shrink-0 border-r border-white/10 flex flex-col items-center justify-center bg-[#080810] p-4">
              <AIAvatar
                isSpeaking={isSpeaking}
                isListening={isListening}
                personaName={getCurrentPersonaName()}
                gender={getCurrentGender()}
              />
              <div className="mt-6 space-y-2 w-full">
                <p className="text-center text-xs text-slate-500">
                  Hold SPACE to speak, or type below
                </p>
                <Button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading || isSpeaking}
                  className={`w-full gap-2 ${
                    isListening
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  size="sm"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Start Speaking
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col">
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 && !isLoading && (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    <p>Interview will begin shortly...</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    ref={i === messages.length - 1 ? lastMessageRef : null}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <span className="text-xs text-indigo-400 font-semibold block mb-1">
                          {getCurrentPersonaName()}
                        </span>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {getCurrentPersonaName()} is thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-white/10 bg-[#111]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAIResponse(input);
                      }
                    }}
                    placeholder="Type your answer..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    disabled={isLoading || !isInterviewStarted}
                  />
                  <Button
                    onClick={() => handleAIResponse(input)}
                    disabled={!input.trim() || isLoading || !isInterviewStarted}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Code Editor Tab */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex">
              <div className="flex-1">
                <CodeEditor
                  code={code || ""}
                  setCode={setCode}
                  language={language}
                  setLanguage={setLanguage}
                />
              </div>
              <div className="w-[400px] flex flex-col border-l border-white/10">
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#1e1e1e]">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Output
                  </span>
                  <Button
                    size="sm"
                    onClick={handleRunCode}
                    disabled={isCompiling}
                    className="gap-1.5 bg-green-600 hover:bg-green-500 text-xs h-7"
                  >
                    {isCompiling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Run Code
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <OutputConsole output={output} error={execError} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
