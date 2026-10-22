
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";

const BG = "#080D1B";
const CARD = "#111A2D";
const CYAN = "#00D4FF";
const PURPLE = "#6C63FF";
const MUTED = "#8490A8";

type AgentUser = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  hotelName?: string;
  hotelAddress?: string;
  agentId?: string;
  verificationStatus?: string;
};

export default function AgentProfile() {
  const [user, setUser] = useState<AgentUser>({});

  const loadProfile = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("safeTourismCurrentUser");
      setUser(raw ? JSON.parse(raw) : {});
    } catch {
      Alert.alert("Error", "Could not load profile information.");
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const logout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("safeTourismCurrentUser");
          router.replace("/(auth)/sign-in" as any);
        },
      },
    ]);
  };

  const row = (icon: keyof typeof Ionicons.glyphMap, label: string, value?: string) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={19} color={CYAN} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value?.trim() || "Not provided"}</Text>
      </View>
    </View>
  );

  const verified = user.verificationStatus === "verified";

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ACCOUNT MANAGEMENT</Text>
        <Text style={styles.heading}>Agent Profile</Text>
        <Text style={styles.subtitle}>View your account and registered property details.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={35} color="white" />
          </View>
          <Text style={styles.name}>{user.name || "Agent Name"}</Text>
          <Text style={styles.email}>{user.email || "No email available"}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={15} color={CYAN} />
            <Text style={styles.roleText}>HOTEL AGENT</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Personal details</Text>
        <View style={styles.detailsCard}>
          {row("person-outline", "Full name", user.name)}
          {row("mail-outline", "Email address", user.email)}
          {row("call-outline", "Phone number", user.phone)}
        </View>

        <Text style={styles.sectionTitle}>Property information</Text>
        <View style={styles.detailsCard}>
          {row("business-outline", "Hotel / Property name", user.hotelName)}
          {row("location-outline", "Property address", user.hotelAddress)}
          {row("id-card-outline", "Agent ID", user.agentId)}
        </View>

        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.verificationCard}>
          <View style={[
            styles.verificationIcon,
            { backgroundColor: verified ? "#163D37" : "#493023" },
          ]}>
            <Ionicons
              name={verified ? "checkmark-circle" : "time-outline"}
              size={24}
              color={verified ? "#45D6A1" : "#FFB66D"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verificationTitle}>
              {verified ? "Verified agent" : "Verification pending"}
            </Text>
            <Text style={styles.verificationText}>
              {verified
                ? "Your account is marked as verified."
                : "Your verification status has not been confirmed by an administrator."}
            </Text>
          </View>
        </View>

        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={19} color={CYAN} />
          <Text style={styles.infoText}>
            Profile details are read from your saved registration. Document upload and admin
            verification need to be implemented through the backend.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color="#FF7777" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>Safe Tourism • Agent Portal</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 35 },
  eyebrow: { color: CYAN, fontSize: 10, letterSpacing: 2, fontWeight: "700", marginTop: 8 },
  heading: { color: "white", fontSize: 27, fontWeight: "800", marginTop: 8 },
  subtitle: { color: MUTED, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 22 },
  profileCard: { backgroundColor: CARD, borderRadius: 20, padding: 23, alignItems: "center", borderWidth: 1, borderColor: "#293750" },
  avatar: { width: 76, height: 76, borderRadius: 25, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  name: { color: "white", fontSize: 20, fontWeight: "800" },
  email: { color: MUTED, fontSize: 12, marginTop: 6 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#162940", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, marginTop: 15 },
  roleText: { color: CYAN, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "700", marginTop: 25, marginBottom: 12 },
  detailsCard: { backgroundColor: CARD, borderRadius: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: "#202B42" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#202B42" },
  detailIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: "#162940", alignItems: "center", justifyContent: "center" },
  label: { color: MUTED, fontSize: 10, marginBottom: 5 },
  value: { color: "white", fontSize: 13, fontWeight: "600" },
  verificationCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD, borderRadius: 17, borderWidth: 1, borderColor: "#293750", padding: 15 },
  verificationIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  verificationTitle: { color: "white", fontSize: 13, fontWeight: "700" },
  verificationText: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 5 },
  infoNote: { flexDirection: "row", gap: 9, padding: 13, backgroundColor: "#102135", borderRadius: 13, marginTop: 15 },
  infoText: { color: "#B8C6D8", flex: 1, fontSize: 11, lineHeight: 17 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: "#2A1924", borderRadius: 14, padding: 16, marginTop: 24, borderWidth: 1, borderColor: "#51303B" },
  logoutText: { color: "#FF7777", fontSize: 14, fontWeight: "700" },
  footer: { color: "#59657A", fontSize: 10, textAlign: "center", marginTop: 20 },
});
