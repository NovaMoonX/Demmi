import { useState } from 'react';
import { Select, Input, Toggle, Button, Modal } from '@moondreamsdev/dreamer-ui/components';
import { useActionModal } from '@moondreamsdev/dreamer-ui/hooks';
import { MealCard } from '@components/MealCard';
import { MealForm } from '@components/MealForm';
import { useMeals } from '@hooks/useMeals';
import { Meal } from '@lib/meals';

export function Meals() {
  const { meals, createMeal, updateMeal, deleteMeal } = useMeals();
  const { confirm } = useActionModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [noPrepTime, setNoPrepTime] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | undefined>(undefined);

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
    { value: 'all', text: 'All Total Times' },
    { value: 'under-15', text: 'Under 15 minutes' },
    { value: '15-30', text: '15-30 minutes' },
    { value: '30-60', text: '30-60 minutes' },
    { value: 'over-60', text: 'Over 60 minutes' },
  ];

  const filteredMeals = meals.filter((meal) => {
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
      matchesTime = totalTime >= 15 && totalTime < 30;
    } else if (timeFilter === '30-60') {
      matchesTime = totalTime >= 30 && totalTime <= 60;
    } else if (timeFilter === 'over-60') {
      matchesTime = totalTime > 60;
    }
    
    // Filter by no prep time
    const matchesNoPrepTime = !noPrepTime || meal.prepTime === 0;
    
    return matchesSearch && matchesCategory && matchesTime && matchesNoPrepTime;
  });

  const handleCreateMeal = () => {
    setEditingMeal(undefined);
    setIsFormOpen(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setIsFormOpen(true);
  };

  const handleDeleteMeal = async (meal: Meal) => {
    const confirmed = await confirm({
      title: 'Delete Meal',
      message: `Are you sure you want to delete "${meal.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      deleteMeal(meal.id);
    }
  };

  const handleFormSubmit = (mealData: Omit<Meal, 'id'>) => {
    if (editingMeal) {
      updateMeal(editingMeal.id, mealData);
    } else {
      createMeal(mealData);
    }
    
    setIsFormOpen(false);
    setEditingMeal(undefined);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingMeal(undefined);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-foreground">Meals</h1>
          <Button onClick={handleCreateMeal} variant="primary">
            Create Meal
          </Button>
        </div>
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
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
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
            placeholder="Filter by total time"
            className="sm:w-64"
          />
          
          <div className="flex items-center gap-3 px-3 py-2">
            <Toggle
              checked={noPrepTime}
              onCheckedChange={setNoPrepTime}
              aria-label="Filter by no prep time"
            />
            <span className="text-sm text-foreground">No Prep Time</span>
          </div>
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
          filteredMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={handleEditMeal}
              onDelete={handleDeleteMeal}
            />
          ))
        )}
      </div>

      {/* Meal Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingMeal ? 'Edit Meal' : 'Create New Meal'}
      >
        <MealForm
          meal={editingMeal}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
}

export default Meals;
