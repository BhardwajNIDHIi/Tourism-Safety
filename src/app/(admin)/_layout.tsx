
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#080D1B" },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="agents" />
      <Stack.Screen name="tourists" />
      <Stack.Screen name="remote-areas" />
      <Stack.Screen name="sos-alerts" />
    </Stack>
  );
}
