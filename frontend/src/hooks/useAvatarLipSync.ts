import { useRef, useCallback } from "react";

interface LipSyncOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export function useAvatarLipSync({ onSpeechStart, onSpeechEnd }: LipSyncOptions = {}) {
  const modelRef = useRef<any>(null);
  const lipSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);

  const setModel = useCallback((model: any) => {
    modelRef.current = model;
  }, []);

  const startLipSync = useCallback(() => {
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
    }

    let phase = 0;
    lipSyncIntervalRef.current = setInterval(() => {
      if (!modelRef.current) return;
      // Sine wave at ~8Hz for natural mouth movement
      phase += 0.5;
      const mouthValue = (Math.sin(phase) + 1) / 2 * 0.8 + 0.1;
      try {
        const coreModel = modelRef.current.internalModel?.coreModel;
        if (coreModel) {
          coreModel.setParameterValueById("ParamMouthOpenY", mouthValue);
        }
      } catch {}
    }, 60); // ~16fps for lip sync
  }, []);

  const stopLipSync = useCallback(() => {
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    // Close mouth
    try {
      const coreModel = modelRef.current?.internalModel?.coreModel;
      if (coreModel) {
        coreModel.setParameterValueById("ParamMouthOpenY", 0);
      }
    } catch {}
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!window.speechSynthesis) {
          resolve();
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.95;
        utterance.pitch = 1.1;

        // Try to pick a female voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("samantha") ||
              v.name.toLowerCase().includes("victoria") ||
              v.name.toLowerCase().includes("karen") ||
              v.name.toLowerCase().includes("tessa") ||
              v.name.toLowerCase().includes("fiona"))
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          startLipSync();
          onSpeechStart?.();
        };

        utterance.onend = () => {
          isSpeakingRef.current = false;
          stopLipSync();
          onSpeechEnd?.();
          resolve();
        };

        utterance.onerror = () => {
          isSpeakingRef.current = false;
          stopLipSync();
          onSpeechEnd?.();
          resolve();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    },
    [startLipSync, stopLipSync, onSpeechStart, onSpeechEnd]
  );

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    isSpeakingRef.current = false;
    stopLipSync();
  }, [stopLipSync]);

  return {
    setModel,
    speak,
    cancelSpeech,
    isSpeaking: isSpeakingRef,
  };
}
