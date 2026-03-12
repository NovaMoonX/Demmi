import { Ollama } from 'ollama/browser';
import type { AbortableAsyncIterator } from 'ollama';
import type { ChatResponse, ProgressResponse } from 'ollama/browser';
import type { ChatMessage } from '@lib/chat';
import type { AgentMealProposal } from '@lib/chat/agent-actions.types';
import type { MealCategory } from '@lib/meals';
import type { IngredientType, MeasurementUnit } from '@lib/ingredients';

/**
 * Phase 1a — action detection only.
 * The AI classifies the user's intent into one of the supported action types.
 */
const ACTION_DETECTION_PROMPT = `
You are Demmi's AI assistant, specialized in cooking, recipes, meal planning, and nutrition.

Your task: Classify the user's CURRENT message intent.

Select ONE action that best matches what the user wants RIGHT NOW:
- "general": User is asking questions, requesting tips, or having a discussion about cooking/nutrition
- "wantsToCreateMeal": User explicitly wants to CREATE / MAKE / ADD / GENERATE a specific recipe, meal, or dish

IMPORTANT CLASSIFICATION RULES:
- Only use "wantsToCreateMeal" when the user EXPLICITLY requests creation (e.g., "create a recipe for...", "make me a meal...", "generate a dish...")
- Use "general" for ALL other interactions: questions about cooking, ingredient advice, nutrition tips, technique discussions, recipe modifications, etc.
- Re-evaluate intent with EVERY message — users can transition between action types at any time
- Focus ONLY on the user's CURRENT request, ignoring previous conversation context

TRANSITION EXAMPLES (users can switch at any time):
- Previous: "What's a good protein for breakfast?" (general) → Current: "Create an egg benedict recipe" (wantsToCreateMeal)
- Previous: "Make me a pasta dish" (wantsToCreateMeal) → Current: "What's the difference between penne and rigatoni?" (general)
- Previous: "Generate a salad recipe" (wantsToCreateMeal) → Current: "How long do tomatoes last?" (general)
- Previous: "Tell me about sourdough" (general) → Current: "Make me a sourdough bread recipe" (wantsToCreateMeal)

Each message is independent — classify based on what the user wants NOW.
`;

const ACTION_DETECTION_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['action'],
  properties: {
    action: {
      type: 'string',
      enum: ['general', 'wantsToCreateMeal'],
      description:
        'The type of user intent: "general" for conversation or "wantsToCreateMeal" for meal creation',
    },
  },
};

/**
 * Phase 1b.1 — general response.
 * Called after action is detected as "general". Returns a conversational response.
 */
const GENERAL_RESPONSE_PROMPT = `
You are Demmi's AI assistant, specialized in cooking, recipes, meal planning, and nutrition.

**CONTEXT**: The user's intent has been classified as 'general conversation' for THIS message — they are NOT requesting meal creation right now.

Your task: Provide a helpful, conversational response to their current question or comment.
- Be concise, friendly, and practical
- Share cooking tips, techniques, ingredient information, nutrition advice, or answer their questions
- If they ask about recipes, you can discuss them, but you're NOT creating/generating a new recipe in this response
- Note: The user can ask you to create a meal in their next message — each message is evaluated independently
`;

const GENERAL_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['response'],
  properties: {
    response: {
      type: 'string',
      description: 'Your message to the user (supports markdown)',
    },
  },
};

/**
 * Phase 1b.2 — meal name proposal.
 * Called after action is detected as "wantsToCreateMeal". Returns the proposed meal name.
 */
const MEAL_NAME_PROPOSAL_PROMPT = `
You are Demmi's AI assistant.

**CONTEXT**: The user's intent has been classified as 'wants to create a meal' for THIS message — they have explicitly requested recipe/meal creation right now.

Your task: Extract or infer the specific name of the recipe/meal/dish the user wants to create in their current request.
- Provide a clear, concise name (3 words or less preferred)
- Be specific (e.g., "Chocolate Chip Cookies" not "Cookies")
- Use the exact name they mentioned if provided, otherwise infer from context
- Focus on what they're trying to CREATE in this specific message
- Do not use generic names like "meal" or "dish" or "plan" — be as specific as possible based on their request
`;

const MEAL_NAME_PROPOSAL_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['proposedMealName'],
  properties: {
    proposedMealName: {
      type: 'string',
      description: 'The name of the recipe or meal to create (be as specific as possible based on the user\'s request)',
    },
  },
};

/**
 * Phase 2 — recipe generation.
 * Called after the user has confirmed intent. Generates the full recipe details.
 */
const RECIPE_GENERATION_PROMPT = `
You are Demmi's AI assistant.

**CONTEXT**: The user has confirmed they want to create a meal. You are now generating the complete recipe details.

Your task: Generate a complete, detailed recipe for the requested meal.
`;

const RECIPE_RESPONSE_SCHEMA: Record<string, unknown> = {
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
    return (
      !lowerName.includes('embed') &&
      !lowerName.includes('vision') &&
      !lowerName.includes('multimodal')
    );
  });

  return textModels;
}

/**
 * Phase 1a: Detect the user's action type (non-streaming).
 * Returns the action classification: 'general' or 'wantsToCreateMeal'.
 */
export async function detectAction(
  model: string,
  messages: ChatMessage[],
): Promise<'general' | 'wantsToCreateMeal' | null> {
  const ollamaMessages = [
    { role: 'system' as const, content: ACTION_DETECTION_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.rawContent ?? m.content,
    })),
  ];

  try {
    const response = await ollamaClient.chat({
      model,
      messages: ollamaMessages,
      stream: false,
      format: ACTION_DETECTION_SCHEMA,
    });

    const parsed = JSON.parse(response.message.content);
    const action = parsed?.action;
    
    if (action === 'general' || action === 'wantsToCreateMeal') {
      return action;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Phase 1b.1: Streaming response for general conversation.
 * Called after action is detected as "general".
 */
export async function getGeneralResponse(
  model: string,
  messages: ChatMessage[],
): Promise<AbortableAsyncIterator<ChatResponse>> {
  const ollamaMessages = [
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.rawContent ?? m.content,
    })),
        { role: 'system' as const, content: GENERAL_RESPONSE_PROMPT },
  ];

  return ollamaClient.chat({
    model,
    messages: ollamaMessages,
    stream: true,
    format: GENERAL_RESPONSE_SCHEMA,
  });
}

/**
 * Phase 1b.2: Get proposed meal name (non-streaming).
 * Called after action is detected as "wantsToCreateMeal".
 */
export async function getMealNameProposal(
  model: string,
  messages: ChatMessage[],
): Promise<string | null> {
  const ollamaMessages = [
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.rawContent ?? m.content,
    })),
        { role: 'system' as const, content: MEAL_NAME_PROPOSAL_PROMPT },
  ];

  try {
    const response = await ollamaClient.chat({
      model,
      messages: ollamaMessages,
      stream: false,
      format: MEAL_NAME_PROPOSAL_SCHEMA,
    });

    const parsed = JSON.parse(response.message.content);
    const proposedMealName = parsed?.proposedMealName;
    
    return typeof proposedMealName === 'string' ? proposedMealName : null;
  } catch {
    return null;
  }
}

/**
 * Phase 2: Non-streaming recipe generation after user confirms intent.
 * Returns the parsed meal proposal, or null on failure.
 */
export async function generateRecipe(
  model: string,
  mealName: string,
): Promise<ParsedOllamaResponse | null> {
  const response = await ollamaClient.chat({
    model,
    messages: [
      { role: 'system' as const, content: RECIPE_GENERATION_PROMPT },
      { role: 'user' as const, content: `Create a recipe for: ${mealName}` },
    ],
    stream: false,
    format: RECIPE_RESPONSE_SCHEMA,
  });

  return parseOllamaResponse(response.message.content);
}

export async function pullModelStream(
  model: string,
): Promise<AbortableAsyncIterator<ProgressResponse>> {
  return ollamaClient.pull({ model, stream: true });
}

function coerceMealCategory(value: string): MealCategory {
  const valid: MealCategory[] = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'dessert',
    'drink',
  ];
  return (
    valid.includes(value as MealCategory) ? value : 'dinner'
  ) as MealCategory;
}

function coerceIngredientType(value: string): IngredientType {
  const valid: IngredientType[] = [
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
  ];
  return (
    valid.includes(value as IngredientType) ? value : 'other'
  ) as IngredientType;
}

function coerceMeasurementUnit(value: string): MeasurementUnit {
  const valid: MeasurementUnit[] = [
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
  ];
  return (
    valid.includes(value as MeasurementUnit) ? value : 'other'
  ) as MeasurementUnit;
}

export interface ParsedOllamaResponse {
  response: string;
  meals: AgentMealProposal[];
}

export interface ParsedGeneralResponse {
  response: string;
}

/**
 * Parse the Phase 1b.1 (general response) JSON response.
 */
export function parseGeneralResponse(json: string): ParsedGeneralResponse | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const response = typeof parsed.response === 'string' ? parsed.response : '';
    return { response };
  } catch {
    return null;
  }
}

/**
 * Parse the Phase 2 (recipe generation) JSON response.
 */
export function parseOllamaResponse(json: string): ParsedOllamaResponse | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const response = typeof parsed.response === 'string' ? parsed.response : '';

    const rawMeals = Array.isArray(parsed.meals) ? parsed.meals : [];
    const meals: AgentMealProposal[] = rawMeals
      .filter(
        (m: unknown): m is Record<string, unknown> =>
          typeof m === 'object' && m !== null,
      )
      .map((m: Record<string, unknown>) => ({
        title: typeof m.title === 'string' ? m.title : 'Untitled Meal',
        description: typeof m.description === 'string' ? m.description : '',
        category: coerceMealCategory(
          typeof m.category === 'string' ? m.category : '',
        ),
        prepTime:
          typeof m.prepTime === 'number'
            ? Math.max(0, Math.round(m.prepTime))
            : 0,
        cookTime:
          typeof m.cookTime === 'number'
            ? Math.max(0, Math.round(m.cookTime))
            : 0,
        servingSize:
          typeof m.servingSize === 'number'
            ? Math.max(1, Math.round(m.servingSize))
            : 1,
        instructions: Array.isArray(m.instructions)
          ? m.instructions.filter((i: unknown) => typeof i === 'string')
          : [],
        imageUrl: '',
        ingredients: Array.isArray(m.ingredients)
          ? m.ingredients
              .filter(
                (i: unknown): i is Record<string, unknown> =>
                  typeof i === 'object' && i !== null,
              )
              .map((i: Record<string, unknown>) => ({
                name: typeof i.name === 'string' ? i.name : 'Unknown',
                type: coerceIngredientType(
                  typeof i.type === 'string' ? i.type : '',
                ),
                unit: coerceMeasurementUnit(
                  typeof i.unit === 'string' ? i.unit : '',
                ),
                servings:
                  typeof i.servings === 'number' ? Math.max(1, i.servings) : 1,
              }))
          : [],
      }));

    return { response, meals };
  } catch {
    return null;
  }
}

/**
 * Extract partial "response" text from an in-progress JSON stream.
 * Used for Phase 1b.1 (general response streaming).
 * Allows progressive display while the full JSON is still building.
 */
export function extractPartialResponse(partialJson: string): string {
  const match = partialJson.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (!match) return '';
  
  try {
    return JSON.parse('"' + match[1] + '"') as string;
  } catch {
    return '';
  }
}
