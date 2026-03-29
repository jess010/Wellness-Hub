import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ExerciseProvider } from "@/context/ExerciseContext";
import { FoodProvider } from "@/context/FoodContext";
import { TaskProvider } from "@/context/TaskContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="food/log" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="food/database" options={{ headerShown: false }} />
      <Stack.Screen name="food/mealplan" options={{ headerShown: false }} />
      <Stack.Screen name="food/meal-plan-detail" options={{ headerShown: false }} />
      <Stack.Screen name="food/saved-meals" options={{ headerShown: false }} />
      <Stack.Screen name="food/shopping" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/add" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="tasks/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/import" options={{ headerShown: false }} />
      <Stack.Screen name="exercise/log" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="exercise/plans" options={{ headerShown: false }} />
      <Stack.Screen name="exercise/plan-detail" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <FoodProvider>
            <TaskProvider>
              <ExerciseProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </ExerciseProvider>
            </TaskProvider>
          </FoodProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
