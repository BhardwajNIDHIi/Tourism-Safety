
import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const BG = "#080D1B";
const CARD = "#111A2D";
const PURPLE = "#6C63FF";
const CYAN = "#00D4FF";
const MUTED = "#8490A8";
const KEY = "safeTourismAgentTourists";

export default function TouristCheckIn() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkoutDate, setCheckoutDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [saving, setSaving] = useState(false);

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    options: { keyboardType?: "default" | "phone-pad" | "numeric"; maxLength?: number } = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#65728A"
        keyboardType={options.keyboardType || "default"}
        maxLength={options.maxLength}
        autoCapitalize="none"
      />
    </View>
  );

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !bookingId.trim() || !checkInDate.trim()) {
      Alert.alert("Missing details", "Tourist name, phone, booking ID and check-in date are required.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      Alert.alert("Invalid phone", "Please enter a valid phone number with at least 10 digits.");
      return;
    }
    if (checkoutDate && checkoutDate < checkInDate) {
      Alert.alert("Invalid dates", "Expected check-out date cannot be before check-in date.");
      return;
    }

    setSaving(true);
    try {
      const currentUserRaw = await AsyncStorage.getItem("safeTourismCurrentUser");
      const agent = currentUserRaw ? JSON.parse(currentUserRaw) : {};
      const existingRaw = await AsyncStorage.getItem(KEY);
      const records = existingRaw ? JSON.parse(existingRaw) : [];

      const duplicate = records.some(
        (t: any) => t.bookingId?.toLowerCase() === bookingId.trim().toLowerCase()
      );
      if (duplicate) {
        Alert.alert("Duplicate booking ID", "This booking ID already exists in the records.");
        setSaving(false);
        return;
      }

      const tourist = {
        id: `${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        bookingId: bookingId.trim(),
        roomNumber: roomNumber.trim(),
        checkInDate,
        checkoutDate: checkoutDate.trim(),
        guestCount: Math.max(1, Number(guestCount) || 1),
        status: "checked_in",
        hotelName: agent.hotelName || "Your Property",
        agentEmail: agent.email || "",
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(KEY, JSON.stringify([tourist, ...records]));
      Alert.alert("Check-in successful", `${name.trim()} has been added to tourist records.`, [
        {
          text: "View records",
          onPress: () => router.replace("/(agent)/tourists" as any),
        },
      ]);
      setName("");
      setPhone("");
      setBookingId("");
      setRoomNumber("");
      setCheckoutDate("");
      setGuestCount("1");
    } catch (error) {
      Alert.alert("Error", "Could not save the check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerIcon}>
          <Ionicons name="person-add-outline" size={28} color={CYAN} />
        </View>
        <Text style={styles.eyebrow}>GUEST MANAGEMENT</Text>
        <Text style={styles.heading}>Tourist Check-in</Text>
        <Text style={styles.subtitle}>Enter the guest details carefully.</Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          {field("Tourist full name *", name, setName, "Enter full name")}
          {field("Mobile number *", phone, setPhone, "10-digit phone number", { keyboardType: "phone-pad", maxLength: 15 })}
          {field("Booking / Reference ID *", bookingId, setBookingId, "e.g. ST-2026-001")}
          <Text style={styles.helper}>Use a unique booking/reference ID for each record.</Text>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Stay details</Text>
          {field("Room number (optional)", roomNumber, setRoomNumber, "e.g. 204")}
          {field("Check-in date * (YYYY-MM-DD)", checkInDate, setCheckInDate, "2026-10-21")}
          {field("Expected check-out (YYYY-MM-DD)", checkoutDate, setCheckoutDate, "2026-10-24")}
          {field("Number of guests", guestCount, setGuestCount, "1", { keyboardType: "numeric", maxLength: 2 })}
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={19} color={CYAN} />
          <Text style={styles.privacyText}>
            Only enter information you are authorized to collect. This demo saves records on this device.
          </Text>
        </View>

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={saving}>
          <Ionicons name="checkmark-circle-outline" size={22} color="white" />
          <Text style={styles.submitText}>{saving ? "Saving..." : "Save Tourist Check-in"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 35 },
  headerIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#162940", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  eyebrow: { color: CYAN, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  heading: { color: "white", fontSize: 27, fontWeight: "800", marginTop: 8 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 7, marginBottom: 22 },
  formCard: { backgroundColor: CARD, padding: 17, borderRadius: 20, borderWidth: 1, borderColor: "#202B42" },
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "700", marginBottom: 18 },
  field: { marginBottom: 16 },
  label: { color: "#D9E0ED", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: "#0A1222", color: "white", borderWidth: 1, borderColor: "#293750", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  helper: { color: MUTED, fontSize: 11, marginTop: -7, lineHeight: 17 },
  privacyNote: { flexDirection: "row", gap: 10, padding: 14, backgroundColor: "#102135", borderRadius: 14, marginTop: 17 },
  privacyText: { color: "#B8C6D8", flex: 1, fontSize: 11, lineHeight: 17 },
  submit: { backgroundColor: PURPLE, borderRadius: 15, minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, marginTop: 20 },
  submitText: { color: "white", fontWeight: "700", fontSize: 14 },
});
