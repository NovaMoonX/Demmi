import { useState } from 'react';
import { Card, Badge, Select, Input } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { mockIngredients, IngredientType } from '@lib/ingredients';

const typeColors: Record<IngredientType, string> = {
  meat: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  produce: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  dairy: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  grains: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  legumes: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  oils: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  spices: 'bg-orange-500/20 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  nuts: 'bg-stone-500/20 text-stone-700 dark:bg-stone-500/10 dark:text-stone-400',
  seafood: 'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  other: 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
};

const typeEmojis: Record<IngredientType, string> = {
  meat: '🥩',
  produce: '🥬',
  dairy: '🥛',
  grains: '🌾',
  legumes: '🫘',
  oils: '🫒',
  spices: '🧂',
  nuts: '🥜',
  seafood: '🐟',
  other: '📦',
};

export function Ingredients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const typeOptions = [
    { value: 'all', text: 'All Types' },
    { value: 'meat', text: '🥩 Meat' },
    { value: 'produce', text: '🥬 Produce' },
    { value: 'dairy', text: '🥛 Dairy' },
    { value: 'grains', text: '🌾 Grains' },
    { value: 'legumes', text: '🫘 Legumes' },
    { value: 'oils', text: '🫒 Oils' },
    { value: 'spices', text: '🧂 Spices' },
    { value: 'nuts', text: '🥜 Nuts' },
    { value: 'seafood', text: '🐟 Seafood' },
    { value: 'other', text: '📦 Other' },
  ];

  const filteredIngredients = mockIngredients.filter((ingredient) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch = ingredient.name.toLowerCase().includes(query);
    const matchesType = typeFilter === 'all' || ingredient.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Ingredients</h1>
        <p className="text-muted-foreground mb-6">
          Browse and manage your ingredients inventory
        </p>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search ingredients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            placeholder="Filter by type"
            className="sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIngredients.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">
              No ingredients found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredIngredients.map((ingredient) => {
            const result = (
              <Card key={ingredient.id} className="flex flex-col h-full overflow-hidden">
                {/* Cover Image */}
                <div className="w-full h-48 overflow-hidden bg-muted">
                  <img
                    src={ingredient.imageUrl}
                    alt={ingredient.name}
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
                        {ingredient.name}
                      </h3>
                      <span className="text-2xl flex-shrink-0">
                        {typeEmojis[ingredient.type]}
                      </span>
                    </div>
                    <Badge variant="base" className={join('capitalize', typeColors[ingredient.type])}>
                      {ingredient.type}
                    </Badge>
                  </div>

                  {/* Inventory */}
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">In Stock</span>
                      <span className="text-lg font-semibold text-foreground">
                        {ingredient.currentAmount} {ingredient.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Price per {ingredient.unit}</span>
                      <span className="text-lg font-semibold text-primary">
                        ${ingredient.pricePerUnit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Macronutrients */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Macros (per 100g)
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-semibold text-foreground">
                          {ingredient.nutrients.protein}g
                        </div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-semibold text-foreground">
                          {ingredient.nutrients.carbs}g
                        </div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-semibold text-foreground">
                          {ingredient.nutrients.fat}g
                        </div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Nutrients */}
                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Calories</span>
                        <span className="font-semibold text-foreground">
                          {ingredient.nutrients.calories} kcal
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fiber</span>
                        <span className="font-semibold text-foreground">
                          {ingredient.nutrients.fiber}g
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sugar</span>
                        <span className="font-semibold text-foreground">
                          {ingredient.nutrients.sugar}g
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sodium</span>
                        <span className="font-semibold text-foreground">
                          {ingredient.nutrients.sodium}mg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
            
            return result;
          })
        )}
      </div>
    </div>
  );
}

export default Ingredients;
