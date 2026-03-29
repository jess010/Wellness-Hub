import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { Task, useTasks } from "@/context/TaskContext";

const EXAMPLE_CSV = `Title,Date,Priority,Category,Notes,Recurring
Weekly Review,2026-03-30,high,Work,Review goals and KPIs,weekly
Grocery Shopping,2026-03-31,medium,Home,,none
Morning Walk,2026-04-01,low,Health,30 min walk,daily
Call Doctor,2026-04-02,high,Health,Schedule annual checkup,none`;

export default function ImportTasksScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { importTasks, categories } = useTasks();

  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<Omit<Task, "id" | "createdAt">[]>([]);
  const [error, setError] = useState("");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const parseCsv = (text: string) => {
    setError("");
    try {
      const lines = text.trim().split("\n").filter((l) => l.trim());
      if (lines.length < 2) { setError("Need at least a header row and one data row"); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const titleIdx = headers.indexOf("title");
      const dateIdx = headers.indexOf("date");
      const priorityIdx = headers.indexOf("priority");
      const categoryIdx = headers.indexOf("category");
      const notesIdx = headers.indexOf("notes");
      const recurringIdx = headers.indexOf("recurring");

      if (titleIdx === -1) { setError("CSV must have a 'Title' column"); return; }

      const today = new Date().toISOString().split("T")[0];
      const parsed: Omit<Task, "id" | "createdAt">[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const catName = categoryIdx >= 0 ? cols[categoryIdx] : "";
        const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        return {
          title: cols[titleIdx] ?? "Untitled",
          date: dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : today,
          priority: (["low", "medium", "high"].includes(cols[priorityIdx]) ? cols[priorityIdx] : "medium") as Task["priority"],
          categoryId: cat?.id,
          notes: notesIdx >= 0 && cols[notesIdx] ? cols[notesIdx] : undefined,
          recurring: (["none", "daily", "weekly", "monthly"].includes(cols[recurringIdx]) ? cols[recurringIdx] : "none") as Task["recurring"],
          status: "pending",
          tagIds: [],
        };
      });
      setPreview(parsed);
    } catch (e) {
      setError("Failed to parse CSV. Please check the format.");
    }
  };

  const handleImport = () => {
    if (preview.length === 0) { Alert.alert("Nothing to import"); return; }
    importTasks(preview);
    Alert.alert("Imported!", `${preview.length} tasks added successfully.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Import Tasks</Text>
        <TouchableOpacity onPress={handleImport} disabled={preview.length === 0}>
          <Text style={[styles.importBtn, { color: preview.length > 0 ? Colors.tasks : Colors.textLight }]}>
            Import {preview.length > 0 ? `(${preview.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: Colors.tasks + "10", borderColor: Colors.tasks + "30" }]}>
          <Feather name="info" size={16} color={Colors.tasks} />
          <Text style={[styles.infoText, { color: Colors.tasks }]}>
            Paste CSV data with columns: Title, Date (YYYY-MM-DD), Priority, Category, Notes, Recurring
          </Text>
        </View>

        <Text style={[styles.label, { color: textSecondary }]}>CSV Data</Text>
        <TextInput
          style={[styles.csvInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
          placeholder="Paste your CSV data here..."
          placeholderTextColor={textSecondary}
          value={csvText}
          onChangeText={setCsvText}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.exampleBtn, { borderColor }]}
            onPress={() => { setCsvText(EXAMPLE_CSV); setPreview([]); }}
          >
            <Feather name="file-text" size={16} color={textSecondary} />
            <Text style={[styles.exampleBtnText, { color: textSecondary }]}>Load Example</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.parseBtn, { backgroundColor: Colors.tasks }]}
            onPress={() => parseCsv(csvText)}
          >
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.parseBtnText}>Parse</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: Colors.error + "15" }]}>
            <Feather name="alert-circle" size={16} color={Colors.error} />
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {preview.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={[styles.previewTitle, { color: textColor }]}>
              Preview ({preview.length} tasks)
            </Text>
            {preview.map((t, i) => (
              <View key={i} style={[styles.previewRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.priorityDot, { backgroundColor: t.priority === "high" ? Colors.error : t.priority === "medium" ? Colors.warning : Colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewTitle2, { color: textColor }]}>{t.title}</Text>
                  <Text style={[styles.previewMeta, { color: textSecondary }]}>
                    {t.date} · {t.priority} · {t.recurring !== "none" ? t.recurring : "one-time"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.formatCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.formatTitle, { color: textColor }]}>CSV Format</Text>
          <Text style={[styles.formatCode, { color: textSecondary, backgroundColor: inputBg }]}>
            {EXAMPLE_CSV}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  importBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16, gap: 16 },
  infoCard: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  csvInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13, fontFamily: "Inter_400Regular", minHeight: 160 },
  buttonRow: { flexDirection: "row", gap: 10 },
  exampleBtn: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, borderWidth: 1 },
  exampleBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  parseBtn: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10 },
  parseBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 10, alignItems: "flex-start" },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  previewSection: { gap: 8 },
  previewTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  previewTitle2: { fontSize: 14, fontFamily: "Inter_500Medium" },
  previewMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  formatCard: { borderRadius: 12, padding: 14, borderWidth: 1 },
  formatTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  formatCode: { fontSize: 11, fontFamily: "Inter_400Regular", padding: 10, borderRadius: 8, lineHeight: 18 },
});
