import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { useExercise } from "@/context/ExerciseContext";

export default function WorkoutPlansScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { workoutPlans, createWorkoutPlan, deleteWorkoutPlan, exerciseTemplates } = useExercise();

  const [showModal, setShowModal] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleCreate = () => {
    if (!planName.trim()) { Alert.alert("Name required"); return; }
    createWorkoutPlan({ name: planName.trim(), description: planDesc.trim() || undefined, exercises: [] });
    setPlanName(""); setPlanDesc("");
    setShowModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Workout Plans</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Feather name="plus" size={24} color={Colors.exercise} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {workoutPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="list" size={48} color={Colors.border} />
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>No workout plans</Text>
            <Text style={[styles.emptySub, { color: textSecondary }]}>Tap + to create a plan</Text>
          </View>
        ) : (
          workoutPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push({ pathname: "/exercise/plan-detail", params: { id: plan.id } })}
            >
              <View style={[styles.planIcon, { backgroundColor: Colors.exercise + "20" }]}>
                <Feather name="list" size={20} color={Colors.exercise} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: textColor }]}>{plan.name}</Text>
                {plan.description ? (
                  <Text style={[styles.planDesc, { color: textSecondary }]} numberOfLines={1}>{plan.description}</Text>
                ) : null}
                <Text style={[styles.planMeta, { color: textSecondary }]}>
                  {plan.exercises.length} exercises
                </Text>
              </View>
              <View style={styles.planActions}>
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: Colors.exercise }]}
                  onPress={() => router.push({ pathname: "/exercise/plan-detail", params: { id: plan.id } })}
                >
                  <Feather name="play" size={14} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert("Delete?", `Remove "${plan.name}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteWorkoutPlan(plan.id) },
                  ])}
                >
                  <Feather name="trash-2" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: cardBg }]}>
            <Text style={[styles.dialogTitle, { color: textColor }]}>New Workout Plan</Text>
            <TextInput
              style={[styles.dialogInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
              placeholder="Plan name (e.g. Push Day)"
              placeholderTextColor={textSecondary}
              value={planName}
              onChangeText={setPlanName}
              autoFocus
            />
            <TextInput
              style={[styles.dialogInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
              placeholder="Description (optional)"
              placeholderTextColor={textSecondary}
              value={planDesc}
              onChangeText={setPlanDesc}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.dialogBtn, { borderColor }]}>
                <Text style={[styles.dialogBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={[styles.dialogBtn, { backgroundColor: Colors.exercise, borderColor: Colors.exercise }]}>
                <Text style={[styles.dialogBtnText, { color: "#fff" }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  planCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  planIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  planDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  planMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  planActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  startBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  dialog: { width: "85%", borderRadius: 16, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  dialogInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dialogActions: { flexDirection: "row", gap: 10 },
  dialogBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  dialogBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
