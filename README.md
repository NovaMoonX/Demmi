# Demmi

A cooking app powered with local LLM using Ollama.

## Features

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
- **Category Badges**: Color-coded badges with unique colors for each category (visible in both light and dark modes)
- **Category Emojis**: Visual indicators for quick meal type identification
- **Search Functionality**: Search recipes by name or description in real-time
- **Filter by Category**: Dropdown filter to show only specific meal types
- **Filter by Cook Time**: Dropdown filter to show meals by total cooking time (under 15 min, 15-30 min, 30-60 min, over 60 min)
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
├── components/     # Reusable UI components
├── lib/           # Utilities and data
│   ├── app/       # App constants
│   └── meals/     # Meal types and mock data
├── routes/        # Router configuration
├── screens/       # Page components
│   ├── Meals.tsx  # Meal browsing screen
│   └── ...
└── ui/            # Layout components
```

