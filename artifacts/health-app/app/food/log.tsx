import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
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
import { FoodItem, useFood } from "@/context/FoodContext";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function LogFoodScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { foodDatabase, logMeal, savedMeals, logSavedMeal, getSavedMealPoints } = useFood();

  const [search, setSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<typeof MEAL_TYPES[number]>("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState<"foods" | "saved">("foods");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;
  const surfaceAlt = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = foodDatabase.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSaved = savedMeals.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLog = () => {
    if (!selectedFood) return;
    const s = parseFloat(servings);
    if (isNaN(s) || s <= 0) {
      Alert.alert("Invalid servings", "Please enter a valid number of servings");
      return;
    }
    logMeal({
      date: new Date().toISOString().split("T")[0],
      mealType: selectedMeal,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      points: selectedFood.points,
      servings: s,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  const handleLogSavedMeal = (savedMealId: string) => {
    const today = new Date().toISOString().split("T")[0];
    logSavedMeal(savedMealId, selectedMeal, today);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Log Food</Text>
        <TouchableOpacity onPress={handleLog} disabled={!selectedFood || tab !== "foods"}>
          <Text style={[styles.saveBtn, { color: selectedFood && tab === "foods" ? Colors.food : Colors.textLight }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.mealPickerScroll, { borderBottomColor: borderColor }]} contentContainerStyle={styles.mealPickerContent}>
        {MEAL_TYPES.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.mealBtn, selectedMeal === m && { backgroundColor: Colors.food, borderColor: Colors.food }]}
            onPress={() => setSelectedMeal(m)}
          >
            <Text style={[styles.mealBtnText, { color: selectedMeal === m ? "#fff" : textSecondary }]}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedFood && tab === "foods" && (
        <View style={[styles.selectedPanel, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.selectedName, { color: textColor }]}>{selectedFood.name}</Text>
            <Text style={[styles.selectedPoints, { color: Colors.food }]}>
              {(selectedFood.points * parseFloat(servings || "1")).toFixed(1)} pts · {selectedFood.servingSize}
            </Text>
          </View>
          <View style={[styles.servingsInput, { borderColor }]}>
            <TouchableOpacity onPress={() => setServings((s) => String(Math.max(0.5, parseFloat(s || "1") - 0.5)))}>
              <Feather name="minus" size={16} color={textColor} />
            </TouchableOpacity>
            <TextInput
              style={[styles.servingsText, { color: textColor }]}
              value={servings}
              onChangeText={setServings}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => setServings((s) => String(parseFloat(s || "1") + 0.5))}>
              <Feather name="plus" size={16} color={textColor} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setSelectedFood(null)}>
            <Feather name="x-circle" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.tabRow, { backgroundColor: surfaceAlt }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "foods" && { backgroundColor: cardBg }]}
          onPress={() => { setTab("foods"); setSearch(""); }}
        >
          <Text style={[styles.tabText, { color: tab === "foods" ? Colors.food : textSecondary }]}>Foods</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "saved" && { backgroundColor: cardBg }]}
          onPress={() => { setTab("saved"); setSearch(""); setSelectedFood(null); }}
        >
          <Feather name="bookmark" size={13} color={tab === "saved" ? Colors.food : textSecondary} />
          <Text style={[styles.tabText, { color: tab === "saved" ? Colors.food : textSecondary }]}>
            Saved Meals {savedMeals.length > 0 ? `(${savedMeals.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Feather name="search" size={16} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder={tab === "foods" ? "Search foods..." : "Search saved meals..."}
          placeholderTextColor={textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {tab === "foods" ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.foodRow,
                { borderBottomColor: borderColor },
                selectedFood?.id === item.id && { backgroundColor: Colors.food + "12" },
              ]}
              onPress={() => setSelectedFood(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.foodName, { color: textColor }]}>{item.name}</Text>
                <Text style={[styles.foodCategory, { color: textSecondary }]}>
                  {item.category} · {item.servingSize}
                </Text>
              </View>
              <View style={[styles.pointsBadge, { backgroundColor: item.points === 0 ? Colors.primary + "20" : Colors.food + "20" }]}>
                <Text style={[styles.pointsBadgeText, { color: item.points === 0 ? Colors.primary : Colors.food }]}>
                  {item.points} pts
                </Text>
              </View>
              {selectedFood?.id === item.id && <Feather name="check" size={16} color={Colors.food} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: textSecondary }]}>No foods found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredSaved}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="bookmark" size={36} color={Colors.border} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No saved meals yet</Text>
              <TouchableOpacity
                style={[styles.createSavedBtn, { backgroundColor: Colors.food + "20" }]}
                onPress={() => { router.back(); setTimeout(() => router.push("/food/saved-meals"), 300); }}
              >
                <Text style={[styles.createSavedText, { color: Colors.food }]}>Create Saved Meals</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const pts = getSavedMealPoints(item);
            return (
              <TouchableOpacity
                style={[styles.savedMealRow, { borderBottomColor: borderColor }]}
                onPress={() => handleLogSavedMeal(item.id)}
              >
                <View style={[styles.savedMealIcon, { backgroundColor: Colors.food + "20" }]}>
                  <Feather name="bookmark" size={16} color={Colors.food} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.savedMealName, { color: textColor }]}>{item.name}</Text>
                  {item.description ? (
                    <Text style={[styles.savedMealDesc, { color: textSecondary }]} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <Text style={[styles.savedMealMeta, { color: textSecondary }]}>
                    {item.ingredients.length} ingredients · {pts} pts
                  </Text>
                </View>
                <View style={[styles.logNowBtn, { backgroundColor: Colors.food }]}>
                  <Text style={styles.logNowText}>Log</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  mealPickerScroll: { borderBottomWidth: 1, maxHeight: 52 },
  mealPickerContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: "row", alignItems: "center" },
  mealBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  selectedPanel: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  selectedName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  selectedPoints: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  servingsInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  servingsText: { fontSize: 16, fontFamily: "Inter_600SemiBold", minWidth: 30, textAlign: "center" },
  tabRow: { flexDirection: "row", marginHorizontal: 12, marginTop: 10, marginBottom: 2, borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  foodName: { fontSize: 15, fontFamily: "Inter_400Regular" },
  foodCategory: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pointsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pointsBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  savedMealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  savedMealIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  savedMealName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  savedMealDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  savedMealMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logNowBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  logNowText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", padding: 40, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  createSavedBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, marginTop: 4 },
  createSavedText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
