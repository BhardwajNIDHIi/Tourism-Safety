
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API = "http://192.168.1.35:5001/api";

export default function AdminRemoteAreas() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("safeTourismToken");
      if (!token) throw new Error("Admin session nahi mili.");

      const res = await fetch(`${API}/admin/remote-areas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Remote areas load nahi hue.");

      setAreas(Array.isArray(data) ? data : data.areas ?? []);
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
      <Text style={s.title}>Remote Areas</Text>
      <Text style={s.sub}>Area coverage and agent assignments</Text>

      {loading && <ActivityIndicator color="#00D4FF" size="large" />}
      {!!error && <Text style={s.error}>{error}</Text>}
      {!loading && !error && areas.length === 0 && <Text style={s.empty}>Abhi remote area records available nahi hain.</Text>}

      {areas.map((area, i) => (
        <View style={s.card} key={String(area._id ?? area.id ?? i)}>
          <Text style={s.name}>{area.name || area.areaName || "Unnamed area"}</Text>
          <Text style={s.label}>District / Region</Text>
          <Text style={s.value}>{area.district || area.region || "—"}</Text>
          <Text style={s.label}>Assigned Agent</Text>
          <Text style={s.value}>
            {area.assignedAgentName || area.assignedAgent?.name || "Not assigned"}
          </Text>
          <Text style={s.label}>Status</Text>
          <Text style={s.status}>{area.status || "Not specified"}</Text>
          {area.latitude != null && area.longitude != null && (
            <>
              <Text style={s.label}>Coordinates</Text>
              <Text style={s.value}>{area.latitude}, {area.longitude}</Text>
            </>
          )}
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
  name: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  label: { color: "#8190B0", fontSize: 12, marginTop: 12 },
  value: { color: "#EAF0FF", fontSize: 14, marginTop: 3 },
  status: { color: "#00D4FF", fontSize: 14, marginTop: 3 },
  error: { color: "#FF9CAB", marginVertical: 15 },
  empty: { color: "#9CA9C5", marginTop: 25, textAlign: "center" },
});
