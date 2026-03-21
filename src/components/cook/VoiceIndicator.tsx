import { useState, useEffect, useRef } from 'react';
import { Toggle, Label } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { VoiceState } from '@hooks/useCookModeVoice';

interface VoiceIndicatorProps {
  voiceState: VoiceState;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function VoiceIndicator({ voiceState, enabled, onToggle }: VoiceIndicatorProps) {
  const [showInitialAnimation, setShowInitialAnimation] = useState(false);
  const wasEnabledRef = useRef(enabled);

  useEffect(() => {
    const wasEnabled = wasEnabledRef.current;
    wasEnabledRef.current = enabled;

    if (enabled && !wasEnabled) {
      const enableTimer = setTimeout(() => {
        setShowInitialAnimation(true);
      }, 0);
      const disableTimer = setTimeout(() => {
        setShowInitialAnimation(false);
      }, 2000);
      return () => {
        clearTimeout(enableTimer);
        clearTimeout(disableTimer);
      };
    } else if (!enabled && wasEnabled) {
      const timer = setTimeout(() => {
        setShowInitialAnimation(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [enabled]);

  if (voiceState === 'unsupported') return null;

  return (
    <>
      {/* Voice Mode Toggle - Top Left */}
      <div className='absolute top-3 left-3 z-10'>
        <div className='bg-background/95 flex items-center gap-2 rounded-full border border-border px-3 py-1.5 backdrop-blur-sm'>
          <Label htmlFor='voice-toggle' className='text-xs'>
            🎤 Voice
          </Label>
          <Toggle
            id='voice-toggle'
            checked={enabled}
            onCheckedChange={onToggle}
            size='sm'
          />
        </div>
      </div>

      {/* Wake Word Notice - Bottom (above step indicators) */}
      {enabled && voiceState !== 'listening' && (
        <div
          className={join(
            'pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs transition-all duration-500',
            'backdrop-blur-sm',
            showInitialAnimation
              ? 'bg-accent/90 text-accent-foreground animate-pulse'
              : 'bg-muted/80 text-muted-foreground',
          )}
          aria-hidden='true'
        >
          <span className='mr-1.5'>🎤</span>
          <span>Say "Hey Demmi"</span>
        </div>
      )}

      <div
        className={join(
          'pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-6 transition-opacity duration-300',
          voiceState === 'listening' ? 'opacity-100' : 'opacity-0',
        )}
        aria-live='polite'
        aria-atomic='true'
      >
        <div className='border-primary/20 bg-background/95 mx-4 w-full max-w-sm rounded-2xl border px-6 py-4 shadow-xl backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
            <div className='relative flex shrink-0 items-center justify-center'>
              <span className='bg-primary/30 absolute inline-flex h-10 w-10 animate-ping rounded-full' />
              <span className='bg-primary relative flex h-10 w-10 items-center justify-center rounded-full text-lg'>
                🎤
              </span>
            </div>
            <div className='flex-1'>
              <p className='text-foreground text-sm font-semibold'>Listening…</p>
              <p className='text-muted-foreground text-xs'>Say a command</p>
            </div>
          </div>
          <div className='text-muted-foreground mt-3 space-y-1 text-xs'>
            <p>
              "Next step"
              <span aria-hidden='true'> · </span>
              "Previous step"
            </p>
            <p>
              "Show ingredients"
              <span aria-hidden='true'> · </span>
              "Close ingredients"
            </p>
            <p>
              "Go to step 4"
              <span aria-hidden='true'> · </span>
              "Exit"
            </p>
            <p>
              "More servings"
              <span aria-hidden='true'> · </span>
              "Less servings"
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
