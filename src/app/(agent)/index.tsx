
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

const STORAGE_KEY = "agentCheckInRecords";

type CheckInRecord = {
  id: string;
  touristName: string;
  phone: string;
  hotelName: string;
  status: string;
  createdAt: string;
};

export default function AgentDashboard() {
  const [records, setRecords] = useState<CheckInRecord[]>([]);

  const loadRecords = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setRecords(stored ? JSON.parse(stored) : []);
    } catch {
      setRecords([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>SAFE TOURISM / PARTNER</Text>
            <Text style={styles.title}>Agent Dashboard</Text>
            <Text style={styles.subtitle}>
              Manage tourist check-ins securely.
            </Text>
          </View>

          <View style={styles.shield}>
            <Ionicons
              name="shield-checkmark"
              size={29}
              color="#00D4FF"
            />
          </View>
        </View>

        <View style={styles.verified}>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#47D7AC"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.verifiedTitle}>
              Agent Workspace
            </Text>
            <Text style={styles.verifiedText}>
              Access is granted after backend verification.
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="people-outline"
              size={25}
              color="#00D4FF"
            />
            <Text style={styles.statNumber}>{records.length}</Text>
            <Text style={styles.statLabel}>Total Check-ins</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="calendar-outline"
              size={25}
              color="#B3A5FF"
            />
            <Text style={styles.statNumber}>
              {
                records.filter(
                  (r) =>
                    new Date(r.createdAt).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.push("/(agent)/check-in")}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="person-add" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.primaryTitle}>Add Tourist Check-in</Text>
            <Text style={styles.primarySubtitle}>
              Register a guest at your hotel
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.push("/(agent)/records")}
        >
          <Ionicons
            name="document-text-outline"
            size={24}
            color="#00D4FF"
          />
          <View style={styles.actionText}>
            <Text style={styles.secondaryTitle}>View Check-in Records</Text>
            <Text style={styles.secondarySubtitle}>
              Review previously saved entries
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={21}
            color="#8B95AA"
          />
        </TouchableOpacity>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#F4BD67"
          />
          <Text style={styles.noticeText}>
            Demo mode: records are stored on this device only.
            Connect MongoDB through your backend to share updates
            across phones.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Ionicons name="log-out-outline" size={19} color="#AAB6CC" />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#080D1B" },
  container: { padding: 22, paddingTop: 35, paddingBottom: 40 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 9,
  },
  subtitle: { color: "#9BA6BB", fontSize: 13, marginTop: 7 },
  shield: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#11243A",
    borderWidth: 1,
    borderColor: "#25425A",
    alignItems: "center",
    justifyContent: "center",
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#10251F",
    borderWidth: 1,
    borderColor: "#245342",
    marginBottom: 22,
  },
  verifiedTitle: { color: "#C8F7E4", fontWeight: "700", fontSize: 13 },
  verifiedText: {
    color: "#A5C7B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  statsRow: { flexDirection: "row", gap: 13, marginBottom: 30 },
  statCard: {
    flex: 1,
    backgroundColor: "#10182A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#243149",
    padding: 17,
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 12,
  },
  statLabel: { color: "#9BA6BB", fontSize: 11, marginTop: 5 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#5148CB",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#7067E5",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1 },
  primaryTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  primarySubtitle: { color: "#D6D4FF", fontSize: 11, marginTop: 5 },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#27354B",
    padding: 17,
    borderRadius: 16,
  },
  secondaryTitle: {
    color: "#EAF0FA",
    fontSize: 13,
    fontWeight: "700",
  },
  secondarySubtitle: {
    color: "#9BA6BB",
    fontSize: 11,
    marginTop: 5,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: "#211D17",
    borderRadius: 13,
    marginTop: 24,
  },
  noticeText: {
    flex: 1,
    color: "#D4C6AF",
    fontSize: 11,
    lineHeight: 18,
  },
  backButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 27,
    padding: 12,
  },
  backText: { color: "#AAB6CC", fontSize: 13 },
});