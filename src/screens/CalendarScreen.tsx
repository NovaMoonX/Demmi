import { useState, useMemo, ReactNode } from 'react';
import { Calendar, Button, Modal, Select, Input, Textarea, Badge } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useMealPlans } from '@hooks/useMealPlans';
import { useMeals } from '@hooks/useMeals';
import { MealType } from '@lib/mealPlans';

type CalendarView = 'month' | 'week' | 'day';

const mealTypeOptions = [
  { value: 'breakfast', text: '🌅 Breakfast' },
  { value: 'lunch', text: '🍱 Lunch' },
  { value: 'dinner', text: '🌙 Dinner' },
  { value: 'snack', text: '🍿 Snack' },
];

const mealTypeColors: Record<MealType, string> = {
  breakfast: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  lunch: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  dinner: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  snack: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
};

const mealTypeBgColors: Record<MealType, string> = {
  breakfast: 'bg-amber-500/20',
  lunch: 'bg-emerald-500/20',
  dinner: 'bg-blue-500/20',
  snack: 'bg-purple-500/20',
};

const mealTypeEmojis: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
  snack: '🍿',
};

export function CalendarScreen() {
  const { createMealPlan, deleteMealPlan, getMealPlansForDate } = useMealPlans();
  const { meals } = useMeals();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for adding/editing meal plans
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [mealTime, setMealTime] = useState<string>('');
  const [mealNotes, setMealNotes] = useState<string>('');

  const mealOptions = useMemo(() => {
    const result = meals.map((meal) => ({
      value: meal.id,
      text: `${meal.title} (${meal.category})`,
    }));
    
    return result;
  }, [meals]);

  const selectedDatePlans = useMemo(() => {
    const result = getMealPlansForDate(selectedDate);
    return result;
  }, [selectedDate, getMealPlansForDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleAddMealPlan = () => {
    if (!selectedMealId) return;

    const dateAtMidnight = new Date(selectedDate);
    dateAtMidnight.setHours(0, 0, 0, 0);

    createMealPlan({
      date: dateAtMidnight.getTime(),
      mealType: selectedMealType as MealType,
      mealId: selectedMealId,
      time: mealTime || null,
      notes: mealNotes || null,
    });

    // Reset form
    setSelectedMealId('');
    setMealTime('');
    setMealNotes('');
  };

  const handleDeleteMealPlan = (id: string) => {
    deleteMealPlan(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Reset form
    setSelectedMealId('');
    setMealTime('');
    setMealNotes('');
  };

  const renderCell = (date: Date, _isSelected: boolean, isDisabled: boolean, isToday: boolean): ReactNode => {
    const plansForDate = getMealPlansForDate(date);
    const hasMeals = plansForDate.length > 0;

    // Day view: Show all meals for the day with details
    if (view === 'day') {
      return (
        <div className="w-full h-full p-2 overflow-y-auto">
          <div className={join(
            'text-lg font-semibold mb-2',
            isToday && 'text-primary',
            isDisabled && 'opacity-50'
          )}>
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          {hasMeals ? (
            <div className="space-y-2">
              {plansForDate.map((plan) => {
                const meal = meals.find((m) => m.id === plan.mealId);
                if (!meal) return null;

                return (
                  <div
                    key={plan.id}
                    className="p-2 rounded-md border border-border bg-muted/30 text-left"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">{mealTypeEmojis[plan.mealType]}</span>
                      <Badge variant="base" className={join('text-xs capitalize', mealTypeColors[plan.mealType])}>
                        {plan.mealType}
                      </Badge>
                      {plan.time && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {plan.time}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {meal.title}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              No meals planned
            </div>
          )}
        </div>
      );
    }

    // Week view: Show meal count and first few meal type indicators
    if (view === 'week') {
      return (
        <div className="w-full h-full p-1 flex flex-col">
          <div className={join(
            'text-sm font-medium mb-1',
            isToday && 'text-primary',
            isDisabled && 'opacity-50'
          )}>
            {date.getDate()}
          </div>
          {hasMeals && (
            <div className="flex-1 flex flex-col gap-0.5">
              {plansForDate.slice(0, 4).map((plan) => {
                const meal = meals.find((m) => m.id === plan.mealId);
                
                return (
                  <div
                    key={plan.id}
                    className={join(
                      'text-xs px-1 py-0.5 rounded truncate',
                      mealTypeColors[plan.mealType]
                    )}
                  >
                    {mealTypeEmojis[plan.mealType]} {meal?.title || 'Meal'}
                  </div>
                );
              })}
              {plansForDate.length > 4 && (
                <div className="text-xs text-muted-foreground">
                  +{plansForDate.length - 4} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Month view: Show date number with meal indicators (dots)
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className={join(
          'text-sm',
          isToday && 'font-bold',
          isDisabled && 'opacity-50'
        )}>
          {date.getDate()}
        </div>
        {hasMeals && (
          <div className="flex gap-0.5 mt-1">
            {plansForDate.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className={join(
                  'w-1.5 h-1.5 rounded-full',
                  mealTypeBgColors[plan.mealType]
                )}
              />
            ))}
            {plansForDate.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto mt-10 md:mt-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Meal Calendar</h1>
        <p className="text-muted-foreground">
          Plan your meals for the week or month
        </p>
      </div>

      {/* View Toggle and Plan Meal Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={view === 'day' ? 'primary' : 'secondary'}
            onClick={() => setView('day')}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'secondary'}
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'primary' : 'secondary'}
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedDate(new Date());
            setIsModalOpen(true);
          }}
        >
          + Plan Meal
        </Button>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <Calendar
          key={view}
          mode="single"
          view={view}
          size="auto"
          initialDate={selectedDate}
          onDateSelect={handleDateSelect}
          renderCell={renderCell}
          showViewSelector={false}
          showNavigation={true}
          navigationLayout="around"
          useMonthYearSelector={true}
          showTodayButton={true}
        />
      </div>

      {/* Selected Date Meal Plans */}
      {selectedDatePlans.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Meals for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <div className="space-y-3">
            {selectedDatePlans.map((plan) => {
              const meal = meals.find((m) => m.id === plan.mealId);
              if (!meal) return null;

              return (
                <div
                  key={plan.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{mealTypeEmojis[plan.mealType]}</span>
                      <Badge variant="base" className={join('capitalize', mealTypeColors[plan.mealType])}>
                        {plan.mealType}
                      </Badge>
                      {plan.time && (
                        <span className="text-sm text-muted-foreground">
                          at {plan.time}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {meal.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {meal.description}
                    </p>
                    {plan.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        Note: {plan.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteMealPlan(plan.id)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Meal Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={`Plan Meals for ${selectedDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}`}
      >
        <div className="space-y-4">
          {/* Current meals for this date */}
          {selectedDatePlans.length > 0 && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Current Meals:
              </h3>
              <div className="space-y-2">
                {selectedDatePlans.map((plan) => {
                  const meal = meals.find((m) => m.id === plan.mealId);
                  if (!meal) return null;
                  
                  return (
                    <div key={plan.id} className="flex items-center justify-between text-sm">
                      <span>
                        {mealTypeEmojis[plan.mealType]} {meal.title}
                        {plan.time && ` (${plan.time})`}
                      </span>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleDeleteMealPlan(plan.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new meal plan form */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Meal Type
            </label>
            <Select
              options={mealTypeOptions}
              value={selectedMealType}
              onChange={(value) => setSelectedMealType(value)}
              placeholder="Select meal type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Meal
            </label>
            <Select
              options={mealOptions}
              value={selectedMealId}
              onChange={(value) => setSelectedMealId(value)}
              placeholder="Choose a meal from your recipes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Time (optional)
            </label>
            <Input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              placeholder="e.g., 08:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <Textarea
              value={mealNotes}
              onChange={(e) => setMealNotes(e.target.value)}
              placeholder="Any special notes or modifications..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={handleModalClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleAddMealPlan}
              disabled={!selectedMealId}
            >
              Add to Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CalendarScreen;
