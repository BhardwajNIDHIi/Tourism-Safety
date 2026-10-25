
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const BG = "#080D1B";
const CARD = "#111A2D";
const PURPLE = "#6C63FF";
const CYAN = "#00D4FF";
const MUTED = "#8490A8";

const CURRENT_USER_KEY = "safeTourismCurrentUser";

const getAgentTouristsKey = (email: string) =>
  `safeTourismAgentTourists_${email.trim().toLowerCase()}`;

// Indian date format: DD-MM-YYYY
const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

// Accept DD-MM-YYYY and older YYYY-MM-DD records.
const parseDate = (value: string): Date | null => {
  const input = value.trim();
  let day: number;
  let month: number;
  let year: number;

  if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    [day, month, year] = input.split("-").map(Number);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    [year, month, day] = input.split("-").map(Number);
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const isValidDate = (value: string) => parseDate(value) !== null;

type Tourist = {
  id: string;
  name: string;
  phone: string;
  bookingId: string;
  roomNumber: string;
  checkInDate: string;
  checkoutDate: string;
  guestCount: number;
  status: "checked_in" | "checked_out";
  hotelName: string;
  agentEmail: string;
  createdAt: string;
};

export default function TouristCheckIn() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState(
    formatDate(new Date())
  );
  const [checkoutDate, setCheckoutDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [saving, setSaving] = useState(false);

  const field = (
    label: string,
    value: string,
    setter: (value: string) => void,
    placeholder: string,
    options: {
      keyboardType?: "default" | "phone-pad" | "numeric";
      maxLength?: number;
    } = {}
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
        editable={!saving}
      />
    </View>
  );

  const submit = async () => {
    if (saving) return;

    const touristName = name.trim();
    const touristPhone = phone.trim();
    const touristBookingId = bookingId.trim();
    const touristCheckInDate = checkInDate.trim();
    const touristCheckoutDate = checkoutDate.trim();

    if (
      !touristName ||
      !touristPhone ||
      !touristBookingId ||
      !touristCheckInDate
    ) {
      Alert.alert(
        "Missing details",
        "Tourist name, phone, booking ID and check-in date are required."
      );
      return;
    }

    if (touristPhone.replace(/\D/g, "").length < 10) {
      Alert.alert(
        "Invalid phone",
        "Please enter a valid phone number with at least 10 digits."
      );
      return;
    }

    if (!isValidDate(touristCheckInDate)) {
      Alert.alert(
        "Invalid check-in date",
        "Enter a valid date in DD-MM-YYYY format, for example 25-10-2026."
      );
      return;
    }

    if (
      touristCheckoutDate &&
      !isValidDate(touristCheckoutDate)
    ) {
      Alert.alert(
        "Invalid check-out date",
        "Enter a valid date in DD-MM-YYYY format, for example 28-10-2026."
      );
      return;
    }

    // Compare actual dates, not date strings.
    if (touristCheckoutDate) {
      const checkIn = parseDate(touristCheckInDate);
      const checkOut = parseDate(touristCheckoutDate);

      if (
        checkIn &&
        checkOut &&
        checkOut.getTime() < checkIn.getTime()
      ) {
        Alert.alert(
          "Invalid dates",
          "Check-out date cannot be before the check-in date."
        );
        return;
      }
    }

    const numberOfGuests = Number(guestCount);

    if (
      !Number.isInteger(numberOfGuests) ||
      numberOfGuests < 1 ||
      numberOfGuests > 99
    ) {
      Alert.alert(
        "Invalid guest count",
        "Enter a number between 1 and 99."
      );
      return;
    }

    setSaving(true);

    try {
      const currentUserRaw = await AsyncStorage.getItem(
        CURRENT_USER_KEY
      );

      if (!currentUserRaw) {
        Alert.alert(
          "Agent not signed in",
          "Please sign in with your agent account before registering a tourist."
        );
        return;
      }

      let agent: any;

      try {
        agent = JSON.parse(currentUserRaw);
      } catch {
        Alert.alert(
          "Session error",
          "Your saved account session is invalid. Please sign in again."
        );
        return;
      }

      const agentEmail = String(agent?.email || "")
        .trim()
        .toLowerCase();

      const agentRole = String(agent?.role || "")
        .trim()
        .toLowerCase();

      if (!agentEmail || agentRole !== "agent") {
        Alert.alert(
          "Invalid agent session",
          "Please sign in again using your agent account."
        );
        return;
      }

      const storageKey = getAgentTouristsKey(agentEmail);
      const existingRaw = await AsyncStorage.getItem(storageKey);

      let existingRecords: Tourist[] = [];

      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);

        if (!Array.isArray(parsed)) {
          throw new Error(
            "Saved tourist records are not in the expected format."
          );
        }

        existingRecords = parsed;
      }

      const normalizedBookingId =
        touristBookingId.toLowerCase();

      const duplicate = existingRecords.some(
        (tourist) =>
          String(tourist.bookingId || "")
            .trim()
            .toLowerCase() === normalizedBookingId
      );

      if (duplicate) {
        Alert.alert(
          "Duplicate booking ID",
          "This booking ID already exists in your records. Use a different booking ID."
        );
        return;
      }

      const tourist: Tourist = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: touristName,
        phone: touristPhone,
        bookingId: touristBookingId,
        roomNumber: roomNumber.trim(),
        checkInDate: touristCheckInDate,
        checkoutDate: touristCheckoutDate,
        guestCount: numberOfGuests,
        status: "checked_in",
        hotelName: String(
          agent.hotelName || "Your Property"
        ).trim(),
        agentEmail,
        createdAt: new Date().toISOString(),
      };

      const updatedRecords = [tourist, ...existingRecords];

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedRecords)
      );

      const verifyRaw = await AsyncStorage.getItem(storageKey);

      if (!verifyRaw) {
        throw new Error(
          "The saved record could not be verified."
        );
      }

      const verifiedRecords = JSON.parse(verifyRaw);

      const wasSaved =
        Array.isArray(verifiedRecords) &&
        verifiedRecords.some(
          (item: Tourist) => item.id === tourist.id
        );

      if (!wasSaved) {
        throw new Error(
          "The tourist record was not found after saving."
        );
      }

      // Reset form after successful saving.
      setName("");
      setPhone("");
      setBookingId("");
      setRoomNumber("");
      setCheckInDate(formatDate(new Date()));
      setCheckoutDate("");
      setGuestCount("1");

      Alert.alert(
        "Check-in successful",
        `${touristName} has been saved successfully.\n\nTotal records for this agent: ${verifiedRecords.length}`,
        [
          {
            text: "Add another",
            style: "cancel",
          },
          {
            text: "View records",
            onPress: () => {
              router.replace("/(agent)/tourists" as any);
            },
          },
        ]
      );
    } catch (error) {
      console.log("Tourist check-in error:", error);

      Alert.alert(
        "Save failed",
        error instanceof Error
          ? error.message
          : "Could not save the tourist. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerIcon}>
          <Ionicons
            name="person-add-outline"
            size={28}
            color={CYAN}
          />
        </View>

        <Text style={styles.eyebrow}>GUEST MANAGEMENT</Text>
        <Text style={styles.heading}>Tourist Check-in</Text>
        <Text style={styles.subtitle}>
          Enter the guest details carefully.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Personal information
          </Text>

          {field(
            "Tourist full name *",
            name,
            setName,
            "Enter full name"
          )}

          {field(
            "Mobile number *",
            phone,
            setPhone,
            "10-digit phone number",
            {
              keyboardType: "phone-pad",
              maxLength: 15,
            }
          )}

          {field(
            "Booking / Reference ID *",
            bookingId,
            setBookingId,
            "e.g. ST-2026-001"
          )}

          <Text style={styles.helper}>
            Use a unique booking/reference ID for each record.
          </Text>

          <Text
            style={[styles.sectionTitle, { marginTop: 24 }]}
          >
            Stay details
          </Text>

          {field(
            "Room number (optional)",
            roomNumber,
            setRoomNumber,
            "e.g. 204"
          )}

          {field(
            "Check-in date * (DD-MM-YYYY)",
            checkInDate,
            setCheckInDate,
            "25-10-2026",
            { maxLength: 10 }
          )}

          {field(
            "Expected check-out (DD-MM-YYYY)",
            checkoutDate,
            setCheckoutDate,
            "28-10-2026",
            { maxLength: 10 }
          )}

          <Text style={styles.helper}>
            Enter dates as day-month-year, for example 25-10-2026.
          </Text>

          {field(
            "Number of guests",
            guestCount,
            setGuestCount,
            "1",
            {
              keyboardType: "numeric",
              maxLength: 2,
            }
          )}
        </View>

        <View style={styles.privacyNote}>
          <Ionicons
            name="lock-closed-outline"
            size={19}
            color={CYAN}
          />
          <Text style={styles.privacyText}>
            Tourist records are saved locally on this device,
            separately for the signed-in agent. This demo does
            not send these records to MongoDB.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submit,
            saving && styles.submitDisabled,
          ]}
          onPress={submit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="white"
            />
          )}

          <Text style={styles.submitText}>
            {saving ? "Saving..." : "Save Tourist Check-in"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#162940",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  eyebrow: {
    color: CYAN,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
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
    marginTop: 7,
    marginBottom: 22,
  },
  formCard: {
    backgroundColor: CARD,
    padding: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#202B42",
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: "#D9E0ED",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0A1222",
    color: "white",
    borderWidth: 1,
    borderColor: "#293750",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  helper: {
    color: MUTED,
    fontSize: 11,
    marginTop: -7,
    marginBottom: 12,
    lineHeight: 17,
  },
  privacyNote: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "#102135",
    borderRadius: 14,
    marginTop: 17,
  },
  privacyText: {
    color: "#B8C6D8",
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
  submit: {
    backgroundColor: PURPLE,
    borderRadius: 15,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 20,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
