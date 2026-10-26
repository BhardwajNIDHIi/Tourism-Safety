
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API = "http://10.6.0.126:5001/api";

export default function AdminAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("safeTourismToken");
      if (!token) throw new Error("Admin session nahi mili.");

      const res = await fetch(`${API}/admin/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Agents load nahi hue.");

      setAgents(Array.isArray(data) ? data : data.agents ?? []);
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
      <Text style={s.title}>Manage Agents</Text>
      <Text style={s.sub}>Registered tourism safety agents</Text>

      {loading && <ActivityIndicator color="#00D4FF" size="large" />}
      {!!error && <Text style={s.error}>{error}</Text>}
      {!loading && !error && agents.length === 0 && <Text style={s.empty}>Abhi koi agent record available nahi hai.</Text>}

      {agents.map((agent, i) => (
        <View style={s.card} key={String(agent._id ?? agent.id ?? i)}>
          <View style={s.row}>
            <Text style={s.name}>{agent.name || "Name not provided"}</Text>
            <Text style={s.status}>{agent.verificationStatus || "Unspecified"}</Text>
          </View>
          <Text style={s.label}>Agent ID</Text><Text style={s.value}>{agent.agentId || "—"}</Text>
          <Text style={s.label}>Email</Text><Text style={s.value}>{agent.email || "—"}</Text>
          <Text style={s.label}>Phone</Text><Text style={s.value}>{agent.phone || "—"}</Text>
          <Text style={s.label}>Hotel</Text><Text style={s.value}>{agent.hotelName || "—"}</Text>
          <Text style={s.label}>Hotel Address</Text><Text style={s.value}>{agent.hotelAddress || "—"}</Text>
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
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  name: { color: "#FFF", fontWeight: "800", fontSize: 17, flex: 1 },
  status: { color: "#00D4FF", fontSize: 11, fontWeight: "700" },
  label: { color: "#8190B0", fontSize: 12, marginTop: 10 },
  value: { color: "#EAF0FF", fontSize: 14, marginTop: 3 },
  error: { color: "#FF9CAB", marginVertical: 15 },
  empty: { color: "#9CA9C5", marginTop: 25, textAlign: "center" },
});
