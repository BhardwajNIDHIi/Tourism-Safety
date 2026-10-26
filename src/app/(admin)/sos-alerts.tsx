
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API = "http://10.6.0.126:5001/api";

export default function AdminSOSAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("safeTourismToken");
      if (!token) throw new Error("Admin session nahi mili.");

      const res = await fetch(`${API}/admin/sos-alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "SOS alerts load nahi hue.");

      setAlerts(Array.isArray(data) ? data : data.alerts ?? []);
    } catch (e: any) {
      setError(e.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#00D4FF" />}
    >
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Dashboard</Text></TouchableOpacity>
      <Text style={s.title}>SOS Alerts</Text>
      <Text style={s.sub}>Emergency monitoring center</Text>

      {loading && <ActivityIndicator color="#00D4FF" size="large" />}
      {!!error && <Text style={s.error}>{error}</Text>}
      {!loading && !error && alerts.length === 0 && (
        <Text style={s.empty}>Abhi koi SOS alert record available nahi hai.</Text>
      )}

      {alerts.map((alert, i) => (
        <View style={s.card} key={String(alert._id ?? alert.id ?? i)}>
          <View style={s.row}>
            <Text style={s.name}>🚨 {alert.emergencyType || alert.type || "Emergency"}</Text>
            <Text style={s.status}>{alert.status || "Unknown"}</Text>
          </View>
          <Text style={s.label}>Tourist</Text>
          <Text style={s.value}>{alert.touristName || alert.tourist?.name || "—"}</Text>
          <Text style={s.label}>Contact</Text>
          <Text style={s.value}>{alert.touristPhone || alert.tourist?.phone || "—"}</Text>
          <Text style={s.label}>Time</Text>
          <Text style={s.value}>
            {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "—"}
          </Text>
          <Text style={s.label}>Location</Text>
          <Text style={s.value}>
            {alert.latitude != null && alert.longitude != null
              ? `${alert.latitude}, ${alert.longitude}`
              : alert.location || "Location not available"}
          </Text>
          {alert.description ? (
            <>
              <Text style={s.label}>Details</Text>
              <Text style={s.value}>{alert.description}</Text>
            </>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#080D1B" },
  content: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  back: { color: "#00D4FF", fontSize: 15, marginBottom: 22 },
  title: { color: "#FFF", fontSize: 27, fontWeight: "800" },
  sub: { color: "#9CA9C5", marginTop: 7, marginBottom: 22 },
  card: { backgroundColor: "#111A30", borderColor: "#563044", borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 13 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { color: "#FFF", fontSize: 16, fontWeight: "800", flex: 1 },
  status: { color: "#FF8391", fontSize: 12, fontWeight: "800" },
  label: { color: "#8190B0", fontSize: 12, marginTop: 12 },
  value: { color: "#EAF0FF", fontSize: 14, marginTop: 3 },
  error: { color: "#FF9CAB", marginVertical: 15 },
  empty: { color: "#9CA9C5", marginTop: 25, textAlign: "center" },
});
