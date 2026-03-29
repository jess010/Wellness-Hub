import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ExerciseType = "cardio" | "strength" | "flexibility" | "sports" | "other";
export type IntensityLevel = "light" | "moderate" | "vigorous";

export interface ExerciseTemplate {
  id: string;
  name: string;
  type: ExerciseType;
  description?: string;
  defaultDuration?: number;
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number;
  pointsEarned?: number;
  muscleGroups?: string[];
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
}

export interface ExerciseLogEntry {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  type: ExerciseType;
  sets?: ExerciseSet[];
  totalDuration?: number;
  distance?: number;
  intensity: IntensityLevel;
  caloriesBurned?: number;
  pointsEarned?: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    order: number;
    targetSets?: number;
    targetReps?: number;
    targetDuration?: number;
    notes?: string;
  }[];
  scheduledDays?: string[];
  createdAt: string;
}

const STORAGE_KEYS = {
  EXERCISE_TEMPLATES: "@health_exercise_templates",
  EXERCISE_LOG: "@health_exercise_log",
  WORKOUT_PLANS: "@health_workout_plans",
};

const DEFAULT_EXERCISES: Omit<ExerciseTemplate, "id">[] = [
  { name: "Running", type: "cardio", description: "Outdoor or treadmill running", defaultDuration: 30, pointsEarned: 4, muscleGroups: ["legs", "core"] },
  { name: "Walking", type: "cardio", description: "Brisk walk", defaultDuration: 30, pointsEarned: 2, muscleGroups: ["legs"] },
  { name: "Cycling", type: "cardio", description: "Bike ride or stationary bike", defaultDuration: 45, pointsEarned: 4, muscleGroups: ["legs"] },
  { name: "Swimming", type: "cardio", description: "Laps in pool", defaultDuration: 30, pointsEarned: 5, muscleGroups: ["full body"] },
  { name: "Push-ups", type: "strength", defaultSets: 3, defaultReps: 15, pointsEarned: 2, muscleGroups: ["chest", "arms", "core"] },
  { name: "Squats", type: "strength", defaultSets: 3, defaultReps: 15, pointsEarned: 2, muscleGroups: ["legs", "glutes"] },
  { name: "Pull-ups", type: "strength", defaultSets: 3, defaultReps: 8, pointsEarned: 3, muscleGroups: ["back", "arms"] },
  { name: "Plank", type: "strength", defaultSets: 3, defaultDuration: 60, pointsEarned: 2, muscleGroups: ["core"] },
  { name: "Yoga", type: "flexibility", description: "Yoga session", defaultDuration: 45, pointsEarned: 2, muscleGroups: ["full body"] },
  { name: "Stretching", type: "flexibility", defaultDuration: 15, pointsEarned: 1, muscleGroups: ["full body"] },
  { name: "HIIT", type: "cardio", defaultDuration: 20, pointsEarned: 5, muscleGroups: ["full body"] },
  { name: "Weight Training", type: "strength", defaultDuration: 45, defaultSets: 4, defaultReps: 10, pointsEarned: 4, muscleGroups: ["varies"] },
];

interface ExerciseContextType {
  exerciseTemplates: ExerciseTemplate[];
  exerciseLog: ExerciseLogEntry[];
  workoutPlans: WorkoutPlan[];
  addExerciseTemplate: (template: Omit<ExerciseTemplate, "id">) => void;
  updateExerciseTemplate: (id: string, updates: Partial<ExerciseTemplate>) => void;
  deleteExerciseTemplate: (id: string) => void;
  logExercise: (entry: Omit<ExerciseLogEntry, "id">) => void;
  updateExerciseLog: (id: string, updates: Partial<ExerciseLogEntry>) => void;
  removeExerciseLog: (id: string) => void;
  getTodayExercises: () => ExerciseLogEntry[];
  getExercisesForDate: (date: string) => ExerciseLogEntry[];
  getTodayCalories: () => number;
  getTodayPoints: () => number;
  createWorkoutPlan: (plan: Omit<WorkoutPlan, "id" | "createdAt">) => void;
  updateWorkoutPlan: (id: string, updates: Partial<WorkoutPlan>) => void;
  deleteWorkoutPlan: (id: string) => void;
}

const ExerciseContext = createContext<ExerciseContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [exerciseLog, setExerciseLog] = useState<ExerciseLogEntry[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesStr, logStr, plansStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_TEMPLATES),
        AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_LOG),
        AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PLANS),
      ]);
      if (templatesStr) {
        setExerciseTemplates(JSON.parse(templatesStr));
      } else {
        const defaults = DEFAULT_EXERCISES.map((e) => ({ ...e, id: generateId() }));
        setExerciseTemplates(defaults);
        await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_TEMPLATES, JSON.stringify(defaults));
      }
      if (logStr) setExerciseLog(JSON.parse(logStr));
      if (plansStr) setWorkoutPlans(JSON.parse(plansStr));
    } catch (e) {
      console.error("Error loading exercise data:", e);
    }
  };

  const saveTemplates = useCallback(async (t: ExerciseTemplate[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_TEMPLATES, JSON.stringify(t));
  }, []);

  const saveLog = useCallback(async (l: ExerciseLogEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOG, JSON.stringify(l));
  }, []);

  const savePlans = useCallback(async (p: WorkoutPlan[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(p));
  }, []);

  const addExerciseTemplate = useCallback((template: Omit<ExerciseTemplate, "id">) => {
    const newT = { ...template, id: generateId() };
    setExerciseTemplates((prev) => {
      const updated = [...prev, newT];
      saveTemplates(updated);
      return updated;
    });
  }, [saveTemplates]);

  const updateExerciseTemplate = useCallback((id: string, updates: Partial<ExerciseTemplate>) => {
    setExerciseTemplates((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveTemplates(updated);
      return updated;
    });
  }, [saveTemplates]);

  const deleteExerciseTemplate = useCallback((id: string) => {
    setExerciseTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTemplates(updated);
      return updated;
    });
  }, [saveTemplates]);

  const logExercise = useCallback((entry: Omit<ExerciseLogEntry, "id">) => {
    const newEntry = { ...entry, id: generateId() };
    setExerciseLog((prev) => {
      const updated = [...prev, newEntry];
      saveLog(updated);
      return updated;
    });
  }, [saveLog]);

  const updateExerciseLog = useCallback((id: string, updates: Partial<ExerciseLogEntry>) => {
    setExerciseLog((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      saveLog(updated);
      return updated;
    });
  }, [saveLog]);

  const removeExerciseLog = useCallback((id: string) => {
    setExerciseLog((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveLog(updated);
      return updated;
    });
  }, [saveLog]);

  const getTodayExercises = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return exerciseLog.filter((e) => e.date === today);
  }, [exerciseLog]);

  const getExercisesForDate = useCallback((date: string) => {
    return exerciseLog.filter((e) => e.date === date);
  }, [exerciseLog]);

  const getTodayCalories = useCallback(() => {
    return getTodayExercises().reduce((sum, e) => sum + (e.caloriesBurned ?? 0), 0);
  }, [getTodayExercises]);

  const getTodayPoints = useCallback(() => {
    return getTodayExercises().reduce((sum, e) => sum + (e.pointsEarned ?? 0), 0);
  }, [getTodayExercises]);

  const createWorkoutPlan = useCallback((plan: Omit<WorkoutPlan, "id" | "createdAt">) => {
    const newPlan = { ...plan, id: generateId(), createdAt: new Date().toISOString() };
    setWorkoutPlans((prev) => {
      const updated = [...prev, newPlan];
      savePlans(updated);
      return updated;
    });
  }, [savePlans]);

  const updateWorkoutPlan = useCallback((id: string, updates: Partial<WorkoutPlan>) => {
    setWorkoutPlans((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      savePlans(updated);
      return updated;
    });
  }, [savePlans]);

  const deleteWorkoutPlan = useCallback((id: string) => {
    setWorkoutPlans((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePlans(updated);
      return updated;
    });
  }, [savePlans]);

  return (
    <ExerciseContext.Provider
      value={{
        exerciseTemplates,
        exerciseLog,
        workoutPlans,
        addExerciseTemplate,
        updateExerciseTemplate,
        deleteExerciseTemplate,
        logExercise,
        updateExerciseLog,
        removeExerciseLog,
        getTodayExercises,
        getExercisesForDate,
        getTodayCalories,
        getTodayPoints,
        createWorkoutPlan,
        updateWorkoutPlan,
        deleteWorkoutPlan,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error("useExercise must be used within ExerciseProvider");
  return ctx;
}
