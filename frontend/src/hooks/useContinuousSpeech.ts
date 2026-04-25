import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseContinuousSpeechOptions {
  onTranscriptReady: (transcript: string) => void;
  silenceTimeout?: number;
  volumeThreshold?: number;
  enabled?: boolean;
}

export function useContinuousSpeech({
  onTranscriptReady,
  silenceTimeout = 1500,
  volumeThreshold = 0.01,
  enabled = true,
}: UseContinuousSpeechOptions) {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const transcriptAccRef = useRef<string>("");
  const animFrameRef = useRef<number>(0);
  const isAISpeakingRef = useRef(false);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const submitTranscript = useCallback(() => {
    const text = transcriptAccRef.current.trim();
    if (text.length > 2) {
      onTranscriptReady(text);
    }
    transcriptAccRef.current = "";
    setTranscript("");
  }, [onTranscriptReady]);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      submitTranscript();
    }, silenceTimeout);
  }, [clearSilenceTimer, submitTranscript, silenceTimeout]);

  const startRecognition = useCallback(() => {
    if (isAISpeakingRef.current || !enabledRef.current) return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        transcriptAccRef.current += " " + final;
        lastSpeechTimeRef.current = Date.now();
        startSilenceTimer();
      }

      setTranscript((transcriptAccRef.current + " " + interim).trim());
      setIsSpeaking(true);

      if (interim || final) {
        lastSpeechTimeRef.current = Date.now();
        clearSilenceTimer();
        if (final) {
          startSilenceTimer();
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech recognition error:", event.error);
      }
      setIsSpeaking(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsSpeaking(false);
      // Auto-restart if enabled and AI is not speaking
      if (enabledRef.current && !isAISpeakingRef.current) {
        setTimeout(() => {
          startRecognition();
        }, 300);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to start recognition:", e);
    }
  }, [startSilenceTimer, clearSilenceTimer]);

  const monitorVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      // RMS volume calculation
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setVolume(rms);

      animFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      monitorVolume();
      startRecognition();
    } catch (error) {
      console.error("Failed to start continuous speech:", error);
    }
  }, [monitorVolume, startRecognition]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    cancelAnimationFrame(animFrameRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);
    setVolume(0);
    setIsSpeaking(false);
    setTranscript("");
    transcriptAccRef.current = "";
  }, [clearSilenceTimer]);

  // Pause recognition while AI speaks
  const pauseForAI = useCallback(() => {
    isAISpeakingRef.current = true;
    clearSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const resumeAfterAI = useCallback(() => {
    isAISpeakingRef.current = false;
    transcriptAccRef.current = "";
    setTranscript("");
    if (enabledRef.current) {
      setTimeout(() => startRecognition(), 500);
    }
  }, [startRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isListening,
    volume,
    transcript,
    isSpeaking,
    start,
    stop,
    pauseForAI,
    resumeAfterAI,
  };
}
