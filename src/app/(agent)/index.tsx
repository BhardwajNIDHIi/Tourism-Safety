
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";

const BG = "#080D1B";
const CARD = "#111A2D";
const PURPLE = "#6C63FF";
const CYAN = "#00D4FF";
const MUTED = "#8490A8";

const getAgentTouristsKey = (email: string) =>
  `safeTourismAgentTourists_${email.trim().toLowerCase()}`;

type Tourist = {
  id: string;
  name: string;
  status: "checked_in" | "checked_out";
  agentEmail?: string;
};

export default function AgentDashboard() {
  const [agentName, setAgentName] = useState("Agent");
  const [hotelName, setHotelName] = useState("Your Property");
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userRaw = await AsyncStorage.getItem(
        "safeTourismCurrentUser"
      );

      if (!userRaw) {
        setAgentName("Agent");
        setHotelName("Hotel not added");
        setTourists([]);
        return;
      }

      const user = JSON.parse(userRaw);
      const email = String(user.email || "").trim().toLowerCase();

      setAgentName(user.name || "Agent");
      setHotelName(user.hotelName || "Hotel not added");

      if (!email) {
        setTourists([]);
        console.warn("Current agent email is missing.");
        return;
      }

      // Read only this agent's records.
      const agentKey = getAgentTouristsKey(email);
      const raw = await AsyncStorage.getItem(agentKey);

      setTourists(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.log("Dashboard loading error:", error);
      setTourists([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const checkedIn = tourists.filter(
    (t) => t.status === "checked_in"
  ).length;

  const checkedOut = tourists.filter(
    (t) => t.status === "checked_out"
  ).length;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={CYAN}
          />
        }
      >
        <View style={styles.topRow}>
          <View style={styles.brandIcon}>
            <Ionicons
              name="shield-checkmark"
              size={25}
              color={CYAN}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>SAFE TOURISM</Text>
            <Text style={styles.subBrand}>AGENT PORTAL</Text>
          </View>

          <TouchableOpacity
            style={styles.bell}
            onPress={() =>
              router.push("/(agent)/alerts" as any)
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>AGENT DASHBOARD</Text>
          <Text style={styles.heading}>
            Welcome, {agentName} 👋
          </Text>
          <Text style={styles.description}>
            Manage guest check-ins and help keep travellers safe.
          </Text>
        </View>

        <View style={styles.hotelCard}>
          <View style={styles.hotelIcon}>
            <Ionicons
              name="business-outline"
              size={25}
              color={CYAN}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.mutedLabel}>
              REGISTERED PROPERTY
            </Text>
            <Text style={styles.hotelTitle}>
              {hotelName}
            </Text>
            <Text style={styles.smallText}>
              Agent portal
            </Text>
          </View>

          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#45D6A1"
          />
        </View>

        <Text style={styles.sectionTitle}>
          Guest overview
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "#1D3150" },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={22}
                color={CYAN}
              />
            </View>
            <Text style={styles.statNumber}>
              {tourists.length}
            </Text>
            <Text style={styles.statLabel}>
              Total records
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "#163D37" },
              ]}
            >
              <Ionicons
                name="log-in-outline"
                size={22}
                color="#45D6A1"
              />
            </View>
            <Text style={styles.statNumber}>
              {checkedIn}
            </Text>
            <Text style={styles.statLabel}>
              Currently staying
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "#392B53" },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color="#B7A4FF"
              />
            </View>
            <Text style={styles.statNumber}>
              {checkedOut}
            </Text>
            <Text style={styles.statLabel}>
              Checked out
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "#493023" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#FFB66D"
              />
            </View>
            <Text style={styles.statNumber}>Active</Text>
            <Text style={styles.statLabel}>
              Portal status
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Quick actions
        </Text>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() =>
            router.push("/(agent)/check-in" as any)
          }
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="person-add-outline"
              size={24}
              color="white"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              Register tourist check-in
            </Text>
            <Text style={styles.actionText}>
              Add guest details to your records
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() =>
            router.push("/(agent)/tourists" as any)
          }
        >
          <Ionicons
            name="list-outline"
            size={23}
            color={CYAN}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              View tourist records
            </Text>
            <Text style={styles.actionText}>
              Search guests and update their status
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={MUTED}
          />
        </TouchableOpacity>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={CYAN}
          />
          <Text style={styles.noticeText}>
            Tourist records are stored separately for each agent
            on this device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  brandIcon: {
    marginTop: 35,
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#15243A",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    marginTop: 35,
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  subBrand: {
    color: CYAN,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 3,
  },
  bell: {
    padding: 12,
    backgroundColor: CARD,
    borderRadius: 14,
  },
  welcome: {
    marginBottom: 22,
  },
  eyebrow: {
    color: CYAN,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 10,
  },
  heading: {
    color: "white",
    fontSize: 25,
    fontWeight: "800",
  },
  description: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  hotelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 17,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#26354F",
    marginBottom: 28,
  },
  hotelIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#1A2B43",
    alignItems: "center",
    justifyContent: "center",
  },
  mutedLabel: {
    color: MUTED,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  hotelTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  smallText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 135,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#202B42",
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  statNumber: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
  },
  primaryAction: {
    backgroundColor: PURPLE,
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 12,
  },
  actionIcon: {
    width: 45,
    height: 45,
    backgroundColor: "#8179FF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  actionText: {
    color: "#B7C1D5",
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },
  secondaryAction: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: "#202B42",
  },
  notice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#102135",
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  noticeText: {
    color: "#B8C6D8",
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
});
