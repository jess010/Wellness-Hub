import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useFood } from "@/context/FoodContext";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getTodayLog, getTodayPoints, dailyBudget, earnedPoints, removeMealLog, foodDatabase } = useFood();
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);

  const todayLog = getTodayLog();
  const usedPoints = getTodayPoints();
  const totalBudget = dailyBudget + earnedPoints;
  const remaining = totalBudget - usedPoints;
  const pct = Math.min(100, (usedPoints / totalBudget) * 100);
  const barColor = pct < 70 ? Colors.success : pct < 90 ? Colors.warning : Colors.error;

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const logByMeal = MEAL_TYPES.reduce(
    (acc, m) => ({ ...acc, [m]: todayLog.filter((e) => e.mealType === m) }),
    {} as Record<typeof MEAL_TYPES[number], typeof todayLog>
  );

  const mealLabel = (m: string) => m.charAt(0).toUpperCase() + m.slice(1);
  const mealIcon = (m: string) => {
    switch (m) {
      case "breakfast": return "sunrise";
      case "lunch": return "sun";
      case "dinner": return "moon";
      default: return "coffee";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Food Tracker</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/food/saved-meals")}>
            <Feather name="bookmark" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/food/database")}>
            <Feather name="database" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/food/mealplan")}>
            <Feather name="calendar" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/food/shopping")}>
            <Feather name="shopping-cart" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pointsCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.pointsTop}>
            <View>
              <Text style={[styles.pointsValue, { color: barColor }]}>{remaining}</Text>
              <Text style={[styles.pointsSubtitle, { color: textSecondary }]}>points remaining</Text>
            </View>
            <View style={styles.pointsBreakdown}>
              <Text style={[styles.breakdownText, { color: textSecondary }]}>
                Budget: <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold" }}>{dailyBudget}</Text>
              </Text>
              <Text style={[styles.breakdownText, { color: textSecondary }]}>
                Earned: <Text style={{ color: Colors.accent, fontFamily: "Inter_600SemiBold" }}>+{earnedPoints}</Text>
              </Text>
              <Text style={[styles.breakdownText, { color: textSecondary }]}>
                Used: <Text style={{ color: Colors.error, fontFamily: "Inter_600SemiBold" }}>{usedPoints}</Text>
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt }]}>
            <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logBtn, { backgroundColor: Colors.food }]}
          onPress={() => router.push("/food/log")}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.logBtnText}>Log Food</Text>
        </TouchableOpacity>

        {MEAL_TYPES.map((meal) => (
          <View key={meal} style={[styles.mealSection, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleRow}>
                <View style={[styles.mealIconWrap, { backgroundColor: Colors.food + "20" }]}>
                  <Feather name={mealIcon(meal) as any} size={16} color={Colors.food} />
                </View>
                <Text style={[styles.mealTitle, { color: textColor }]}>{mealLabel(meal)}</Text>
              </View>
              <Text style={[styles.mealPoints, { color: textSecondary }]}>
                {logByMeal[meal].reduce((s, e) => s + e.points * e.servings, 0)} pts
              </Text>
            </View>
            {logByMeal[meal].length === 0 ? (
              <Text style={[styles.emptyMeal, { color: textSecondary }]}>Nothing logged yet</Text>
            ) : (
              logByMeal[meal].map((entry) => (
                <View key={entry.id} style={[styles.entryRow, { borderTopColor: borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryName, { color: textColor }]}>{entry.foodName}</Text>
                    <Text style={[styles.entryDetail, { color: textSecondary }]}>
                      {entry.servings}x serving · {entry.points * entry.servings} pts
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeMealLog(entry.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: { padding: 8 },
  scrollContent: { padding: 16 },
  pointsCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  pointsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  pointsValue: { fontSize: 40, fontFamily: "Inter_700Bold" },
  pointsSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -2 },
  pointsBreakdown: { gap: 4, alignItems: "flex-end" },
  breakdownText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  logBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  mealSection: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  mealTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  mealPoints: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyMeal: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", paddingVertical: 4 },
  entryRow: { flexDirection: "row", alignItems: "center", paddingTop: 10, borderTopWidth: 1, gap: 8 },
  entryName: { fontSize: 14, fontFamily: "Inter_400Regular" },
  entryDetail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
