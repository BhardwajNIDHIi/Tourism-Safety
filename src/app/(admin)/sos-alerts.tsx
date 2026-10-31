
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

const API_BASE_URL = "http://192.168.1.36:5001";
const ALERTS_ENDPOINT = `${API_BASE_URL}/api/admin/sos-alerts`;

type LocationValue =
  | string
  | {
      latitude?: number | string;
      longitude?: number | string;
      address?: string;
      city?: string;
    }
  | null
  | undefined;

type SOSAlert = {
  _id?: string;
  id?: string;
  name?: string;
  touristName?: string;
  touristPhone?: string;
  phone?: string;
  emergencyType?: string;
  category?: string;
  message?: string;
  status?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location?: LocationValue;
  createdAt?: string;
  updatedAt?: string;
};

function formatLocation(alert: SOSAlert): string {
  const latitude = alert.latitude;
  const longitude = alert.longitude;

  if (latitude != null && longitude != null) {
    return `${latitude}, ${longitude}`;
  }

  const location = alert.location;

  if (typeof location === "string" && location.trim()) {
    return location;
  }

  if (location && typeof location === "object") {
    if (
      location.latitude != null &&
      location.longitude != null
    ) {
      return `${location.latitude}, ${location.longitude}`;
    }

    if (location.address) return location.address;
    if (location.city) return location.city;
  }

  return "Location not available";
}

function formatDate(value?: string): string {
  if (!value) return "Date not available";

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

function normalizeStatus(status?: string): string {
  const value = (status || "new").toLowerCase();

  if (value === "acknowledged") return "Acknowledged";
  if (value === "resolved") return "Resolved";

  return "New";
}

function getAlertArray(response: any): SOSAlert[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.alerts)) return response.alerts;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.sosAlerts)) return response.sosAlerts;

  return [];
}

export default function AdminSOSAlerts() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = await AsyncStorage.getItem("safeTourismToken");

      const response = await fetch(ALERTS_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const responseText = await response.text();

      let result: any = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Server se invalid response mila.");
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Request failed (${response.status})`
        );
      }

      setAlerts(getAlertArray(result));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Alerts load nahi ho sake.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const renderAlert = ({ item, index }: { item: SOSAlert; index: number }) => {
    const status = normalizeStatus(item.status);
    const isResolved = status === "Resolved";
    const isAcknowledged = status === "Acknowledged";

    const name =
      item.touristName || item.name || "Tourist";

    const phone = item.touristPhone || item.phone || "Not provided";

    const emergency =
      item.emergencyType || item.category || item.message || "SOS Emergency";

    const uniqueKey = item._id || item.id || `${index}`;

    return (
      <View style={styles.alertCard} key={uniqueKey}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={27} color="#FF5B69" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>{emergency}</Text>
            <Text style={styles.dateText}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isResolved
                ? styles.resolvedBadge
                : isAcknowledged
                  ? styles.acknowledgedBadge
                  : styles.newBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isResolved
                  ? styles.resolvedText
                  : isAcknowledged
                    ? styles.acknowledgedText
                    : styles.newText,
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={18} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Tourist Name</Text>
            <Text style={styles.value}>{name}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={18} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={18} color="#9BA8C7" />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {formatLocation(item)}
            </Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.label}>Message</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#080D1B" />
        <View style={styles.centerContent}>
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
        <View>
          <Text style={styles.heading}>SOS Alerts</Text>
          <Text style={styles.subtitle}>
            Monitor tourist emergency requests
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadAlerts(true)}
          disabled={refreshing}
          accessibilityLabel="Refresh alerts"
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="refresh" size={21} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="notifications" size={23} color="#FF6574" />
        </View>

        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryLabel}>Total SOS Alerts</Text>
          <Text style={styles.summaryNumber}>{alerts.length}</Text>
        </View>

        <View style={styles.summaryRight}>
          <Text style={styles.summarySmall}>Emergency</Text>
          <Text style={styles.summarySmall}>Monitoring</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color="#FF6978"
          />
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Unable to load alerts</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
          <TouchableOpacity onPress={() => loadAlerts()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={alerts}
        keyExtractor={(item, index) =>
          String(item._id || item.id || index)
        }
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={42}
                  color="#6C63FF"
                />
              </View>
              <Text style={styles.emptyTitle}>No SOS Alerts</Text>
              <Text style={styles.emptySubtitle}>
                New tourist emergency requests will appear here.
              </Text>
              <TouchableOpacity
                style={styles.emptyRefreshButton}
                onPress={() => loadAlerts()}
              >
                <Text style={styles.emptyRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080D1B",
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9BA8C7",
    fontSize: 13,
    marginTop: 5,
  },
  refreshButton: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 17,
    borderRadius: 18,
    backgroundColor: "#111A30",
    borderWidth: 1,
    borderColor: "#26314D",
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    height: 48,
    width: 48,
    borderRadius: 15,
    backgroundColor: "#38202F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    color: "#AAB5D0",
    fontSize: 13,
  },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 3,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summarySmall: {
    color: "#8D9BB9",
    fontSize: 11,
    marginVertical: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
    flexGrow: 1,
  },
  alertCard: {
    backgroundColor: "#111A30",
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#26314D",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    height: 45,
    width: 45,
    borderRadius: 14,
    backgroundColor: "#38202F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  headerText: {
    flex: 1,
    paddingRight: 5,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dateText: {
    color: "#8795B3",
    fontSize: 11,
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBadge: {
    backgroundColor: "#40242E",
  },
  acknowledgedBadge: {
    backgroundColor: "#3C321D",
  },
  resolvedBadge: {
    backgroundColor: "#17392F",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  newText: {
    color: "#FF7885",
  },
  acknowledgedText: {
    color: "#F5C76B",
  },
  resolvedText: {
    color: "#70D8A6",
  },
  separator: {
    height: 1,
    backgroundColor: "#26314D",
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  detailContent: {
    flex: 1,
    marginLeft: 11,
  },
  label: {
    color: "#8795B3",
    fontSize: 12,
    marginBottom: 5,
  },
  value: {
    color: "#F0F3FF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  messageBox: {
    backgroundColor: "#0B1225",
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  messageText: {
    color: "#E1E7F8",
    fontSize: 13,
    lineHeight: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#AAB5D0",
    marginTop: 13,
    fontSize: 14,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#2B1825",
    borderWidth: 1,
    borderColor: "#623044",
    gap: 9,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    color: "#FF8995",
    fontWeight: "700",
    fontSize: 13,
  },
  errorMessage: {
    color: "#E2B9C1",
    fontSize: 11,
    marginTop: 4,
  },
  retryText: {
    color: "#B6AEFF",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 55,
  },
  emptyIcon: {
    height: 80,
    width: 80,
    borderRadius: 25,
    backgroundColor: "#171D3A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  emptySubtitle: {
    color: "#8F9DBA",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  emptyRefreshButton: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 20,
  },
  emptyRefreshText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
