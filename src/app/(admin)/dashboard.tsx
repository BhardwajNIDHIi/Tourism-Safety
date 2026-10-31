
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API = "http://192.168.1.36:5001/api";

type Stats = {
  totalAgents?: number;
  totalTourists?: number;
  totalHotels?: number;
  activeSOSAlerts?: number;
};

const menu = [
  { title: "Manage Agents", subtitle: "Review agent registrations", icon: "👥", route: "/(admin)/agents" },
  { title: "Manage Tourists", subtitle: "View registered tourists", icon: "🧳", route: "/(admin)/tourists" },
  { title: "Remote Areas", subtitle: "Areas and assigned agents", icon: "📍", route: "/(admin)/remote-areas" },
  { title: "SOS Alerts", subtitle: "Monitor emergency alerts", icon: "🚨", route: "/(admin)/sos-alerts" },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("safeTourismToken");
      if (!token) throw new Error("Admin session nahi mili. Dobara sign in karo.");

      const response = await fetch(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Dashboard data load nahi hua.");
      }

      setStats(data.stats ?? data);
    } catch (e: any) {
      setError(e.message || "Server se connect nahi ho pa raha.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const cards = [
    { title: "Total Agents", value: stats?.totalAgents, icon: "👥" },
    { title: "Total Tourists", value: stats?.totalTourists, icon: "🧳" },
    { title: "Hotels", value: stats?.totalHotels, icon: "🏨" },
    { title: "Active SOS", value: stats?.activeSOSAlerts, icon: "🚨" },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor="#00D4FF" />
      }
    >
      <Text style={styles.eyebrow}>SAFE TOURISM • CONTROL CENTER</Text>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Monitor your tourism safety system.</Text>

      {loading && !stats ? <ActivityIndicator size="large" color="#00D4FF" /> : null}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadDashboard}>
            <Text style={styles.retry}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.section}>System Overview</Text>
      <View style={styles.grid}>
        {cards.map((card) => (
          <View style={styles.statCard} key={card.title}>
            <Text style={styles.icon}>{card.icon}</Text>
            <Text style={styles.statValue}>
              {card.value == null ? "—" : card.value}
            </Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Management</Text>
      {menu.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={styles.menuCard}
          onPress={() => router.push(item.route as any)}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.logout}
        onPress={async () => {
          await AsyncStorage.multiRemove(["safeTourismToken", "safeTourismCurrentUser"]);
          router.replace("/(auth)/sign-in" as any);
        }}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#080D1B" },
  content: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  eyebrow: { color: "#00D4FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", marginTop: 10 },
  subtitle: { color: "#9CA9C5", marginTop: 7, marginBottom: 25 },
  section: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 22, marginBottom: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47%", flexGrow: 1, backgroundColor: "#111A30", borderColor: "#253451", borderWidth: 1, borderRadius: 18, padding: 17 },
  icon: { fontSize: 24 },
  statValue: { color: "#FFFFFF", fontSize: 27, fontWeight: "800", marginTop: 14 },
  statLabel: { color: "#9CA9C5", fontSize: 12, marginTop: 5 },
  menuCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111A30", borderWidth: 1, borderColor: "#253451", borderRadius: 16, padding: 16, marginBottom: 11, gap: 13 },
  menuIcon: { fontSize: 26 },
  menuTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  menuSubtitle: { color: "#9CA9C5", fontSize: 12, marginTop: 5 },
  arrow: { color: "#00D4FF", fontSize: 28 },
  errorBox: { backgroundColor: "#321C2A", borderRadius: 12, padding: 14, marginTop: 15 },
  errorText: { color: "#FFC4D0" },
  retry: { color: "#00D4FF", fontWeight: "800", marginTop: 10 },
  logout: { marginTop: 20, borderWidth: 1, borderColor: "#F05D70", borderRadius: 12, padding: 14, alignItems: "center" },
  logoutText: { color: "#FF8391", fontWeight: "800" },
});
