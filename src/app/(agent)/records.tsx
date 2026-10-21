
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const STORAGE_KEY = "agentCheckInRecords";

type CheckInRecord = {
  id: string;
  touristName: string;
  phone: string;
  hotelName: string;
  status: string;
  createdAt: string;
  bookingReference?: string;
};

export default function AgentRecordsScreen() {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const refresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Check-in Records</Text>
          <Text style={styles.subtitle}>
            {records.length} saved record(s)
          </Text>
        </View>

        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={21} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#00D4FF"
          />
        }
      >
        {records.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="document-text-outline"
                size={36}
                color="#00D4FF"
              />
            </View>
            <Text style={styles.emptyTitle}>No Check-ins Yet</Text>
            <Text style={styles.emptyText}>
              Tourist records you save will appear here.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(agent)/check-in")}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add First Check-in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person-outline"
                    size={23}
                    color="#00D4FF"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>
                    {record.touristName}
                  </Text>
                  <Text style={styles.date}>
                    {formatDate(record.createdAt)}
                  </Text>
                </View>

                <View style={styles.status}>
                  <Text style={styles.statusText}>Recorded</Text>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.detailRow}>
                <Ionicons
                  name="call-outline"
                  size={17}
                  color="#8B95AA"
                />
                <Text style={styles.detailText}>{record.phone}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="business-outline"
                  size={17}
                  color="#8B95AA"
                />
                <Text style={styles.detailText}>{record.hotelName}</Text>
              </View>

              {record.bookingReference ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={17}
                    color="#8B95AA"
                  />
                  <Text style={styles.detailText}>
                    Booking: {record.bookingReference}
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#080D1B" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 19,
    paddingVertical: 18,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#202C42",
  },
  backButton: { padding: 5 },
  refreshButton: { padding: 8 },
  title: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  subtitle: { color: "#8B95AA", fontSize: 12, marginTop: 4 },
  list: { padding: 19, paddingBottom: 35, flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
  },
  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: "#11243A",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
  },
  emptyText: {
    color: "#9BA6BB",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 9,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#635BEE",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 23,
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#27334A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#11243A",
    alignItems: "center",
    justifyContent: "center",
  },
  guestName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  date: { color: "#8B95AA", fontSize: 10, marginTop: 5 },
  status: {
    backgroundColor: "#16342C",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { color: "#78E4BB", fontSize: 10, fontWeight: "700" },
  separator: {
    height: 1,
    backgroundColor: "#27334A",
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 9,
  },
  detailText: { color: "#C6D0E0", fontSize: 12, flex: 1 },
});