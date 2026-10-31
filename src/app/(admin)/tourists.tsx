
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API = "http://192.168.1.36:5001/api";

export default function AdminTourists() {
  const [tourists, setTourists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("safeTourismToken");
      if (!token) throw new Error("Admin session nahi mili.");

      const res = await fetch(`${API}/admin/tourists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tourists load nahi hue.");

      setTourists(Array.isArray(data) ? data : data.tourists ?? []);
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
      <Text style={s.title}>Manage Tourists</Text>
      <Text style={s.sub}>Registered tourist accounts</Text>

      {loading && <ActivityIndicator color="#00D4FF" size="large" />}
      {!!error && <Text style={s.error}>{error}</Text>}
      {!loading && !error && tourists.length === 0 && <Text style={s.empty}>Abhi koi tourist record available nahi hai.</Text>}

      {tourists.map((tourist, i) => (
        <View style={s.card} key={String(tourist._id ?? tourist.id ?? i)}>
          <Text style={s.name}>{tourist.name || "Name not provided"}</Text>
          <Text style={s.label}>Email</Text><Text style={s.value}>{tourist.email || "—"}</Text>
          <Text style={s.label}>Phone</Text><Text style={s.value}>{tourist.phone || "—"}</Text>
          <Text style={s.label}>Assigned Agent</Text>
          <Text style={s.value}>
            {tourist.assignedAgentName || tourist.assignedAgent?.name || "Not assigned"}
          </Text>
          <Text style={s.label}>Account Created</Text>
          <Text style={s.value}>
            {tourist.createdAt ? new Date(tourist.createdAt).toLocaleDateString() : "—"}
          </Text>
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
  card: { backgroundColor: "#111A30", borderColor: "#253451", borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 13 },
  name: { color: "#FFF", fontSize: 17, fontWeight: "800", marginBottom: 8 },
  label: { color: "#8190B0", fontSize: 12, marginTop: 10 },
  value: { color: "#EAF0FF", fontSize: 14, marginTop: 3 },
  error: { color: "#FF9CAB", marginVertical: 15 },
  empty: { color: "#9CA9C5", marginTop: 25, textAlign: "center" },
});
