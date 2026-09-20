import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";

export default function DrawerLayout() {
  return (
    <View style={styles.container}>
      {/* DRAWER NAVIGATION */}
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0B1220",
          },

          headerTintColor: "#fff",

          drawerStyle: {
            backgroundColor: "#0B1220",
          },

          drawerActiveTintColor: "#F2A93B",

          drawerActiveBackgroundColor: "#16233B",

          drawerInactiveTintColor: "#8FA3BF",

          drawerContentContainerStyle: {
            paddingTop: 60,
          },

          drawerItemStyle: {
            marginVertical: 4,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            title: "Home",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="explore"
          options={{
            drawerLabel: "Explore",
            title: "Explore",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="earth" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="emergency"
          options={{
            drawerLabel: "Emergency",
            title: "Emergency",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="alert-circle"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Drawer.Screen
          name="safetytips"
          options={{
            drawerLabel: "Safety Tips",
            title: "Safety Tips",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="shield-checkmark"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Drawer.Screen
          name="safe-checkin"
          options={{
            drawerLabel: "Safe-CheckIn",
            title: "SafeCheckIn",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="people"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Drawer.Screen
          name="packages"
          options={{
            drawerLabel: "Packages",
            title: "Packages",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="briefcase"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Drawer.Screen
          name="setting"
          options={{
            drawerLabel: "Settings",
            title: "Settings",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="settings-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Drawer.Screen
          name="aboutsafetourism"
          options={{
            drawerLabel: "About Safe Tourism",
            title: "About Safe Tourism",
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="information-circle"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Drawer>

      {/* FLOATING SOS BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.sosButton}
        onPress={() => router.push("/(tabs)/sos")}
      >
        <View style={styles.sosInner}>
          <Ionicons
            name="warning"
            size={30}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  sosButton: {
    position: "absolute",
    bottom: 22,
    alignSelf: "center",

    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor: "#070B18",

    alignItems: "center",
    justifyContent: "center",

    elevation: 15,

    shadowColor: "#FF5368",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  sosInner: {
    width: 62,
    height: 62,

    borderRadius: 31,

    backgroundColor: "#FF5368",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 3,
    borderColor: "#FF7181",
  },
});