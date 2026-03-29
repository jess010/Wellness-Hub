import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { useTasks } from "@/context/TaskContext";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { tasks, updateTask, deleteTask, completeTask, moveTask, categories, tags } = useTasks();

  const task = tasks.find((t) => t.id === id);
  const [editNotes, setEditNotes] = useState(task?.notes ?? "");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDate, setMoveDate] = useState(task?.date ?? "");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Text style={{ color: textColor, padding: 20 }}>Task not found</Text>
      </View>
    );
  }

  const category = categories.find((c) => c.id === task.categoryId);
  const taskTags = tags.filter((t) => task.tagIds.includes(t.id));
  const priorityColor = task.priority === "high" ? Colors.error : task.priority === "medium" ? Colors.warning : Colors.primary;

  const handleDelete = () => {
    Alert.alert("Delete task?", `Remove "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteTask(task.id); router.back(); } },
    ]);
  };

  const handleSaveNotes = () => {
    updateTask(task.id, { notes: editNotes.trim() || undefined });
  };

  const handleMove = () => {
    if (!moveDate.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert("Invalid date format. Use YYYY-MM-DD"); return; }
    moveTask(task.id, moveDate);
    setShowMoveModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>Task Detail</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Feather name="trash-2" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.taskHeader, { borderLeftColor: priorityColor }]}>
          <Text style={[styles.taskTitle, { color: textColor }]}>{task.title}</Text>
          <View style={styles.taskMeta}>
            <View style={[styles.metaChip, { backgroundColor: priorityColor + "20" }]}>
              <Text style={[styles.metaChipText, { color: priorityColor }]}>
                {task.priority} priority
              </Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: Colors.tasks + "20" }]}>
              <Text style={[styles.metaChipText, { color: Colors.tasks }]}>
                {task.status.replace("_", " ")}
              </Text>
            </View>
            {task.recurring !== "none" && (
              <View style={[styles.metaChip, { backgroundColor: Colors.info + "20" }]}>
                <Feather name="repeat" size={10} color={Colors.info} />
                <Text style={[styles.metaChipText, { color: Colors.info }]}>{task.recurring}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
          <Feather name="calendar" size={16} color={textSecondary} />
          <Text style={[styles.infoText, { color: textColor }]}>
            {new Date(task.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>

        {category && (
          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <Feather name={category.icon as any} size={16} color={category.color} />
            <Text style={[styles.infoText, { color: textColor }]}>{category.name}</Text>
          </View>
        )}

        {taskTags.length > 0 && (
          <View style={[styles.tagsRow, { borderBottomColor: borderColor }]}>
            {taskTags.map((tag) => (
              <View key={tag.id} style={[styles.tagChip, { backgroundColor: tag.color + "20" }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>#{tag.name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Add notes..."
            placeholderTextColor={textSecondary}
            value={editNotes}
            onChangeText={setEditNotes}
            onBlur={handleSaveNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actions}>
          {task.status !== "done" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => { completeTask(task.id); router.back(); }}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.actionText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {task.status === "done" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.surfaceAlt, borderColor }]}
              onPress={() => updateTask(task.id, { status: "pending", completedAt: undefined })}
            >
              <Feather name="rotate-ccw" size={18} color={textSecondary} />
              <Text style={[styles.actionText, { color: textSecondary }]}>Mark Pending</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.tasks + "20", borderColor: Colors.tasks + "30" }]}
            onPress={() => { setMoveDate(task.date); setShowMoveModal(true); }}
          >
            <Feather name="move" size={18} color={Colors.tasks} />
            <Text style={[styles.actionText, { color: Colors.tasks }]}>Move to Date</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showMoveModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: cardBg }]}>
            <Text style={[styles.dialogTitle, { color: textColor }]}>Move Task</Text>
            <Text style={[styles.dialogSub, { color: textSecondary }]}>Enter new date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.dialogInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
              value={moveDate}
              onChangeText={setMoveDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={textSecondary}
              autoFocus
            />
            <View style={styles.quickMoves}>
              {[-1, 1, 7].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.quickBtn, { borderColor }]}
                  onPress={() => setMoveDate(addDays(task.date, d))}
                >
                  <Text style={[styles.quickBtnText, { color: textSecondary }]}>
                    {d === -1 ? "Yesterday" : d === 1 ? "Tomorrow" : "+1 Week"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setShowMoveModal(false)} style={[styles.dialogBtn, { borderColor }]}>
                <Text style={[styles.dialogBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMove} style={[styles.dialogBtn, { backgroundColor: Colors.tasks, borderColor: Colors.tasks }]}>
                <Text style={[styles.dialogBtnText, { color: "#fff" }]}>Move</Text>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", flex: 1, marginHorizontal: 12 },
  scrollContent: { padding: 16 },
  taskHeader: { borderLeftWidth: 4, paddingLeft: 12, marginBottom: 20 },
  taskTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 10, lineHeight: 28 },
  taskMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  metaChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, borderBottomWidth: 1 },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 12, borderBottomWidth: 1 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  notesInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 100 },
  actions: { marginTop: 24, gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  actionText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  dialog: { width: "85%", borderRadius: 16, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  dialogSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dialogInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  quickMoves: { flexDirection: "row", gap: 8 },
  quickBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  quickBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  dialogActions: { flexDirection: "row", gap: 10 },
  dialogBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  dialogBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
