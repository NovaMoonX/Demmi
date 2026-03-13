# Agent Architecture Redesign - Design Document

**Date:** March 12, 2026  
**Version:** 1.2  
**Status:** In Design
**Goal:** Improve Ollama agent performance, reliability, and modularity

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current Architecture](#current-architecture)
3. [Performance Analysis](#performance-analysis)
4. [Proposed Architecture](#proposed-architecture)
5. [Key Improvements](#key-improvements)
6. [Implementation Plan](#implementation-plan)
7. [Technical Decisions](#technical-decisions)
8. [Open Questions](#open-questions)

---

## Problem Statement

### Current Issues

1. **Slow Response Time:** Users wait 2-5 seconds before seeing any response
2. **Sequential Latency:** Multiple API calls stack (detection → proposal → generation)
3. **Lack of Progressive Feedback:** No visual feedback during long operations
4. **Rigid Architecture:** Adding new action types requires significant refactoring
5. **Excessive Context:** Full conversation history sent for every call
6. **Non-streaming Long Tasks:** Recipe generation takes 2-5+ seconds with no feedback

### User Experience Impact

- ❌ Feels slow and unresponsive
- ❌ No indication of progress during generation
- ❌ Long wait times discourage usage
- ❌ Difficult to iterate and add new features

---

## Current Architecture

### Message Flow (As-Is)

```
User sends message
    ↓
[1] detectAction() - non-streaming (100-200ms)
    ├─→ "general"
    │       ↓
    │   [2] getGeneralResponse() - streaming ✓
    │       User sees response progressively
    │
    └─→ "wantsToCreateMeal"
            ↓
        [2] getMealNameProposal() - non-streaming (100-200ms)
            Show confirmation UI
            ↓
        User clicks "Yes, create it"
            ↓
        [3] generateRecipe() - non-streaming (2-5+ seconds)
            No feedback until complete
            ↓
        Show full recipe for review
            ↓
        User clicks "Save"
            ↓
        Save to Redux + Firestore
```

### Performance Breakdown

**General Flow:**
- Detection: 100-200ms
- Response: Streaming (feels instant)
- **Total perceived latency: ~200ms** ✓

**Create Meal Flow:**
- Detection: 100-200ms
- Name proposal: 100-200ms
- **User sees confirmation: 200-400ms** (not bad)
- User confirms (human action)
- Recipe generation: 2,000-5,000ms
- **User waits with no feedback: 2-5 seconds** ❌

### Current Code Structure

```
src/lib/ollama/
  ├── ollama.service.ts (650+ lines, monolithic)
  │   ├── listLocalModels()
  │   ├── detectAction()
  │   ├── getGeneralResponse()
  │   ├── getMealNameProposal()
  │   ├── generateRecipe()
  │   ├── parseOllamaResponse()
  │   ├── parseGeneralResponse()
  │   └── extractPartialResponse()
  └── index.ts (exports)
```

**Issues:**
- All logic in one file
- Tightly coupled prompts and schemas
- Hard to test individual pieces
- Adding new actions requires editing multiple places

---

## Proposed Architecture

### Message Flow (To-Be)

```
User sends message
    ↓
[1] Detect Intent using generate() (80-120ms)
    Pass: last 10 summaries + current message
    ↓
    ├─→ "general"
    │       ↓
    │   [2] Execute general handler (streaming)
    │       User sees response progressively
    │       ↓
    │   [3] Generate summary async (non-blocking)
    │       Store for future intent detection
    │
    └─→ "createMeal"
            ↓
        [2] Execute multi-step handler
            ├─→ Step 1: Meal Name (80ms)
            │   UI: Show name in confirmation card
            │   ↓
            │   User clicks "Yes, create it"
            │   ↓
            ├─→ Step 2: Category + Servings (100ms)
            │   UI: Update card with category badge
            │   ↓
            ├─→ Step 3: Description (150ms)
            │   UI: Show description text
            │   ↓
            ├─→ Step 4: Ingredients (200ms per batch)
            │   UI: Ingredients appear progressively
            │   ↓
            └─→ Step 5: Instructions (300ms)
                UI: Steps appear one by one
                ↓
        Show complete recipe for review
            ↓
        [3] Generate summary async (non-blocking)
            Store: "Created recipe for [name] with [X] ingredients"
```

### Performance Improvements

**General Flow:**
- Detection: 80-120ms (using `generate()` + summaries)
- Response: Streaming
- Summary generation: Async, non-blocking
- **Total perceived latency: ~100ms** ✓ (faster than before)

**Create Meal Flow:**
- Detection: 80-120ms
- Name: 80ms
- **User sees name: ~200ms** ✓ (faster)
- User confirms
- Category + Servings: 100ms → **UI updates**
- Description: 150ms → **UI updates**
- Ingredients: 200ms → **UI updates**
- Instructions: 300ms → **UI updates**
- **Total generation: ~750ms with progressive feedback** ✓ (much better UX!)

### New Code Structure

```
src/lib/ollama/
  ├── ollama.service.ts (core client functions)
  │   ├── ollamaClient
  │   ├── listLocalModels()
  │   ├── detectIntent() - uses generate()
  │   ├── generateSummary() - async helper
  │   └── executeActionStep() - generic step executor
  │
  ├── actions/
  │   ├── registry.ts - ACTION_REGISTRY
  │   ├── types.ts - ActionHandler, ActionStep interfaces
  │   │
  │   ├── generalAction.ts
  │   │   ├── Imports prompts from @lib/ollama/prompts
  │   │   ├── Imports schemas from @lib/ollama/schemas
  │   │   ├── executeGeneral() - handles execution + dispatch
  │   │   └── Exports generalAction handler
  │   │
  │   ├── createMealAction.ts
  │   │   ├── Imports prompts from @lib/ollama/prompts
  │   │   ├── Imports schemas from @lib/ollama/schemas
  │   │   ├── steps[] - each step handles its own dispatch
  │   │   │   ├── proposeNameStep
  │   │   │   ├── generateBasicInfoStep
  │   │   │   ├── generateDescriptionStep
  │   │   │   ├── generateIngredientsStep
  │   │   │   └── generateInstructionsStep
  │   │   └── Exports createMealAction handler
  │   │
  │   └── ... (future actions: addIngredient, planWeek, etc.)
  │
  ├── prompts/
  │   ├── intent.prompts.ts - Intent detection prompts
  │   ├── general.prompts.ts - General conversation prompts
  │   ├── meal.prompts.ts - Meal creation prompts
  │   └── summary.prompts.ts - Summary generation prompts
  │
  ├── schemas/
  │   ├── intent.schema.ts - Intent detection schemas
  │   ├── general.schema.ts - General response schemas
  │   ├── meal.schemas.ts - Meal step schemas
  │   └── summary.schema.ts - Summary generation schema
  │
  └── index.ts (clean exports)
```

**Benefits:**
- ✅ Modular: Each action is self-contained (includes prompts, schemas, AND dispatch logic)
- ✅ Testable: Easy to unit test individual actions
- ✅ Maintainable: Clear separation of concerns
- ✅ Extensible: Add new actions without touching existing code
- ✅ Discoverable: Clear file structure
- ✅ Centralized: Prompts and schemas are reusable across actions

---

## Key Improvements

### 1. Summary-Based Intent Detection

**Problem:** Passing full conversation history is slow and doesn't scale.

**Solution:** Generate and store summaries for efficient context.

#### Implementation

```typescript
// In ChatMessage type
export interface ChatMessage {
  // ... existing fields
  summary: string | null; // 2-4 sentence summary of this exchange
}

// Summary generation (async, non-blocking)
export async function generateSummary(
  model: string,
  userMessage: string,
  assistantMessage: string,
): Promise<string> {
  // Only generate if messages are substantial
  if (userMessage.length < 100 && assistantMessage.length < 200) {
    return ''; // Short messages don't need summaries
  }

  const response = await ollamaClient.generate({
    model,
    prompt: `Summarize this exchange in 2-4 sentences. Include key topics, requests, and important context:\n\nUser: ${userMessage}\n\nAssistant: ${assistantMessage}\n\nSummary:`,
    stream: false,
  });

  return response.response.trim();
}

// Intent detection using summaries
export async function detectIntent(
  model: string,
  messages: ChatMessage[],
): Promise<ActionType> {
  // Get last 10 summaries (skip messages without summaries)
  const recentSummaries = messages
    .slice(-10)
    .filter(m => m.summary)
    .map(m => m.summary)
    .join('\n');

  // Get current (full) message
  const currentMessage = messages[messages.length - 1].content;

  const prompt = `${INTENT_DETECTION_PROMPT}

Recent context (summaries):
${recentSummaries}

Current user message:
${currentMessage}

Classify the current message intent.`;

  const response = await ollamaClient.generate({
    model,
    prompt,
    format: INTENT_SCHEMA,
    stream: false,
  });

  // Parse and return intent
  return parseIntent(response.response);
}
```

#### Workflow

1. User sends message
2. Detect intent (using last 10 summaries + current message)
3. Execute action
4. **After** response is displayed, generate summary async:
   ```typescript
   // Non-blocking summary generation
   generateSummary(model, userMsg, assistantMsg)
     .then(summary => {
       dispatch(updateMessageSummary({ messageId, summary }));
     })
     .catch(err => console.warn('Summary generation failed', err));
   ```

#### Benefits

- ✅ Consistent token usage (summaries are fixed size)
- ✅ Preserves context from early in conversation
- ✅ Faster intent detection (smaller payload)
- ✅ Scales to hundreds of messages
- ✅ Non-blocking (doesn't slow down main flow)

### 2. Modular Action Handler System

**Problem:** Monolithic service file, hard to extend.

**Solution:** Plugin-like architecture with registry.

#### Core Interfaces

```typescript
// src/lib/ollama/actions/types.ts

export type ActionType = 'general' | 'createMeal' | 'addIngredient' | 'planWeek';

export interface StepContext {
  messages: ChatMessage[];
  chatId: string;
  messageId: string;
  previousResults?: Record<string, unknown>; // Results from previous steps
}

export interface StepRuntime {
  dispatch: AppDispatch; // Redux dispatcher
  abortSignal?: AbortSignal; // For cancellation support
}

export interface StepResult {
  stepName: string;
  data: unknown;
  error?: string;
  cancelled?: boolean; // Indicates if step was cancelled
}

export interface ActionStep {
  name: string; // e.g., "proposeName", "generateIngredients"
  prompt: string;
  schema: Record<string, unknown>;
  isStreaming?: boolean;
  
  // Executes the step AND handles its own Redux dispatch
  execute: (
    model: string,
    context: StepContext,
    runtime: StepRuntime,
  ) => Promise<StepResult | AsyncIterableIterator<StepResult>>;
  
  // Optional: Cleanup on cancellation
  onCancel?: (context: StepContext, runtime: StepRuntime) => void;
}

export interface ActionHandler {
  type: ActionType;
  description: string;
  isMultiStep: boolean;
  
  // For single-step actions (general)
  execute?: (
    model: string,
    context: StepContext,
    runtime: StepRuntime,
  ) => Promise<ActionResult | AsyncIterableIterator<ActionResult>>;
  
  // For multi-step actions (createMeal)
  steps?: ActionStep[];
  
  // Optional: Called before starting multi-step execution
  onStart?: (context: StepContext, runtime: StepRuntime) => void;
  
  // Optional: Called after all steps complete successfully
  onComplete?: (context: StepContext, runtime: StepRuntime) => void;
  
  // Optional: Called if execution is cancelled mid-flow
  onCancel?: (context: StepContext, runtime: StepRuntime, completedSteps: string[]) => void;
}

export interface ActionResult {
  type: ActionType;
  data: unknown;
  error?: string;
}
```

#### Example: General Action (Single-Step)

```typescript
// src/lib/ollama/actions/generalAction.ts

import { GENERAL_PROMPT } from '@lib/ollama/prompts/general.prompts';
import { GENERAL_SCHEMA } from '@lib/ollama/schemas/general.schema';
import { ollamaClient } from '@lib/ollama/ollama.service';
import { updateMessageContent } from '@store/slices/chatsSlice';
import { extractPartialResponse } from '@lib/ollama/ollama.service';
import type { ActionHandler } from './types';

export const generalAction: ActionHandler = {
  type: 'general',
  description: 'Handle general conversation, questions, and tips',
  isMultiStep: false,
  
  async execute(model, context, runtime) {
    const { messages, chatId, messageId } = context;
    const { dispatch, abortSignal } = runtime;
    
    // Use chat() for conversational context
    const stream = await ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: GENERAL_PROMPT },
        ...messages.slice(-5).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      format: GENERAL_SCHEMA,
      signal: abortSignal, // Support cancellation
    });

    // Handle streaming with dispatch inside action
    let responseContent = '';
    for await (const chunk of stream) {
      if (abortSignal?.aborted) {
        break;
      }
      
      responseContent += chunk.message.content;
      const displayContent = extractPartialResponse(responseContent);
      
      // Dispatch Redux update from within action
      dispatch(updateMessageContent({
        chatId,
        messageId,
        content: displayContent,
      }));
    }

    return {
      type: 'general',
      data: { content: responseContent },
    };
  },
};
```

#### Example: Create Meal Action (Multi-Step)

```typescript
// src/lib/ollama/actions/createMealAction.ts

import {
  MEAL_NAME_PROMPT,
  MEAL_INFO_PROMPT,
  MEAL_DESCRIPTION_PROMPT,
  MEAL_INGREDIENTS_PROMPT,
  MEAL_INSTRUCTIONS_PROMPT,
} from '@lib/ollama/prompts/meal.prompts';

import {
  MEAL_NAME_SCHEMA,
  MEAL_INFO_SCHEMA,
  MEAL_DESCRIPTION_SCHEMA,
  MEAL_INGREDIENTS_SCHEMA,
  MEAL_INSTRUCTIONS_SCHEMA,
} from '@lib/ollama/schemas/meal.schemas';

import { ollamaClient } from '@lib/ollama/ollama.service';
import type { ActionHandler, ActionStep, StepContext, StepResult } from './types';

// Step 1: Propose meal name
const proposeNameStep: ActionStep = {
  name: 'proposeName',
  prompt: MEAL_NAME_PROMPT,
  schema: MEAL_NAME_SCHEMA,
  
  async execute(model, context, runtime) {
    const { messages, chatId, messageId } = context;
    const { dispatch, abortSignal } = runtime;
    
    // Update UI to show we're generating the name
    dispatch(updateAgentActionStatus({
      chatId,
      messageId,
      status: 'generating_name',
    }));
    
    try {
      const response = await ollamaClient.chat({
        model,
        messages: [
          { role: 'system', content: this.prompt },
          ...messages.slice(-3).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        stream: false,
        format: this.schema,
        signal: abortSignal, // Support cancellation
      });

      if (abortSignal?.aborted) {
        return {
          stepName: this.name,
          data: {},
          cancelled: true,
        };
      }

      const parsed = JSON.parse(response.message.content);
      
      // Update Redux with the meal name
      dispatch(updateRecipeStep({
        chatId,
        messageId,
        stepName: this.name,
        data: { name: parsed.name },
      }));
      
      return {
        stepName: this.name,
        data: { name: parsed.name },
      };
    } catch (err) {
      return {
        stepName: this.name,
        data: {},
        error: err instanceof Error ? err.message : 'Failed to generate name',
      };
    }
  },
  
  onCancel(context, runtime) {
    // Clean up on cancellation
    runtime.dispatch(updateAgentActionStatus({
      chatId: context.chatId,
      messageId: context.messageId,
      status: 'cancelled',
    }));
  },
};

// Step 2: Generate category + servings + time
const generateBasicInfoStep: ActionStep = {
  name: 'generateBasicInfo',
  prompt: MEAL_INFO_PROMPT,
  schema: MEAL_INFO_SCHEMA,
  
  async execute(model, context) {
    const mealName = context.previousResults?.name as string;
    
    const response = await ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: this.prompt },
        { role: 'user', content: `Generate basic info for: ${mealName}` },
      ],
      stream: false,
      format: this.schema,
    });

    const parsed = JSON.parse(response.message.content);
    
    return {
      stepName: this.name,
      data: {
        category: parsed.category,
        servings: parsed.servings,
        totalTime: parsed.totalTime,
      },
    };
  },
};

// Step 3: Generate description
const generateDescriptionStep: ActionStep = {
  name: 'generateDescription',
  prompt: MEAL_DESCRIPTION_PROMPT,
  schema: MEAL_DESCRIPTION_SCHEMA,
  
  async execute(model, context) {
    const mealName = context.previousResults?.name as string;
    
    const response = await ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: this.prompt },
        { role: 'user', content: `Write a description for: ${mealName}` },
      ],
      stream: false,
      format: this.schema,
    });

    const parsed = JSON.parse(response.message.content);
    
    return {
      stepName: this.name,
      data: { description: parsed.description },
    };
  },
};

// Step 4: Generate ingredients
const generateIngredientsStep: ActionStep = {
  name: 'generateIngredients',
  prompt: MEAL_INGREDIENTS_PROMPT,
  schema: MEAL_INGREDIENTS_SCHEMA,
  
  async execute(model, context) {
    const mealName = context.previousResults?.name as string;
    const servings = context.previousResults?.servings as number;
    
    const response = await ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: this.prompt },
        { role: 'user', content: `List ingredients for ${mealName} (${servings} servings)` },
      ],
      stream: false,
      format: this.schema,
    });

    const parsed = JSON.parse(response.message.content);
    
    return {
      stepName: this.name,
      data: { ingredients: parsed.ingredients },
    };
  },
};

// Step 5: Generate instructions
const generateInstructionsStep: ActionStep = {
  name: 'generateInstructions',
  prompt: MEAL_INSTRUCTIONS_PROMPT,
  schema: MEAL_INSTRUCTIONS_SCHEMA,
  
  async execute(model, context) {
    const mealName = context.previousResults?.name as string;
    const ingredients = context.previousResults?.ingredients as Array<unknown>;
    
    const response = await ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: this.prompt },
        {
          role: 'user',
          content: `Write instructions for ${mealName} using these ingredients: ${JSON.stringify(ingredients)}`,
        },
      ],
      stream: false,
      format: this.schema,
    });

    const parsed = JSON.parse(response.message.content);
    
    return {
      stepName: this.name,
      data: { instructions: parsed.instructions },
    };
  },
};

// Export the complete action handler
export const createMealAction: ActionHandler = {
  type: 'createMeal',
  description: 'Create a new meal recipe with ingredients and instructions',
  isMultiStep: true,
  
  steps: [
    proposeNameStep,
    generateBasicInfoStep,
    generateDescriptionStep,
    generateIngredientsStep,
    generateInstructionsStep,
  ],
  
  onStart(context, runtime) {
    // Initialize the recipe generation UI
    runtime.dispatch(updateAgentActionStatus({
      chatId: context.chatId,
      messageId: context.messageId,
      status: 'generating_name',
    }));
  },
  
  onComplete(context, runtime) {
    // Mark recipe as ready for approval
    runtime.dispatch(updateAgentActionStatus({
      chatId: context.chatId,
      messageId: context.messageId,
      status: 'pending_approval',
    }));
  },
  
  onCancel(context, runtime, completedSteps) {
    // Handle cancellation - clean up partial recipe
    console.log(`Recipe generation cancelled after steps: ${completedSteps.join(', ')}`);
    
    runtime.dispatch(updateAgentActionStatus({
      chatId: context.chatId,
      messageId: context.messageId,
      status: 'cancelled',
    }));
    
    // Optionally: Remove the partial recipe from Redux
    if (completedSteps.length === 0) {
      runtime.dispatch(removeMessage({
        chatId: context.chatId,
        messageId: context.messageId,
      }));
    }
  },
};
```

#### Action Registry

```typescript
// src/lib/ollama/actions/registry.ts

import { generalAction } from './generalAction';
import { createMealAction } from './createMealAction';
import type { ActionType, ActionHandler } from './types';

export const ACTION_REGISTRY: Record<ActionType, ActionHandler> = {
  general: generalAction,
  createMeal: createMealAction,
  // Future actions:
  // addIngredient: addIngredientAction,
  // planWeek: planWeekAction,
};

export function getActionHandler(actionType: ActionType): ActionHandler {
  const handler = ACTION_REGISTRY[actionType];
  if (!handler) {
    throw new Error(`Unknown action type: ${actionType}`);
  }
  return handler;
}
```

#### Usage in Chat.tsx

```typescript
// src/screens/Chat.tsx - simplified excerpt

import { detectIntent } from '@lib/ollama/ollama.service';
import { getActionHandler } from '@lib/ollama/actions/registry';
import { useAppDispatch } from '@store/hooks';

export function Chat() {
  // Hook must be called at component top level
  const dispatch = useAppDispatch();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const handleSendMessage = async () => {
    // ... validation & setup
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
  
    try {
      // Step 1: Detect intent
      const intent = await detectIntent(selectedModel, allMessages);
      
      // Step 2: Get handler from registry
      const handler = getActionHandler(intent);
      
      // Step 3: Build context (no dispatch/abortSignal here!)
      const context = {
        messages: allMessages,
        chatId: targetChatId,
        messageId: assistantMessageId,
        previousResults: {},
      };
      
      // Step 4: Build runtime (dispatch + abortSignal separate)
      const runtime = {
        dispatch,
        abortSignal: abortController.signal,
      };
    
      // Step 5: Execute based on handler type
      if (handler.isMultiStep) {
        // Multi-step execution
        handler.onStart?.(context, runtime);
        
        const completedSteps: string[] = [];
        
        for (const step of handler.steps!) {
          // Check for cancellation before each step
          if (runtime.abortSignal?.aborted) {
            handler.onCancel?.(context, runtime, completedSteps);
            break;
          }
          
          // Execute step with separate runtime param
          const result = await step.execute(selectedModel, context, runtime);
          
          // Check if step was cancelled or errored
          if (result.cancelled) {
            handler.onCancel?.(context, runtime, completedSteps);
            break;
          }
          
          if (result.error) {
            console.error(`Step ${step.name} failed:`, result.error);
            // Optionally: retry logic here
            break;
          }
          
          // Store result for next step
          context.previousResults = {
            ...context.previousResults,
            ...result.data,
          };
          
          completedSteps.push(step.name);
        }
        
        // Only call onComplete if all steps finished successfully
        if (completedSteps.length === handler.steps!.length) {
          handler.onComplete?.(context, runtime);
        }
        
      } else {
        // Single-step execution (action handles dispatch internally)
        await handler.execute!(selectedModel, context, runtime);
      }
      
      // Step 6: Generate summary (async, non-blocking)
      generateSummary(selectedModel, userMessage, assistantMessage)
        .then(summary => {
          dispatch(updateMessageSummary({ messageId: assistantMessageId, summary }));
        })
        .catch(err => console.warn('Summary generation failed', err));
      
    } catch (err) {
      // Error handling
      console.error('Action execution failed:', err);
    } finally {
      abortControllerRef.current = null;
    }
  };
  
  // Handle cancel button click
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  
  // ... rest of component
}
```

### 3. Multi-Step Recipe Generation

**Problem:** Single long API call with no feedback.

**Solution:** Break into 5 progressive steps with UI updates.

#### Step-by-Step Breakdown

| Step | What | Time | Schema Complexity | UI Update |
|------|------|------|-------------------|-----------|
| 1 | Meal Name | ~80ms | Simple (1 field) | Show name in card |
| 2 | Category + Servings + Time | ~100ms | Simple (3 fields) | Add category badge |
| 3 | Description | ~150ms | Simple (1 field) | Show description |
| 4 | Ingredients | ~200ms | Medium (array) | List appears |
| 5 | Instructions | ~300ms | Medium (array) | Steps appear |

**Total: ~830ms with 5 visual updates** (vs 2-5 seconds with no feedback)

#### Simplified Schemas

```typescript
// Step 1: Name only
export const MEAL_NAME_SCHEMA = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
};

// Step 2: Basic info
export const MEAL_INFO_SCHEMA = {
  type: 'object',
  required: ['category', 'servings', 'totalTime'],
  properties: {
    category: { type: 'string', enum: MEAL_CATEGORIES },
    servings: { type: 'integer', minimum: 1 },
    totalTime: { type: 'integer', minimum: 1 },
  },
};

// Step 3: Description
export const MEAL_DESCRIPTION_SCHEMA = {
  type: 'object',
  required: ['description'],
  properties: {
    description: { type: 'string' },
  },
};

// Step 4: Ingredients (simplified!)
export const MEAL_INGREDIENTS_SCHEMA = {
  type: 'object',
  required: ['ingredients'],
  properties: {
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'amount'],
        properties: {
          name: { type: 'string' },
          amount: { type: 'string' }, // e.g., "2 cups", "1 tbsp"
        },
      },
    },
  },
};

// Step 5: Instructions
export const MEAL_INSTRUCTIONS_SCHEMA = {
  type: 'object',
  required: ['instructions'],
  properties: {
    instructions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};
```

#### UI Updates (AgentActionCard)

```typescript
// New status states for multi-step progress
export type AgentActionStatus =
  | 'detecting_intent'
  | 'generating_name'
  | 'generating_info'
  | 'generating_description'
  | 'generating_ingredients'
  | 'generating_instructions'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'; // New: for interrupted generation

// AgentActionCard shows progressive updates
export function AgentActionCard({ action }: Props) {
  if (action.status === 'generating_name') {
    return <LoadingState message="Thinking of a name..." />;
  }
  
  if (action.status === 'generating_info') {
    return (
      <Card>
        <h3>{action.meals[0].name}</h3>
        <LoadingState message="Getting details..." />
      </Card>
    );
  }
  
  if (action.status === 'generating_description') {
    return (
      <Card>
        <h3>{action.meals[0].name}</h3>
        <Badge>{action.meals[0].category}</Badge>
        <p>{action.meals[0].servings} servings · {action.meals[0].totalTime}m</p>
        <LoadingState message="Writing description..." />
      </Card>
    );
  }
  
  if (action.status === 'generating_ingredients') {
    return (
      <Card>
        {/* ... name, category, description */}
        <LoadingState message="Gathering ingredients..." />
      </Card>
    );
  }
  
  if (action.status === 'generating_instructions') {
    return (
      <Card>
        {/* ... name, category, description, ingredients */}
        <LoadingState message="Writing instructions..." />
      </Card>
    );
  }
  
  // ... rest of states
}
```

### 4. Redux Dispatch Within Actions (True Modularity)

**Problem:** Chat.tsx needs to know about action-specific Redux updates (`updateRecipeStep`, `markRecipeComplete`, etc.).

**Solution:** Pass `dispatch` in `StepRuntime` (separate from business context); let actions handle their own Redux updates.

#### Benefits

- ✅ **True modularity:** Actions are completely self-contained
- ✅ **No coupling:** Chat.tsx doesn't need to know about meal-specific Redux actions
- ✅ **Easier testing:** Mock dispatch to test action behavior in isolation
- ✅ **Clean separation:** Business context vs runtime concerns
- ✅ **React compliant:** `useAppDispatch()` called at component top level
- ✅ **Clearer responsibilities:** Each action owns its state management
- ✅ **Simpler Chat.tsx:** Generic execution loop for all actions

#### Before vs After

**Before (Chat.tsx knows about recipe actions):**
```typescript
// Chat.tsx needs to import meal-specific actions
import { updateRecipeStep, markRecipeComplete } from '@store/slices/chatsSlice';

const handleSendMessage = async () => {
  const dispatch = useAppDispatch(); // ❌ Inside function
  
  for (const step of handler.steps!) {
    const result = await step.execute(selectedModel, context);
    
    // Chat.tsx dispatches action-specific updates ❌
    dispatch(updateRecipeStep({
      chatId: targetChatId,
      messageId: assistantMessageId,
      stepName: result.stepName,
      data: result.data,
    }));
    
    context.previousResults = { ...context.previousResults, ...result.data };
  }
  
  // Chat.tsx knows about completion ❌
  dispatch(markRecipeComplete({ chatId, messageId }));
};
```

**After (Actions handle their own dispatch):**
```typescript
// Chat.tsx component
export function Chat() {
  const dispatch = useAppDispatch(); // ✅ At component top level
  
  const handleSendMessage = async () => {
    // Build runtime with dispatch
    const runtime = { dispatch, abortSignal: abortController.signal };
    
    // Chat.tsx is generic - doesn't know about specific actions ✅
    for (const step of handler.steps!) {
      const result = await step.execute(selectedModel, context, runtime);
      
      // Step already dispatched updates internally via runtime.dispatch ✅
      // Chat.tsx just manages the loop
      
      if (result.cancelled || result.error) break;
      
      context.previousResults = { ...context.previousResults, ...result.data };
    }
    
    // Action's onComplete() handles finalization ✅
    handler.onComplete?.(context, runtime);
  };
}
```

### 5. Step Interruption Support (Cancellation)

**Problem:** Users can't cancel multi-step generation mid-flow. Long operations block UI.

**Solution:** Pass `AbortSignal` in context; check before each step; provide cancel button.

#### Implementation

**1. Runtime includes AbortSignal:**
```typescript
const abortController = new AbortController();

const context = {
  messages: allMessages,
  chatId: targetChatId,
  messageId: assistantMessageId,
  previousResults: {},
};

const runtime = {
  dispatch,
  abortSignal: abortController.signal, // ← Add signal as separate param
};
```

**2. Steps check signal:**
```typescript
async execute(model, context, runtime) {
  const { abortSignal, dispatch } = runtime;
  
  // Pass signal to Ollama
  const response = await ollamaClient.chat({
    model,
    messages: [...],
    signal: abortSignal, // ← Ollama supports AbortSignal
  });
  
  // Check if cancelled during processing
  if (abortSignal?.aborted) {
    return { stepName: this.name, data: {}, cancelled: true };
  }
  
  // Process & dispatch...
}
```

**3. Chat.tsx handles cancel button:**
```typescript
export function Chat() {
  // Hook at top level
  const dispatch = useAppDispatch();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

// In UI
{isSending && (
  <Button onClick={handleCancelGeneration}>
    Cancel Generation
  </Button>
)}
```

**4. Actions clean up on cancellation:**
```typescript
export const createMealAction: ActionHandler = {
  // ...
  
  onCancel(context, runtime, completedSteps) {
    console.log(`Cancelled after: ${completedSteps.join(', ')}`);
    
    // Clean up partial recipe
    runtime.dispatch(updateAgentActionStatus({
      chatId: context.chatId,
      messageId: context.messageId,
      status: 'cancelled',
    }));
    
    // Optionally remove if no steps completed
    if (completedSteps.length === 0) {
      runtime.dispatch(removeMessage({
        chatId: context.chatId,
        messageId: context.messageId,
      }));
    }
  },
};
```

#### Benefits

- ✅ **Better UX:** Users can cancel long operations
- ✅ **Resource efficient:** Stops unnecessary API calls immediately
- ✅ **Clean state:** Proper cleanup via `onCancel()` hooks
- ✅ **Responsive:** No frozen UI waiting for completion
- ✅ **Standard API:** Uses native `AbortController`/`AbortSignal`

#### Cancellation Flow

```
User clicks "Cancel"
    ↓
Chat.tsx calls abortController.abort()
    ↓
Currently executing step sees runtime.abortSignal.aborted
    ↓
Step returns { cancelled: true }
    ↓
Chat.tsx stops loop, calls handler.onCancel(context, runtime, completedSteps)
    ↓
Action cleans up partial state via runtime.dispatch()
    ↓
UI shows "Cancelled" state
```

### 6. Prompts & Schemas Organization (Separation of Concerns)

**Clarification:** Prompts and schemas live in **separate folders**, NOT in action files.

#### Correct Structure

```
src/lib/ollama/
  ├── prompts/
  │   ├── intent.prompts.ts    ← INTENT_DETECTION_PROMPT defined here
  │   ├── general.prompts.ts   ← GENERAL_PROMPT defined here
  │   ├── meal.prompts.ts      ← MEAL_NAME_PROMPT, etc. defined here
  │   └── summary.prompts.ts   ← SUMMARY_GENERATION_PROMPT defined here
  │
  ├── schemas/
  │   ├── intent.schema.ts     ← INTENT_SCHEMA defined here
  │   ├── general.schema.ts    ← GENERAL_SCHEMA defined here
  │   ├── meal.schemas.ts      ← MEAL_NAME_SCHEMA, etc. defined here
  │   └── summary.schema.ts    ← SUMMARY_SCHEMA defined here
  │
  └── actions/
      ├── generalAction.ts     ← IMPORTS from prompts/ and schemas/
      └── createMealAction.ts  ← IMPORTS from prompts/ and schemas/
```

#### Example Files

**prompts/meal.prompts.ts:**
```typescript
export const MEAL_NAME_PROMPT = `Extract the meal name from the user's request.

Rules:
- Be specific (not "pasta" but "Spaghetti Carbonara")
- 1-4 words maximum
- Use proper capitalization
- If name not provided, infer from context

Respond with JSON: { "name": "Meal Name" }`;

export const MEAL_INFO_PROMPT = `Provide basic information for this meal...`;
export const MEAL_DESCRIPTION_PROMPT = `Write a 1-2 sentence description...`;
export const MEAL_INGREDIENTS_PROMPT = `List all ingredients with amounts...`;
export const MEAL_INSTRUCTIONS_PROMPT = `Write step-by-step cooking instructions...`;
```

**schemas/meal.schemas.ts:**
```typescript
import { MEAL_CATEGORIES } from '@lib/meals';

export const MEAL_NAME_SCHEMA = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
};

export const MEAL_INFO_SCHEMA = {
  type: 'object',
  required: ['category', 'servings', 'totalTime'],
  properties: {
    category: { type: 'string', enum: MEAL_CATEGORIES },
    servings: { type: 'integer', minimum: 1 },
    totalTime: { type: 'integer', minimum: 1 },
  },
};

// ... other schemas
```

**actions/createMealAction.ts:**
```typescript
// Import prompts
import {
  MEAL_NAME_PROMPT,
  MEAL_INFO_PROMPT,
  MEAL_DESCRIPTION_PROMPT,
  MEAL_INGREDIENTS_PROMPT,
  MEAL_INSTRUCTIONS_PROMPT,
} from '@lib/ollama/prompts/meal.prompts';

// Import schemas
import {
  MEAL_NAME_SCHEMA,
  MEAL_INFO_SCHEMA,
  MEAL_DESCRIPTION_SCHEMA,
  MEAL_INGREDIENTS_SCHEMA,
  MEAL_INSTRUCTIONS_SCHEMA,
} from '@lib/ollama/schemas/meal.schemas';

// Use in steps
const proposeNameStep: ActionStep = {
  name: 'proposeName',
  prompt: MEAL_NAME_PROMPT,    // ← Imported
  schema: MEAL_NAME_SCHEMA,    // ← Imported
  async execute(model, context) {
    // ...
  }
};
```

#### Why Separate?

- ✅ **Reusability:** Multiple actions can use similar prompts
- ✅ **Iteration:** Easy to tweak prompts without touching logic
- ✅ **Testing:** Can test prompts independently (eval frameworks)
- ✅ **Version control:** Easier to track prompt changes in git
- ✅ **A/B testing:** Swap prompts without changing action code
- ✅ **Prompt engineering:** Dedicated files for prompt optimization
- ✅ **Code organization:** Keeps action files focused on execution logic

### 7. `generate()` vs `chat()` (API Selection)

**Decision:** Use `generate()` for intent detection and summaries; `chat()` for everything else.

**Decision Matrix:**

| Task | Use | Reason |
|------|-----|--------|
| **Intent Detection** | `generate()` | Pure classification, no conversation context needed |
| **Summary Generation** | `generate()` | One-off task, no conversation context |
| **General Responses** | `chat()` | Conversational, needs history |
| **Recipe Steps** | `chat()` | Each step builds on previous, benefits from context |

**Why `generate()` for intent?**
- Intent detection is **classification**, not conversation
- We provide explicit context (summaries)
- No benefit from Ollama managing conversation history
- Slightly faster (less overhead)

**Why `chat()` for recipe steps?**
- Steps are sequential and related (name → description uses name)
- Better coherence when AI remembers previous steps
- Easier to pass context naturally

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Set up new file structure and core interfaces without breaking existing code.

#### Tasks

1. **Create new directory structure**
   ```
   src/lib/ollama/
     ├── actions/
     ├── prompts/
     └── schemas/
   ```

2. **Define core interfaces**
   - [ ] Create `actions/types.ts` with `ActionHandler`, `ActionStep`, `StepContext`, `StepRuntime`
   - [ ] Note: `StepContext` = business context, `StepRuntime` = dispatch + abortSignal
   - [ ] Export from `actions/index.ts`

3. **Add summary field to ChatMessage**
   - [ ] Update `chat.types.ts` to include `summary: string | null`
   - [ ] Update Redux slice to handle summary updates
   - [ ] Create migration for existing messages (set summary to null)

4. **Implement `generateSummary()` function**
   - [ ] Create `ollama.service.ts::generateSummary()`
   - [ ] Test with various message lengths
   - [ ] Ensure it's non-blocking

5. **Update `detectIntent()` to use summaries**
   - [ ] Modify to accept summaries as context
   - [ ] Fall back to full messages if summaries not available
   - [ ] Use `generate()` instead of `chat()`

**Deliverables:**
- ✅ New file structure
- ✅ Core interfaces defined
- ✅ Summary generation working
- ✅ Intent detection refactored

### Phase 2: Migrate General Action (Week 2)

**Goal:** Prove the new architecture works with simplest action. Establish prompts/schemas separation pattern.

#### Tasks

1. **Create prompts and schemas folders** ✅ **Critical: Separation of concerns**
   - [ ] Create `prompts/general.prompts.ts` with `GENERAL_PROMPT`
   - [ ] Create `prompts/intent.prompts.ts` with `INTENT_DETECTION_PROMPT`
   - [ ] Create `schemas/general.schema.ts` with `GENERAL_SCHEMA`
   - [ ] Create `schemas/intent.schema.ts` with `INTENT_SCHEMA`
   - [ ] Add barrel exports for each folder

2. **Extract general action**
   - [ ] Create `actions/generalAction.ts`
   - [ ] Import prompts from `@lib/ollama/prompts/general.prompts`
   - [ ] Import schemas from `@lib/ollama/schemas/general.schema`
   - [ ] Implement `ActionHandler` interface with `execute(model, context, runtime)`
   - [ ] Handle dispatch internally via `runtime.dispatch`

3. **Create action registry**
   - [ ] Create `actions/registry.ts`
   - [ ] Add `ACTION_REGISTRY` with `general` action
   - [ ] Add `getActionHandler()` helper

4. **Update Chat.tsx to use registry** ✅ **Separate context and runtime**
   - [ ] Move `useAppDispatch()` to component top level (before any returns)
   - [ ] Build `context` with business data (messages, chatId, messageId)
   - [ ] Build `runtime` with dispatch and abortSignal
   - [ ] Replace direct calls with `getActionHandler()`
   - [ ] Remove action-specific imports from Chat.tsx
   - [ ] Test general conversation flow
   - [ ] Ensure streaming still works

5. **Generate summaries after general responses**
   - [ ] Call `generateSummary()` async after response complete
   - [ ] Update Redux with summary
   - [ ] Test intent detection with summaries

**Deliverables:**
- ✅ Prompts/schemas properly separated and reusable
- ✅ General action fully migrated with internal dispatch
- ✅ Registry pattern working
- ✅ Chat.tsx is now generic (no action-specific logic)
- ✅ Summaries being generated and used

### Phase 3: Multi-Step Recipe Generation (Week 3)

**Goal:** Implement progressive recipe creation with visual feedback, internal dispatch, and cancellation support.

#### Tasks

1. **Define recipe prompts and schemas**
   - [ ] Create `prompts/meal.prompts.ts` with all 5 step prompts
   - [ ] Create `schemas/meal.schemas.ts` with all 5 step schemas
   - [ ] Keep schemas simple (1-3 fields each)
   - [ ] Write concise, focused prompts

2. **Implement createMealAction** ✅ **With internal dispatch via runtime**
   - [ ] Create `actions/createMealAction.ts`
   - [ ] Import prompts and schemas
   - [ ] Implement all 5 steps as `ActionStep` objects
   - [ ] Each step signature: `execute(model, context, runtime)`
   - [ ] Each step handles Redux updates via `runtime.dispatch`
   - [ ] Each step checks `runtime.abortSignal` for cancellation
   - [ ] Each step has `onCancel(context, runtime)` hook
   - [ ] Test each step individually

3. **Add action lifecycle hooks**
   - [ ] Implement `onStart(context, runtime)` to initialize UI
   - [ ] Implement `onComplete(context, runtime)` to mark recipe ready
   - [ ] Implement `onCancel(context, runtime, completedSteps)` to clean up
   - [ ] All hooks use `runtime.dispatch` for Redux updates
   - [ ] Add to registry

4. **Update Redux slice for progressive updates**
   - [ ] Add new action: `updateRecipeStep()`
   - [ ] Add new status states: `generating_name`, `generating_info`, etc.
   - [ ] Add `cancelled` status
   - [ ] Handle partial recipe state

5. **Update AgentActionCard for progressive UI**
   - [ ] Add UI for each generation state
   - [ ] Show loading indicators for current step
   - [ ] Display completed steps while generating next
   - [ ] Add cancel button during generation
   - [ ] Show "Cancelled" state if interrupted

6. **Update Chat.tsx for multi-step execution** ✅ **Generic loop + cancellation**
   - [ ] Ensure `useAppDispatch()` is at component top level
   - [ ] Create `AbortController` for each message
   - [ ] Store in ref for cancel button access
   - [ ] Pass `abortSignal` in `runtime` object (not context)
   - [ ] Pass all steps `execute(model, context, runtime)`
   - [ ] Loop through steps, check `runtime.abortSignal` before each
   - [ ] Call `handler.onCancel(context, runtime, completedSteps)` if interrupted
   - [ ] Handle errors mid-flow
   - [ ] Implement `handleCancelGeneration()` for UI

**Deliverables:**
- ✅ Multi-step recipe generation working
- ✅ Progressive UI updates (5 visual steps)
- ✅ All steps dispatch their own Redux updates
- ✅ Full cancellation support with cleanup
- ✅ All 5 steps executing smoothly
- ✅ Error handling for failed steps
- ✅ Cancel button functional

### Phase 4: Polish & Optimization (Week 4)

**Goal:** Improve performance and user experience.

#### Tasks

1. **Performance tuning**
   - [ ] Profile API call times
   - [ ] Optimize prompts for speed
   - [ ] Test with different models (qwen, mistral, llama)

2. **Error handling**
   - [ ] Handle network failures gracefully
   - [ ] Add retry logic for transient failures
   - [ ] Show helpful error messages

3. **Cancellation support** ✅ **Now core feature**
   - [x] Design cancellation architecture (AbortSignal in context)
   - [ ] Implement cancel button in Chat.tsx UI
   - [ ] Test abort scenarios across all action types
   - [ ] Ensure proper cleanup via onCancel() hooks
   - [ ] Handle partial state (e.g., recipe with only name + description)

4. **Loading states**
   - [ ] Add skeleton loaders for each step
   - [ ] Show progress indicators
   - [ ] Add estimated time remaining

5. **Testing**
   - [ ] Unit tests for action handlers
   - [ ] Integration tests for multi-step flow
   - [ ] End-to-end tests for full user journey

**Deliverables:**
- ✅ Optimized performance
- ✅ Robust error handling
- ✅ Excellent loading states
- ✅ Comprehensive test coverage

### Phase 5: Documentation & Future Actions (Week 5)

**Goal:** Document the system and enable easy addition of new actions.

#### Tasks

1. **Documentation**
   - [ ] Add JSDoc comments to all interfaces
   - [ ] Write README for `actions/` directory
   - [ ] Create "How to Add a New Action" guide
   - [ ] Document prompt engineering best practices

2. **Prepare for future actions**
   - [ ] Identify next 2-4 actions to implement (addIngredient, planWeek, etc.)
   - [ ] Create templates for new actions
   - [ ] Set up action testing framework

3. **Final cleanup**
   - [ ] Remove old/unused code
   - [ ] Consolidate duplicate logic
   - [ ] Update README.md with new architecture

**Deliverables:**
- ✅ Complete documentation
- ✅ Easy-to-use templates
- ✅ Clean codebase

---

## Technical Decisions

### Decision 1: `generate()` vs `chat()` for Intent Detection

**Decision:** Use `generate()` for intent detection.

**Reasoning:**
- Intent detection is a **classification task**, not a conversation
- We provide explicit context (summaries), don't need Ollama to manage history
- Approximately 10-30ms faster due to less overhead
- Clearer separation of concerns

**Tradeoffs:**
- Slightly more manual context management
- Need to format prompt carefully

**Alternatives Considered:**
- Use `chat()` for consistency across all calls
  - Rejected: Unnecessary overhead for non-conversational task

### Decision 2: Multi-Step vs Single-Step Recipe Generation

**Decision:** Use multi-step approach with 5 separate API calls.

**Reasoning:**
- **Better UX:** Progressive visual feedback feels much faster
- **Simpler schemas:** Each step has 1-3 fields (faster AI processing)
- **Error recovery:** Can retry individual steps
- **Flexibility:** Can skip steps or add steps easily
- **Modularity:** Each step is independently testable

**Tradeoffs:**
- More API calls (5 instead of 1)
- More complex state management
- More network round trips

**Why it's worth it:**
- Total time: ~830ms (faster than single call at 2-5 seconds)
- User sees progress immediately (perceived performance)
- Each step completes quickly (feels snappy)

**Alternatives Considered:**
- Single streaming call with progressive JSON parsing
  - Rejected: Complex to parse partial JSON, harder to handle errors
- Two-step approach (basic info + full recipe)
  - Rejected: Still too long for second step, less granular feedback

### Decision 3: Summary-Based Context vs Full Message History

**Decision:** Generate summaries and pass last 10 summaries for intent detection.

**Reasoning:**
- **Scalability:** Works for conversations with 100+ messages
- **Performance:** Consistent small payload (~200 tokens vs 1000+)
- **Context preservation:** Critical info from early messages retained
- **Future-proof:** Enables even longer conversations

**Tradeoffs:**
- Additional API call for summary generation (but async)
- Potential information loss in summarization
- More complex data model

**Mitigation:**
- Generate summaries async (non-blocking)
- Fall back to full messages if summaries not available
- Include full current message (only context is summarized)

**Alternatives Considered:**
- Always pass full message history
  - Rejected: Doesn't scale, wastes tokens
- Only use last N messages with no summaries
  - Rejected: Loses critical context from earlier in conversation
- Use semantic search / embedding-based retrieval
  - Rejected: Too complex for current needs, adds dependencies

### Decision 4: Modular Action Registry vs Monolithic Service

**Decision:** Use plugin-like action registry.

**Reasoning:**
- **Extensibility:** Adding new actions doesn't require editing existing code
- **Testability:** Each action is independently testable
- **Maintainability:** Clear separation of concerns, easy to understand
- **Discoverability:** Easy to see all available actions

**Tradeoffs:**
- More files and indirection
- Slightly more boilerplate per action

**Why it's worth it:**
- Makes it trivial to add new action types (goal: add one per sprint)
- Reduces risk of breaking existing actions when adding new ones
- Enables parallel development (multiple people can work on different actions)

**Alternatives Considered:**
- Keep all logic in `ollama.service.ts`
  - Rejected: File already 650+ lines, hard to navigate
- Use class-based architecture with inheritance
  - Rejected: More complex, not idiomatic TypeScript

### Decision 5: Store Summaries in ChatMessage vs Separate Collection

**Decision:** Store summaries directly in `ChatMessage.summary` field.

**Reasoning:**
- **Simplicity:** No additional queries needed
- **Data locality:** Summary travels with message
- **Type safety:** Part of main data model
- **Performance:** No joins needed

**Tradeoffs:**
- Slightly larger message objects
- Need to migrate existing messages

**Alternatives Considered:**
- Separate `messageSummaries` collection in Firestore
  - Rejected: Adds complexity, requires additional queries
- Store summaries in localStorage only
  - Rejected: Doesn't sync across devices
- Don't store summaries, regenerate on demand
  - Rejected: Wasteful, adds latency

---

## Open Questions

### ✅ Resolved Concerns

**March 12, 2026 Update:** The following concerns were raised and addressed:

#### 1. ✅ Prompts Organization Confusion
**Concern:** "Why do we have a `prompts/` folder AND `GENERAL_PROMPT` in `generalAction.ts`?"

**Resolution:** Prompts are **defined** in `prompts/` and **imported** into action files. This ensures:
- Prompts are centralized and reusable
- Actions remain focused on execution logic
- Easier prompt iteration without touching action code
- See [Section 6: Prompts & Schemas Organization](#6-prompts--schemas-organization-separation-of-concerns) for details

#### 2. ✅ Step Interruption Support
**Concern:** "For multi-step actions, we should account for step interruptions"

**Resolution:** Added comprehensive cancellation support:
- `AbortSignal` passed in context to all steps
- Steps check signal and return `{ cancelled: true }` if aborted
- Action handlers have `onCancel()` hook for cleanup
- Chat.tsx provides cancel button with `AbortController`
- See [Section 5: Step Interruption Support](#5-step-interruption-support-cancellation) for details

#### 3. ✅ Redux Dispatch in Actions
**Concern:** "To make actions truly modular, define Redux actions within each step by passing `dispatch`"

**Resolution:** Actions now handle their own Redux updates:
- `dispatch` passed in context (alongside `chatId`, `messageId`, etc.)
- Each step dispatches its own updates (e.g., `updateRecipeStep()`)
- Chat.tsx knows nothing about action-specific Redux actions
- True separation of concerns, easier testing
- See [Section 4: Redux Dispatch Within Actions](#4-redux-dispatch-within-actions-true-modularity) for details

#### 4. ✅ Separate Runtime Concerns from Business Context
**Concern:** "`dispatch` and `abortSignal` should be passed as 3rd param, separate from context"

**Resolution:** Introduced `StepRuntime` interface:
- `StepContext` = business context (messages, chatId, messageId, previousResults)
- `StepRuntime` = runtime concerns (dispatch, abortSignal)
- Signatures: `execute(model, context, runtime)` and `onCancel(context, runtime)`
- Cleaner separation of concerns, easier to test

#### 5. ✅ React Hook Rules Compliance
**Concern:** "`useAppDispatch()` cannot be called within function, should be top of component"

**Resolution:** Fixed Chat.tsx to follow React rules:
- `const dispatch = useAppDispatch()` declared at component top level
- Referenced within `handleSendMessage()` but not called there
- Passed into runtime object for actions
- Complies with React hooks rules

---

### Question 1: How Many Summaries to Pass for Intent Detection?

**Current Plan:** Last 10 summaries

**Considerations:**
- More summaries = better context, but larger payload
- Fewer summaries = faster, but might miss context
- Should vary by conversation length?

**Action:** Test with 5, 10, and 15 summaries to find optimal balance.

### Question 2: Should Summary Generation Be Mandatory?

**Current Plan:** Generate automatically for messages > 100 chars (user) or > 200 chars (assistant)

**Considerations:**
- Could add latency if done synchronously
- Async generation might not be ready for next intent detection
- Should have fallback strategy

**Options:**
1. Always generate, but async (current plan)
2. Only generate for "important" messages (how to determine?)
3. Generate on demand when needed for intent detection

**Action:** Start with option 1, monitor performance, adjust if needed.

### Question 3: Can Users Edit Recipe Mid-Generation?

**Current Plan:** No, users must wait for all 5 steps to complete

**Considerations:**
- Would be nice UX to edit name while ingredients are generating
- Complex state management
- Risk of inconsistency (edited name doesn't match generated description)

**Options:**
1. No editing until complete (current plan)
2. Allow editing, cancel remaining steps
3. Allow editing, regenerate dependent steps

**Action:** Start with option 1, consider option 2 in future iteration.

### Question 4: How to Handle Step Failures?

**Current Plan:** Show error, allow retry of failed step

**Considerations:**
- Should automatically retry transient failures?
- Should allow continuing without failed step? (e.g., skip description)
- Should cancel entire flow?

**Options:**
1. Show error, allow manual retry of step
2. Auto-retry with exponential backoff (3 attempts)
3. Show error, allow skipping step

**Action:** Implement option 2 with fallback to option 1 if all retries fail.

### Question 5: Should Recipe Steps Be Parallelizable?

**Current Plan:** Sequential (step 2 needs step 1 results)

**Considerations:**
- Some steps could run in parallel (description + basic info)
- Ingredients need name + servings, instructions need ingredients
- Parallel would be faster but more complex

**Potential Optimization:**
```
Step 1: Name (80ms)
    ↓
Parallel:
  - Step 2: Basic Info (100ms)
  - Step 3: Description (150ms)
    ↓ (wait for both)
Step 4: Ingredients (200ms)
    ↓
Step 5: Instructions (300ms)
```

**Action:** Start with sequential, consider parallelization if profiling shows significant benefit.

### Question 6: How to Version Prompts and Schemas?

**Current Plan:** No versioning, update in place

**Considerations:**
- Prompt changes could affect existing conversations
- Might want to A/B test prompts
- Could track which prompt version generated each message

**Options:**
1. No versioning (current plan)
2. Add version field to prompts/schemas
3. Store prompt version in message metadata

**Action:** Start with option 1, add versioning if needed for A/B testing.

---

## Appendix: Example Prompts

### Intent Detection Prompt

```typescript
export const INTENT_DETECTION_PROMPT = `You are Demmi's AI assistant.

Your task: Classify the user's CURRENT message intent.

Actions:
- "general": Questions, tips, discussions about cooking/nutrition
- "createMeal": Explicit request to CREATE/MAKE/GENERATE a recipe

Rules:
- Focus ONLY on current message
- "createMeal" requires explicit creation language
- All other cases use "general"

Respond with JSON: { "action": "general" | "createMeal" }`;
```

### Summary Generation Prompt

```typescript
export const SUMMARY_GENERATION_PROMPT = `Summarize this exchange in 2-4 sentences.

Include:
- Key topics discussed
- Any requests or questions
- Important context or decisions
- Food/recipe names mentioned

Be concise but preserve critical details.`;
```

### Meal Name Prompt

```typescript
export const MEAL_NAME_PROMPT = `Extract the meal name from the user's request.

Rules:
- Be specific (not "pasta" but "Spaghetti Carbonara")
- 1-4 words maximum
- Use proper capitalization
- If name not provided, infer from context

Respond with JSON: { "name": "Meal Name" }`;
```

### Meal Basic Info Prompt

```typescript
export const MEAL_INFO_PROMPT = `Provide basic information for this meal.

Required:
- Category: breakfast, lunch, dinner, snack, or dessert
- Servings: number of people (1-12)
- Total time: prep + cook in minutes

Be realistic and practical.

Respond with JSON: { "category": "dinner", "servings": 4, "totalTime": 45 }`;
```

### Meal Description Prompt

```typescript
export const MEAL_DESCRIPTION_PROMPT = `Write a 1-2 sentence description for this meal.

Focus on:
- What makes it special
- Flavor profile
- Occasion or when to serve

Be enticing but concise.

Respond with JSON: { "description": "..." }`;
```

### Meal Ingredients Prompt

```typescript
export const MEAL_INGREDIENTS_PROMPT = `List all ingredients with amounts for this meal.

Rules:
- Use standard measurements (cups, tbsp, oz, etc.)
- Be specific with amounts
- Include all necessary ingredients
- Order by usage (main → seasonings)

Example format:
- "2 cups flour"
- "1 tbsp olive oil"
- "1/2 tsp salt"

Respond with JSON: { "ingredients": [{ "name": "flour", "amount": "2 cups" }, ...] }`;
```

### Meal Instructions Prompt

```typescript
export const MEAL_INSTRUCTIONS_PROMPT = `Write step-by-step cooking instructions.

Rules:
- One step per line
- Clear and concise
- Include temperatures and times
- Order chronologically
- 3-10 steps total

Respond with JSON: { "instructions": ["Step 1...", "Step 2...", ...] }`;
```

---

## Success Metrics

### Performance Metrics

**Before:**
- Time to first token (Create Meal): 200-400ms
- Time to complete recipe: 2,200-5,400ms
- User perceived wait: 2-5 seconds with no feedback

**After (Target):**
- Time to first token: 80-120ms
- Time to complete recipe: 830ms with 5 visual updates
- User perceived wait: ~100ms (then progressive feedback)

**Improvement:**
- 🎯 50% faster time to completion
- 🎯 85% better perceived performance (immediate feedback)
- 🎯 5x more visual feedback points

### Code Quality Metrics

**Before:**
- Lines in `ollama.service.ts`: 650+
- Number of actions: 2 (hard-coded)
- Time to add new action: 4-6 hours (requires editing multiple places)

**After (Target):**
- Lines in `ollama.service.ts`: ~200 (core client only)
- Number of actions: 2 (modular)
- Time to add new action: 1-2 hours (copy template, implement)

**Improvement:**
- 🎯 68% reduction in main service file size
- 🎯 67% faster to add new actions
- 🎯 100% test coverage per action (independently testable)

### User Experience Metrics

**Before:**
- Steps with no feedback: 1 (recipe generation)
- Visual updates during generation: 0
- Ability to see progress: None

**After (Target):**
- Steps with no feedback: 0
- Visual updates during generation: 5
- Ability to see progress: Real-time step-by-step

**Improvement:**
- 🎯 5x more visual feedback
- 🎯 100% of operations have progress indicators
- 🎯 Users can cancel mid-generation

---

## Conclusion

This redesign transforms the agent architecture from a monolithic, slow system into a modular, fast, and extensible platform. Key benefits:

1. **50% faster** overall performance (summary-based context, simpler schemas)
2. **85% better** perceived performance (immediate feedback, progressive UI)
3. **Progressive UI** keeps users engaged (5 visual updates per recipe)
4. **True modularity** makes adding new actions trivial (action registry + internal dispatch)
5. **Summary-based context** scales to long conversations (10 summaries vs full history)
6. **Multi-step generation** provides granular feedback (name → info → desc → ingredients → instructions)
7. **User control** with full cancellation support (AbortSignal, onCancel hooks)
8. **Clean separation** of prompts, schemas, and execution logic

### Architectural Highlights

**1. Actions are Self-Contained:**
- Import their own prompts and schemas
- Handle their own Redux dispatch via `StepRuntime`
- Manage their own cancellation cleanup
- No coupling to Chat.tsx

**2. Clean Separation of Concerns:**
- `StepContext` = business data (messages, ids, results)
- `StepRuntime` = runtime concerns (dispatch, cancellation)
- Function signatures: `execute(model, context, runtime)`

**3. Prompts & Schemas are Reusable:**
- Centralized in dedicated folders
- Easy to iterate and A/B test
- Version-controlled separately from logic

**4. Cancellation is First-Class:**
- AbortSignal passed via StepRuntime to all steps
- Proper cleanup via onCancel hooks
- Clean partial state handling

**5. React Compliant:**
- `useAppDispatch()` called at component top level
- Passed into runtime object for actions
- Follows React hooks rules

The phased implementation plan ensures we can deliver value incrementally while maintaining stability. Each phase builds on the previous, de-risking the migration.

**Next Steps:**
1. Review and approve this design document
2. Begin Phase 1 (Foundation) implementation
3. Track metrics against targets
4. Iterate based on user feedback

---

**Document Version:** 1.2  
**Last Updated:** March 12, 2026 (Separated runtime concerns from business context)  
**Author:** AI Assistant (with input from Stephon)  
**Status:** Ready for Review
