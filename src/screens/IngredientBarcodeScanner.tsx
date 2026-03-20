import Quagga from '@ericblade/quagga2';
import type { QuaggaJSResultObject } from '@ericblade/quagga2';
import { Button } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type ScanStatus = 'initializing' | 'scanning' | 'detected' | 'error' | 'denied';

interface DetectedBarcode {
  code: string;
  format: string;
}

const FORMAT_LABELS: Record<string, string> = {
  ean_reader: 'EAN-13',
  ean_8_reader: 'EAN-8',
  code_128_reader: 'Code 128',
  code_39_reader: 'Code 39',
  upc_reader: 'UPC-A',
  upc_e_reader: 'UPC-E',
};

export function IngredientBarcodeScanner() {
  const location = useLocation();
  const fromMealPath =
    (location.state as { fromMealPath?: string } | null)?.fromMealPath ?? null;

  const scannerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ScanStatus>('initializing');
  const [detected, setDetected] = useState<DetectedBarcode | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const handleDetected = useCallback((result: QuaggaJSResultObject) => {
    const code = result.codeResult.code;
    const format = result.codeResult.format;
    if (!code) return;

    Quagga.stop();
    setDetected({
      code,
      format: FORMAT_LABELS[format] ?? format,
    });
    setStatus('detected');
  }, []);

  useEffect(() => {
    if (!scannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
          ],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          const message =
            err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
          if (message.includes('permission') || message.includes('denied')) {
            setStatus('denied');
          } else {
            setStatus('error');
          }
          return;
        }

        const video = scannerRef.current?.querySelector('video');
        if (video) {
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
        }

        const canvas = scannerRef.current?.querySelector('canvas.drawingBuffer');
        if (canvas instanceof HTMLElement) {
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
        }

        Quagga.start();
        setStatus('scanning');
      },
    );

    Quagga.onDetected(handleDetected);

    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, [scanKey, handleDetected]);

  const handleScanAgain = () => {
    setDetected(null);
    setStatus('initializing');
    setScanKey((k) => k + 1);
  };

  return (
    <div className='mx-auto mt-10 max-w-2xl p-6 md:mt-0'>
      <div className='mb-6'>
        <Link
          to={fromMealPath ?? '/ingredients'}
          state={fromMealPath ? { fromMealPath } : undefined}
          className='text-muted-foreground hover:text-foreground mb-4 inline-block text-sm'
        >
          {fromMealPath ? '← Back to Meal' : '← Back to Ingredients'}
        </Link>
        <h1 className='text-foreground mb-2 text-4xl font-bold'>Scan Barcode</h1>
        <p className='text-muted-foreground'>
          Point your camera at a product barcode to get started.
        </p>
      </div>

      <div
        className={join(
          'bg-muted relative aspect-video w-full overflow-hidden rounded-2xl border',
          status === 'detected' && 'hidden',
        )}
      >
        <div
          ref={scannerRef}
          className={join(
            'absolute inset-0',
            status !== 'scanning' && 'hidden',
          )}
        />

        {status === 'initializing' && (
          <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-center'>
            <span className='text-5xl'>📷</span>
            <p className='text-muted-foreground text-sm'>Starting camera…</p>
          </div>
        )}

        {status === 'denied' && (
          <div className='flex h-full flex-col items-center justify-center gap-4 p-8 text-center'>
            <span className='text-5xl'>📷</span>
            <p className='text-foreground font-semibold'>Camera access denied</p>
            <p className='text-muted-foreground text-sm'>
              Please allow camera access in your browser settings, then try again.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className='flex h-full flex-col items-center justify-center gap-4 p-8 text-center'>
            <span className='text-5xl'>⚠️</span>
            <p className='text-foreground font-semibold'>Scanner error</p>
            <p className='text-muted-foreground text-sm'>
              Unable to start the barcode scanner. Please try again.
            </p>
            <Button variant='secondary' size='sm' onClick={handleScanAgain}>
              Try Again
            </Button>
          </div>
        )}

        {status === 'scanning' && (
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            <div className='h-1/2 w-3/4 rounded-lg border-4 border-white/60 shadow-lg' />
          </div>
        )}
      </div>

      {status === 'detected' && detected && (
        <div className='flex flex-col gap-4'>
          <div className='bg-card rounded-2xl border p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <span className='text-3xl'>✅</span>
              <h2 className='text-foreground text-xl font-semibold'>Barcode Detected</h2>
            </div>

            <div className='flex flex-col gap-3'>
              <div className='bg-muted rounded-xl p-4'>
                <p className='text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide'>
                  Barcode
                </p>
                <p className='text-foreground break-all font-mono text-2xl font-bold'>
                  {detected.code}
                </p>
              </div>

              <div className='bg-muted rounded-xl p-4'>
                <p className='text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide'>
                  Format
                </p>
                <p className='text-foreground font-semibold'>{detected.format}</p>
              </div>
            </div>
          </div>

          <Button variant='secondary' onClick={handleScanAgain} className='w-full'>
            Scan Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default IngredientBarcodeScanner;
