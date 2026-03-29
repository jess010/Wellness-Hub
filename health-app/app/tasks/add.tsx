import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { BACKLOG_DATE, RecurringType, Task, useTasks } from "@/context/TaskContext";

const PRIORITIES = ["low", "medium", "high"] as const;
const RECURRING_OPTIONS: { value: RecurringType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { addTask, addRecurringTask, categories, tags } = useTasks();
  const params = useLocalSearchParams<{ backlog?: string }>();

  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(params.backlog === "1" ? BACKLOG_DATE : today);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [recurring, setRecurring] = useState<RecurringType>("none");
  const [recurringCount, setRecurringCount] = useState("4");
  const [selectedCat, setSelectedCat] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = () => {
    if (!title.trim()) { Alert.alert("Title required"); return; }
    const task: Omit<Task, "id" | "createdAt"> = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      status: "pending",
      date,
      categoryId: selectedCat,
      tagIds: selectedTags,
      recurring,
      priority,
    };
    if (recurring !== "none") {
      const count = parseInt(recurringCount) || 4;
      addRecurringTask(task, count);
    } else {
      addTask(task);
    }
    router.back();
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const priorityColor = (p: string) => p === "high" ? Colors.error : p === "medium" ? Colors.warning : Colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>New Task</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: Colors.tasks }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[styles.titleInput, { color: textColor, borderBottomColor: borderColor }]}
          placeholder="Task title..."
          placeholderTextColor={textSecondary}
          value={title}
          onChangeText={setTitle}
          autoFocus
          multiline
        />

        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Add notes..."
            placeholderTextColor={textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Date</Text>
          <View style={styles.quickDateRow}>
            {[
              { label: "Today", value: today },
              { label: "Tomorrow", value: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
              { label: "Backlog", value: BACKLOG_DATE },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.quickDateBtn,
                  { borderColor },
                  date === opt.value && { backgroundColor: Colors.tasks, borderColor: Colors.tasks },
                ]}
                onPress={() => setDate(opt.value)}
              >
                <Text style={[styles.quickDateText, { color: date === opt.value ? "#fff" : textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {date !== BACKLOG_DATE && (
            <TextInput
              style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor, marginTop: 8 }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={textSecondary}
              value={date}
              onChangeText={setDate}
            />
          )}
          {date === BACKLOG_DATE && (
            <View style={[styles.backlogNote, { backgroundColor: Colors.tasks + "10" }]}>
              <Feather name="inbox" size={13} color={Colors.tasks} />
              <Text style={[styles.backlogNoteText, { color: Colors.tasks }]}>
                Task will be added to the backlog — assign a day later
              </Text>
            </View>
          )}
        </View>

        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Priority</Text>
          <View style={styles.optionRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.optionBtn, priority === p && { backgroundColor: priorityColor(p), borderColor: priorityColor(p) }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.optionText, { color: priority === p ? "#fff" : textSecondary }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Recurring</Text>
          <View style={styles.optionRow}>
            {RECURRING_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.optionBtn, recurring === r.value && { backgroundColor: Colors.tasks, borderColor: Colors.tasks }]}
                onPress={() => setRecurring(r.value)}
              >
                <Text style={[styles.optionText, { color: recurring === r.value ? "#fff" : textSecondary }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {recurring !== "none" && (
            <View style={[styles.countRow, { marginTop: 10 }]}>
              <Text style={[styles.countLabel, { color: textSecondary }]}>Repeat count:</Text>
              <TextInput
                style={[styles.countInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                value={recurringCount}
                onChangeText={setRecurringCount}
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        {categories.length > 0 && (
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, !selectedCat && { backgroundColor: Colors.tasks, borderColor: Colors.tasks }]}
                  onPress={() => setSelectedCat(undefined)}
                >
                  <Text style={[styles.optionText, { color: !selectedCat ? "#fff" : textSecondary }]}>None</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.optionBtn, selectedCat === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setSelectedCat(cat.id)}
                  >
                    <Text style={[styles.optionText, { color: selectedCat === cat.id ? "#fff" : textSecondary }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Tags</Text>
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagChip, selectedTags.includes(tag.id) && { backgroundColor: tag.color }]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Text style={[styles.tagText, { color: selectedTags.includes(tag.id) ? "#fff" : textSecondary }]}>
                    #{tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16 },
  titleInput: { fontSize: 22, fontFamily: "Inter_600SemiBold", paddingBottom: 12, borderBottomWidth: 1, marginBottom: 20 },
  formField: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  notesInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 80 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  optionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  countRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  countLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  countInput: { width: 60, padding: 8, borderRadius: 8, borderWidth: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surfaceAlt },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  quickDateRow: { flexDirection: "row", gap: 8 },
  quickDateBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  quickDateText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  backlogNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, marginTop: 8 },
  backlogNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
});
