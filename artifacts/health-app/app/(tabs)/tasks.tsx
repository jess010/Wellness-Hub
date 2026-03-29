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
import { BACKLOG_DATE, Task, useTasks } from "@/context/TaskContext";

type ViewMode = "daily" | "weekly" | "monthly" | "backlog";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function TaskCard({
  task, onComplete, onPress, showDate = false,
  onSchedule,
}: {
  task: Task;
  onComplete: () => void;
  onPress: () => void;
  showDate?: boolean;
  onSchedule?: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const isDone = task.status === "done";
  const priorityColor = task.priority === "high" ? Colors.error : task.priority === "medium" ? Colors.warning : Colors.textLight;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.taskCard, { borderLeftColor: priorityColor, borderColor, backgroundColor: cardBg }]}
    >
      <TouchableOpacity
        onPress={onComplete}
        style={[
          styles.checkbox,
          { borderColor: isDone ? Colors.primary : borderColor, backgroundColor: isDone ? Colors.primary : "transparent" },
        ]}
      >
        {isDone && <Feather name="check" size={12} color="#fff" />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, { color: textColor }, isDone && styles.strikethrough]} numberOfLines={2}>
          {task.title}
        </Text>
        {showDate && task.date !== BACKLOG_DATE && (
          <Text style={[styles.taskDate, { color: textSecondary }]}>{formatDate(task.date)}</Text>
        )}
        {task.notes ? (
          <Text style={[styles.taskNotes, { color: textSecondary }]} numberOfLines={1}>{task.notes}</Text>
        ) : null}
      </View>
      {task.date === BACKLOG_DATE && onSchedule ? (
        <TouchableOpacity
          onPress={onSchedule}
          style={[styles.scheduleBtn, { backgroundColor: Colors.tasks + "20" }]}
        >
          <Feather name="calendar" size={13} color={Colors.tasks} />
          <Text style={[styles.scheduleBtnText, { color: Colors.tasks }]}>Schedule</Text>
        </TouchableOpacity>
      ) : (
        <>
          {task.recurring !== "none" && <Feather name="repeat" size={13} color={textSecondary} />}
          <Feather name="chevron-right" size={16} color={textSecondary} />
        </>
      )}
    </TouchableOpacity>
  );
}

function ScheduleModal({
  visible, onClose, onSchedule,
}: {
  visible: boolean;
  onClose: () => void;
  onSchedule: (date: string) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const quickDates = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "This week", date: addDays(today, 2) },
    { label: "Next week", date: addDays(today, 7) },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: cardBg }]}>
          <Text style={[styles.dialogTitle, { color: textColor }]}>Schedule Task</Text>
          <View style={styles.quickDates}>
            {quickDates.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickDateBtn, { borderColor }]}
                onPress={() => setDate(q.date)}
              >
                <Text style={[styles.quickDateText, { color: date === q.date ? Colors.tasks : textSecondary }]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.dialogInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={textSecondary}
          />
          <View style={styles.dialogActions}>
            <TouchableOpacity onPress={onClose} style={[styles.dialogBtn, { borderColor }]}>
              <Text style={[styles.dialogBtnText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { onSchedule(date); onClose(); }}
              style={[styles.dialogBtn, { backgroundColor: Colors.tasks, borderColor: Colors.tasks }]}
            >
              <Text style={[styles.dialogBtnText, { color: "#fff" }]}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getTasksForDate, getTasksForWeek, getTasksForMonth, getBacklogTasks, completeTask, scheduleFromBacklog } = useTasks();

  const today = new Date().toISOString().split("T")[0];
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState(today);
  const [schedulingTask, setSchedulingTask] = useState<string | null>(null);

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const surfaceAlt = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const weekStart = getWeekStart(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedMonth = new Date(selectedDate);

  const dailyTasks = getTasksForDate(selectedDate);
  const weeklyTasks = getTasksForWeek(weekStart);
  const monthlyTasks = getTasksForMonth(selectedMonth.getFullYear(), selectedMonth.getMonth());
  const backlogTasks = getBacklogTasks();

  const tasks =
    viewMode === "daily" ? dailyTasks
    : viewMode === "weekly" ? weeklyTasks
    : viewMode === "monthly" ? monthlyTasks
    : backlogTasks;

  const pendingCount = tasks.filter((t) => t.status !== "done").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const VIEW_MODES: { key: ViewMode; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "backlog", label: "Backlog" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Tasks</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/tasks/import")}>
            <Feather name="upload" size={20} color={Colors.tasks} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/tasks/add")}>
            <Feather name="plus" size={22} color={Colors.tasks} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.viewToggleScroll, { backgroundColor: surfaceAlt }]} contentContainerStyle={styles.viewToggleContent}>
        {VIEW_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.toggleBtn,
              viewMode === mode.key && { backgroundColor: cardBg, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
              mode.key === "backlog" && viewMode !== "backlog" && backlogTasks.length > 0 && styles.backlogBadgeWrap,
            ]}
            onPress={() => setViewMode(mode.key)}
          >
            <Text style={[styles.toggleText, { color: viewMode === mode.key ? Colors.tasks : textSecondary }]}>
              {mode.label}
            </Text>
            {mode.key === "backlog" && backlogTasks.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{backlogTasks.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {viewMode === "daily" && (
        <View style={[styles.dateNav, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
            <Feather name="chevron-left" size={22} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(today)}>
            <Text style={[styles.dateText, { color: textColor }]}>
              {selectedDate === today ? "Today" : formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
            <Feather name="chevron-right" size={22} color={textColor} />
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "weekly" && (
        <View style={[styles.weekNav, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -7))}>
            <Feather name="chevron-left" size={22} color={textColor} />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekDays}>
            {weekDays.map((d) => {
              const dayTasks = getTasksForDate(d);
              const hasPending = dayTasks.some((t) => t.status !== "done");
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, d === selectedDate && { backgroundColor: Colors.tasks }]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dayText, { color: d === selectedDate ? "#fff" : textSecondary }]}>
                    {formatShortDate(d)}
                  </Text>
                  {hasPending && d !== selectedDate && (
                    <View style={[styles.dayDot, { backgroundColor: Colors.tasks }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 7))}>
            <Feather name="chevron-right" size={22} color={textColor} />
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "monthly" && (
        <View style={[styles.dateNav, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d.toISOString().split("T")[0]); }}>
            <Feather name="chevron-left" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.dateText, { color: textColor }]}>
            {new Date(selectedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d.toISOString().split("T")[0]); }}>
            <Feather name="chevron-right" size={22} color={textColor} />
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "backlog" && (
        <View style={[styles.backlogHeader, { backgroundColor: Colors.tasks + "10", borderBottomColor: borderColor }]}>
          <Feather name="inbox" size={15} color={Colors.tasks} />
          <Text style={[styles.backlogHeaderText, { color: Colors.tasks }]}>
            {backlogTasks.length} items — tap Schedule to assign to a day
          </Text>
        </View>
      )}

      {viewMode !== "backlog" && (
        <View style={[styles.summaryBar, { backgroundColor: Colors.tasks + "08" }]}>
          <Text style={[styles.summaryText, { color: Colors.tasks }]}>
            {pendingCount} pending · {doneCount} done
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather
              name={viewMode === "backlog" ? "inbox" : "check-circle"}
              size={48}
              color={Colors.border}
            />
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>
              {viewMode === "backlog" ? "Backlog is empty" : "No tasks"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
              {viewMode === "backlog"
                ? 'Add tasks with "Backlog" as the date'
                : "Tap + to add a new task"}
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showDate={viewMode === "weekly" || viewMode === "monthly"}
              onComplete={() => completeTask(task.id)}
              onPress={() => router.push({ pathname: "/tasks/[id]", params: { id: task.id } })}
              onSchedule={viewMode === "backlog" ? () => setSchedulingTask(task.id) : undefined}
            />
          ))
        )}

        {viewMode === "backlog" && (
          <TouchableOpacity
            style={[styles.addBacklogBtn, { borderColor: Colors.tasks + "50" }]}
            onPress={() => router.push({ pathname: "/tasks/add", params: { backlog: "1" } })}
          >
            <Feather name="plus" size={16} color={Colors.tasks} />
            <Text style={[styles.addBacklogText, { color: Colors.tasks }]}>Add to backlog</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ScheduleModal
        visible={!!schedulingTask}
        onClose={() => setSchedulingTask(null)}
        onSchedule={(date) => {
          if (schedulingTask) scheduleFromBacklog(schedulingTask, date);
          setSchedulingTask(null);
        }}
      />
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
  viewToggleScroll: { maxHeight: 46 },
  viewToggleContent: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 4, gap: 4, alignItems: "center" },
  toggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  toggleText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  backlogBadgeWrap: {},
  badge: { backgroundColor: Colors.tasks, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dateText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  weekDays: { flexDirection: "row", gap: 4, paddingHorizontal: 4 },
  dayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: "center" },
  dayText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  backlogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backlogHeaderText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryBar: { paddingHorizontal: 16, paddingVertical: 6 },
  summaryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  scrollContent: { padding: 12 },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  taskDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  taskNotes: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  strikethrough: { textDecorationLine: "line-through", opacity: 0.5 },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  scheduleBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
  addBacklogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    marginTop: 8,
  },
  addBacklogText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  dialog: { width: "85%", borderRadius: 16, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  quickDates: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickDateBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  quickDateText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dialogInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dialogActions: { flexDirection: "row", gap: 10 },
  dialogBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  dialogBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
