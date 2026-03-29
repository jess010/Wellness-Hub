# HealthTrack — Personal Health Mobile App

## Overview
An all-in-one personal health tracking Expo (React Native) mobile app for Android with three core features: food/nutrition tracking (Weight Watchers-style points), task management, and exercise planning/logging.

## Architecture
- **Framework**: Expo SDK 54, expo-router (file-based routing)
- **Storage**: AsyncStorage (local device storage, no backend)
- **Fonts**: Inter (400/500/600/700) via @expo-google-fonts/inter
- **Icons**: @expo/vector-icons (Feather)
- **State**: React Context + AsyncStorage

## Project Structure
```
artifacts/health-app/
├── app/
│   ├── _layout.tsx         # Root layout with all providers
│   ├── (tabs)/             # 4-tab navigation
│   │   ├── _layout.tsx     # Tab bar config
│   │   ├── index.tsx       # Dashboard
│   │   ├── food.tsx        # Food Tracker
│   │   ├── tasks.tsx       # Tasks
│   │   └── exercise.tsx    # Exercise
│   ├── food/               # Food sub-screens
│   │   ├── log.tsx         # Log meals
│   │   ├── database.tsx    # Food database CRUD
│   │   ├── shopping.tsx    # Shopping list
│   │   └── mealplan.tsx    # Meal plans
│   ├── tasks/              # Task sub-screens
│   │   ├── add.tsx         # Add task (recurring support)
│   │   ├── [id].tsx        # Task detail + move/edit
│   │   └── import.tsx      # CSV batch import
│   └── exercise/           # Exercise sub-screens
│       ├── log.tsx         # Log exercise (sets/reps)
│       ├── plans.tsx       # Workout plans list
│       └── plan-detail.tsx # Plan exercises management
├── context/
│   ├── FoodContext.tsx      # Food DB, meal log, shopping, meal plans
│   ├── TaskContext.tsx      # Tasks, tags, categories, recurring
│   └── ExerciseContext.tsx  # Templates, log, workout plans
└── constants/
    └── colors.ts            # Design system colors
```

## Features
### Food (Points-based, Weight Watchers style)
- Food database with 12 default items (CRUD + category filter)
- Log meals by type (breakfast/lunch/dinner/snack)
- Daily points budget (default 23) + earned points from exercise
- Shopping list with categories and check-off
- Meal plans creation

### Tasks
- Daily / Weekly / Monthly views with date navigation
- Add tasks: title, notes, date, priority, category, tags, recurring
- Recurring tasks: daily/weekly/monthly with repeat count
- Move task to different date
- Batch CSV import (Title, Date, Priority, Category, Notes, Recurring columns)
- Status: pending / done / in_progress / cancelled

### Exercise
- 12 default exercise templates (cardio, strength, flexibility)
- Log exercise: sets/reps/weight for strength, duration for cardio
- Points earned from exercise add to food budget
- Workout plans with ordered exercises
- Calories burned tracking

## Design System
- Primary: #10B981 (emerald green) — food
- Tasks: #8B5CF6 (purple)
- Exercise: #F97316 (orange)
- Dashboard: #0EA5E9 (blue)
- Dark mode support throughout

## UUID Generation
`Date.now().toString() + Math.random().toString(36).substr(2, 9)` (no uuid package)

## CSV Import Format (Tasks)
```
Title,Date,Priority,Category,Notes,Recurring
Weekly Review,2026-03-30,high,Work,Review goals,weekly
```
