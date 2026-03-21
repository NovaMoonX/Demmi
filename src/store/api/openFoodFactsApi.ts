import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface OpenFoodFactsProduct {
  product_name?: string;
  nutriments?: {
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
    'energy-kcal_100g'?: number;
  };
  image_url?: string;
}

export interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export const openFoodFactsApi = createApi({
  reducerPath: 'openFoodFactsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://world.openfoodfacts.org/api/v0/',
  }),
  endpoints: (builder) => ({
    getProductByBarcode: builder.query<OpenFoodFactsResponse, string>({
      query: (barcode) => `product/${barcode}.json`,
    }),
  }),
});

export const { useLazyGetProductByBarcodeQuery } = openFoodFactsApi;
