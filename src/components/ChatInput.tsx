import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { ArrowUp, Mic, MicOff, Square } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export function ChatInput({ onSubmit, disabled, initialValue }: ChatInputProps) {
  const [value, setValue] = useState(initialValue ?? '');
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check voice support on mount
  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  // Sync initial value from props (for deep-link prefill)
  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue((prev) => {
        // If we had existing text, append with a space
        const base = prev.trim();
        return base ? `${base} ${transcript}` : transcript;
      });
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <div className='px-3 sm:px-6 pt-3 pb-3 sm:pb-4'>
      <div className='max-w-[760px] mx-auto'>
        <div
          className='flex items-end gap-2 rounded-2xl px-3 sm:px-4 pt-1.5 pb-1.5 sm:pb-2 transition-all duration-200'
          style={{
            background: isListening
              ? 'rgba(255,59,92,0.06)'
              : focused
                ? 'rgba(124,92,252,0.06)'
                : 'rgba(13,13,26,0.8)',
            border: `1px solid ${
              isListening
                ? 'rgba(255,59,92,0.4)'
                : focused
                  ? 'rgba(124,92,252,0.4)'
                  : 'rgba(124,92,252,0.15)'
            }`,
            boxShadow: isListening
              ? '0 0 0 3px rgba(255,59,92,0.08), 0 0 30px rgba(255,59,92,0.08)'
              : focused
                ? '0 0 0 3px rgba(124,92,252,0.08), 0 0 30px rgba(124,92,252,0.08)'
                : 'none',
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={
              isListening
                ? 'Listening…'
                : disabled
                  ? 'AI is thinking…'
                  : 'Ask about your finances, add expenses…'
            }
            rows={1}
            className='flex-1 resize-none border-none bg-transparent text-[#f0efff] font-sans text-sm sm:text-[15px] leading-relaxed outline-none py-2 min-h-[38px] max-h-[160px]'
            style={{
              fontFamily: '"DM Sans", sans-serif',
            }}
          />

          <div className='flex items-center gap-1 pb-1'>
            {/* Voice button */}
            {voiceSupported && (
              <button
                type='button'
                onClick={toggleVoice}
                className='w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200'
                style={{
                  background: isListening
                    ? 'rgba(255,59,92,0.15)'
                    : 'transparent',
                  color: isListening ? '#ff3b5c' : '#4a4870',
                  border: isListening
                    ? '1px solid rgba(255,59,92,0.3)'
                    : '1px solid transparent',
                }}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? (
                  <Square className='w-3.5 h-3.5' fill='currentColor' />
                ) : (
                  <Mic className='w-4 h-4' />
                )}
              </button>
            )}

            {/* Non-voice fallback — disabled mic icon */}
            {!voiceSupported && (
              <button
                type='button'
                disabled
                className='w-8 h-8 rounded-lg flex items-center justify-center cursor-not-allowed text-[rgba(74,72,112,0.4)]'
                title='Voice input not supported in this browser'
              >
                <MicOff className='w-4 h-4' />
              </button>
            )}

            {/* Send button */}
            <button
              type='button'
              disabled={!canSubmit}
              onClick={handleSubmit}
              className='w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0'
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #7c5cfc, #00d4ff)'
                  : 'rgba(74,72,112,0.2)',
                boxShadow: canSubmit ? '0 0 15px rgba(124,92,252,0.4)' : 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              <ArrowUp
                className='w-4 h-4'
                style={{ color: canSubmit ? '#fff' : 'rgba(74,72,112,0.5)' }}
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>

        <p className='text-center font-mono text-[9px] sm:text-[10px] text-[#4a4870] mt-1.5 sm:mt-2 tracking-wide'>
          Enter to send · Shift+Enter for new line
          {voiceSupported && ' · Click mic for voice'}
        </p>
      </div>

      {/* Voice listening pulse animation */}
      {isListening && (
        <style>{`
          @keyframes voicePulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(255,59,92,0.4); }
            50% { box-shadow: 0 0 0 8px rgba(255,59,92,0); }
          }
        `}</style>
      )}
    </div>
  );
}
