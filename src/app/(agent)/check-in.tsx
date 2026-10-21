
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "agentCheckInRecords";

type CheckInRecord = {
  id: string;
  touristName: string;
  phone: string;
  hotelName: string;
  status: string;
  createdAt: string;
};

export default function AgentCheckInScreen() {
  const [touristName, setTouristName] = useState("");
  const [phone, setPhone] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [saving, setSaving] = useState(false);

  const saveCheckIn = async () => {
    if (
      !touristName.trim() ||
      !phone.trim() ||
      !hotelName.trim()
    ) {
      Alert.alert(
        "Required Details",
        "Please enter the tourist name, phone number and hotel name."
      );
      return;
    }

    if (!/^\d{10,15}$/.test(phone.trim())) {
      Alert.alert(
        "Invalid Phone",
        "Enter a phone number containing 10 to 15 digits."
      );
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: CheckInRecord[] = stored
        ? JSON.parse(stored)
        : [];

      const newRecord: CheckInRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        touristName: touristName.trim(),
        phone: phone.trim(),
        hotelName: hotelName.trim(),
        status: "Check-in recorded",
        createdAt: new Date().toISOString(),
      };

      // Optional booking reference is kept in the record too.
      const recordWithBooking = {
        ...newRecord,
        bookingReference: bookingReference.trim(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([recordWithBooking, ...existing])
      );

      Alert.alert(
        "Check-in Saved",
        "Tourist check-in details have been saved on this device.",
        [
          {
            text: "View Records",
            onPress: () => router.replace("/(agent)/records"),
          },
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Save Failed",
        "Unable to save this record. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>Agent Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.iconBox}>
          <Ionicons name="person-add" size={31} color="#00D4FF" />
        </View>

        <Text style={styles.title}>Tourist Check-in</Text>
        <Text style={styles.subtitle}>
          Add a guest's stay information to the register.
        </Text>

        <View style={styles.notice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#00D4FF"
          />
          <Text style={styles.noticeText}>
            Enter accurate information and obtain the guest's
            consent before recording their personal details.
          </Text>
        </View>

        <Text style={styles.label}>TOURIST FULL NAME *</Text>
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#8B95AA" />
          <TextInput
            style={styles.input}
            placeholder="Enter tourist name"
            placeholderTextColor="#707B90"
            value={touristName}
            onChangeText={setTouristName}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.label}>PHONE NUMBER *</Text>
        <View style={styles.inputBox}>
          <Ionicons name="call-outline" size={20} color="#8B95AA" />
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor="#707B90"
            value={phone}
            onChangeText={(value) =>
              setPhone(value.replace(/\D/g, "").slice(0, 15))
            }
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        <Text style={styles.label}>HOTEL / PROPERTY NAME *</Text>
        <View style={styles.inputBox}>
          <Ionicons
            name="business-outline"
            size={20}
            color="#8B95AA"
          />
          <TextInput
            style={styles.input}
            placeholder="Enter hotel name"
            placeholderTextColor="#707B90"
            value={hotelName}
            onChangeText={setHotelName}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.label}>
          BOOKING REFERENCE (OPTIONAL)
        </Text>
        <View style={styles.inputBox}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color="#8B95AA"
          />
          <TextInput
            style={styles.input}
            placeholder="Booking or reservation ID"
            placeholderTextColor="#707B90"
            value={bookingReference}
            onChangeText={setBookingReference}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={saveCheckIn}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={21}
                color="#FFFFFF"
              />
              <Text style={styles.saveText}>Save Check-in</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Demo storage only · Cross-device sync requires a backend.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#080D1B" },
  container: { padding: 23, paddingTop: 25, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", gap: 10 },
  backText: { color: "#DCE5F3", fontSize: 13, fontWeight: "600" },
  iconBox: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: "#11243A",
    borderWidth: 1,
    borderColor: "#25425A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 20,
  },
  subtitle: {
    color: "#9BA6BB",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  notice: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "#102137",
    borderRadius: 13,
    marginTop: 23,
  },
  noticeText: {
    flex: 1,
    color: "#B6C7DB",
    fontSize: 11,
    lineHeight: 18,
  },
  label: {
    color: "#B9C4D8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 10,
  },
  inputBox: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#27334A",
    borderRadius: 13,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 14,
  },
  saveButton: {
    minHeight: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#635BEE",
    borderRadius: 14,
    marginTop: 30,
  },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footer: {
    color: "#7F8CA4",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 18,
  },
});