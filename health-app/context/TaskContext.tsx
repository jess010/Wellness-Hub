import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type RecurringType = "none" | "daily" | "weekly" | "monthly";
export type TaskView = "daily" | "weekly" | "monthly" | "backlog";

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  date: string;
  categoryId?: string;
  tagIds: string[];
  recurring: RecurringType;
  recurringParentId?: string;
  priority: "low" | "medium" | "high";
  completedAt?: string;
  createdAt: string;
}

export const BACKLOG_DATE = "__backlog__";

const STORAGE_KEYS = {
  TASKS: "@health_tasks",
  TAGS: "@health_tags",
  CATEGORIES: "@health_categories",
};

const DEFAULT_TAGS: TaskTag[] = [
  { id: "t1", name: "Health", color: "#10B981" },
  { id: "t2", name: "Work", color: "#0EA5E9" },
  { id: "t3", name: "Personal", color: "#8B5CF6" },
  { id: "t4", name: "Errands", color: "#F59E0B" },
];

const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: "c1", name: "Health", icon: "heart", color: "#10B981" },
  { id: "c2", name: "Work", icon: "briefcase", color: "#0EA5E9" },
  { id: "c3", name: "Home", icon: "home", color: "#F59E0B" },
  { id: "c4", name: "Personal", icon: "user", color: "#8B5CF6" },
  { id: "c5", name: "Shopping", icon: "shopping-cart", color: "#EF4444" },
];

interface TaskContextType {
  tasks: Task[];
  tags: TaskTag[];
  categories: TaskCategory[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  moveTask: (id: string, newDate: string) => void;
  importTasks: (tasks: Omit<Task, "id" | "createdAt">[]) => void;
  getTasksForDate: (date: string) => Task[];
  getTasksForWeek: (startDate: string) => Task[];
  getTasksForMonth: (year: number, month: number) => Task[];
  getBacklogTasks: () => Task[];
  scheduleFromBacklog: (id: string, date: string) => void;
  addTag: (tag: Omit<TaskTag, "id">) => void;
  deleteTag: (id: string) => void;
  addCategory: (cat: Omit<TaskCategory, "id">) => void;
  deleteCategory: (id: string) => void;
  addRecurringTask: (task: Omit<Task, "id" | "createdAt">, count: number) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TaskTag[]>(DEFAULT_TAGS);
  const [categories, setCategories] = useState<TaskCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tasksStr, tagsStr, catsStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.TAGS),
        AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
      ]);
      if (tasksStr) setTasks(JSON.parse(tasksStr));
      if (tagsStr) setTags(JSON.parse(tagsStr));
      if (catsStr) setCategories(JSON.parse(catsStr));
    } catch (e) {
      console.error("Error loading task data:", e);
    }
  };

  const saveTasks = useCallback(async (t: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(t));
  }, []);
  const saveTags = useCallback(async (t: TaskTag[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(t));
  }, []);
  const saveCategories = useCallback(async (c: TaskCategory[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(c));
  }, []);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString() };
    setTasks((prev) => { const updated = [...prev, newTask]; saveTasks(updated); return updated; });
  }, [saveTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => { const updated = prev.map((t) => t.id === id ? { ...t, ...updates } : t); saveTasks(updated); return updated; });
  }, [saveTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => { const updated = prev.filter((t) => t.id !== id); saveTasks(updated); return updated; });
  }, [saveTasks]);

  const completeTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, status: "done" as TaskStatus, completedAt: new Date().toISOString() } : t
      );
      saveTasks(updated);
      return updated;
    });
  }, [saveTasks]);

  const moveTask = useCallback((id: string, newDate: string) => {
    setTasks((prev) => { const updated = prev.map((t) => t.id === id ? { ...t, date: newDate } : t); saveTasks(updated); return updated; });
  }, [saveTasks]);

  const importTasks = useCallback((importedTasks: Omit<Task, "id" | "createdAt">[]) => {
    const newTasks = importedTasks.map((t) => ({ ...t, id: generateId(), createdAt: new Date().toISOString() }));
    setTasks((prev) => { const updated = [...prev, ...newTasks]; saveTasks(updated); return updated; });
  }, [saveTasks]);

  const getTasksForDate = useCallback((date: string) => tasks.filter((t) => t.date === date), [tasks]);

  const getTasksForWeek = useCallback((startDate: string) => {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    return tasks.filter((t) => t.date !== BACKLOG_DATE && dates.includes(t.date));
  }, [tasks]);

  const getTasksForMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return tasks.filter((t) => t.date !== BACKLOG_DATE && t.date.startsWith(prefix));
  }, [tasks]);

  const getBacklogTasks = useCallback(() => tasks.filter((t) => t.date === BACKLOG_DATE), [tasks]);

  const scheduleFromBacklog = useCallback((id: string, date: string) => {
    setTasks((prev) => { const updated = prev.map((t) => t.id === id ? { ...t, date } : t); saveTasks(updated); return updated; });
  }, [saveTasks]);

  const addTag = useCallback((tag: Omit<TaskTag, "id">) => {
    const newTag = { ...tag, id: generateId() };
    setTags((prev) => { const updated = [...prev, newTag]; saveTags(updated); return updated; });
  }, [saveTags]);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => { const updated = prev.filter((t) => t.id !== id); saveTags(updated); return updated; });
  }, [saveTags]);

  const addCategory = useCallback((cat: Omit<TaskCategory, "id">) => {
    const newCat = { ...cat, id: generateId() };
    setCategories((prev) => { const updated = [...prev, newCat]; saveCategories(updated); return updated; });
  }, [saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => { const updated = prev.filter((c) => c.id !== id); saveCategories(updated); return updated; });
  }, [saveCategories]);

  const addRecurringTask = useCallback((task: Omit<Task, "id" | "createdAt">, count: number) => {
    const parentId = generateId();
    const newTasks: Task[] = Array.from({ length: count }, (_, i) => {
      let date = task.date;
      if (date !== BACKLOG_DATE) {
        if (task.recurring === "daily") date = addDays(task.date, i);
        else if (task.recurring === "weekly") date = addDays(task.date, i * 7);
        else if (task.recurring === "monthly") {
          const d = new Date(task.date);
          d.setMonth(d.getMonth() + i);
          date = d.toISOString().split("T")[0];
        }
      }
      return {
        ...task,
        id: i === 0 ? parentId : generateId(),
        date,
        recurringParentId: i === 0 ? undefined : parentId,
        createdAt: new Date().toISOString(),
      };
    });
    setTasks((prev) => { const updated = [...prev, ...newTasks]; saveTasks(updated); return updated; });
  }, [saveTasks]);

  return (
    <TaskContext.Provider value={{
      tasks, tags, categories,
      addTask, updateTask, deleteTask, completeTask, moveTask, importTasks,
      getTasksForDate, getTasksForWeek, getTasksForMonth,
      getBacklogTasks, scheduleFromBacklog,
      addTag, deleteTag, addCategory, deleteCategory, addRecurringTask,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}
