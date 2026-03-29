import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { FoodItem, MealIngredient, SavedMeal, useFood } from "@/context/FoodContext";

function IngredientRow({
  ing, food, onUpdate, onRemove,
}: {
  ing: MealIngredient;
  food: FoodItem | undefined;
  onUpdate: (servings: number) => void;
  onRemove: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  if (!food) return null;
  return (
    <View style={[styles.ingRow, { borderBottomColor: borderColor }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.ingName, { color: textColor }]}>{food.name}</Text>
        <Text style={[styles.ingMeta, { color: textSecondary }]}>
          {food.points * ing.servings} pts · {food.servingSize}
        </Text>
      </View>
      <View style={[styles.servingsControl, { borderColor }]}>
        <TouchableOpacity onPress={() => onUpdate(Math.max(0.5, ing.servings - 0.5))}>
          <Feather name="minus" size={14} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.servingsVal, { color: textColor }]}>{ing.servings}</Text>
        <TouchableOpacity onPress={() => onUpdate(ing.servings + 0.5)}>
          <Feather name="plus" size={14} color={textColor} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Feather name="x" size={15} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function SavedMealsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { savedMeals, createSavedMeal, updateSavedMeal, deleteSavedMeal, getSavedMealPoints, foodDatabase } = useFood();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [foodSearch, setFoodSearch] = useState("");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const openAdd = () => {
    setName(""); setDescription(""); setIngredients([]); setEditId(null); setShowModal(true);
  };

  const openEdit = (meal: SavedMeal) => {
    setName(meal.name);
    setDescription(meal.description ?? "");
    setIngredients([...meal.ingredients]);
    setEditId(meal.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    const data = { name: name.trim(), description: description.trim() || undefined, ingredients };
    if (editId) { updateSavedMeal(editId, data); }
    else { createSavedMeal(data); }
    setShowModal(false);
  };

  const addIngredient = (food: FoodItem) => {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.foodId === food.id);
      if (existing) return prev.map((i) => i.foodId === food.id ? { ...i, servings: i.servings + 1 } : i);
      return [...prev, { foodId: food.id, servings: 1 }];
    });
    setShowFoodPicker(false);
    setFoodSearch("");
  };

  const updateIngServings = (foodId: string, servings: number) => {
    setIngredients((prev) => prev.map((i) => i.foodId === foodId ? { ...i, servings } : i));
  };

  const removeIngredient = (foodId: string) => {
    setIngredients((prev) => prev.filter((i) => i.foodId !== foodId));
  };

  const totalPts = (ings: MealIngredient[]) => {
    return ings.reduce((sum, ing) => {
      const food = foodDatabase.find((f) => f.id === ing.foodId);
      return sum + (food ? food.points * ing.servings : 0);
    }, 0);
  };

  const filteredFoods = foodDatabase.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(foodSearch.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Saved Meals</Text>
        <TouchableOpacity onPress={openAdd}>
          <Feather name="plus" size={24} color={Colors.food} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={savedMeals}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="bookmark" size={48} color={Colors.border} />
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>No saved meals yet</Text>
            <Text style={[styles.emptySub, { color: textSecondary }]}>
              Save meals with ingredients for quick logging
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pts = getSavedMealPoints(item);
          return (
            <TouchableOpacity
              style={[styles.mealCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => openEdit(item)}
            >
              <View style={[styles.mealIcon, { backgroundColor: Colors.food + "20" }]}>
                <Feather name="bookmark" size={18} color={Colors.food} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mealName, { color: textColor }]}>{item.name}</Text>
                {item.description ? (
                  <Text style={[styles.mealDesc, { color: textSecondary }]} numberOfLines={1}>{item.description}</Text>
                ) : null}
                <Text style={[styles.mealMeta, { color: textSecondary }]}>
                  {item.ingredients.length} ingredients · {pts} pts
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => Alert.alert("Delete meal?", `Remove "${item.name}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteSavedMeal(item.id) },
                  ])}
                >
                  <Feather name="trash-2" size={15} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.cancelText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>{editId ? "Edit Meal" : "New Saved Meal"}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: Colors.food }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Meal Name *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. Protein Breakfast"
                placeholderTextColor={textSecondary}
                value={name}
                onChangeText={setName}
                autoFocus={!editId}
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Description (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. High protein morning meal"
                placeholderTextColor={textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.formField}>
              <View style={styles.ingredientsHeader}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                  Ingredients ({totalPts(ingredients)} pts)
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFoodPicker(true)}
                  style={[styles.addIngBtn, { backgroundColor: Colors.food + "20" }]}
                >
                  <Feather name="plus" size={14} color={Colors.food} />
                  <Text style={[styles.addIngText, { color: Colors.food }]}>Add Food</Text>
                </TouchableOpacity>
              </View>

              {ingredients.length === 0 ? (
                <TouchableOpacity
                  style={[styles.noIngPlaceholder, { borderColor }]}
                  onPress={() => setShowFoodPicker(true)}
                >
                  <Feather name="plus-circle" size={20} color={textSecondary} />
                  <Text style={[styles.noIngText, { color: textSecondary }]}>Add ingredients from your food database</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.ingList, { borderColor }]}>
                  {ingredients.map((ing) => (
                    <IngredientRow
                      key={ing.foodId}
                      ing={ing}
                      food={foodDatabase.find((f) => f.id === ing.foodId)}
                      onUpdate={(s) => updateIngServings(ing.foodId, s)}
                      onRemove={() => removeIngredient(ing.foodId)}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showFoodPicker} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => { setShowFoodPicker(false); setFoodSearch(""); }}>
              <Text style={[styles.cancelText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>Add Ingredient</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor, margin: 12 }]}>
            <Feather name="search" size={16} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search foods..."
              placeholderTextColor={textSecondary}
              value={foodSearch}
              onChangeText={setFoodSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredFoods}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.foodPickerRow, { borderBottomColor: borderColor }]}
                onPress={() => addIngredient(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodPickerName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.foodPickerMeta, { color: textSecondary }]}>
                    {item.category} · {item.servingSize}
                  </Text>
                </View>
                <View style={[styles.ptsBadge, { backgroundColor: Colors.food + "20" }]}>
                  <Text style={[styles.ptsText, { color: Colors.food }]}>{item.points} pts</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  listContent: { padding: 16 },
  mealCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  mealIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mealName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  mealDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  mealMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  formScroll: { padding: 16 },
  formField: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  ingredientsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addIngBtn: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addIngText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  noIngPlaceholder: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", justifyContent: "center" },
  noIngText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  ingList: { borderRadius: 10, borderWidth: 1 },
  ingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  ingName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  ingMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  servingsControl: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  servingsVal: { fontSize: 14, fontFamily: "Inter_600SemiBold", minWidth: 24, textAlign: "center" },
  removeBtn: { padding: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  foodPickerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  foodPickerName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  foodPickerMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ptsBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ptsText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
