import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { ExerciseLogEntry, ExerciseType, useExercise } from "@/context/ExerciseContext";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const TYPE_COLORS: Record<ExerciseType, string> = {
  cardio: Colors.secondary,
  strength: Colors.exercise,
  flexibility: Colors.primary,
  sports: Colors.accent,
  other: Colors.textSecondary,
};

const TYPE_ICONS: Record<ExerciseType, string> = {
  cardio: "wind",
  strength: "zap",
  flexibility: "loader",
  sports: "award",
  other: "activity",
};

function ExerciseCard({ entry, onRemove }: { entry: ExerciseLogEntry; onRemove: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const typeColor = TYPE_COLORS[entry.type];

  return (
    <View style={[styles.exerciseCard, { borderColor, borderLeftColor: typeColor }]}>
      <View style={[styles.exerciseIconWrap, { backgroundColor: typeColor + "20" }]}>
        <Feather name={TYPE_ICONS[entry.type] as any} size={18} color={typeColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.exerciseName, { color: textColor }]}>{entry.exerciseName}</Text>
        <View style={styles.exerciseDetails}>
          {entry.totalDuration && (
            <Text style={[styles.detailChip, { color: typeColor, backgroundColor: typeColor + "15" }]}>
              {entry.totalDuration}min
            </Text>
          )}
          {entry.sets && entry.sets.length > 0 && (
            <Text style={[styles.detailChip, { color: typeColor, backgroundColor: typeColor + "15" }]}>
              {entry.sets.length} sets
            </Text>
          )}
          {entry.caloriesBurned ? (
            <Text style={[styles.detailChip, { color: Colors.exercise, backgroundColor: Colors.exercise + "15" }]}>
              ~{entry.caloriesBurned} cal
            </Text>
          ) : null}
          {entry.pointsEarned ? (
            <Text style={[styles.detailChip, { color: Colors.primary, backgroundColor: Colors.primary + "15" }]}>
              +{entry.pointsEarned} pts
            </Text>
          ) : null}
        </View>
        {entry.notes ? (
          <Text style={[styles.exerciseNotes, { color: textSecondary }]} numberOfLines={1}>
            {entry.notes}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="x" size={16} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    getExercisesForDate,
    getTodayCalories,
    getTodayPoints,
    removeExerciseLog,
    workoutPlans,
  } = useExercise();

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const exercises = getExercisesForDate(selectedDate);
  const totalCalories = exercises.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0);
  const totalPoints = exercises.reduce((s, e) => s + (e.pointsEarned ?? 0), 0);
  const totalMinutes = exercises.reduce((s, e) => s + (e.totalDuration ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Exercise</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/exercise/plans")}>
            <Feather name="list" size={20} color={Colors.exercise} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/exercise/log")}>
            <Feather name="plus" size={22} color={Colors.exercise} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.dateNav, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
          <Feather name="chevron-left" size={22} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(today)}>
          <Text style={[styles.dateText, { color: textColor }]}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
          <Feather name="chevron-right" size={22} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: Colors.exercise + "15", borderColor: Colors.exercise + "30" }]}>
            <Text style={[styles.statValue, { color: Colors.exercise }]}>{exercises.length}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Exercises</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.secondary + "15", borderColor: Colors.secondary + "30" }]}>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{totalMinutes}m</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Duration</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning + "30" }]}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>~{totalCalories}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Cal Burned</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "30" }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>+{totalPoints}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Pts Earned</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logBtn, { backgroundColor: Colors.exercise }]}
          onPress={() => router.push("/exercise/log")}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.logBtnText}>Log Exercise</Text>
        </TouchableOpacity>

        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="activity" size={48} color={Colors.border} />
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>No exercises logged</Text>
            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
              Tap + to log an exercise
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Logged Exercises</Text>
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} entry={ex} onRemove={() => removeExerciseLog(ex.id)} />
            ))}
          </>
        )}

        {workoutPlans.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textColor, marginTop: 16 }]}>Workout Plans</Text>
            {workoutPlans.slice(0, 3).map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => router.push({ pathname: "/exercise/plan-detail", params: { id: plan.id } })}
              >
                <View style={[styles.planIcon, { backgroundColor: Colors.exercise + "20" }]}>
                  <Feather name="list" size={18} color={Colors.exercise} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: textColor }]}>{plan.name}</Text>
                  <Text style={[styles.planDetail, { color: textSecondary }]}>
                    {plan.exercises.length} exercises
                  </Text>
                </View>
                <Feather name="play-circle" size={22} color={Colors.exercise} />
              </TouchableOpacity>
            ))}
          </>
        )}
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
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dateText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statBox: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  logBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  exerciseIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  exerciseName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  exerciseDetails: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  detailChip: { fontSize: 11, fontFamily: "Inter_500Medium", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  exerciseNotes: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  planIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  planDetail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
});
