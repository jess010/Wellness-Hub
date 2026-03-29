import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
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
import { useExercise } from "@/context/ExerciseContext";
import { useFood } from "@/context/FoodContext";
import { useTasks } from "@/context/TaskContext";

function PointsRing({ used, budget, earned }: { used: number; budget: number; earned: number }) {
  const remaining = budget + earned - used;
  const pct = Math.min(100, Math.max(0, ((used) / (budget + earned)) * 100));
  const color = pct < 70 ? Colors.success : pct < 90 ? Colors.warning : Colors.error;
  return (
    <View style={styles.pointsRingContainer}>
      <View style={[styles.pointsRing, { borderColor: color }]}>
        <Text style={[styles.pointsNumber, { color }]}>{remaining}</Text>
        <Text style={styles.pointsLabel}>pts left</Text>
      </View>
      <View style={styles.pointsLegend}>
        <View style={styles.pointsRow}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.pointsLegendText}>Budget: {budget}</Text>
        </View>
        <View style={styles.pointsRow}>
          <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.pointsLegendText}>Earned: {earned}</Text>
        </View>
        <View style={styles.pointsRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.pointsLegendText}>Used: {used}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getTodayPoints: getFoodPoints, dailyBudget, earnedPoints, getTodayLog } = useFood();
  const { getTodayExercises, getTodayCalories, getTodayPoints: getExercisePoints } = useExercise();
  const { getTasksForDate } = useTasks();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = getTasksForDate(today);
  const completedTasks = todayTasks.filter((t) => t.status === "done").length;
  const todayExercises = getTodayExercises();
  const foodUsed = getFoodPoints();
  const exerciseEarned = getExercisePoints();
  const totalEarned = earnedPoints + exerciseEarned;
  const todayLog = getTodayLog();

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: textSecondary }]}>{greeting()}</Text>
            <Text style={[styles.dateText, { color: textColor }]}>{dateStr}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Today's Points</Text>
          <PointsRing used={foodUsed} budget={dailyBudget} earned={totalEarned} />
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: Colors.food + "18", borderColor: Colors.food + "40" }]}
            onPress={() => router.push("/(tabs)/food")}
          >
            <View style={[styles.statIcon, { backgroundColor: Colors.food }]}>
              <Feather name="coffee" size={18} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: Colors.food }]}>{todayLog.length}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Meals logged</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: Colors.tasks + "18", borderColor: Colors.tasks + "40" }]}
            onPress={() => router.push("/(tabs)/tasks")}
          >
            <View style={[styles.statIcon, { backgroundColor: Colors.tasks }]}>
              <Feather name="check-square" size={18} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: Colors.tasks }]}>
              {completedTasks}/{todayTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Tasks done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: Colors.exercise + "18", borderColor: Colors.exercise + "40" }]}
            onPress={() => router.push("/(tabs)/exercise")}
          >
            <View style={[styles.statIcon, { backgroundColor: Colors.exercise }]}>
              <Feather name="activity" size={18} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: Colors.exercise }]}>{todayExercises.length}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Workouts</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textColor }]}>Today's Tasks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
                <Text style={[styles.seeAll, { color: Colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {todayTasks.slice(0, 4).map((task) => (
              <View key={task.id} style={[styles.taskRow, { borderBottomColor: borderColor }]}>
                <View style={[styles.taskCheck, task.status === "done" && { backgroundColor: Colors.primary }]}>
                  {task.status === "done" && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text
                  style={[
                    styles.taskText,
                    { color: textColor },
                    task.status === "done" && styles.taskDone,
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <View style={[styles.priorityDot, { backgroundColor: task.priority === "high" ? Colors.error : task.priority === "medium" ? Colors.warning : Colors.textLight }]} />
              </View>
            ))}
          </View>
        )}

        {todayExercises.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textColor }]}>Today's Exercise</Text>
              <Text style={[styles.caloriesText, { color: Colors.exercise }]}>
                ~{getTodayCalories()} cal burned
              </Text>
            </View>
            {todayExercises.slice(0, 3).map((ex) => (
              <View key={ex.id} style={[styles.exerciseRow, { borderBottomColor: borderColor }]}>
                <View style={[styles.exerciseIcon, { backgroundColor: Colors.exercise + "20" }]}>
                  <Feather name="activity" size={14} color={Colors.exercise} />
                </View>
                <Text style={[styles.exerciseName, { color: textColor }]}>{ex.exerciseName}</Text>
                <Text style={[styles.exerciseDetail, { color: textSecondary }]}>
                  {ex.totalDuration ? `${ex.totalDuration}min` : ex.sets ? `${ex.sets.length} sets` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.food + "18", borderColor: Colors.food + "40" }]}
              onPress={() => router.push("/food/log")}
            >
              <Feather name="plus-circle" size={20} color={Colors.food} />
              <Text style={[styles.actionText, { color: Colors.food }]}>Log Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.tasks + "18", borderColor: Colors.tasks + "40" }]}
              onPress={() => router.push("/tasks/add")}
            >
              <Feather name="plus-circle" size={20} color={Colors.tasks} />
              <Text style={[styles.actionText, { color: Colors.tasks }]}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.exercise + "18", borderColor: Colors.exercise + "40" }]}
              onPress={() => router.push("/exercise/log")}
            >
              <Feather name="plus-circle" size={20} color={Colors.exercise} />
              <Text style={[styles.actionText, { color: Colors.exercise }]}>Log Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.secondary + "18", borderColor: Colors.secondary + "40" }]}
              onPress={() => router.push("/food/shopping")}
            >
              <Feather name="shopping-cart" size={20} color={Colors.secondary} />
              <Text style={[styles.actionText, { color: Colors.secondary }]}>Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  dateText: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  pointsRingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  pointsRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsNumber: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pointsLabel: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  pointsLegend: { gap: 8 },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pointsLegendText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  taskText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  taskDone: { textDecorationLine: "line-through", opacity: 0.5 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  exerciseIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  exerciseName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  exerciseDetail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  caloriesText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  quickActions: { marginBottom: 16 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
