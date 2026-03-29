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
import { DayKey, MealPlan, MealPlanDay, MealPlanDayEntry, useFood } from "@/context/FoodContext";

const ALL_DAYS: { key: DayKey; short: string; label: string }[] = [
  { key: "monday",    short: "Mon", label: "Monday"    },
  { key: "tuesday",   short: "Tue", label: "Tuesday"   },
  { key: "wednesday", short: "Wed", label: "Wednesday" },
  { key: "thursday",  short: "Thu", label: "Thursday"  },
  { key: "friday",    short: "Fri", label: "Friday"    },
  { key: "saturday",  short: "Sat", label: "Saturday"  },
  { key: "sunday",    short: "Sun", label: "Sunday"    },
];

const MEAL_TYPES: { key: keyof MealPlanDay; label: string; icon: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "sunrise" },
  { key: "lunch",     label: "Lunch",     icon: "sun"     },
  { key: "dinner",    label: "Dinner",    icon: "moon"    },
  { key: "snacks",    label: "Snacks",    icon: "coffee"  },
];

const EMPTY_DAY: MealPlanDay = { breakfast: [], lunch: [], dinner: [], snacks: [] };

function getPlanDays(startDay: DayKey, duration: number): typeof ALL_DAYS {
  const startIdx = ALL_DAYS.findIndex((d) => d.key === startDay);
  return Array.from({ length: Math.min(duration, 7) }, (_, i) => ALL_DAYS[(startIdx + i) % 7]);
}

export default function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    mealPlans, createMealPlan, updateMealPlan, deleteMealPlan, getMealPlanPoints,
    foodDatabase, savedMeals,
  } = useFood();

  // ── Create modal state ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [planName,    setPlanName]    = useState("");
  const [planDesc,    setPlanDesc]    = useState("");
  const [planStart,   setPlanStart]   = useState<DayKey>("monday");
  const [planDuration, setPlanDuration] = useState(7);

  // ── Detail view state ────────────────────────────────────────────────────
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDay,    setSelectedDay]    = useState<DayKey>("monday");

  // ── Add-entry modal state ─────────────────────────────────────────────────
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [addingMealType,  setAddingMealType]  = useState<keyof MealPlanDay>("breakfast");
  const [addMode,         setAddMode]         = useState<"food" | "savedmeal">("food");
  const [search,          setSearch]          = useState("");
  const [selectedItemId,  setSelectedItemId]  = useState<string | null>(null);
  const [servings,        setServings]        = useState("1");

  // ── Theme ─────────────────────────────────────────────────────────────────
  const bg         = isDark ? Colors.dark.background  : Colors.background;
  const cardBg     = isDark ? Colors.dark.card        : Colors.card;
  const textColor  = isDark ? Colors.dark.text        : Colors.text;
  const textSec    = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border     : Colors.border;
  const inputBg    = isDark ? Colors.dark.surfaceAlt  : Colors.surfaceAlt;
  const surfaceAlt = isDark ? Colors.dark.surfaceAlt  : Colors.surfaceAlt;
  const topInset   = Platform.OS === "web" ? 67 : insets.top;

  // Always read fresh plan data from context
  const activePlan = selectedPlanId ? mealPlans.find((p) => p.id === selectedPlanId) ?? null : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!planName.trim()) { Alert.alert("Name required"); return; }
    createMealPlan({
      name: planName.trim(),
      description: planDesc.trim() || undefined,
      startDay: planStart,
      duration: planDuration,
      days: {},
    });
    setPlanName(""); setPlanDesc(""); setPlanStart("monday"); setPlanDuration(7);
    setShowCreateModal(false);
  };

  const handleDelete = (plan: MealPlan) => {
    Alert.alert(
      "Delete plan?",
      `Remove "${plan.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
          deleteMealPlan(plan.id);
          if (selectedPlanId === plan.id) setSelectedPlanId(null);
        }},
      ],
    );
  };

  const getEntryPoints = (entry: MealPlanDayEntry) => {
    const food = foodDatabase.find((f) => f.id === entry.foodId);
    return food ? food.points * entry.servings : 0;
  };

  const getDayPoints = (plan: MealPlan, dayKey: DayKey): number => {
    const day = plan.days[dayKey];
    if (!day) return 0;
    return [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks]
      .reduce((s, e) => s + getEntryPoints(e), 0);
  };

  const openAddModal = (mealType: keyof MealPlanDay) => {
    setAddingMealType(mealType); setSelectedItemId(null);
    setServings("1"); setSearch(""); setAddMode("food"); setShowAddModal(true);
  };

  const handleAddEntry = () => {
    if (!activePlan || !selectedItemId) return;
    const s = parseFloat(servings) || 1;
    const currentDay = activePlan.days[selectedDay] ?? EMPTY_DAY;
    let newEntries: MealPlanDayEntry[] = [];

    if (addMode === "savedmeal") {
      const meal = savedMeals.find((m) => m.id === selectedItemId);
      if (!meal) return;
      newEntries = meal.ingredients.map((ing) => ({
        foodId: ing.foodId, servings: ing.servings * s, savedMealId: meal.id,
      }));
    } else {
      newEntries = [{ foodId: selectedItemId, servings: s }];
    }

    const updatedDay: MealPlanDay = {
      ...currentDay,
      [addingMealType]: [...currentDay[addingMealType], ...newEntries],
    };
    updateMealPlan(activePlan.id, { days: { ...activePlan.days, [selectedDay]: updatedDay } });
    setShowAddModal(false);
  };

  const removeEntry = (mealType: keyof MealPlanDay, index: number) => {
    if (!activePlan) return;
    const currentDay = activePlan.days[selectedDay] ?? EMPTY_DAY;
    const updatedDay: MealPlanDay = {
      ...currentDay,
      [mealType]: currentDay[mealType].filter((_, i) => i !== index),
    };
    updateMealPlan(activePlan.id, { days: { ...activePlan.days, [selectedDay]: updatedDay } });
  };

  const filteredFoods  = foodDatabase.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredSaved  = savedMeals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (activePlan) {
    const planDays    = getPlanDays(activePlan.startDay, activePlan.duration);
    const currentDay  = activePlan.days[selectedDay] ?? EMPTY_DAY;
    const dayPts      = getDayPoints(activePlan, selectedDay);

    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setSelectedPlanId(null)}>
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{activePlan.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(activePlan)}>
            <Feather name="trash-2" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Plan meta */}
        <View style={[styles.planMeta, { backgroundColor: Colors.food + "10", borderBottomColor: borderColor }]}>
          <Feather name="calendar" size={13} color={Colors.food} />
          <Text style={[styles.planMetaText, { color: Colors.food }]}>
            Starts {ALL_DAYS.find((d) => d.key === activePlan.startDay)?.label} · {activePlan.duration} day{activePlan.duration !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Day picker — only shows the plan's active days */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={[styles.dayPickerScroll, { backgroundColor: surfaceAlt }]}
          contentContainerStyle={styles.dayPickerContent}
        >
          {planDays.map((day) => {
            const pts        = getDayPoints(activePlan, day.key);
            const isSelected = selectedDay === day.key;
            return (
              <TouchableOpacity
                key={day.key}
                style={[styles.dayChip, isSelected && { backgroundColor: Colors.food }]}
                onPress={() => setSelectedDay(day.key)}
              >
                <Text style={[styles.dayChipLabel, { color: isSelected ? "#fff" : textSec }]}>{day.short}</Text>
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
            {ALL_DAYS.find((d) => d.key === selectedDay)?.label}
          </Text>
          <Text style={[styles.dayPts, { color: Colors.food }]}>{dayPts} pts</Text>
        </View>

        {/* Meal sections */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {MEAL_TYPES.map((mealType) => {
            const entries = currentDay[mealType.key];
            const mealPts = entries.reduce((s, e) => s + getEntryPoints(e), 0);
            return (
              <View key={mealType.key} style={[styles.mealSection, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.mealSectionHeader}>
                  <View style={styles.mealTitleRow}>
                    <View style={[styles.mealIcon, { backgroundColor: Colors.food + "20" }]}>
                      <Feather name={mealType.icon as any} size={14} color={Colors.food} />
                    </View>
                    <Text style={[styles.mealSectionTitle, { color: textColor }]}>{mealType.label}</Text>
                    {mealPts > 0 && (
                      <Text style={[styles.mealPts, { color: textSec }]}>{mealPts} pts</Text>
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
                    <Text style={[styles.emptyMealText, { color: textSec }]}>Tap + to add food or a saved meal</Text>
                  </TouchableOpacity>
                ) : (
                  entries.map((entry, idx) => {
                    const food = foodDatabase.find((f) => f.id === entry.foodId);
                    if (!food) return null;
                    return (
                      <View key={idx} style={[styles.entryRow, { borderTopColor: borderColor }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.entryFoodName, { color: textColor }]}>{food.name}</Text>
                          <Text style={[styles.entryMeta, { color: textSec }]}>
                            {entry.servings}× {food.servingSize} · {getEntryPoints(entry)} pts
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeEntry(mealType.key, idx)}>
                          <Feather name="x" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Add food/saved meal modal */}
        <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { backgroundColor: bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={[styles.cancelText, { color: textSec }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Add to {MEAL_TYPES.find((m) => m.key === addingMealType)?.label}
              </Text>
              <TouchableOpacity onPress={handleAddEntry}>
                <Text style={[styles.saveText, { color: selectedItemId ? Colors.food : Colors.textLight }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modeToggle, { backgroundColor: surfaceAlt, margin: 12 }]}>
              {(["food", "savedmeal"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, addMode === mode && { backgroundColor: cardBg }]}
                  onPress={() => { setAddMode(mode); setSelectedItemId(null); }}
                >
                  {mode === "savedmeal" && (
                    <Feather name="bookmark" size={13} color={addMode === mode ? Colors.food : textSec} />
                  )}
                  <Text style={[styles.modeBtnText, { color: addMode === mode ? Colors.food : textSec }]}>
                    {mode === "food" ? "Food Item" : "Saved Meal"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedItemId && (
              <View style={[styles.servingsRow, { backgroundColor: Colors.food + "10", borderColor: Colors.food + "30", marginHorizontal: 12, marginBottom: 8 }]}>
                <Text style={[styles.servingsLabel, { color: Colors.food }]}>Servings:</Text>
                <View style={[styles.servingsControl, { borderColor }]}>
                  <TouchableOpacity onPress={() => setServings((s) => String(Math.max(0.5, parseFloat(s) - 0.5)))}>
                    <Feather name="minus" size={14} color={textColor} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.servingsInput, { color: textColor }]}
                    value={servings} onChangeText={setServings}
                    keyboardType="decimal-pad" selectTextOnFocus
                  />
                  <TouchableOpacity onPress={() => setServings((s) => String(parseFloat(s) + 0.5))}>
                    <Feather name="plus" size={14} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor, marginHorizontal: 12, marginBottom: 8 }]}>
              <Feather name="search" size={16} color={textSec} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder={addMode === "food" ? "Search foods…" : "Search saved meals…"}
                placeholderTextColor={textSec}
                value={search} onChangeText={setSearch}
              />
            </View>

            {addMode === "food" ? (
              <FlatList
                data={filteredFoods} keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickRow, { borderBottomColor: borderColor },
                      selectedItemId === item.id && { backgroundColor: Colors.food + "12" }]}
                    onPress={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickName, { color: textColor }]}>{item.name}</Text>
                      <Text style={[styles.pickMeta, { color: textSec }]}>{item.category} · {item.servingSize}</Text>
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
                data={filteredSaved} keyExtractor={(i) => i.id}
                ListEmptyComponent={
                  <View style={{ padding: 30, alignItems: "center" }}>
                    <Text style={[styles.pickMeta, { color: textSec, textAlign: "center" }]}>
                      No saved meals yet.{"\n"}Create some using the bookmark icon in the Food tab.
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
                      style={[styles.pickRow, { borderBottomColor: borderColor },
                        selectedItemId === item.id && { backgroundColor: Colors.food + "12" }]}
                      onPress={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                    >
                      <View style={[styles.savedMealIconWrap, { backgroundColor: Colors.food + "20" }]}>
                        <Feather name="bookmark" size={14} color={Colors.food} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickName, { color: textColor }]}>{item.name}</Text>
                        <Text style={[styles.pickMeta, { color: textSec }]}>{item.ingredients.length} ingredients · {pts} pts</Text>
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

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Meal Plans</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Feather name="plus" size={24} color={Colors.food} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mealPlans} keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={Colors.border} />
            <Text style={[styles.emptyTitle, { color: textSec }]}>No meal plans yet</Text>
            <Text style={[styles.emptySub, { color: textSec }]}>Tap + to create a meal plan</Text>
          </View>
        }
        renderItem={({ item }) => {
          const pts = getMealPlanPoints(item);
          const totalEntries = Object.values(item.days).reduce((sum, day) => {
            if (!day) return sum;
            return sum + day.breakfast.length + day.lunch.length + day.dinner.length + day.snacks.length;
          }, 0);
          const startLabel = ALL_DAYS.find((d) => d.key === (item.startDay ?? "monday"))?.label ?? "Monday";
          return (
            <View style={[styles.planCard, { backgroundColor: cardBg, borderColor }]}>
              {/* Top row: icon + info */}
              <View style={styles.planCardTop}>
                <View style={[styles.planIcon, { backgroundColor: Colors.food + "20" }]}>
                  <Feather name="calendar" size={20} color={Colors.food} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: textColor }]}>{item.name}</Text>
                  {item.description ? (
                    <Text style={[styles.planDesc, { color: textSec }]} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <View style={styles.planStats}>
                    <View style={[styles.statChip, { backgroundColor: Colors.food + "15" }]}>
                      <Text style={[styles.statChipText, { color: Colors.food }]}>
                        From {startLabel} · {item.duration ?? 7}d
                      </Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: Colors.food + "15" }]}>
                      <Text style={[styles.statChipText, { color: Colors.food }]}>{totalEntries} meals</Text>
                    </View>
                    {pts > 0 && (
                      <View style={[styles.statChip, { backgroundColor: Colors.food + "15" }]}>
                        <Text style={[styles.statChipText, { color: Colors.food }]}>~{pts} pts</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {/* Bottom row: action buttons — separate, no nesting conflict */}
              <View style={[styles.planCardActions, { borderTopColor: borderColor }]}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Feather name="trash-2" size={15} color={Colors.error} />
                  <Text style={[styles.deleteBtnText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: Colors.food }]}
                  onPress={() => {
                    setSelectedDay(item.startDay ?? "monday");
                    setSelectedPlanId(item.id);
                  }}
                >
                  <Feather name="edit-2" size={14} color="#fff" />
                  <Text style={styles.editBtnText}>Edit Meals</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Create plan modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.cancelText, { color: textSec }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>New Meal Plan</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={[styles.saveText, { color: Colors.food }]}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} showsVerticalScrollIndicator={false}>
            <View>
              <Text style={[styles.fieldLabel, { color: textSec }]}>Plan name *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. Healthy Week 1"
                placeholderTextColor={textSec}
                value={planName} onChangeText={setPlanName} autoFocus
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: textSec }]}>Description (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. Low-calorie meal plan"
                placeholderTextColor={textSec}
                value={planDesc} onChangeText={setPlanDesc}
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: textSec }]}>Starts on</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {ALL_DAYS.map((day) => (
                    <TouchableOpacity
                      key={day.key}
                      style={[styles.dayPickBtn, { borderColor }, planStart === day.key && { backgroundColor: Colors.food, borderColor: Colors.food }]}
                      onPress={() => setPlanStart(day.key)}
                    >
                      <Text style={[styles.dayPickBtnText, { color: planStart === day.key ? "#fff" : textSec }]}>
                        {day.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: textSec }]}>Duration</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durBtn, { borderColor }, planDuration === d && { backgroundColor: Colors.food, borderColor: Colors.food }]}
                    onPress={() => setPlanDuration(d)}
                  >
                    <Text style={[styles.durBtnText, { color: planDuration === d ? "#fff" : textSec }]}>
                      {d} {d === 1 ? "day" : "days"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.durPreview, { color: textSec }]}>
                {planDuration === 7
                  ? `Full week starting ${ALL_DAYS.find((d) => d.key === planStart)?.label}`
                  : `${ALL_DAYS.find((d) => d.key === planStart)?.label} – ${
                      getPlanDays(planStart, planDuration).slice(-1)[0]?.label
                    }`}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", flex: 1, marginHorizontal: 12 },
  listContent: { padding: 16 },
  emptyState:  { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle:  { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub:    { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },

  planCard:       { borderRadius: 14, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  planCardTop:    { flexDirection: "row", gap: 12, padding: 16, alignItems: "flex-start" },
  planIcon:       { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planName:       { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  planDesc:       { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  planStats:      { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  statChip:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statChipText:   { fontSize: 11, fontFamily: "Inter_500Medium" },
  planCardActions:{ flexDirection: "row", borderTopWidth: 1, padding: 10, gap: 10 },
  deleteBtn:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)" },
  deleteBtnText:  { fontSize: 13, fontFamily: "Inter_500Medium" },
  editBtn:        { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8 },
  editBtnText:    { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  planMeta:       { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  planMetaText:   { fontSize: 12, fontFamily: "Inter_500Medium" },

  dayPickerScroll:   { maxHeight: 64 },
  dayPickerContent:  { paddingHorizontal: 10, paddingVertical: 8, gap: 6, flexDirection: "row", alignItems: "center" },
  dayChip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignItems: "center", minWidth: 52 },
  dayChipLabel:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dayChipPts:        { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  dayHeader:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  dayLabel:          { fontSize: 16, fontFamily: "Inter_700Bold" },
  dayPts:            { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  detailScroll:      { padding: 12 },
  mealSection:       { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  mealSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealTitleRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  mealIcon:          { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  mealSectionTitle:  { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  mealPts:           { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 4 },
  addMealBtn:        { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  emptyMeal:         { paddingVertical: 6 },
  emptyMealText:     { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  entryRow:          { flexDirection: "row", alignItems: "center", paddingTop: 8, borderTopWidth: 1, gap: 8, marginTop: 4 },
  entryFoodName:     { fontSize: 13, fontFamily: "Inter_500Medium" },
  entryMeta:         { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  modalContainer: { flex: 1 },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle:     { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText:     { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveText:       { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  fieldLabel:     { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  fieldInput:     { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },

  dayPickBtn:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  dayPickBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  durBtn:         { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  durBtnText:     { fontSize: 13, fontFamily: "Inter_500Medium" },
  durPreview:     { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", marginTop: 8 },

  modeToggle:     { flexDirection: "row", borderRadius: 10, padding: 3 },
  modeBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  modeBtnText:    { fontSize: 14, fontFamily: "Inter_500Medium" },
  servingsRow:    { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  servingsLabel:  { fontSize: 14, fontFamily: "Inter_500Medium" },
  servingsControl:{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  servingsInput:  { fontSize: 16, fontFamily: "Inter_600SemiBold", minWidth: 30, textAlign: "center" },
  searchBar:      { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  searchInput:    { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  pickRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  pickName:       { fontSize: 15, fontFamily: "Inter_500Medium" },
  pickMeta:       { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ptsBadge:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ptsText:        { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  savedMealIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
