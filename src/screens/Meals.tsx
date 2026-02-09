import { useState } from 'react';
import { Card, Badge, Select, Input } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { mockMeals, MealCategory } from '@lib/meals';

const categoryColors: Record<MealCategory, string> = {
  breakfast: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  lunch: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  dinner: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  snack: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  dessert: 'bg-pink-500/20 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  drink: 'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const categoryOptions = [
    { value: 'all', text: 'All Categories' },
    { value: 'breakfast', text: '🌅 Breakfast' },
    { value: 'lunch', text: '🍱 Lunch' },
    { value: 'dinner', text: '🌙 Dinner' },
    { value: 'snack', text: '🍿 Snack' },
    { value: 'dessert', text: '🍰 Dessert' },
    { value: 'drink', text: '🥤 Drink' },
  ];

  const timeOptions = [
    { value: 'all', text: 'All Cook Times' },
    { value: 'under-15', text: 'Under 15 minutes' },
    { value: '15-30', text: '15-30 minutes' },
    { value: '30-60', text: '30-60 minutes' },
    { value: 'over-60', text: 'Over 60 minutes' },
  ];

  const filteredMeals = mockMeals.filter((meal) => {
    const totalTime = meal.prepTime + meal.cookTime;
    const query = searchQuery.toLowerCase();
    
    // Search by name or description only
    const matchesSearch = 
      meal.title.toLowerCase().includes(query) ||
      meal.description.toLowerCase().includes(query);
    
    // Filter by category
    const matchesCategory = categoryFilter === 'all' || meal.category === categoryFilter;
    
    // Filter by total cook time
    let matchesTime = true;
    if (timeFilter === 'under-15') {
      matchesTime = totalTime < 15;
    } else if (timeFilter === '15-30') {
      matchesTime = totalTime >= 15 && totalTime <= 30;
    } else if (timeFilter === '30-60') {
      matchesTime = totalTime > 30 && totalTime <= 60;
    } else if (timeFilter === 'over-60') {
      matchesTime = totalTime > 60;
    }
    
    return matchesSearch && matchesCategory && matchesTime;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Meals</h1>
        <p className="text-muted-foreground mb-6">
          Browse your meal recipes
        </p>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search recipes by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            placeholder="Filter by category"
            className="sm:w-64"
          />
          
          <Select
            options={timeOptions}
            value={timeFilter}
            onChange={(value) => setTimeFilter(value)}
            placeholder="Filter by cook time"
            className="sm:w-64"
          />
        </div>
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
