import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'unsupported' | 'wake_word' | 'listening';

type VoiceCommand =
  | 'next'
  | 'previous'
  | 'open_ingredients'
  | 'close_ingredients'
  | 'increase_servings'
  | 'decrease_servings'
  | 'exit';

const WAKE_WORD_PATTERN = /hey\s+dem(?:m?[iy]|m?e{1,2}|m+i?)/i;
const COMMAND_TIMEOUT_MS = 8000;

function matchCommand(text: string): VoiceCommand | null {
  const t = text.toLowerCase().trim();

  if (/\b(next(\s+step)?|forward|continue)\b/.test(t)) return 'next';
  if (/\b((previous|prev)(\s+step)?|go\s+back|backward)\b/.test(t)) return 'previous';
  if (/\b(open|show|see|display)\s+ingredients?\b/.test(t) || /^ingredients?\s*$/.test(t)) return 'open_ingredients';
  if (/\b(close|hide|dismiss)\s+ingredients?\b/.test(t)) return 'close_ingredients';
  if (/\b(increase|add|more)\s+(servings?|portions?)\b/.test(t)) return 'increase_servings';
  if (/\b(decrease|less|fewer|reduce|remove)\s+(servings?|portions?)\b/.test(t)) return 'decrease_servings';
  if (/\b(exit|leave|stop\s+cooking|done\s+cooking|finish\s+cooking|quit)\b/.test(t)) return 'exit';

  return null;
}

export interface UseCookModeVoiceOptions {
  onNextStep: () => void;
  onPrevStep: () => void;
  onOpenIngredients: () => void;
  onCloseIngredients: () => void;
  onIncreaseServings: () => void;
  onDecreaseServings: () => void;
  onExit: () => void;
}

export interface UseCookModeVoiceResult {
  voiceState: VoiceState;
}

export function useCookModeVoice({
  onNextStep,
  onPrevStep,
  onOpenIngredients,
  onCloseIngredients,
  onIncreaseServings,
  onDecreaseServings,
  onExit,
}: UseCookModeVoiceOptions): UseCookModeVoiceResult {
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const [voiceState, setVoiceState] = useState<VoiceState>(
    isSupported ? 'wake_word' : 'unsupported',
  );

  const voiceStateRef = useRef<VoiceState>(voiceState);
  const shouldRestartRef = useRef(true);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callbacksRef = useRef({
    onNextStep,
    onPrevStep,
    onOpenIngredients,
    onCloseIngredients,
    onIncreaseServings,
    onDecreaseServings,
    onExit,
  });

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    callbacksRef.current = {
      onNextStep,
      onPrevStep,
      onOpenIngredients,
      onCloseIngredients,
      onIncreaseServings,
      onDecreaseServings,
      onExit,
    };
  }, [onNextStep, onPrevStep, onOpenIngredients, onCloseIngredients, onIncreaseServings, onDecreaseServings, onExit]);

  const exitCommandMode = useCallback(() => {
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    voiceStateRef.current = 'wake_word';
    setVoiceState('wake_word');
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    type ExtendedWindow = Window & { webkitSpeechRecognition?: typeof SpeechRecognition };
    const SpeechRecognitionCtor =
      window.SpeechRecognition ??
      (window as ExtendedWindow).webkitSpeechRecognition!;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.trim();

      if (voiceStateRef.current === 'wake_word') {
        if (WAKE_WORD_PATTERN.test(transcript)) {
          if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
          voiceStateRef.current = 'listening';
          setVoiceState('listening');
          commandTimeoutRef.current = setTimeout(() => {
            voiceStateRef.current = 'wake_word';
            setVoiceState('wake_word');
          }, COMMAND_TIMEOUT_MS);
        }
      } else if (voiceStateRef.current === 'listening' && result.isFinal) {
        const command = matchCommand(transcript);
        if (command !== null) {
          exitCommandMode();
          switch (command) {
            case 'next':
              callbacksRef.current.onNextStep();
              break;
            case 'previous':
              callbacksRef.current.onPrevStep();
              break;
            case 'open_ingredients':
              callbacksRef.current.onOpenIngredients();
              break;
            case 'close_ingredients':
              callbacksRef.current.onCloseIngredients();
              break;
            case 'increase_servings':
              callbacksRef.current.onIncreaseServings();
              break;
            case 'decrease_servings':
              callbacksRef.current.onDecreaseServings();
              break;
            case 'exit':
              callbacksRef.current.onExit();
              break;
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('Voice recognition error:', event.error);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          // Restart recognition to keep it active. 
          // This is needed because some browsers stop recognition after a while or on certain errors.
          recognition.start();
        } catch {
          // Ignore restart errors (e.g. already running)
        }
      }
    };

    shouldRestartRef.current = true;
    try {
      recognition.start();
    } catch {
      // Ignore start errors
    }

    return () => {
      shouldRestartRef.current = false;
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Ignore
      }
    };
  }, [isSupported, exitCommandMode]);

  return { voiceState };
}
