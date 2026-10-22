
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

const BG = "#080D1B";
const CARD = "#111A2D";
const CYAN = "#00D4FF";
const MUTED = "#8490A8";
const ALERT_KEY = "safeTourismAgentAlerts";

type SafetyAlert = {
  id: string;
  touristName: string;
  type: string;
  message: string;
  location?: string;
  createdAt: string;
  status: "new" | "acknowledged" | "resolved";
};

export default function AgentAlerts() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ALERT_KEY);
      setAlerts(raw ? JSON.parse(raw) : []);
    } catch {
      Alert.alert("Error", "Could not load safety alerts.");
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAlerts(); }, [loadAlerts]));

  const updateStatus = async (item: SafetyAlert, status: SafetyAlert["status"]) => {
    try {
      const updated = alerts.map(a => a.id === item.id ? { ...a, status } : a);
      await AsyncStorage.setItem(ALERT_KEY, JSON.stringify(updated));
      setAlerts(updated);
    } catch {
      Alert.alert("Error", "Could not update this alert.");
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const newCount = alerts.filter(a => a.status === "new").length;

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={CYAN} />}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="shield-outline" size={29} color={CYAN} />
        </View>
        <Text style={styles.eyebrow}>TRAVELLER PROTECTION</Text>
        <Text style={styles.heading}>Safety Alerts</Text>
        <Text style={styles.subtitle}>
          Monitor incoming SOS reports and follow up with tourists.
        </Text>

        <View style={styles.countCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.countLabel}>New alerts</Text>
            <Text style={styles.countNumber}>{newCount}</Text>
            <Text style={styles.countHint}>Recheck this page for updates</Text>
          </View>
          <View style={styles.alertIcon}>
            <Ionicons name="notifications" size={27} color="#FFB66D" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>

        {alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-done-outline" size={32} color="#45D6A1" />
            </View>
            <Text style={styles.emptyTitle}>No safety alerts</Text>
            <Text style={styles.emptyText}>
              There are no alerts stored on this device right now. Real-time SOS notifications
              require the backend and SOS integration.
            </Text>
          </View>
        ) : (
          alerts.map(item => (
            <View key={item.id} style={styles.alertCard}>
              <View style={styles.alertTop}>
                <View style={styles.alertSymbol}>
                  <Ionicons name="warning-outline" size={22} color="#FFB66D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{item.type || "Safety alert"}</Text>
                  <Text style={styles.alertName}>{item.touristName}</Text>
                </View>
                <View style={[
                  styles.status,
                  item.status === "new" ? styles.newStatus :
                  item.status === "resolved" ? styles.resolvedStatus : styles.ackStatus,
                ]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.message}>{item.message}</Text>
              {item.location ? <Text style={styles.meta}>Location: {item.location}</Text> : null}
              <Text style={styles.meta}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              {item.status === "new" && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => updateStatus(item, "acknowledged")}
                >
                  <Text style={styles.actionText}>Acknowledge alert</Text>
                </TouchableOpacity>
              )}
              {item.status !== "resolved" && (
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => updateStatus(item, "resolved")}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#45D6A1" />
                  <Text style={styles.resolveText}>Mark as resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={CYAN} />
          <Text style={styles.noteText}>
            This screen is not an emergency dispatch service. For immediate danger, contact local
            emergency services and follow your property's emergency procedure.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 35 },
  iconCircle: { width: 57, height: 57, borderRadius: 18, backgroundColor: "#162940", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  eyebrow: { color: CYAN, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  heading: { color: "white", fontSize: 27, fontWeight: "800", marginTop: 8 },
  subtitle: { color: MUTED, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 22 },
  countCard: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderWidth: 1, borderColor: "#3A3041", borderRadius: 18, padding: 18 },
  countLabel: { color: MUTED, fontSize: 12 },
  countNumber: { color: "white", fontSize: 32, fontWeight: "800", marginTop: 6 },
  countHint: { color: MUTED, fontSize: 10, marginTop: 4 },
  alertIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: "#392B2D", alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: "white", fontSize: 17, fontWeight: "700", marginTop: 28, marginBottom: 14 },
  emptyCard: { alignItems: "center", backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: "#202B42", padding: 25 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: "#163D37", alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: "white", fontSize: 17, fontWeight: "700", marginTop: 16 },
  emptyText: { color: MUTED, textAlign: "center", fontSize: 12, lineHeight: 19, marginTop: 9 },
  alertCard: { backgroundColor: CARD, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#3A3041", marginBottom: 13 },
  alertTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertSymbol: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#392B2D", alignItems: "center", justifyContent: "center" },
  alertTitle: { color: "white", fontSize: 14, fontWeight: "700" },
  alertName: { color: MUTED, fontSize: 11, marginTop: 4 },
  status: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 6 },
  newStatus: { backgroundColor: "#493023" },
  ackStatus: { backgroundColor: "#1D3150" },
  resolvedStatus: { backgroundColor: "#163D37" },
  statusText: { color: "white", fontSize: 8, fontWeight: "800" },
  message: { color: "#D5DCEA", fontSize: 12, lineHeight: 18, marginTop: 15 },
  meta: { color: MUTED, fontSize: 10, marginTop: 8 },
  actionButton: { backgroundColor: "#493023", borderRadius: 11, padding: 12, alignItems: "center", marginTop: 15 },
  actionText: { color: "#FFB66D", fontSize: 12, fontWeight: "700" },
  resolveButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 13 },
  resolveText: { color: "#45D6A1", fontSize: 12, fontWeight: "700" },
  note: { flexDirection: "row", gap: 10, padding: 14, backgroundColor: "#102135", borderRadius: 14, marginTop: 20 },
  noteText: { color: "#B8C6D8", flex: 1, fontSize: 11, lineHeight: 17 },
});
