
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";

const BG = "#080D1B";
const CARD = "#111A2D";
const CYAN = "#00D4FF";
const PURPLE = "#6C63FF";
const MUTED = "#8490A8";

const CURRENT_USER_KEY = "safeTourismCurrentUser";

const getAgentTouristsKey = (email: string) =>
  `safeTourismAgentTourists_${email.trim().toLowerCase()}`;

type Tourist = {
  id: string;
  name: string;
  phone: string;
  bookingId: string;
  roomNumber?: string;
  checkInDate: string;
  checkoutDate?: string;
  guestCount?: number;
  status: "checked_in" | "checked_out";
  hotelName?: string;
  agentEmail?: string;
  createdAt?: string;
};

export default function TouristRecords() {
  const [records, setRecords] = useState<Tourist[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "checked_in" | "checked_out"
  >("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      const userRaw = await AsyncStorage.getItem(
        CURRENT_USER_KEY
      );

      if (!userRaw) {
        setRecords([]);
        return;
      }

      let user: any;

      try {
        user = JSON.parse(userRaw);
      } catch {
        setRecords([]);
        Alert.alert(
          "Session error",
          "Your saved account session is invalid. Please sign in again."
        );
        return;
      }

      const email = String(user?.email || "")
        .trim()
        .toLowerCase();

      const role = String(user?.role || "")
        .trim()
        .toLowerCase();

      // Accept both "Agent" and "agent".
      if (!email || role !== "agent") {
        setRecords([]);
        return;
      }

      const storageKey = getAgentTouristsKey(email);
      const raw = await AsyncStorage.getItem(storageKey);

      if (!raw) {
        setRecords([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        setRecords([]);
        Alert.alert(
          "Data error",
          "Tourist records are not stored in the expected format."
        );
        return;
      }

      // Keep records for this agent only.
      const agentRecords: Tourist[] = parsed.filter(
        (tourist: Tourist) => {
          if (!tourist || typeof tourist !== "object") {
            return false;
          }

          // Older records may not have agentEmail.
          if (!tourist.agentEmail) {
            return true;
          }

          return (
            tourist.agentEmail.trim().toLowerCase() === email
          );
        }
      );

      setRecords(agentRecords);
    } catch (error) {
      console.log("Tourist records loading error:", error);
      Alert.alert(
        "Loading error",
        "Could not load tourist records. Please refresh and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRecords();
    }, [loadRecords])
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadRecords();
  };

  const checkout = (tourist: Tourist) => {
    Alert.alert(
      "Confirm check-out",
      `Mark ${tourist.name} as checked out?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Check out",
          onPress: async () => {
            try {
              const userRaw = await AsyncStorage.getItem(
                CURRENT_USER_KEY
              );

              if (!userRaw) {
                Alert.alert(
                  "Session expired",
                  "Please sign in again."
                );
                return;
              }

              const user = JSON.parse(userRaw);
              const email = String(user?.email || "")
                .trim()
                .toLowerCase();
              const role = String(user?.role || "")
                .trim()
                .toLowerCase();

              if (!email || role !== "agent") {
                Alert.alert(
                  "Invalid agent",
                  "Please sign in with your agent account again."
                );
                return;
              }

              const storageKey = getAgentTouristsKey(email);
              const raw = await AsyncStorage.getItem(storageKey);
              const currentRecords: Tourist[] = raw
                ? JSON.parse(raw)
                : [];

              const updatedRecords = currentRecords.map(
                (item) =>
                  item.id === tourist.id
                    ? {
                        ...item,
                        status: "checked_out" as const,
                      }
                    : item
              );

              await AsyncStorage.setItem(
                storageKey,
                JSON.stringify(updatedRecords)
              );

              await loadRecords();

              Alert.alert(
                "Updated",
                `${tourist.name} has been checked out.`
              );
            } catch (error) {
              console.log("Check-out error:", error);
              Alert.alert(
                "Error",
                "Could not update this record. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const filtered = records.filter((tourist) => {
    const query = search.trim().toLowerCase();

    const searchableText = [
      tourist.name,
      tourist.phone,
      tourist.bookingId,
      tourist.roomNumber || "",
      tourist.hotelName || "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(query);

    const matchesFilter =
      filter === "all" || tourist.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={CYAN}
          />
        }
      >
        <Text style={styles.eyebrow}>GUEST MANAGEMENT</Text>

        <Text style={styles.heading}>Tourist Records</Text>

        <Text style={styles.subtitle}>
          Manage registered guests and their stay status.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={MUTED}
          />

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone or booking ID"
            placeholderTextColor="#65728A"
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={MUTED}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
        >
          {(
            [
              ["all", "All records"],
              ["checked_in", "Checked-in"],
              ["checked_out", "Checked-out"],
            ] as const
          ).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filterChip,
                filter === value && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value && styles.filterTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryText}>
              {filtered.length} record(s) found
            </Text>

            <Text style={styles.totalText}>
              Total saved: {records.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              router.push("/(agent)/check-in" as any)
            }
          >
            <Ionicons name="add" size={19} color="white" />
            <Text style={styles.addText}>Add tourist</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator
              size="large"
              color={CYAN}
            />
            <Text style={styles.emptyText}>
              Loading tourist records...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="people-outline"
              size={42}
              color={MUTED}
            />

            <Text style={styles.emptyTitle}>
              {records.length > 0
                ? "No matching records"
                : "No tourist records"}
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? "Try a different search term."
                : records.length > 0
                ? "Try changing the selected filter."
                : "No records were found for this agent's saved storage key."}
            </Text>

            {!search && records.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() =>
                  router.push("/(agent)/check-in" as any)
                }
              >
                <Text style={styles.emptyButtonText}>
                  Register tourist
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refresh}
            >
              <Ionicons
                name="refresh-outline"
                size={17}
                color={CYAN}
              />
              <Text style={styles.refreshText}>
                Refresh records
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((tourist) => (
            <View
              key={tourist.id}
              style={styles.touristCard}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {tourist.name?.charAt(0)?.toUpperCase() ||
                      "T"}
                  </Text>
                </View>

                <View style={styles.nameContainer}>
                  <Text style={styles.name}>
                    {tourist.name}
                  </Text>

                  <Text style={styles.booking}>
                    Booking: {tourist.bookingId}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    tourist.status === "checked_in"
                      ? styles.inStatus
                      : styles.outStatus,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          tourist.status === "checked_in"
                            ? "#45D6A1"
                            : "#B7A4FF",
                      },
                    ]}
                  >
                    {tourist.status === "checked_in"
                      ? "CHECKED-IN"
                      : "CHECKED-OUT"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={MUTED}
                />
                <Text style={styles.detail}>
                  {tourist.phone}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={MUTED}
                />
                <Text style={styles.detail}>
                  Check-in: {tourist.checkInDate}
                </Text>
              </View>

              {tourist.checkoutDate ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={16}
                    color={MUTED}
                  />
                  <Text style={styles.detail}>
                    Expected check-out: {tourist.checkoutDate}
                  </Text>
                </View>
              ) : null}

              {tourist.roomNumber ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="bed-outline"
                    size={16}
                    color={MUTED}
                  />
                  <Text style={styles.detail}>
                    Room: {tourist.roomNumber}
                  </Text>
                </View>
              ) : null}

              {typeof tourist.guestCount === "number" && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={MUTED}
                  />
                  <Text style={styles.detail}>
                    Guests: {tourist.guestCount}
                  </Text>
                </View>
              )}

              {tourist.hotelName ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="business-outline"
                    size={16}
                    color={MUTED}
                  />
                  <Text style={styles.detail}>
                    {tourist.hotelName}
                  </Text>
                </View>
              ) : null}

              {tourist.status === "checked_in" && (
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => checkout(tourist)}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color="#FFB66D"
                  />
                  <Text style={styles.checkoutText}>
                    Mark as checked out
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  eyebrow: {
    color: CYAN,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 8,
  },
  heading: {
    color: "white",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#293750",
    borderRadius: 14,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    color: "white",
    paddingVertical: 14,
    fontSize: 12,
  },
  filters: {
    marginTop: 16,
    maxHeight: 43,
  },
  filterChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#293750",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginRight: 8,
    backgroundColor: CARD,
  },
  filterActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "white",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 14,
  },
  summaryText: {
    color: MUTED,
    fontSize: 12,
  },
  totalText: {
    color: CYAN,
    fontSize: 11,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: PURPLE,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  addText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    padding: 28,
    backgroundColor: CARD,
    borderRadius: 18,
    marginTop: 12,
  },
  emptyTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: MUTED,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: PURPLE,
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 17,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    padding: 8,
  },
  refreshText: {
    color: CYAN,
    fontSize: 12,
    fontWeight: "700",
  },
  touristCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#202B42",
    marginBottom: 13,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#26305B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  booking: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  status: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 7,
  },
  inStatus: {
    backgroundColor: "#15382F",
  },
  outStatus: {
    backgroundColor: "#30264C",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "800",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 9,
  },
  detail: {
    color: "#C1CAD9",
    fontSize: 12,
    flex: 1,
  },
  checkoutButton: {
    borderTopWidth: 1,
    borderTopColor: "#293750",
    marginTop: 15,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkoutText: {
    color: "#FFB66D",
    fontSize: 12,
    fontWeight: "700",
  },
});
