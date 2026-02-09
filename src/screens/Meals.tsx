import { useState } from 'react';
import { Card, Badge } from '@moondreamsdev/dreamer-ui/components';
import { Input } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { mockMeals, MealCategory } from '@lib/meals';

const categoryColors: Record<MealCategory, string> = {
  breakfast: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  lunch: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  dinner: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  snack: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  dessert: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  drink: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
};

const categoryEmojis: Record<MealCategory, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
  snack: '🍿',
  dessert: '🍰',
  drink: '🥤',
};

export function Meals() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeals = mockMeals.filter((meal) => {
    const query = searchQuery.toLowerCase();
    
    return (
      meal.title.toLowerCase().includes(query) ||
      meal.description.toLowerCase().includes(query) ||
      meal.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Meals</h1>
        <p className="text-muted-foreground mb-6">
          Browse user-created meal recipes
        </p>
        
        {/* Search Input */}
        <Input
          type="text"
          placeholder="Search recipes by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">
              No recipes found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredMeals.map((meal) => {
            const totalTime = meal.prepTime + meal.cookTime;
            
            return (
              <Card key={meal.id} className="flex flex-col h-full overflow-hidden">
                {/* Cover Image */}
                <div className="w-full h-48 overflow-hidden bg-muted">
                  <img
                    src={meal.imageUrl}
                    alt={meal.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect width="800" height="400" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2394a3b8"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>

                <div className="p-6 flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {meal.title}
                      </h3>
                      <span className="text-2xl flex-shrink-0">
                        {categoryEmojis[meal.category]}
                      </span>
                    </div>
                    <Badge className={join('capitalize', categoryColors[meal.category])}>
                      {meal.category}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {meal.description}
                  </p>

                  {/* Metadata */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {meal.prepTime}m
                      </div>
                      <div className="text-xs text-muted-foreground">Prep</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {meal.cookTime}m
                      </div>
                      <div className="text-xs text-muted-foreground">Cook</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {meal.servingSize}
                      </div>
                      <div className="text-xs text-muted-foreground">Servings</div>
                    </div>
                  </div>

                  {/* Total time */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Time</span>
                      <span className="font-semibold text-foreground">
                        {totalTime} minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Instructions</span>
                      <span className="font-semibold text-foreground">
                        {meal.instructions.length} steps
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Meals;
