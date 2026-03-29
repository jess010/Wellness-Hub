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
import { ExerciseSet, ExerciseTemplate, IntensityLevel, useExercise } from "@/context/ExerciseContext";

const INTENSITY_OPTIONS: { value: IntensityLevel; label: string; color: string }[] = [
  { value: "light", label: "Light", color: Colors.primary },
  { value: "moderate", label: "Moderate", color: Colors.warning },
  { value: "vigorous", label: "Vigorous", color: Colors.error },
];

export default function LogExerciseScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { exerciseTemplates, logExercise } = useExercise();

  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  const [intensity, setIntensity] = useState<IntensityLevel>("moderate");
  const [duration, setDuration] = useState("");
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [notes, setNotes] = useState("");
  const [calories, setCalories] = useState("");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = exerciseTemplates.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectExercise = (ex: ExerciseTemplate) => {
    setSelectedExercise(ex);
    if (ex.defaultDuration) setDuration(String(ex.defaultDuration));
    if (ex.defaultSets && ex.defaultReps) {
      setSets(Array.from({ length: ex.defaultSets }, () => ({
        reps: ex.defaultReps,
        weight: ex.defaultWeight,
        completed: false,
      })));
    }
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { reps: lastSet?.reps ?? 10, weight: lastSet?.weight, completed: false }]);
  };

  const updateSet = (idx: number, updates: Partial<ExerciseSet>) => {
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)));
  };

  const handleLog = () => {
    if (!selectedExercise) return;
    logExercise({
      date: new Date().toISOString().split("T")[0],
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      type: selectedExercise.type,
      sets: sets.length > 0 ? sets : undefined,
      totalDuration: duration ? parseInt(duration) : undefined,
      intensity,
      caloriesBurned: calories ? parseInt(calories) : undefined,
      pointsEarned: selectedExercise.pointsEarned,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Log Exercise</Text>
        <TouchableOpacity onPress={handleLog} disabled={!selectedExercise}>
          <Text style={[styles.saveBtn, { color: selectedExercise ? Colors.exercise : Colors.textLight }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {selectedExercise ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.selectedCard, { backgroundColor: Colors.exercise + "15", borderColor: Colors.exercise + "30" }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedName, { color: textColor }]}>{selectedExercise.name}</Text>
              <Text style={[styles.selectedType, { color: Colors.exercise }]}>
                {selectedExercise.type}
                {selectedExercise.pointsEarned ? ` · +${selectedExercise.pointsEarned} pts` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setSelectedExercise(null); setSets([]); setDuration(""); }}>
              <Feather name="x-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Intensity</Text>
            <View style={styles.intensityRow}>
              {INTENSITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.intensityBtn, intensity === opt.value && { backgroundColor: opt.color, borderColor: opt.color }]}
                  onPress={() => setIntensity(opt.value)}
                >
                  <Text style={[styles.intensityText, { color: intensity === opt.value ? "#fff" : textSecondary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(selectedExercise.type === "cardio" || selectedExercise.type === "flexibility") && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textSecondary }]}>Duration (minutes)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. 30"
                placeholderTextColor={textSecondary}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
              />
            </View>
          )}

          {selectedExercise.type === "strength" && (
            <View style={styles.section}>
              <View style={styles.setsHeader}>
                <Text style={[styles.sectionLabel, { color: textSecondary }]}>Sets</Text>
                <TouchableOpacity onPress={addSet} style={[styles.addSetBtn, { backgroundColor: Colors.exercise + "20" }]}>
                  <Feather name="plus" size={14} color={Colors.exercise} />
                  <Text style={[styles.addSetText, { color: Colors.exercise }]}>Add Set</Text>
                </TouchableOpacity>
              </View>
              {sets.map((set, idx) => (
                <View key={idx} style={[styles.setRow, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[styles.setNum, { color: textSecondary }]}>{idx + 1}</Text>
                  <View style={styles.setInputGroup}>
                    <Text style={[styles.setInputLabel, { color: textSecondary }]}>Reps</Text>
                    <TextInput
                      style={[styles.setInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                      value={String(set.reps ?? "")}
                      onChangeText={(v) => updateSet(idx, { reps: parseInt(v) || undefined })}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.setInputGroup}>
                    <Text style={[styles.setInputLabel, { color: textSecondary }]}>Weight</Text>
                    <TextInput
                      style={[styles.setInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                      value={String(set.weight ?? "")}
                      onChangeText={(v) => updateSet(idx, { weight: parseFloat(v) || undefined })}
                      keyboardType="decimal-pad"
                      placeholder="lbs"
                      placeholderTextColor={textSecondary}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.setDone, set.completed && { backgroundColor: Colors.primary }]}
                    onPress={() => updateSet(idx, { completed: !set.completed })}
                  >
                    {set.completed && <Feather name="check" size={14} color="#fff" />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSets((prev) => prev.filter((_, i) => i !== idx))}>
                    <Feather name="x" size={14} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {sets.length === 0 && (
                <TouchableOpacity
                  style={[styles.addFirstSet, { borderColor }]}
                  onPress={() => setSets([{ reps: 10, completed: false }])}
                >
                  <Feather name="plus" size={16} color={textSecondary} />
                  <Text style={[styles.addFirstSetText, { color: textSecondary }]}>Add first set</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Calories Burned (optional)</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
              placeholder="Estimated calories"
              placeholderTextColor={textSecondary}
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
              placeholder="How did it feel?"
              placeholderTextColor={textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      ) : (
        <>
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
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.exerciseRow, { borderBottomColor: borderColor }]}
                onPress={() => handleSelectExercise(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.exerciseMeta, { color: textSecondary }]}>
                    {item.type}
                    {item.defaultDuration ? ` · ${item.defaultDuration}min` : ""}
                    {item.defaultSets && item.defaultReps ? ` · ${item.defaultSets}×${item.defaultReps}` : ""}
                    {item.pointsEarned ? ` · +${item.pointsEarned}pts` : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={textSecondary} />
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16 },
  selectedCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  selectedName: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  selectedType: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2, textTransform: "capitalize" },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  intensityRow: { flexDirection: "row", gap: 8 },
  intensityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  intensityText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fieldInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  setsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addSetBtn: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addSetText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  setRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  setNum: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 16, textAlign: "center" },
  setInputGroup: { flex: 1, gap: 2 },
  setInputLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  setInput: { padding: 8, borderRadius: 8, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  setDone: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  addFirstSet: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", justifyContent: "center" },
  addFirstSetText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  notesInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 80 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  exerciseRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  exerciseName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  exerciseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
});
