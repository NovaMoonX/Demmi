import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Input, Select, Button } from '@moondreamsdev/dreamer-ui/components';
import { useActionModal } from '@moondreamsdev/dreamer-ui/hooks';
import { Ingredient, IngredientType, MeasurementUnit, Product, INGREDIENT_TYPE_EMOJIS, MEASUREMENT_UNIT_LABELS } from '@lib/ingredients';
import { useIngredients } from '@hooks/useIngredients';
import { capitalize } from '@/utils';
import { join } from '@moondreamsdev/dreamer-ui/utils';

export function IngredientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ingredients, createIngredient, updateIngredient, deleteIngredient } = useIngredients();
  const { confirm } = useActionModal();

  const isEditing = id !== 'new';
  const existingIngredient = isEditing ? ingredients.find((i) => i.id === id) : undefined;

  const [name, setName] = useState(existingIngredient?.name || '');
  const [type, setType] = useState<IngredientType>(existingIngredient?.type || 'other');
  const [currentAmount, setCurrentAmount] = useState(existingIngredient?.currentAmount.toString() || '0');
  const [servingSize, setServingSize] = useState(existingIngredient?.servingSize.toString() || '0');
  const [unit, setUnit] = useState<MeasurementUnit>(existingIngredient?.unit || 'g');
  const [otherUnit, setOtherUnit] = useState<string>(existingIngredient?.otherUnit || '');
  const [imageUrl, setImageUrl] = useState<string>(existingIngredient?.imageUrl || '');
  
  // Nutrient profile state
  const [protein, setProtein] = useState(existingIngredient?.nutrients.protein.toString() || '0');
  const [carbs, setCarbs] = useState(existingIngredient?.nutrients.carbs.toString() || '0');
  const [fat, setFat] = useState(existingIngredient?.nutrients.fat.toString() || '0');
  const [fiber, setFiber] = useState(existingIngredient?.nutrients.fiber.toString() || '0');
  const [sugar, setSugar] = useState(existingIngredient?.nutrients.sugar.toString() || '0');
  const [sodium, setSodium] = useState(existingIngredient?.nutrients.sodium.toString() || '0');
  const [calories, setCalories] = useState(existingIngredient?.nutrients.calories.toString() || '0');

  // Products state
  const [products, setProducts] = useState<Product[]>(existingIngredient?.products || []);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productRetailer, setProductRetailer] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productServings, setProductServings] = useState('');
  const [productUrl, setProductUrl] = useState('');

  const typeOptions = Object.entries(INGREDIENT_TYPE_EMOJIS).map(([typeKey, emoji]) => ({
    value: typeKey,
    text: `${emoji} ${capitalize(typeKey)}`,
  }));

  const unitOptions = Object.entries(MEASUREMENT_UNIT_LABELS).map(([unitKey, label]) => ({
    value: unitKey,
    text: label,
  }));

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

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductRetailer('');
    setProductLabel('');
    setProductCost('');
    setProductServings('');
    setProductUrl('');
    setShowProductForm(false);
  };

  const handleAddProduct = () => {
    if (!productRetailer || !productLabel || !productCost || !productServings) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      retailer: productRetailer,
      label: productLabel,
      cost: parseFloat(productCost),
      servings: parseFloat(productServings),
      url: productUrl || null,
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    resetProductForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductRetailer(product.retailer);
    setProductLabel(product.label);
    setProductCost(product.cost.toString());
    setProductServings(product.servings.toString());
    setProductUrl(product.url || '');
    setShowProductForm(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProductId || !productRetailer || !productLabel || !productCost || !productServings) return;

    const updatedProducts = products.map((p) => {
      if (p.id === editingProductId) {
        const result: Product = {
          id: p.id,
          retailer: productRetailer,
          label: productLabel,
          cost: parseFloat(productCost),
          servings: parseFloat(productServings),
          url: productUrl || null,
        };
        return result;
      }
      return p;
    });

    setProducts(updatedProducts);
    resetProductForm();
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const confirmed = await confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.label}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      const updatedProducts = products.filter((p) => p.id !== productId);
      setProducts(updatedProducts);
      if (editingProductId === productId) {
        resetProductForm();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ingredientData: Omit<Ingredient, 'id'> = {
      name,
      type: type as IngredientType,
      currentAmount: parseFloat(currentAmount) || 0,
      servingSize: parseFloat(servingSize) || 100,
      unit: unit as MeasurementUnit,
      otherUnit: unit === 'other' ? otherUnit : null,
      products: products,
      imageUrl: imageUrl,
      nutrients: {
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
        calories: parseFloat(calories) || 0,
      },
    };

    if (isEditing && existingIngredient) {
      updateIngredient(existingIngredient.id, ingredientData);
    } else {
      createIngredient(ingredientData);
    }

    navigate('/ingredients');
  };

  const handleDelete = async () => {
    if (!existingIngredient) return;

    const confirmed = await confirm({
      title: 'Delete Ingredient',
      message: `Are you sure you want to delete "${existingIngredient.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      deleteIngredient(existingIngredient.id);
      navigate('/ingredients');
    }
  };

  const handleCancel = () => {
    navigate('/ingredients');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto mt-10 md:mt-0">
      <div className="mb-8">
        <Link
          to="/ingredients"
          className="text-sm text-muted-foreground hover:text-foreground inline-block mb-4"
        >
          ← Back to Ingredients
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {isEditing ? 'Edit Ingredient' : 'Create New Ingredient'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update the details of your ingredient' : 'Add a new ingredient to your inventory'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Name *
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter ingredient name"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
            Type *
          </label>
          <Select
            options={typeOptions}
            value={type}
            onChange={(value) => setType(value as IngredientType)}
            placeholder="Select type"
          />
        </div>

        <div className="grid grid-cols-2 items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="currentAmount" className="block text-sm font-medium text-foreground mb-1">
              Current Amount *
            </label>
            <Input
              id="currentAmount"
              type="number"
              step="0.01"
              min="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="servingSize" className="block text-sm font-medium text-foreground mb-1">
              Serving Size *
            </label>
            <Input
              id="servingSize"
              type="number"
              step="0.01"
              min="0.01"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="unit" className="block text-sm font-medium text-foreground mb-1">
              Unit *
            </label>
            <Select
              options={unitOptions}
              value={unit}
              onChange={(value) => setUnit(value as MeasurementUnit)}
              placeholder="Select unit"
            />
          </div>

          {unit === 'other' && (
            <div className="flex flex-col">
              <label htmlFor="otherUnit" className="block text-sm font-medium text-foreground mb-1">
                Custom Unit *
              </label>
              <Input
                id="otherUnit"
                type="text"
                value={otherUnit}
                onChange={(e) => setOtherUnit(e.target.value)}
                placeholder="e.g., servings, portions"
                required
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-foreground mb-1">
            Ingredient Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
          />
          {imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
              <img
                src={imageUrl}
                alt="Ingredient preview"
                className="w-full max-w-md h-48 object-cover rounded-lg border border-border"
              />
            </div>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Nutrient Profile (per serving)
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="protein" className="block text-sm font-medium text-foreground mb-1">
                Protein (g) *
              </label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="carbs" className="block text-sm font-medium text-foreground mb-1">
                Carbohydrates (g) *
              </label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="fat" className="block text-sm font-medium text-foreground mb-1">
                Fat (g) *
              </label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="fiber" className="block text-sm font-medium text-foreground mb-1">
                Fiber (g) *
              </label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                min="0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="sugar" className="block text-sm font-medium text-foreground mb-1">
                Sugar (g) *
              </label>
              <Input
                id="sugar"
                type="number"
                step="0.1"
                min="0"
                value={sugar}
                onChange={(e) => setSugar(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="sodium" className="block text-sm font-medium text-foreground mb-1">
                Sodium (mg) *
              </label>
              <Input
                id="sodium"
                type="number"
                step="1"
                min="0"
                value={sodium}
                onChange={(e) => setSodium(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col col-span-2">
              <label htmlFor="calories" className="block text-sm font-medium text-foreground mb-1">
                Calories (kcal) *
              </label>
              <Input
                id="calories"
                type="number"
                step="1"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

                <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Product Pricing
            </h2>
          </div>

          <div className="space-y-4">
            {products.length > 0 && (
              <div className="space-y-2">
                {products.map((product) => {
                  const pricePerServing = product.cost / product.servings;
                  
                  return (
                    <div
                      key={product.id}
                      className={join(
                        'p-4 rounded-lg border',
                        editingProductId === product.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{product.label}</h3>
                          <p className="text-sm text-muted-foreground">{product.retailer}</p>
                          <div className="mt-2 flex gap-4 text-sm">
                            <span className="text-foreground">
                              ${product.cost.toFixed(2)} ({product.servings} servings)
                            </span>
                            <span className="text-muted-foreground">
                              ${pricePerServing.toFixed(2)}/serving
                            </span>
                          </div>
                          {product.url && (
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline mt-1 inline-block"
                            >
                              View Product →
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleEditProduct(product)}
                            className="text-sm"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!showProductForm && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowProductForm(true)}
                className="w-full"
              >
                + Add Product
              </Button>
            )}

            {showProductForm && (
              <div className="p-4 rounded-lg border border-border bg-muted/50">
              <h3 className="text-sm font-medium text-foreground mb-3">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Retailer
                  </label>
                  <Input
                    type="text"
                    value={productRetailer}
                    onChange={(e) => setProductRetailer(e.target.value)}
                    placeholder="e.g., Whole Foods"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Product Label
                  </label>
                  <Input
                    type="text"
                    value={productLabel}
                    onChange={(e) => setProductLabel(e.target.value)}
                    placeholder="e.g., Organic Chicken Breast"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Cost ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Servings
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={productServings}
                    onChange={(e) => setProductServings(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Product URL (optional)
                  </label>
                  <Input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://example.com/product"
                  />
                </div>

                <div className="col-span-2 flex gap-2">
                  {editingProductId ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleUpdateProduct}
                        className="flex-1"
                      >
                        Update Product
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetProductForm}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetProductForm}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleAddProduct}
                        className="flex-1"
                      >
                        Add Product
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="submit" variant="primary" className="flex-1">
            {isEditing ? 'Update Ingredient' : 'Create Ingredient'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Ingredient
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default IngredientDetail;
