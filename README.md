# Demmi

A cooking app powered with local LLM using Ollama.

## Features

### 💬 Chat
- **AI Chat Interface**: Modern ChatGPT-style interface for cooking assistance
- **Message Bubbles**: User messages (orange) and assistant responses (gray) with distinct styling
- **Chat History**: Collapsible sidebar showing all conversations
- **Pinned Chats**: Pin important conversations to keep them at the top
- **New Chat**: Start fresh conversations with a single click
- **Mock AI Responses**: Context-aware responses based on keywords (recipe, ingredient, meal prep)
- **Auto-scroll**: Messages automatically scroll into view
- **Typing Indicator**: Animated loading state while waiting for responses
- **Empty State**: Beautiful prompt for new conversations
- **Keyboard Support**: Enter to send, Shift+Enter for new lines
- **Message Count**: Shows number of messages in each conversation
- **Delete Chats**: Remove conversations from history
- **Responsive Design**: Works seamlessly on mobile and desktop

### 🍳 Cooking-Themed Design
- **Orange Accent Color**: Warm, cooking-inspired orange accent color throughout the app
- **Modern & Clean**: Simple black and white base with orange highlights
- **Light & Dark Modes**: Full support for both themes with automatic color adjustments

### 🎨 Navigation
- **Sidebar Navigation**: ChatGPT-style sidebar with intuitive navigation
  - **Chat**: AI-powered cooking assistant
  - **Ingredients**: Manage your ingredients
  - **Meals**: Browse and manage meal recipes
  - **Calendar**: Schedule your cooking
  - **Account**: User settings and profile
- **Theme Toggle**: Switch component for seamless light/dark mode switching
- **Mobile Responsive**: Collapsible sidebar with hamburger menu on mobile devices

### 🍽️ Meals
- **Meal Cards**: Beautiful card-based layout displaying meal recipes
- **Cover Images**: Each meal features an attractive cover image
- **Meal Categories**: Organized by breakfast, lunch, dinner, snack, dessert, and drink
- **Category Badges**: Color-coded badges with unique colors for each category (fully visible in both light and dark modes)
- **Category Emojis**: Visual indicators for quick meal type identification
- **Search Functionality**: Search recipes by name or description in real-time
- **Filter by Category**: Dropdown filter to show only specific meal types
- **Filter by Total Time**: Dropdown filter to show meals by total cooking time (prep + cook time: under 15 min, 15-30 min, 30-60 min, over 60 min)
- **No Prep Time Toggle**: Filter switch to show only meals that require no preparation time
- **Recipe Details**: 
  - Title and description
  - Prep time and cook time
  - Serving size
  - Total cooking time
  - Step-by-step instructions count
- **Responsive Grid**: Adapts from 1 column (mobile) to 3 columns (desktop)
- **Mock Data**: 8 sample meals across all categories for demonstration
- **User-Centric Content**: Displays your meal recipes with personalized messaging

### 📱 Mobile-First Design
- Fully responsive sidebar that adapts to screen size
- Touch-friendly interface with smooth animations
- Optimized for both desktop and mobile experiences

## Tech Stack

- [React 19](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TailwindCSS 4](https://tailwindcss.com/)
- [Dreamer UI](https://www.npmjs.com/package/@moondreamsdev/dreamer-ui) - Component library
- [Vite](https://vite.dev/) - Build tool

## Design & Visual Aesthetic

### Color Palette
- **Accent**: Orange (orange-500 light, orange-400 dark) - Warm, cooking-inspired
- **Success**: Emerald green
- **Warning**: Amber
- **Destructive**: Red
- **Background**: Slate-100 (light), Slate-900 (dark)
- **Foreground**: Slate-900 (light), Slate-100 (dark)

### Components
Built with [Dreamer UI](https://www.npmjs.com/package/@moondreamsdev/dreamer-ui):
- Toggle switch for theme control
- Avatar component for user account
- Responsive sidebar navigation
- Card and layout components
- Badge components for categorization

## Data Schema

### Chat Interfaces
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // milliseconds timestamp
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  isPinned: boolean;
  lastUpdated: number; // milliseconds timestamp
}
```

### Meal Interface
```typescript
interface Meal {
  id: string;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink';
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servingSize: number;
  instructions: string[];
  imageUrl: string;
}
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ChatHistory.tsx  # Chat sidebar navigation
│   ├── ChatMessage.tsx  # Message bubble component
│   └── Sidebar.tsx      # Main app sidebar
├── lib/             # Utilities and data
│   ├── app/         # App constants
│   ├── chat/        # Chat types and mock data
│   └── meals/       # Meal types and mock data
├── routes/          # Router configuration
├── screens/         # Page components
│   ├── Chat.tsx     # AI chat interface
│   ├── Meals.tsx    # Meal browsing screen
│   └── ...
└── ui/              # Layout components
```

