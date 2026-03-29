import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  points: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize: string;
  brand?: string;
}

export interface MealIngredient {
  foodId: string;
  servings: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  description?: string;
  ingredients: MealIngredient[];
  createdAt: string;
}

export interface MealLogEntry {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodId: string;
  foodName: string;
  points: number;
  servings: number;
  notes?: string;
  savedMealId?: string;
}

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface MealPlanDayEntry {
  foodId: string;
  servings: number;
  savedMealId?: string;
}

export interface MealPlanDay {
  breakfast: MealPlanDayEntry[];
  lunch: MealPlanDayEntry[];
  dinner: MealPlanDayEntry[];
  snacks: MealPlanDayEntry[];
}

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  startDay: DayKey;
  duration: number;
  days: Partial<Record<DayKey, MealPlanDay>>;
  createdAt: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  notes?: string;
}

const STORAGE_KEYS = {
  FOOD_DATABASE: "@health_food_database_v2",
  MEAL_LOG: "@health_meal_log",
  MEAL_PLANS: "@health_meal_plans",
  SHOPPING_LIST: "@health_shopping_list",
  DAILY_BUDGET: "@health_daily_budget",
  SAVED_MEALS: "@health_saved_meals",
};

interface FoodContextType {
  foodDatabase: FoodItem[];
  mealLog: MealLogEntry[];
  mealPlans: MealPlan[];
  shoppingList: ShoppingListItem[];
  savedMeals: SavedMeal[];
  dailyBudget: number;
  earnedPoints: number;
  addFoodItem: (item: Omit<FoodItem, "id">) => void;
  updateFoodItem: (id: string, item: Partial<FoodItem>) => void;
  deleteFoodItem: (id: string) => void;
  importFoodItems: (items: Omit<FoodItem, "id">[]) => void;
  logMeal: (entry: Omit<MealLogEntry, "id">) => void;
  removeMealLog: (id: string) => void;
  logSavedMeal: (savedMealId: string, mealType: MealLogEntry["mealType"], date: string) => void;
  getTodayLog: () => MealLogEntry[];
  getLogForDate: (date: string) => MealLogEntry[];
  getTodayPoints: () => number;
  getPointsForDate: (date: string) => number;
  createMealPlan: (plan: Omit<MealPlan, "id" | "createdAt">) => void;
  updateMealPlan: (id: string, updates: Partial<MealPlan>) => void;
  deleteMealPlan: (id: string) => void;
  getMealPlanPoints: (plan: MealPlan) => number;
  addToShoppingList: (item: Omit<ShoppingListItem, "id">) => void;
  updateShoppingItem: (id: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingItem: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearCheckedItems: () => void;
  createSavedMeal: (meal: Omit<SavedMeal, "id" | "createdAt">) => void;
  updateSavedMeal: (id: string, updates: Partial<SavedMeal>) => void;
  deleteSavedMeal: (id: string) => void;
  getSavedMealPoints: (meal: SavedMeal) => number;
  setDailyBudget: (budget: number) => void;
  setEarnedPoints: (points: number) => void;
}

const FoodContext = createContext<FoodContextType | null>(null);

const DEFAULT_FOODS: Omit<FoodItem, "id">[] = [
  // Dairy & Milk
  { name: "Almond Milk",                           category: "Dairy",            points: 1.5, servingSize: "1 cup" },
  { name: "Butter",                                category: "Dairy",            points: 6,   servingSize: "1 TB" },
  { name: "Cheese Cheddar (Grated)",               category: "Dairy",            points: 4.5, servingSize: "1 oz / 28g" },
  { name: "Cheese Cheddar (Sliced)",               category: "Dairy",            points: 3.5, servingSize: "1 slice" },
  { name: "Milk (Whole or Half & Half Cream)",     category: "Dairy",            points: 1.5, servingSize: "1 TB" },
  { name: "Milk (Flavored Creamer)",               category: "Dairy",            points: 2,   servingSize: "1 TB" },
  // Nuts & Seeds
  { name: "Almonds",                               category: "Nuts & Seeds",     points: 4.5, servingSize: "1/4 cup" },
  { name: "Assorted Nuts Trail Mix",               category: "Nuts & Seeds",     points: 4.5, servingSize: "1 small handful" },
  { name: "Cacao Nibs",                            category: "Nuts & Seeds",     points: 2.5, servingSize: "1 TB" },
  { name: "Cashews",                               category: "Nuts & Seeds",     points: 4.5, servingSize: "1/2 cup" },
  { name: "Peanuts",                               category: "Nuts & Seeds",     points: 3.5, servingSize: "1/4 cup" },
  { name: "Pine Nuts",                             category: "Nuts & Seeds",     points: 4.5, servingSize: "1 oz" },
  { name: "Pistachios",                            category: "Nuts & Seeds",     points: 3.5, servingSize: "1/4 cup (4 in 4oz)" },
  { name: "Sunflower Seeds",                       category: "Nuts & Seeds",     points: 1.5, servingSize: "1 TB" },
  { name: "Tahini",                                category: "Nuts & Seeds",     points: 3.5, servingSize: "1 TB" },
  // Fruits
  { name: "Apple (Granny Smith)",                  category: "Fruits",           points: 0,   servingSize: "1 unit" },
  { name: "Apple (Red Delicious)",                 category: "Fruits",           points: 0,   servingSize: "1 unit" },
  { name: "Avocado",                               category: "Fruits",           points: 3.5, servingSize: "1/4 fruit" },
  { name: "Bananas",                               category: "Fruits",           points: 0,   servingSize: "1 medium" },
  { name: "Blueberries (Frozen)",                  category: "Fruits",           points: 0,   servingSize: "1 cup (est. 1/12 bag)" },
  { name: "Dates (Medjool)",                       category: "Fruits",           points: 4.5, servingSize: "6 dates (est. 45 in bag)" },
  { name: "Lemon",                                 category: "Fruits",           points: 0,   servingSize: "1/2 lemon" },
  { name: "Mandarin",                              category: "Fruits",           points: 0,   servingSize: "1 fruit" },
  { name: "Mango",                                 category: "Fruits",           points: 0,   servingSize: "1/2 mango" },
  { name: "Oranges (Navel)",                       category: "Fruits",           points: 0,   servingSize: "1 unit" },
  { name: "Pear (Bartlett)",                       category: "Fruits",           points: 0,   servingSize: "1 unit" },
  { name: "Pomegranate Juice",                     category: "Fruits",           points: 4,   servingSize: "1 cup" },
  { name: "Raisins",                               category: "Fruits",           points: 5,   servingSize: "1/4 cup" },
  { name: "Raspberries",                           category: "Fruits",           points: 0,   servingSize: "1 handful" },
  // Vegetables
  { name: "Beans (Frozen)",                        category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Beans (Baby)",                          category: "Vegetables",       points: 4.5, servingSize: "1/2 cup" },
  { name: "Beans (Kidney)",                        category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Beans (Chickpeas)",                     category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Beans (Pinto)",                         category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Black Beans (Can)",                     category: "Vegetables",       points: 0,   servingSize: "1/2 can" },
  { name: "Black Beans (Dried)",                   category: "Vegetables",       points: 0,   servingSize: "1/4 cup dry" },
  { name: "Broccoli (Crowns)",                     category: "Vegetables",       points: 0,   servingSize: "1 cup (est. 6 per lb)" },
  { name: "Capsicum (Red)",                        category: "Vegetables",       points: 1,   servingSize: "1 whole" },
  { name: "Capsicum (Green)",                      category: "Vegetables",       points: 0,   servingSize: "1 whole" },
  { name: "Carrots",                               category: "Vegetables",       points: 0,   servingSize: "1 carrot" },
  { name: "Celery",                                category: "Vegetables",       points: 0,   servingSize: "1 stick" },
  { name: "Chickpeas",                             category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Corn (Frozen, Fresh, Canned)",          category: "Vegetables",       points: 0,   servingSize: "1 small cob" },
  { name: "Cucumber",                              category: "Vegetables",       points: 0,   servingSize: "1 unit" },
  { name: "Garlic (Fresh)",                        category: "Vegetables",       points: 0,   servingSize: "1 clove" },
  { name: "Ginger",                                category: "Vegetables",       points: 0,   servingSize: "1 cup" },
  { name: "Green Beans",                           category: "Vegetables",       points: 0,   servingSize: "1 cup" },
  { name: "Kale (Baby)",                           category: "Vegetables",       points: 0,   servingSize: "1 cup" },
  { name: "Kale (Curly)",                          category: "Vegetables",       points: 0,   servingSize: "1 cup" },
  { name: "Lentils (Green)",                       category: "Vegetables",       points: 0,   servingSize: "1 cup" },
  { name: "Mushrooms (Baby Bella)",                category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Mushrooms (White)",                     category: "Vegetables",       points: 0,   servingSize: "1/2 cup" },
  { name: "Onions (Red)",                          category: "Vegetables",       points: 0,   servingSize: "1 (normal) slice" },
  { name: "Onions (Yellow)",                       category: "Vegetables",       points: 0,   servingSize: "1 (normal) slice" },
  { name: "Red Kidney Beans",                      category: "Vegetables",       points: 0,   servingSize: "1/2 can" },
  { name: "Romaine",                               category: "Vegetables",       points: 0,   servingSize: "1 baby" },
  { name: "Spring Mix",                            category: "Vegetables",       points: 0,   servingSize: "1/2 a small bag" },
  { name: "Sprouts (Pea)",                         category: "Vegetables",       points: 0,   servingSize: "1 handful (~15 sprouts)" },
  // Protein
  { name: "Bacon (Pork)",                          category: "Protein",          points: 2,   servingSize: "1 piece" },
  { name: "Bacon (Turkey)",                        category: "Protein",          points: 1,   servingSize: "1 piece" },
  { name: "Beef (Jill Hamburger)",                 category: "Protein",          points: 11,  servingSize: "4 oz patty" },
  { name: "Chicken Breast",                        category: "Protein",          points: 0,   servingSize: "0.75 lb" },
  { name: "Eggs",                                  category: "Protein",          points: 0,   servingSize: "1 unit" },
  { name: "Falafels - Afia Traditional",           category: "Protein",          points: 6,   servingSize: "3x balls" },
  { name: "Falafels - Afia Garlic & Herb",         category: "Protein",          points: 6,   servingSize: "3x balls" },
  { name: "Protein Shake",                         category: "Protein",          points: 10,  servingSize: "4 oz serving" },
  { name: "Salmon (Tinned)",                       category: "Protein",          points: 0,   servingSize: "5 oz" },
  { name: "Sausages (Kielbasa)",                   category: "Protein",          points: 6,   servingSize: "2 oz / 1/4 cup" },
  { name: "Tuna (Tinned, In Water)",               category: "Protein",          points: 0,   servingSize: "1x 5oz tin" },
  { name: "Tuna (Tinned, Normal Packet)",          category: "Protein",          points: 0,   servingSize: "1x normal sized packet" },
  { name: "Tuna (Packet, In Water)",               category: "Protein",          points: 4.5, servingSize: "1/4 cup" },
  // Grains & Bread
  { name: "Bread (Ezekiel)",                       category: "Grains & Bread",   points: 1,   servingSize: "1 slice" },
  { name: "Bread (Whole Wheat)",                   category: "Grains & Bread",   points: 3,   servingSize: "1 slice" },
  { name: "Bread (Keto)",                          category: "Grains & Bread",   points: 1.5, servingSize: "1 slice" },
  { name: "Noodles (Thick, Wide)",                 category: "Grains & Bread",   points: 5,   servingSize: "1 cup" },
  { name: "Pasta",                                 category: "Grains & Bread",   points: 4,   servingSize: "1/2 cup (cooked)" },
  { name: "Quinoa (All)",                          category: "Grains & Bread",   points: 1,   servingSize: "1 cup" },
  { name: "Rolled Oats",                           category: "Grains & Bread",   points: 1,   servingSize: "1/2 cup" },
  { name: "Tortillas (Corn)",                      category: "Grains & Bread",   points: 1.5, servingSize: "1 tortilla" },
  { name: "Wrap (Spinach)",                        category: "Grains & Bread",   points: 2,   servingSize: "1 wrap" },
  // Condiments & Spices
  { name: "Balsamic Vinegar",                      category: "Condiments",       points: 0,   servingSize: "1 TB (est 40 in bottle)" },
  { name: "Celery Salt",                           category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Cilantro",                              category: "Condiments",       points: 0,   servingSize: "1 cup" },
  { name: "Cinnamon",                              category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Cumin (Ground)",                        category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Dijon Mustard",                         category: "Condiments",       points: 0,   servingSize: "1 TB (est 20 in bottle)" },
  { name: "Dressing (Honey Mustard)",              category: "Condiments",       points: 2,   servingSize: "1 TB" },
  { name: "Garlic Powder",                         category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Guacamole (Wholly, Orig Mini)",         category: "Condiments",       points: 5,   servingSize: "1 pkt" },
  { name: "Hummus (TJ's Red Bell Pepper)",         category: "Condiments",       points: 2.5, servingSize: "2 TB" },
  { name: "Hummus (Plain)",                        category: "Condiments",       points: 2.5, servingSize: "1 TB" },
  { name: "Italian Herbs",                         category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Mayonnaise (Reg, Kraft)",               category: "Condiments",       points: 3.5, servingSize: "1 TB" },
  { name: "Mint (Fresh)",                          category: "Condiments",       points: 0,   servingSize: "1 TB" },
  { name: "Onion Powder",                          category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Paprika",                               category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Parsley (Dried)",                       category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  { name: "Pesto (Basil)",                         category: "Condiments",       points: 3,   servingSize: "1 TB" },
  { name: "Taco Seasoning",                        category: "Condiments",       points: 0,   servingSize: "1 tsp" },
  // Oils
  { name: "Olive Oil (Garlic)",                    category: "Oils",             points: 1.5, servingSize: "1 tsp" },
  { name: "Olive Oil (Regular)",                   category: "Oils",             points: 1.5, servingSize: "1 tsp" },
  { name: "Olive Oil (Spray)",                     category: "Oils",             points: 4.5, servingSize: "1 spritz" },
  // Beverages
  { name: "Coffee",                                category: "Beverages",        points: 0,   servingSize: "1 cup" },
  { name: "Tea (All Unsweetened)",                 category: "Beverages",        points: 0,   servingSize: "1 bag / large cup" },
  // Soups & Broths
  { name: "Broth (Pork, Restaurant)",              category: "Soups & Broths",   points: 8,   servingSize: "1 cup" },
  { name: "Soup (Cream of Mushroom)",              category: "Soups & Broths",   points: 6,   servingSize: "2/5 of a can" },
  { name: "Soup (Spinach)",                        category: "Soups & Broths",   points: 8,   servingSize: "1 cup (est. 16 p/box)" },
  { name: "Soup (Spinach, Frozen)",                category: "Soups & Broths",   points: 6,   servingSize: "1 cup (est. 16 p/box)" },
  // Fast Food & Snacks
  { name: "Chicken Crispy Wrap (Burger King)",     category: "Fast Food",        points: 12,  servingSize: "1 wrap" },
  { name: "Chips (Lays BBQ)",                      category: "Fast Food",        points: 4.5, servingSize: "~12 chips" },
  { name: "Chocolate (Hershey's Nugget)",          category: "Fast Food",        points: 0,   servingSize: "1 bar" },
  { name: "Fries (Burger King, Large)",            category: "Fast Food",        points: 12,  servingSize: "1 large" },
  { name: "Fries (McDonald's, Medium)",            category: "Fast Food",        points: 11,  servingSize: "1 medium" },
  { name: "Fries (McDonald's, Large)",             category: "Fast Food",        points: 16.5,servingSize: "1 large" },
  { name: "Ginger Snap Cookie",                    category: "Fast Food",        points: 2,   servingSize: "1 small" },
  { name: "Quarter Pounder w/ Cheese (McDonald's)",category: "Fast Food",        points: 19,  servingSize: "1 burger" },
];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [dailyBudget, setDailyBudgetState] = useState<number>(23);
  const [earnedPoints, setEarnedPointsState] = useState<number>(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dbStr, logStr, plansStr, shopStr, budgetStr, savedMealsStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FOOD_DATABASE),
        AsyncStorage.getItem(STORAGE_KEYS.MEAL_LOG),
        AsyncStorage.getItem(STORAGE_KEYS.MEAL_PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_BUDGET),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS),
      ]);
      if (dbStr) {
        setFoodDatabase(JSON.parse(dbStr));
      } else {
        const defaults = DEFAULT_FOODS.map((f) => ({ ...f, id: generateId() }));
        setFoodDatabase(defaults);
        await AsyncStorage.setItem(STORAGE_KEYS.FOOD_DATABASE, JSON.stringify(defaults));
      }
      if (logStr) setMealLog(JSON.parse(logStr));
      if (plansStr) setMealPlans(JSON.parse(plansStr));
      if (shopStr) setShoppingList(JSON.parse(shopStr));
      if (savedMealsStr) setSavedMeals(JSON.parse(savedMealsStr));
      if (budgetStr) {
        const parsed = JSON.parse(budgetStr);
        setDailyBudgetState(parsed.budget ?? 23);
        setEarnedPointsState(parsed.earned ?? 0);
      }
    } catch (e) {
      console.error("Error loading food data:", e);
    }
  };

  const saveDatabase = useCallback(async (items: FoodItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_DATABASE, JSON.stringify(items));
  }, []);
  const saveMealLog = useCallback(async (log: MealLogEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MEAL_LOG, JSON.stringify(log));
  }, []);
  const saveMealPlans = useCallback(async (plans: MealPlan[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(plans));
  }, []);
  const saveShoppingList = useCallback(async (list: ShoppingListItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(list));
  }, []);
  const saveSavedMeals = useCallback(async (meals: SavedMeal[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(meals));
  }, []);
  const saveBudget = useCallback(async (budget: number, earned: number) => {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_BUDGET, JSON.stringify({ budget, earned }));
  }, []);

  const addFoodItem = useCallback((item: Omit<FoodItem, "id">) => {
    const newItem = { ...item, id: generateId() };
    setFoodDatabase((prev) => { const updated = [...prev, newItem]; saveDatabase(updated); return updated; });
  }, [saveDatabase]);

  const updateFoodItem = useCallback((id: string, updates: Partial<FoodItem>) => {
    setFoodDatabase((prev) => { const updated = prev.map((f) => f.id === id ? { ...f, ...updates } : f); saveDatabase(updated); return updated; });
  }, [saveDatabase]);

  const deleteFoodItem = useCallback((id: string) => {
    setFoodDatabase((prev) => { const updated = prev.filter((f) => f.id !== id); saveDatabase(updated); return updated; });
  }, [saveDatabase]);

  const importFoodItems = useCallback((items: Omit<FoodItem, "id">[]) => {
    const newItems = items.map((i) => ({ ...i, id: generateId() }));
    setFoodDatabase((prev) => { const updated = [...prev, ...newItems]; saveDatabase(updated); return updated; });
  }, [saveDatabase]);

  const logMeal = useCallback((entry: Omit<MealLogEntry, "id">) => {
    const newEntry = { ...entry, id: generateId() };
    setMealLog((prev) => { const updated = [...prev, newEntry]; saveMealLog(updated); return updated; });
  }, [saveMealLog]);

  const removeMealLog = useCallback((id: string) => {
    setMealLog((prev) => { const updated = prev.filter((e) => e.id !== id); saveMealLog(updated); return updated; });
  }, [saveMealLog]);

  const logSavedMeal = useCallback((savedMealId: string, mealType: MealLogEntry["mealType"], date: string) => {
    setSavedMeals((currentSavedMeals) => {
      const meal = currentSavedMeals.find((m) => m.id === savedMealId);
      if (!meal) return currentSavedMeals;
      setFoodDatabase((currentDb) => {
        const newEntries: MealLogEntry[] = meal.ingredients
          .map((ing) => {
            const food = currentDb.find((f) => f.id === ing.foodId);
            if (!food) return null;
            return {
              id: generateId(),
              date,
              mealType,
              foodId: food.id,
              foodName: food.name,
              points: food.points,
              servings: ing.servings,
              savedMealId,
            };
          })
          .filter(Boolean) as MealLogEntry[];
        setMealLog((prev) => { const updated = [...prev, ...newEntries]; saveMealLog(updated); return updated; });
        return currentDb;
      });
      return currentSavedMeals;
    });
  }, [saveMealLog]);

  const getTodayLog = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return mealLog.filter((e) => e.date === today);
  }, [mealLog]);

  const getLogForDate = useCallback((date: string) => mealLog.filter((e) => e.date === date), [mealLog]);

  const getTodayPoints = useCallback(() => {
    return getTodayLog().reduce((sum, e) => sum + e.points * e.servings, 0);
  }, [getTodayLog]);

  const getPointsForDate = useCallback((date: string) => {
    return getLogForDate(date).reduce((sum, e) => sum + e.points * e.servings, 0);
  }, [getLogForDate]);

  const getMealPlanPoints = useCallback((plan: MealPlan) => {
    let total = 0;
    Object.values(plan.days).forEach((day) => {
      if (!day) return;
      [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].forEach((item) => {
        const food = foodDatabase.find((f) => f.id === item.foodId);
        if (food) total += food.points * item.servings;
      });
    });
    return total;
  }, [foodDatabase]);

  const createMealPlan = useCallback((plan: Omit<MealPlan, "id" | "createdAt">) => {
    const newPlan = { ...plan, id: generateId(), createdAt: new Date().toISOString() };
    setMealPlans((prev) => { const updated = [...prev, newPlan]; saveMealPlans(updated); return updated; });
  }, [saveMealPlans]);

  const updateMealPlan = useCallback((id: string, updates: Partial<MealPlan>) => {
    setMealPlans((prev) => { const updated = prev.map((p) => p.id === id ? { ...p, ...updates } : p); saveMealPlans(updated); return updated; });
  }, [saveMealPlans]);

  const deleteMealPlan = useCallback((id: string) => {
    setMealPlans((prev) => { const updated = prev.filter((p) => p.id !== id); saveMealPlans(updated); return updated; });
  }, [saveMealPlans]);

  const addToShoppingList = useCallback((item: Omit<ShoppingListItem, "id">) => {
    const newItem = { ...item, id: generateId() };
    setShoppingList((prev) => { const updated = [...prev, newItem]; saveShoppingList(updated); return updated; });
  }, [saveShoppingList]);

  const updateShoppingItem = useCallback((id: string, updates: Partial<ShoppingListItem>) => {
    setShoppingList((prev) => { const updated = prev.map((i) => i.id === id ? { ...i, ...updates } : i); saveShoppingList(updated); return updated; });
  }, [saveShoppingList]);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => { const updated = prev.filter((i) => i.id !== id); saveShoppingList(updated); return updated; });
  }, [saveShoppingList]);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => { const updated = prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i); saveShoppingList(updated); return updated; });
  }, [saveShoppingList]);

  const clearCheckedItems = useCallback(() => {
    setShoppingList((prev) => { const updated = prev.filter((i) => !i.checked); saveShoppingList(updated); return updated; });
  }, [saveShoppingList]);

  const createSavedMeal = useCallback((meal: Omit<SavedMeal, "id" | "createdAt">) => {
    const newMeal = { ...meal, id: generateId(), createdAt: new Date().toISOString() };
    setSavedMeals((prev) => { const updated = [...prev, newMeal]; saveSavedMeals(updated); return updated; });
  }, [saveSavedMeals]);

  const updateSavedMeal = useCallback((id: string, updates: Partial<SavedMeal>) => {
    setSavedMeals((prev) => { const updated = prev.map((m) => m.id === id ? { ...m, ...updates } : m); saveSavedMeals(updated); return updated; });
  }, [saveSavedMeals]);

  const deleteSavedMeal = useCallback((id: string) => {
    setSavedMeals((prev) => { const updated = prev.filter((m) => m.id !== id); saveSavedMeals(updated); return updated; });
  }, [saveSavedMeals]);

  const getSavedMealPoints = useCallback((meal: SavedMeal) => {
    return meal.ingredients.reduce((sum, ing) => {
      const food = foodDatabase.find((f) => f.id === ing.foodId);
      return sum + (food ? food.points * ing.servings : 0);
    }, 0);
  }, [foodDatabase]);

  const setDailyBudget = useCallback((budget: number) => {
    setDailyBudgetState(budget);
    saveBudget(budget, earnedPoints);
  }, [earnedPoints, saveBudget]);

  const setEarnedPoints = useCallback((points: number) => {
    setEarnedPointsState(points);
    saveBudget(dailyBudget, points);
  }, [dailyBudget, saveBudget]);

  return (
    <FoodContext.Provider value={{
      foodDatabase, mealLog, mealPlans, shoppingList, savedMeals,
      dailyBudget, earnedPoints,
      addFoodItem, updateFoodItem, deleteFoodItem, importFoodItems,
      logMeal, removeMealLog, logSavedMeal,
      getTodayLog, getLogForDate, getTodayPoints, getPointsForDate,
      createMealPlan, updateMealPlan, deleteMealPlan, getMealPlanPoints,
      addToShoppingList, updateShoppingItem, removeShoppingItem, toggleShoppingItem, clearCheckedItems,
      createSavedMeal, updateSavedMeal, deleteSavedMeal, getSavedMealPoints,
      setDailyBudget, setEarnedPoints,
    }}>
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error("useFood must be used within FoodProvider");
  return ctx;
}
