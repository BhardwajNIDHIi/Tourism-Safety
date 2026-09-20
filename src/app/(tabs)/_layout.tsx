import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Label hide
        tabBarShowLabel: false,

        // Floating-style bottom bar
        tabBarStyle: {
          position: "absolute",
          bottom: 18,
          left: 25,
          right: 25,
          height: 70,

          backgroundColor: "#10172A",

          borderRadius: 25,
          borderWidth: 1,
          borderColor: "#1C253D",

          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: {
            width: 0,
            height: 5,
          },
        },
      }}
    >
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",

          tabBarIcon: () => (
            <View style={styles.sosContainer}>
              <View style={styles.sosButton}>
                <Ionicons
                  name="warning"
                  size={28}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.sosText}>
                SOS
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sosContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },

  sosButton: {
    width: 62,
    height: 62,
    borderRadius: 31,

    backgroundColor: "#FF5368",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 5,
    borderColor: "#070B18",

    shadowColor: "#FF5368",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 15,
  },

  sosText: {
    color: "#FF5368",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 1,
  },
});