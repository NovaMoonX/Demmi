import { MEASUREMENT_UNITS, MeasurementUnit } from '@lib/ingredients';
import type { OpenFoodFactsProduct } from '@store/api/openFoodFactsApi';

const SUPPORTED_SERVING_UNITS = MEASUREMENT_UNITS.filter(
  (unit) => unit !== 'other',
);

const SUPPORTED_SERVING_UNITS_PATTERN = SUPPORTED_SERVING_UNITS
  .slice()
  .sort((firstUnit, secondUnit) => secondUnit.length - firstUnit.length)
  .join('|');

const SERVING_INFO_REGEX = new RegExp(
  `(\\d+(?:\\.\\d+)?(?:\\/\\d+(?:\\.\\d+)?)?)\\s*(${SUPPORTED_SERVING_UNITS_PATTERN})\\b`,
  'gi',
);

function isMeasurementUnit(value: string): value is MeasurementUnit {
  const result = MEASUREMENT_UNITS.includes(value as MeasurementUnit);
  return result;
}

function parseServingQuantity(value: string) {
  if (value.includes('/')) {
    const [numeratorText, denominatorText] = value.split('/');
    const numerator = Number(numeratorText);
    const denominator = Number(denominatorText);
    if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
      const result = numerator / denominator;
      return result;
    }
  }

  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  const result = parsedValue;
  return result;
}

function parseServingInfoFromText(servingText: string) {
  const matches = Array.from(servingText.matchAll(SERVING_INFO_REGEX));

  const parsedMatches: Array<{ servingSize: number; unit: MeasurementUnit }> = [];
  matches.forEach((match) => {
    const parsedSize = parseServingQuantity(match[1] ?? '0');
    const parsedUnit = (match[2] ?? '').toLowerCase();
    if (parsedSize <= 0 || !isMeasurementUnit(parsedUnit) || parsedUnit === 'other') {
      return;
    }

    parsedMatches.push({
      servingSize: parsedSize,
      unit: parsedUnit,
    });
  });

  const metricMatch = parsedMatches.find((match) => match.unit === 'g' || match.unit === 'ml');
  if (metricMatch != null) {
    const result = metricMatch;
    return result;
  }

  const firstMatch = parsedMatches[0] ?? null;
  if (firstMatch != null) {
    const result = firstMatch;
    return result;
  }

  const result = null;
  return result;
}

function roundToFirstDecimal(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return 0;
  }

  const result = Math.round(numericValue * 10) / 10;
  return result;
}

interface ServingInfo {
  servingSize: number;
  unit: MeasurementUnit;
  otherUnit: string | null;
}

interface BarcodePrefill {
  barcode: string | null;
  name: string;
  imageUrl: string;
  servingSize: number;
  unit: MeasurementUnit;
  otherUnit: string | null;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  calories: number;
}

function getServingInfoFromProduct(
  product: OpenFoodFactsProduct | null | undefined,
): ServingInfo {
  const importedServingSizeText = product?.serving_size_imported ?? '';
  const importedServingInfo = parseServingInfoFromText(importedServingSizeText);
  if (importedServingInfo != null) {
    const result: ServingInfo = {
      servingSize: importedServingInfo.servingSize,
      unit: importedServingInfo.unit,
      otherUnit: null,
    };
    return result;
  }

  const servingSizeText = product?.serving_size ?? '';
  const servingInfo = parseServingInfoFromText(servingSizeText);
  if (servingInfo != null) {
    const result: ServingInfo = {
      servingSize: servingInfo.servingSize,
      unit: servingInfo.unit,
      otherUnit: null,
    };
    return result;
  }

  const rawUnit = (product?.serving_quantity_unit ?? '').toLowerCase().trim();
  const explicitServingQuantity = Number(product?.serving_quantity ?? 0);
  if (explicitServingQuantity > 0 && isMeasurementUnit(rawUnit) && rawUnit !== 'other') {
    const result: ServingInfo = {
      servingSize: explicitServingQuantity,
      unit: rawUnit,
      otherUnit: null,
    };
    return result;
  }

  const result: ServingInfo = {
    servingSize: 100,
    unit: 'g',
    otherUnit: null,
  };
  return result;
}

function getServingNutrientValue(
  servingValue: number | undefined,
  per100Value: number | undefined,
  servingSize: number,
) {
  if (servingValue != null) {
    const result = roundToFirstDecimal(servingValue);
    return result;
  }

  const normalizedPer100Value = Number(per100Value ?? 0);
  const computedServingValue = (normalizedPer100Value * servingSize) / 100;
  const result = roundToFirstDecimal(computedServingValue);
  return result;
}

export function getBarcodePrefillFromProduct(
  product: OpenFoodFactsProduct | null | undefined,
  barcode: string | null,
): BarcodePrefill {
  const nutrients = product?.nutriments;
  const servingInfo = getServingInfoFromProduct(product);
  const servingSize = servingInfo.servingSize;
  const sodiumServingInMg = Number(nutrients?.sodium_serving ?? 0) * 1000;
  const sodiumPer100InMg = Number(nutrients?.sodium_100g ?? 0) * 1000;

  const result: BarcodePrefill = {
    barcode,
    name: product?.product_name ?? '',
    imageUrl: product?.image_url ?? '',
    servingSize: roundToFirstDecimal(servingSize),
    unit: servingInfo.unit,
    otherUnit: servingInfo.otherUnit,
    protein: getServingNutrientValue(
      nutrients?.proteins_serving,
      nutrients?.proteins_100g,
      servingSize,
    ),
    carbs: getServingNutrientValue(
      nutrients?.carbohydrates_serving,
      nutrients?.carbohydrates_100g,
      servingSize,
    ),
    fat: getServingNutrientValue(
      nutrients?.fat_serving,
      nutrients?.fat_100g,
      servingSize,
    ),
    fiber: getServingNutrientValue(
      nutrients?.fiber_serving,
      nutrients?.fiber_100g,
      servingSize,
    ),
    sugar: getServingNutrientValue(
      nutrients?.sugars_serving,
      nutrients?.sugars_100g,
      servingSize,
    ),
    sodium: getServingNutrientValue(
      sodiumServingInMg,
      sodiumPer100InMg,
      servingSize,
    ),
    calories: getServingNutrientValue(
      nutrients?.['energy-kcal_serving'],
      nutrients?.['energy-kcal_100g'],
      servingSize,
    ),
  };

  return result;
}
