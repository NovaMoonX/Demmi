import { capitalize } from '@/utils';
import { INGREDIENT_TYPE_COLORS, INGREDIENT_TYPE_EMOJIS, mockIngredients } from '@lib/ingredients';
import {
  Badge,
  Card,
  Input,
  Select,
} from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useMemo, useState } from 'react';

const FALLBACK_IMAGE_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect width="800" height="400" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2394a3b8"%3EImage not available%3C/text%3E%3C/svg%3E';

export function Ingredients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredIngredients = mockIngredients.filter((ingredient) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch = ingredient.name.toLowerCase().includes(query);
    const matchesType = typeFilter === 'all' || ingredient.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const typeOption = useMemo(() => {
    const options = Object.entries(INGREDIENT_TYPE_EMOJIS).map(
      ([type, emoji]) => ({
        value: type,
        text: `${emoji} ${capitalize(type)}`,
      }),
    );
    return [{ value: 'all', text: 'All Types' }, ...options];
  }, []);

  return (
    <div className='mx-auto max-w-7xl p-6'>
      <div className='mb-8'>
        <h1 className='text-foreground mb-2 text-4xl font-bold'>Ingredients</h1>
        <p className='text-muted-foreground mb-6'>
          Browse and manage your ingredients inventory
        </p>

        {/* Search and Filters */}
        <div className='mb-4 flex flex-col gap-4 md:flex-row'>
          <Input
            type='text'
            placeholder='Search ingredients by name...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='flex-1'
          />
        </div>

        <div className='flex flex-col items-start gap-4 sm:flex-row'>
          <Select
            options={typeOption}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            placeholder='Filter by type'
            className='sm:w-64'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {filteredIngredients.length === 0 ? (
          <div className='col-span-full py-12 text-center'>
            <p className='text-muted-foreground text-lg'>
              No ingredients found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredIngredients.map((ingredient) => (
            <Card
              key={ingredient.id}
              className='flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg'
            >
              {/* Cover Image */}
              <div className='bg-muted h-48 w-full overflow-hidden'>
                <img
                  src={ingredient.imageUrl}
                  alt={ingredient.name}
                  className='h-full w-full object-cover'
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                  }}
                />
              </div>

              <div className='flex flex-col p-6'>
                {/* Header */}
                <div className='mb-4'>
                  <div className='mb-2 flex items-start justify-between gap-2'>
                    <h3 className='text-foreground text-xl font-semibold'>
                      {ingredient.name}
                    </h3>
                    <span className='flex-shrink-0 text-2xl'>
                      {INGREDIENT_TYPE_EMOJIS[ingredient.type]}
                    </span>
                  </div>
                  <Badge
                    variant='base'
                    className={join('capitalize', INGREDIENT_TYPE_COLORS[ingredient.type])}
                  >
                    {ingredient.type}
                  </Badge>
                </div>

                {/* In Stock - Main Focus */}
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    In Stock
                  </span>
                  <span className='text-foreground text-2xl font-bold'>
                    {ingredient.currentAmount} {ingredient.unit}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default Ingredients;
