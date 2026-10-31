
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.1.36:5001/api";

type SOSAlert = {
  _id?: string;
  id?: string;
  user?: any;
  touristName?: string;
  name?: string;
  touristPhone?: string;
  phone?: string;
  category?: string;
  emergencyType?: string;
  description?: string;
  message?: string;
  forWhom?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location?: any;
  status?: string;
  createdAt?: string;
};

function getAlerts(data: any): SOSAlert[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.alerts)) return data.alerts;
  if (Array.isArray(data?.sosAlerts)) return data.sosAlerts;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.alerts)) return data.data.alerts;
  return [];
}

function getTouristName(item: SOSAlert): string {
  const user = item.user;

  if (typeof item.touristName === "string") return item.touristName;
  if (typeof item.name === "string") return item.name;

  if (user && typeof user === "object") {
    if (typeof user.name === "string") return user.name;
    if (typeof user.fullName === "string") return user.fullName;
  }

  return "Tourist";
}

function getTouristPhone(item: SOSAlert): string {
  if (typeof item.touristPhone === "string") return item.touristPhone;
  if (typeof item.phone === "string") return item.phone;

  if (item.user && typeof item.user === "object") {
    if (typeof item.user.phone === "string") return item.user.phone;
  }

  return "Not provided";
}

function getLocation(item: SOSAlert): string {
  if (item.latitude != null && item.longitude != null) {
    return `${item.latitude}, ${item.longitude}`;
  }

  const location = item.location;

  if (typeof location === "string") return location;

  if (location && typeof location === "object") {
    if (
      location.latitude != null &&
      location.longitude != null
    ) {
      return `${location.latitude}, ${location.longitude}`;
    }

    if (typeof location.address === "string") return location.address;
    if (typeof location.city === "string") return location.city;
  }

  return "Location not available";
}

function getStatus(status?: string): "Active" | "Acknowledged" | "Resolved" {
  const value = (status || "Active").toLowerCase();

  if (value === "resolved") return "Resolved";
  if (value === "acknowledged") return "Acknowledged";

  return "Active";
}

function formatDate(value?: string): string {
  if (!value) return "Time not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgentAlerts() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadAlerts = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = await AsyncStorage.getItem("safeTourismToken");

      if (!token) {
        throw new Error("Login session nahi mili. Dobara sign in karo.");
      }

      const response = await fetch(`${API_BASE_URL}/agent/sos-alerts`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      let result: any = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Backend se valid JSON response nahi mila.");
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Server error: ${response.status}`
        );
      }

      setAlerts(getAlerts(result));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "SOS alerts load nahi ho sake."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const updateStatus = async (
    item: SOSAlert,
    nextStatus: "Acknowledged" | "Resolved"
  ) => {
    const id = item._id || item.id;

    if (!id) {
      Alert.alert("Error", "Is alert ki ID backend response mein nahi mili.");
      return;
    }

    try {
      setUpdatingId(id);

      const token = await AsyncStorage.getItem("safeTourismToken");

      if (!token) {
        throw new Error("Login session nahi mili. Dobara sign in karo.");
      }

      const response = await fetch(
        `${API_BASE_URL}/agent/sos-alerts/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const responseText = await response.text();
      let result: any = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Backend se valid JSON response nahi mila.");
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Status update failed: ${response.status}`
        );
      }

      setAlerts((previous) =>
        previous.map((alert) =>
          (alert._id || alert.id) === id
            ? { ...alert, status: nextStatus }
            : alert
        )
      );

      Alert.alert("Success", `Alert marked as ${nextStatus}.`);
    } catch (err) {
      Alert.alert(
        "Unable to update",
        err instanceof Error ? err.message : "Status update nahi hua."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const renderAlert = ({ item }: { item: SOSAlert }) => {
    const id = item._id || item.id || "";
    const status = getStatus(item.status);
    const busy = updatingId === id;

    const category =
      item.category || item.emergencyType || "SOS Emergency";

    const description =
      item.description || item.message || "No additional description.";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.alertIcon}>
            <Ionicons name="alert-circle" size={26} color="#FF6574" />
          </View>

          <View style={styles.headerDetails}>
            <Text style={styles.category}>{category}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>

          <View
            style={[
              styles.badge,
              status === "Active"
                ? styles.activeBadge
                : status === "Acknowledged"
                  ? styles.ackBadge
                  : styles.resolvedBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                status === "Active"
                  ? styles.activeText
                  : status === "Acknowledged"
                    ? styles.ackText
                    : styles.resolvedText,
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={19} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Tourist</Text>
            <Text style={styles.value}>{getTouristName(item)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={19} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{getTouristPhone(item)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={19} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Location (latitude, longitude)</Text>
            <Text style={styles.value}>{getLocation(item)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={19} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Help requested for</Text>
            <Text style={styles.value}>
              {typeof item.forWhom === "string" ? item.forWhom : "Not specified"}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {status !== "Resolved" && (
          <View style={styles.actions}>
            {status === "Active" && (
              <TouchableOpacity
                style={[styles.ackButton, busy && styles.disabledButton]}
                disabled={busy}
                onPress={() => updateStatus(item, "Acknowledged")}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.buttonText}>Acknowledge</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.resolveButton, busy && styles.disabledButton]}
              disabled={busy}
              onPress={() => updateStatus(item, "Resolved")}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Resolve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#080D1B" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading SOS alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080D1B" />

      <View style={styles.topHeader}>
        <View style={styles.headingArea}>
          <Text style={styles.heading}>SOS Alerts</Text>
          <Text style={styles.subtitle}>
            Monitor tourist emergency requests
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadAlerts(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="notifications-outline" size={24} color="#FF6574" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Total SOS Alerts</Text>
          <Text style={styles.summaryCount}>{alerts.length}</Text>
        </View>
        <View style={styles.summaryStats}>
          <Text style={styles.statText}>
            Active: {alerts.filter((a) => getStatus(a.status) === "Active").length}
          </Text>
          <Text style={styles.statText}>
            Resolved: {alerts.filter((a) => getStatus(a.status) === "Resolved").length}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={22} color="#FF7885" />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>Alerts load nahi hue</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity onPress={() => loadAlerts()}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={alerts}
        keyExtractor={(item, index) => String(item._id || item.id || index)}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAlerts(true)}
            tintColor="#6C63FF"
            colors={["#6C63FF"]}
          />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Ionicons
                name="shield-checkmark-outline"
                size={52}
                color="#6C63FF"
              />
              <Text style={styles.emptyTitle}>No SOS alerts</Text>
              <Text style={styles.emptyText}>
                Tourist emergency requests will appear here.
              </Text>
              <TouchableOpacity
                style={styles.emptyRefresh}
                onPress={() => loadAlerts()}
              >
                <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080D1B" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#AAB5D0", marginTop: 12 },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headingArea: { flex: 1 },
  heading: { color: "#FFFFFF", fontSize: 27, fontWeight: "800" },
  subtitle: { color: "#9BA8C7", fontSize: 13, marginTop: 5 },
  refreshButton: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  summary: {
    marginHorizontal: 20,
    marginBottom: 17,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#111A30",
    borderWidth: 1,
    borderColor: "#26314D",
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    height: 47,
    width: 47,
    borderRadius: 15,
    backgroundColor: "#38202F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryLabel: { color: "#AAB5D0", fontSize: 12 },
  summaryCount: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 3,
  },
  summaryStats: { alignItems: "flex-end", gap: 5 },
  statText: { color: "#AAB5D0", fontSize: 11 },
  list: { paddingHorizontal: 20, paddingBottom: 35, flexGrow: 1 },
  card: {
    backgroundColor: "#111A30",
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#26314D",
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  alertIcon: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: "#38202F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerDetails: { flex: 1, paddingRight: 5 },
  category: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  date: { color: "#8795B3", fontSize: 10, marginTop: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  activeBadge: { backgroundColor: "#40242E" },
  ackBadge: { backgroundColor: "#3C321D" },
  resolvedBadge: { backgroundColor: "#17392F" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  activeText: { color: "#FF7885" },
  ackText: { color: "#F5C76B" },
  resolvedText: { color: "#70D8A6" },
  divider: { height: 1, backgroundColor: "#26314D", marginVertical: 15 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  detailContent: { flex: 1, marginLeft: 11 },
  label: { color: "#8795B3", fontSize: 12, marginBottom: 5 },
  value: { color: "#F0F3FF", fontSize: 14, lineHeight: 20 },
  descriptionBox: {
    backgroundColor: "#0B1225",
    borderRadius: 12,
    padding: 12,
    marginTop: 1,
  },
  description: { color: "#E1E7F8", fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10, marginTop: 15 },
  ackButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 11,
    backgroundColor: "#5149D8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  resolveButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 11,
    backgroundColor: "#167A58",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#2B1825",
    borderWidth: 1,
    borderColor: "#623044",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  errorTitle: { color: "#FF8995", fontWeight: "700", fontSize: 13 },
  errorText: { color: "#E2B9C1", fontSize: 11, marginTop: 4, flexShrink: 1 },
  retry: { color: "#B6AEFF", fontWeight: "700", fontSize: 12 },
  empty: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 55 },
  emptyTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 15 },
  emptyText: {
    color: "#8F9DBA",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  emptyRefresh: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 20,
  },
});
