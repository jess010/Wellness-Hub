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
import { useExercise } from "@/context/ExerciseContext";

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { workoutPlans, updateWorkoutPlan, exerciseTemplates } = useExercise();

  const plan = workoutPlans.find((p) => p.id === id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("10");
  const [selectedEx, setSelectedEx] = useState<string | null>(null);

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Text style={{ color: textColor, padding: 20 }}>Plan not found</Text>
      </View>
    );
  }

  const filteredTemplates = exerciseTemplates.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddExercise = () => {
    if (!selectedEx) return;
    const ex = exerciseTemplates.find((e) => e.id === selectedEx);
    if (!ex) return;
    const updated = [
      ...plan.exercises,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        order: plan.exercises.length + 1,
        targetSets: parseInt(targetSets) || undefined,
        targetReps: parseInt(targetReps) || undefined,
      },
    ];
    updateWorkoutPlan(plan.id, { exercises: updated });
    setSelectedEx(null);
    setShowAddModal(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    const updated = plan.exercises
      .filter((e) => e.exerciseId !== exerciseId)
      .map((e, i) => ({ ...e, order: i + 1 }));
    updateWorkoutPlan(plan.id, { exercises: updated });
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{plan.name}</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Feather name="plus" size={24} color={Colors.exercise} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {plan.description ? (
          <Text style={[styles.planDesc, { color: textSecondary }]}>{plan.description}</Text>
        ) : null}

        {plan.exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="plus-circle" size={48} color={Colors.border} />
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>No exercises yet</Text>
            <TouchableOpacity
              style={[styles.addFirstBtn, { backgroundColor: Colors.exercise }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addFirstBtnText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plan.exercises.map((ex, idx) => {
            const template = exerciseTemplates.find((t) => t.id === ex.exerciseId);
            return (
              <View key={`${ex.exerciseId}-${idx}`} style={[styles.exRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.orderBadge, { backgroundColor: Colors.exercise }]}>
                  <Text style={styles.orderText}>{ex.order}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: textColor }]}>{ex.exerciseName}</Text>
                  <Text style={[styles.exMeta, { color: textSecondary }]}>
                    {template?.type ?? ""}
                    {ex.targetSets ? ` · ${ex.targetSets} sets` : ""}
                    {ex.targetReps ? ` × ${ex.targetReps} reps` : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExercise(ex.exerciseId)}>
                  <Feather name="x" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>Add Exercise</Text>
            <TouchableOpacity onPress={handleAddExercise}>
              <Text style={[styles.saveText, { color: selectedEx ? Colors.exercise : Colors.textLight }]}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor, margin: 12 }]}>
            <Feather name="search" size={16} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search exercises..."
              placeholderTextColor={textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          {selectedEx && (
            <View style={[styles.setConfig, { backgroundColor: Colors.exercise + "10", borderColor: Colors.exercise + "30" }]}>
              <View style={styles.setConfigField}>
                <Text style={[styles.setConfigLabel, { color: textSecondary }]}>Sets</Text>
                <TextInput style={[styles.setConfigInput, { backgroundColor: inputBg, borderColor, color: textColor }]} value={targetSets} onChangeText={setTargetSets} keyboardType="number-pad" />
              </View>
              <View style={styles.setConfigField}>
                <Text style={[styles.setConfigLabel, { color: textSecondary }]}>Reps</Text>
                <TextInput style={[styles.setConfigInput, { backgroundColor: inputBg, borderColor, color: textColor }]} value={targetReps} onChangeText={setTargetReps} keyboardType="number-pad" />
              </View>
            </View>
          )}
          <FlatList
            data={filteredTemplates}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.exItem, { borderBottomColor: borderColor }, selectedEx === item.id && { backgroundColor: Colors.exercise + "15" }]}
                onPress={() => setSelectedEx(item.id === selectedEx ? null : item.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exItemName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.exItemMeta, { color: textSecondary }]}>{item.type}</Text>
                </View>
                {selectedEx === item.id && <Feather name="check" size={16} color={Colors.exercise} />}
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", flex: 1, marginHorizontal: 12 },
  scrollContent: { padding: 16 },
  planDesc: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16, lineHeight: 20 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  addFirstBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addFirstBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  exRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  orderBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  orderText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  exName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  exMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  setConfig: { flexDirection: "row", gap: 16, padding: 12, marginHorizontal: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1 },
  setConfigField: { flex: 1, gap: 4 },
  setConfigLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  setConfigInput: { padding: 8, borderRadius: 8, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  exItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  exItemName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  exItemMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
});
