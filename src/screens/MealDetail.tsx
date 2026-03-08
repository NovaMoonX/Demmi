import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Input,
  Textarea,
  Select,
  Button,
  DynamicList,
  Label,
} from '@moondreamsdev/dreamer-ui/components';
import { useActionModal } from '@moondreamsdev/dreamer-ui/hooks';
import { Meal, MealCategory, MealIngredient } from '@lib/meals';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { createMeal, updateMeal, deleteMeal } from '@store/slices/mealsSlice';
import type { DynamicListItem } from '@moondreamsdev/dreamer-ui/components';
import { MealIngredientSelector } from '@components/meals/MealIngredientSelector';

export function MealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const meals = useAppSelector((state) => state.meals.items);
  const allIngredients = useAppSelector((state) => state.ingredients.items);
  const { confirm } = useActionModal();

  const isEditing = id !== 'new';
  const existingMeal = isEditing ? meals.find((m) => m.id === id) : undefined;

  const fromMealPath =
    isEditing && existingMeal ? `/meals/${existingMeal.id}` : '/meals/new';

  const [title, setTitle] = useState(existingMeal?.title || '');
  const [description, setDescription] = useState(
    existingMeal?.description || '',
  );
  const [category, setCategory] = useState<string>(
    existingMeal?.category || 'breakfast',
  );
  const [prepTime, setPrepTime] = useState(
    existingMeal?.prepTime.toString() || '0',
  );
  const [cookTime, setCookTime] = useState(
    existingMeal?.cookTime.toString() || '0',
  );
  const [servingSize, setServingSize] = useState(
    existingMeal?.servingSize.toString() || '1',
  );
  const [imageUrl, setImageUrl] = useState<string>(
    existingMeal?.imageUrl || '',
  );
  const [instructions, setInstructions] = useState<DynamicListItem<object>[]>(
    existingMeal?.instructions.map((inst, index) => ({
      id: `inst-${index}`,
      content: inst,
    })) || [],
  );
  const [selectedIngredients, setSelectedIngredients] = useState<MealIngredient[]>(
    existingMeal?.ingredients ?? [],
  );

  // Auto-add a newly created ingredient when returning from the ingredient creation flow
  const processedNewIngredientRef = useRef<string | null>(null);
  useEffect(() => {
    const state = location.state as { newIngredientId?: string } | null;
    const newId = state?.newIngredientId;
    if (newId && newId !== processedNewIngredientRef.current) {
      const ing = allIngredients.find((i) => i.id === newId);
      if (ing) {
        processedNewIngredientRef.current = newId;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedIngredients((prev) => {
          if (prev.some((item) => item.ingredientId === newId)) {
            return prev;
          }
          const result = [...prev, { ingredientId: newId, servings: 1 }];
          return result;
        });
      }
    }
  }, [location.state, allIngredients]);

  const categoryOptions = [
    { value: 'breakfast', text: '🌅 Breakfast' },
    { value: 'lunch', text: '🍱 Lunch' },
    { value: 'dinner', text: '🌙 Dinner' },
    { value: 'snack', text: '🍿 Snack' },
    { value: 'dessert', text: '🍰 Dessert' },
    { value: 'drink', text: '🥤 Drink' },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (result && typeof result === 'string') {
          setImageUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const instructionsList = instructions
      .map((item) => (typeof item.content === 'string' ? item.content : ''))
      .filter((line) => line.trim().length > 0);

    const ingredientsList: MealIngredient[] = selectedIngredients
      .filter((item) => item.ingredientId.trim().length > 0)
      .map((item) => ({
        ingredientId: item.ingredientId,
        servings: item.servings > 0 ? item.servings : 1,
      }));

    const mealData: Omit<Meal, 'id'> = {
      title,
      description,
      category: category as MealCategory,
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      servingSize: Number(servingSize) || 1,
      imageUrl: imageUrl,
      instructions: instructionsList,
      ingredients: ingredientsList,
    };

    if (isEditing && existingMeal) {
      dispatch(updateMeal({ id: existingMeal.id, updates: mealData }));
    } else {
      dispatch(createMeal(mealData));
    }

    navigate('/meals');
  };

  const handleDelete = async () => {
    if (!existingMeal) return;

    const confirmed = await confirm({
      title: 'Delete Meal',
      message: `Are you sure you want to delete "${existingMeal.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      dispatch(deleteMeal(existingMeal.id));
      navigate('/meals');
    }
  };

  const handleCancel = () => {
    navigate('/meals');
  };

  return (
    <div className='mx-auto mt-10 max-w-4xl p-6 md:mt-0'>
      <div className='mb-8'>
        <Link
          to='/meals'
          className='text-muted-foreground hover:text-foreground mb-4 inline-block text-sm'
        >
          ← Back to Meals
        </Link>
        <h1 className='text-foreground mb-2 text-4xl font-bold'>
          {isEditing ? 'Edit Meal' : 'Create New Meal'}
        </h1>
        <p className='text-muted-foreground'>
          {isEditing
            ? 'Update the details of your meal recipe'
            : 'Add a new meal to your collection'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <Label htmlFor='title'>
            Title *
          </Label>
          <Input
            id='title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Enter meal title'
            required
          />
        </div>

        <div>
          <Label htmlFor='description'>
            Description *
          </Label>
          <Textarea
            id='description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Enter meal description'
            required
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor='category'>
            Category *
          </Label>
          <Select
            options={categoryOptions}
            value={category}
            onChange={(value) => setCategory(value)}
            placeholder='Select category'
          />
        </div>

        <div className='grid grid-cols-3 items-end gap-4'>
          <div className='flex flex-col'>
            <Label htmlFor='prepTime'>
              Prep Time (min) *
            </Label>
            <Input
              id='prepTime'
              type='number'
              min='0'
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col'>
            <Label htmlFor='cookTime'>
              Cook Time (min) *
            </Label>
            <Input
              id='cookTime'
              type='number'
              min='0'
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col'>
            <Label htmlFor='servingSize'>
              Servings *
            </Label>
            <Input
              id='servingSize'
              type='number'
              min='1'
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor='image'>
            Meal Image
          </Label>
          <input
            id='image'
            type='file'
            accept='image/*'
            onChange={handleImageChange}
            className='text-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 block w-full text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium'
          />
          {imageUrl && (
            <div className='mt-4'>
              <p className='text-muted-foreground mb-2 text-sm'>
                Image Preview:
              </p>
              <img
                src={imageUrl}
                alt='Meal preview'
                className='border-border h-48 w-full max-w-md rounded-lg border object-cover'
              />
            </div>
          )}
        </div>

        <div>
          <Label>
            Ingredients
          </Label>
          <MealIngredientSelector
            ingredients={allIngredients}
            selectedIngredients={selectedIngredients}
            onChange={setSelectedIngredients}
            fromMealPath={fromMealPath}
          />
        </div>

        <div>
          <Label>
            Instructions *
          </Label>
          <DynamicList
            items={instructions}
            onItemsChange={setInstructions}
            allowAdd
            allowDelete
            allowReorder
            addPlaceholder='Add instruction step...'
            marker='decimal'
            showReorderButtons
          />
        </div>

        <div className='border-border flex gap-3 border-t pt-4'>
          <Button type='submit' variant='primary' className='flex-1'>
            {isEditing ? 'Update Meal' : 'Create Meal'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            onClick={handleCancel}
            className='flex-1'
          >
            Cancel
          </Button>
          {isEditing && (
            <Button type='button' variant='destructive' onClick={handleDelete}>
              Delete Meal
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default MealDetail;
