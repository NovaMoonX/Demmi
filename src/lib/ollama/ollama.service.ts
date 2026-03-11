import { Ollama } from 'ollama/browser';
import type { AbortableAsyncIterator } from 'ollama';
import type { ChatResponse, ProgressResponse } from 'ollama/browser';
import type { ChatMessage } from '@lib/chat';
import type { AgentMealProposal } from '@lib/chat/agent-actions.types';
import type { MealCategory } from '@lib/meals';
import type { IngredientType, MeasurementUnit } from '@lib/ingredients';

const SYSTEM_PROMPT =
  'You are Demmi\'s AI assistant, specialized in helping users with cooking, recipes, meal planning, ingredients, and nutrition. ' +
  'Help users discover new meals, plan their weekly menu, understand ingredient combinations, and make informed food choices. ' +
  'Be concise, friendly, and practical.\n\n' +
  'You always respond with a JSON object containing exactly two fields:\n' +
  '  "response": your message to the user (always required, supports markdown)\n' +
  '  "meals": an array of meal objects to create (empty [] by default)\n\n' +
  'Only populate "meals" when the user explicitly asks you to create, add, or make a meal. ' +
  'Each meal must have: title, description, category ("breakfast"|"lunch"|"dinner"|"snack"|"dessert"|"drink"), ' +
  'prepTime (minutes), cookTime (minutes), servingSize, instructions (array of steps), ' +
  'and ingredients (array of {name, type, unit, servings}). ' +
  'Ingredient type must be one of: "meat","produce","dairy","grains","legumes","oils","spices","nuts","seafood","other". ' +
  'Ingredient unit must be one of: "lb","oz","kg","g","cup","tbsp","tsp","piece","ml","l","other". ' +
  'Use "servings" to indicate how many units/portions of that ingredient the meal requires. ' +
  'For all other requests set "meals" to [].';

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['response', 'meals'],
  properties: {
    response: {
      type: 'string',
    },
    meals: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'title',
          'description',
          'category',
          'prepTime',
          'cookTime',
          'servingSize',
          'instructions',
          'ingredients',
        ],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'],
          },
          prepTime: { type: 'integer', minimum: 0 },
          cookTime: { type: 'integer', minimum: 0 },
          servingSize: { type: 'integer', minimum: 1 },
          instructions: { type: 'array', items: { type: 'string' } },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type', 'unit', 'servings'],
              properties: {
                name: { type: 'string' },
                type: {
                  type: 'string',
                  enum: [
                    'meat',
                    'produce',
                    'dairy',
                    'grains',
                    'legumes',
                    'oils',
                    'spices',
                    'nuts',
                    'seafood',
                    'other',
                  ],
                },
                unit: {
                  type: 'string',
                  enum: [
                    'lb',
                    'oz',
                    'kg',
                    'g',
                    'cup',
                    'tbsp',
                    'tsp',
                    'piece',
                    'ml',
                    'l',
                    'other',
                  ],
                },
                servings: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
    },
  },
};

export const ollamaClient = new Ollama();

export async function listLocalModels(): Promise<string[]> {
  const response = await ollamaClient.list();
  const allModels = response.models.map((m) => m.name);

  const textModels = allModels.filter((name) => {
    const lowerName = name.toLowerCase();
    return !lowerName.includes('embed') && !lowerName.includes('vision') && !lowerName.includes('multimodal');
  });

  return textModels;
}

export async function startChatStream(
  model: string,
  messages: ChatMessage[],
): Promise<AbortableAsyncIterator<ChatResponse>> {
  const ollamaMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      // For assistant messages use rawContent (the full JSON) so the AI retains context
      content: m.rawContent ?? m.content,
    })),
  ];

  return ollamaClient.chat({
    model,
    messages: ollamaMessages,
    stream: true,
    format: RESPONSE_SCHEMA,
  });
}

export async function pullModelStream(
  model: string,
): Promise<AbortableAsyncIterator<ProgressResponse>> {
  return ollamaClient.pull({ model, stream: true });
}

function coerceMealCategory(value: string): MealCategory {
  const valid: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'];
  return (valid.includes(value as MealCategory) ? value : 'dinner') as MealCategory;
}

function coerceIngredientType(value: string): IngredientType {
  const valid: IngredientType[] = [
    'meat', 'produce', 'dairy', 'grains', 'legumes',
    'oils', 'spices', 'nuts', 'seafood', 'other',
  ];
  return (valid.includes(value as IngredientType) ? value : 'other') as IngredientType;
}

function coerceMeasurementUnit(value: string): MeasurementUnit {
  const valid: MeasurementUnit[] = [
    'lb', 'oz', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'piece', 'ml', 'l', 'other',
  ];
  return (valid.includes(value as MeasurementUnit) ? value : 'other') as MeasurementUnit;
}

export interface ParsedOllamaResponse {
  response: string;
  meals: AgentMealProposal[];
}

export function parseOllamaResponse(json: string): ParsedOllamaResponse | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const response = typeof parsed.response === 'string' ? parsed.response : '';

    const rawMeals = Array.isArray(parsed.meals) ? parsed.meals : [];
    const meals: AgentMealProposal[] = rawMeals
      .filter((m: unknown): m is Record<string, unknown> => typeof m === 'object' && m !== null)
      .map((m: Record<string, unknown>) => ({
        title: typeof m.title === 'string' ? m.title : 'Untitled Meal',
        description: typeof m.description === 'string' ? m.description : '',
        category: coerceMealCategory(typeof m.category === 'string' ? m.category : ''),
        prepTime: typeof m.prepTime === 'number' ? Math.max(0, Math.round(m.prepTime)) : 0,
        cookTime: typeof m.cookTime === 'number' ? Math.max(0, Math.round(m.cookTime)) : 0,
        servingSize: typeof m.servingSize === 'number' ? Math.max(1, Math.round(m.servingSize)) : 1,
        instructions: Array.isArray(m.instructions)
          ? m.instructions.filter((i: unknown) => typeof i === 'string')
          : [],
        imageUrl: '',
        ingredients: Array.isArray(m.ingredients)
          ? m.ingredients
              .filter((i: unknown): i is Record<string, unknown> => typeof i === 'object' && i !== null)
              .map((i: Record<string, unknown>) => ({
                name: typeof i.name === 'string' ? i.name : 'Unknown',
                type: coerceIngredientType(typeof i.type === 'string' ? i.type : ''),
                unit: coerceMeasurementUnit(typeof i.unit === 'string' ? i.unit : ''),
                servings: typeof i.servings === 'number' ? Math.max(0, i.servings) : 1,
              }))
          : [],
      }));

    return { response, meals };
  } catch {
    return null;
  }
}

/**
 * Extract the partial "response" text from an in-progress JSON stream.
 * Allows progressive display of the AI's message while the full JSON is still building.
 */
export function extractPartialResponse(partialJson: string): string {
  const match = partialJson.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (!match) return '';
  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\r/g, '');
}

