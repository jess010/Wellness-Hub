import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { DayKey, MealPlanDay, MealPlanDayEntry, useFood } from "@/context/FoodContext";

const DAYS: { key: DayKey; short: string; label: string }[] = [
  { key: "monday", short: "Mon", label: "Monday" },
  { key: "tuesday", short: "Tue", label: "Tuesday" },
  { key: "wednesday", short: "Wed", label: "Wednesday" },
  { key: "thursday", short: "Thu", label: "Thursday" },
  { key: "friday", short: "Fri", label: "Friday" },
  { key: "saturday", short: "Sat", label: "Saturday" },
  { key: "sunday", short: "Sun", label: "Sunday" },
];

const MEAL_TYPES: { key: keyof MealPlanDay; label: string; icon: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "sunrise" },
  { key: "lunch", label: "Lunch", icon: "sun" },
  { key: "dinner", label: "Dinner", icon: "moon" },
  { key: "snacks", label: "Snacks", icon: "coffee" },
];

const EMPTY_DAY: MealPlanDay = { breakfast: [], lunch: [], dinner: [], snacks: [] };

export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { mealPlans, updateMealPlan, foodDatabase, savedMeals } = useFood();

  const plan = mealPlans.find((p) => p.id === id);
  const [selectedDay, setSelectedDay] = useState<DayKey>("monday");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMealType, setAddingMealType] = useState<keyof MealPlanDay>("breakfast");
  const [addMode, setAddMode] = useState<"food" | "savedmeal">("food");
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [servings, setServings] = useState("1");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;
  const surfaceAlt = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Text style={{ color: textColor, padding: 20 }}>Plan not found</Text>
      </View>
    );
  }

  const currentDay = plan.days[selectedDay] ?? EMPTY_DAY;

  const getDayPoints = (day: MealPlanDay | undefined): number => {
    if (!day) return 0;
    return [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].reduce((sum, entry) => {
      const food = foodDatabase.find((f) => f.id === entry.foodId);
      return sum + (food ? food.points * entry.servings : 0);
    }, 0);
  };

  const getMealEntryPoints = (entry: MealPlanDayEntry): number => {
    const food = foodDatabase.find((f) => f.id === entry.foodId);
    return food ? food.points * entry.servings : 0;
  };

  const openAddModal = (mealType: keyof MealPlanDay) => {
    setAddingMealType(mealType);
    setSelectedItemId(null);
    setServings("1");
    setSearch("");
    setAddMode("food");
    setShowAddModal(true);
  };

  const handleAddEntry = () => {
    if (!selectedItemId) return;
    const s = parseFloat(servings) || 1;

    let newEntries: MealPlanDayEntry[] = [];

    if (addMode === "savedmeal") {
      const meal = savedMeals.find((m) => m.id === selectedItemId);
      if (!meal) return;
      newEntries = meal.ingredients.map((ing) => ({
        foodId: ing.foodId,
        servings: ing.servings * s,
        savedMealId: meal.id,
      }));
    } else {
      newEntries = [{ foodId: selectedItemId, servings: s }];
    }

    const updatedDay: MealPlanDay = {
      ...currentDay,
      [addingMealType]: [...currentDay[addingMealType], ...newEntries],
    };
    updateMealPlan(plan.id, { days: { ...plan.days, [selectedDay]: updatedDay } });
    setShowAddModal(false);
  };

  const removeEntry = (mealType: keyof MealPlanDay, index: number) => {
    const updatedDay: MealPlanDay = {
      ...currentDay,
      [mealType]: currentDay[mealType].filter((_, i) => i !== index),
    };
    updateMealPlan(plan.id, { days: { ...plan.days, [selectedDay]: updatedDay } });
  };

  const filteredFoods = foodDatabase.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSavedMeals = savedMeals.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase())
  );

  const dayPoints = getDayPoints(currentDay);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{plan.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.dayPickerScroll, { backgroundColor: surfaceAlt }]} contentContainerStyle={styles.dayPickerContent}>
        {DAYS.map((day) => {
          const pts = getDayPoints(plan.days[day.key]);
          const isSelected = selectedDay === day.key;
          return (
            <TouchableOpacity
              key={day.key}
              style={[styles.dayChip, isSelected && { backgroundColor: Colors.food }]}
              onPress={() => setSelectedDay(day.key)}
            >
              <Text style={[styles.dayChipLabel, { color: isSelected ? "#fff" : textSecondary }]}>{day.short}</Text>
              {pts > 0 && (
                <Text style={[styles.dayChipPts, { color: isSelected ? "rgba(255,255,255,0.8)" : Colors.food }]}>
                  {pts}pt
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.dayHeader, { borderBottomColor: borderColor }]}>
        <Text style={[styles.dayLabel, { color: textColor }]}>
          {DAYS.find((d) => d.key === selectedDay)?.label}
        </Text>
        <Text style={[styles.dayPts, { color: Colors.food }]}>{dayPoints} pts</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {MEAL_TYPES.map((mealType) => {
          const entries = currentDay[mealType.key];
          const mealPts = entries.reduce((s, e) => s + getMealEntryPoints(e), 0);
          return (
            <View key={mealType.key} style={[styles.mealSection, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.mealSectionHeader}>
                <View style={styles.mealTitleRow}>
                  <View style={[styles.mealIcon, { backgroundColor: Colors.food + "20" }]}>
                    <Feather name={mealType.icon as any} size={14} color={Colors.food} />
                  </View>
                  <Text style={[styles.mealSectionTitle, { color: textColor }]}>{mealType.label}</Text>
                  {mealPts > 0 && (
                    <Text style={[styles.mealPts, { color: textSecondary }]}>{mealPts} pts</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => openAddModal(mealType.key)}
                  style={[styles.addMealBtn, { backgroundColor: Colors.food + "15" }]}
                >
                  <Feather name="plus" size={14} color={Colors.food} />
                </TouchableOpacity>
              </View>

              {entries.length === 0 ? (
                <TouchableOpacity onPress={() => openAddModal(mealType.key)} style={styles.emptyMeal}>
                  <Text style={[styles.emptyMealText, { color: textSecondary }]}>Tap + to add</Text>
                </TouchableOpacity>
              ) : (
                entries.map((entry, idx) => {
                  const food = foodDatabase.find((f) => f.id === entry.foodId);
                  if (!food) return null;
                  return (
                    <View key={idx} style={[styles.entryRow, { borderTopColor: borderColor }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.entryFoodName, { color: textColor }]}>{food.name}</Text>
                        <Text style={[styles.entryMeta, { color: textSecondary }]}>
                          {entry.servings}× serving · {getMealEntryPoints(entry)} pts
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeEntry(mealType.key, idx)}>
                        <Feather name="x" size={14} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Add to {MEAL_TYPES.find((m) => m.key === addingMealType)?.label}
            </Text>
            <TouchableOpacity onPress={handleAddEntry}>
              <Text style={[styles.saveText, { color: selectedItemId ? Colors.food : Colors.textLight }]}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.modeToggle, { backgroundColor: surfaceAlt, margin: 12 }]}>
            <TouchableOpacity
              style={[styles.modeBtn, addMode === "food" && { backgroundColor: cardBg }]}
              onPress={() => { setAddMode("food"); setSelectedItemId(null); }}
            >
              <Text style={[styles.modeBtnText, { color: addMode === "food" ? Colors.food : textSecondary }]}>
                Food Item
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, addMode === "savedmeal" && { backgroundColor: cardBg }]}
              onPress={() => { setAddMode("savedmeal"); setSelectedItemId(null); }}
            >
              <Text style={[styles.modeBtnText, { color: addMode === "savedmeal" ? Colors.food : textSecondary }]}>
                Saved Meal
              </Text>
            </TouchableOpacity>
          </View>

          {selectedItemId && (
            <View style={[styles.servingsRow, { backgroundColor: Colors.food + "10", borderColor: Colors.food + "30" }]}>
              <Text style={[styles.servingsLabel, { color: Colors.food }]}>Servings:</Text>
              <View style={[styles.servingsControl, { borderColor }]}>
                <TouchableOpacity onPress={() => setServings((s) => String(Math.max(0.5, parseFloat(s) - 0.5)))}>
                  <Feather name="minus" size={14} color={textColor} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.servingsInput, { color: textColor }]}
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity onPress={() => setServings((s) => String(parseFloat(s) + 0.5))}>
                  <Feather name="plus" size={14} color={textColor} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor, marginHorizontal: 12, marginBottom: 8 }]}>
            <Feather name="search" size={16} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder={addMode === "food" ? "Search foods..." : "Search saved meals..."}
              placeholderTextColor={textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {addMode === "food" ? (
            <FlatList
              data={filteredFoods}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickRow, { borderBottomColor: borderColor }, selectedItemId === item.id && { backgroundColor: Colors.food + "12" }]}
                  onPress={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickName, { color: textColor }]}>{item.name}</Text>
                    <Text style={[styles.pickMeta, { color: textSecondary }]}>{item.category} · {item.servingSize}</Text>
                  </View>
                  <View style={[styles.ptsBadge, { backgroundColor: Colors.food + "20" }]}>
                    <Text style={[styles.ptsText, { color: Colors.food }]}>{item.points} pts</Text>
                  </View>
                  {selectedItemId === item.id && <Feather name="check" size={16} color={Colors.food} />}
                </TouchableOpacity>
              )}
            />
          ) : (
            <FlatList
              data={filteredSavedMeals}
              keyExtractor={(i) => i.id}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={[styles.emptyPickerText, { color: textSecondary }]}>
                    No saved meals yet. Create some in the Saved Meals screen.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const pts = item.ingredients.reduce((sum, ing) => {
                  const food = foodDatabase.find((f) => f.id === ing.foodId);
                  return sum + (food ? food.points * ing.servings : 0);
                }, 0);
                return (
                  <TouchableOpacity
                    style={[styles.pickRow, { borderBottomColor: borderColor }, selectedItemId === item.id && { backgroundColor: Colors.food + "12" }]}
                    onPress={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                  >
                    <View style={[styles.savedMealIconWrap, { backgroundColor: Colors.food + "20" }]}>
                      <Feather name="bookmark" size={14} color={Colors.food} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickName, { color: textColor }]}>{item.name}</Text>
                      <Text style={[styles.pickMeta, { color: textSecondary }]}>
                        {item.ingredients.length} ingredients · {pts} pts
                      </Text>
                    </View>
                    {selectedItemId === item.id && <Feather name="check" size={16} color={Colors.food} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", flex: 1, marginHorizontal: 12 },
  dayPickerScroll: { maxHeight: 64 },
  dayPickerContent: { paddingHorizontal: 10, paddingVertical: 8, gap: 6, flexDirection: "row", alignItems: "center" },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignItems: "center", minWidth: 52 },
  dayChipLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dayChipPts: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  dayLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  dayPts: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 12 },
  mealSection: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  mealSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  mealSectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  mealPts: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 4 },
  addMealBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  emptyMeal: { paddingVertical: 6 },
  emptyMealText: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  entryRow: { flexDirection: "row", alignItems: "center", paddingTop: 8, borderTopWidth: 1, gap: 8, marginTop: 4 },
  entryFoodName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  entryMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modeToggle: { flexDirection: "row", borderRadius: 10, padding: 3 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  servingsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 12, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  servingsLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  servingsControl: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  servingsInput: { fontSize: 16, fontFamily: "Inter_600SemiBold", minWidth: 30, textAlign: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  pickRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  pickName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  pickMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ptsBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ptsText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  savedMealIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  emptyPicker: { padding: 30, alignItems: "center" },
  emptyPickerText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
