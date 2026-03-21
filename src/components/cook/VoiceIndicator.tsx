import { join } from '@moondreamsdev/dreamer-ui/utils';
import { VoiceState } from '@hooks/useCookModeVoice';

interface VoiceIndicatorProps {
  voiceState: VoiceState;
}

export function VoiceIndicator({ voiceState }: VoiceIndicatorProps) {
  if (voiceState === 'unsupported') return null;

  return (
    <>
      <div
        className={join(
          'pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-opacity duration-300',
          'bg-muted/80 text-muted-foreground backdrop-blur-sm',
          voiceState === 'listening' ? 'opacity-0' : 'opacity-100',
        )}
        aria-hidden='true'
      >
        <span>🎤</span>
        <span>Say "Hey Demmi"</span>
      </div>

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
              "Go to step [number]"
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
