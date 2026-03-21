import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Label } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useLazyGetProductByBarcodeQuery } from '@store/api/openFoodFactsApi';

function roundToFirstDecimal(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return 0;
  }

  const result = Math.round(numericValue * 10) / 10;
  return result;
}

function SampleBarcode() {
  const bars = [
    3, 1, 2, 1, 3, 1, 1, 1, 2, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2,
    1, 1, 3, 2, 1, 2, 1, 1, 2, 3, 2, 1, 3, 2, 1, 3, 1, 2,
    1, 1, 3, 1, 2, 1, 2, 3, 1, 1,
  ];

  let x = 0;
  const barElements: React.ReactElement[] = [];
  bars.forEach((w, i) => {
    const width = w * 3;
    if (i % 2 === 0) {
      barElements.push(
        <rect
          key={i}
          x={x}
          y={0}
          width={width}
          height={80}
          fill='currentColor'
        />,
      );
    }
    x += width;
  });
  const totalWidth = x;

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='flex items-end gap-1'>
        <span className='text-foreground mb-2 text-sm font-bold'>0</span>
        <svg
          viewBox={`0 0 ${totalWidth} 80`}
          width={260}
          height={80}
          className='text-foreground'
          aria-label='Sample barcode'
        >
          {barElements}
        </svg>
        <span className='text-foreground mb-2 text-sm font-bold'>6</span>
      </div>
      <span className='text-foreground font-mono text-sm tracking-widest'>
        78742 09522
      </span>
    </div>
  );
}

export function IngredientBarcodeEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromMealPath =
    (location.state as { fromMealPath?: string } | null)?.fromMealPath ?? null;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [submittedBarcode, setSubmittedBarcode] = useState<string | null>(null);

  const [triggerLookup, { data, isFetching, isError }] =
    useLazyGetProductByBarcodeQuery();

  const handleLookup = () => {
    const cleaned = barcodeInput.replace(/\s/g, '').trim();
    if (!cleaned) return;
    setSubmittedBarcode(cleaned);
    void triggerLookup(cleaned, true); // pull from cache if available
  };

  const handleContinue = () => {
    const product = data?.product;
    const nutrients = product?.nutriments;
    const sodiumInMg = Number(nutrients?.sodium_100g ?? 0) * 1000;

    const prefill = {
      barcode: submittedBarcode,
      name: product?.product_name ?? '',
      imageUrl: product?.image_url ?? '',
      protein: roundToFirstDecimal(nutrients?.proteins_100g),
      carbs: roundToFirstDecimal(nutrients?.carbohydrates_100g),
      fat: roundToFirstDecimal(nutrients?.fat_100g),
      fiber: roundToFirstDecimal(nutrients?.fiber_100g),
      sugar: roundToFirstDecimal(nutrients?.sugars_100g),
      sodium: roundToFirstDecimal(sodiumInMg),
      calories: roundToFirstDecimal(nutrients?.['energy-kcal_100g']),
    };

    navigate('/ingredients/new', {
      state: { fromMealPath, barcodePrefill: prefill },
    });
  };

  const handleSkip = () => {
    navigate('/ingredients/new', {
      state: {
        fromMealPath,
        barcodePrefill: { barcode: barcodeInput.replace(/\s/g, '').trim() || null },
      },
    });
  };

  const productFound =
    !isFetching && data != null && data.status === 1 && data.product != null;
  const productNotFound =
    !isFetching && data != null && data.status !== 1;

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
        <h1 className='text-foreground mb-2 text-4xl font-bold'>
          Enter Barcode
        </h1>
        <p className='text-muted-foreground'>
          Type in the full barcode number to look up the product.
        </p>
      </div>

      <div className='border-border bg-muted/30 mb-6 flex flex-col items-center gap-4 rounded-2xl border p-6'>
        <p className='text-foreground text-center text-sm font-semibold'>
          Sample barcode — what to look for
        </p>
        <SampleBarcode />
        <div className='text-muted-foreground max-w-sm text-center text-xs leading-relaxed'>
          A typical barcode has a single digit on the{' '}
          <strong className='text-foreground'>far left</strong>, bars in the
          middle, and a digit on the{' '}
          <strong className='text-foreground'>far right</strong>
          &nbsp;— with a full number printed underneath. Include{' '}
          <em>all</em> digits (including those outside the bars) when entering
          below.
          <br/>
          So, for the sample barcode above, you would enter <strong>078742095226</strong>.
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='ingredient-barcode'>Barcode Number</Label>
          <Input
            id='ingredient-barcode'
            type='number'
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder='e.g. 4 012345 678905'
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLookup();
            }}
          />
        </div>

        <Button
          variant='primary'
          onClick={handleLookup}
          disabled={!barcodeInput.trim() || isFetching}
          className='w-full'
        >
          {isFetching ? 'Looking up…' : 'Look Up Barcode'}
        </Button>

        {isFetching && (
          <div
            className={join(
              'rounded-lg border p-4',
              'border-border bg-muted/50',
            )}
          >
            <p className='text-muted-foreground text-sm'>
              Looking up barcode{' '}
              <strong className='text-foreground'>{submittedBarcode}</strong>…
            </p>
          </div>
        )}

        {isError && (
          <div className='text-destructive rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30'>
            Failed to reach Open Food Facts. Check your connection and try
            again.
          </div>
        )}

        {productNotFound && (
          <div
            className={join(
              'rounded-lg border p-4',
              'border-border bg-muted/50',
            )}
          >
            <p className='text-muted-foreground text-sm'>
              No product found for{' '}
              <strong className='text-foreground'>{submittedBarcode}</strong>.
              You can still continue and fill in the details manually.
            </p>
          </div>
        )}

        {productFound && data.product != null && (
          <div className='border-border rounded-lg border p-4'>
            <p className='text-muted-foreground mb-1 text-xs tracking-wide uppercase'>
              Product found
            </p>
            <p className='text-foreground font-semibold'>
              {data.product.product_name ?? 'Unknown product'}
            </p>
            {data.product.image_url != null && (
              <img
                src={data.product.image_url}
                alt={data.product.product_name ?? 'Product'}
                className='border-border mt-3 h-32 w-full rounded-lg border object-contain'
              />
            )}
            <p className='text-muted-foreground mt-2 text-xs'>
              Nutritional info will be pre-filled on the next screen (per 100
              g).
            </p>
          </div>
        )}

        {(productFound || productNotFound) && (
          <div className='flex gap-3'>
            <Button
              variant='primary'
              onClick={handleContinue}
              className='flex-1'
            >
              Continue to Ingredient Form
            </Button>
          </div>
        )}

        {submittedBarcode == null && (
          <Button variant='secondary' onClick={handleSkip} className='w-full'>
            Skip — go to manual entry
          </Button>
        )}
      </div>
    </div>
  );
}

export default IngredientBarcodeEntry;
