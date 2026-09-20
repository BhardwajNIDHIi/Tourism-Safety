
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { Ionicons } from "@expo/vector-icons";

const SOS_CONTACTS_KEY = "sosEmergencyContacts";

export default function SOSScreen() {
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -----------------------------
  // LOAD EMERGENCY CONTACTS
  // -----------------------------
  useEffect(() => {
    loadContacts();
    getLocation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem(SOS_CONTACTS_KEY);

      if (saved) {
        const data = JSON.parse(saved);

        setContact1(data.contact1 || "");
        setContact2(data.contact2 || "");
      }
    } catch (error) {
      console.log("Contact loading error:", error);
    }
  };

  // -----------------------------
  // GET CURRENT LOCATION
  // -----------------------------
  const getLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);
    } catch (error) {
      console.log("Location error:", error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // LOCATION MESSAGE
  // -----------------------------
  const getLocationMessage = () => {
    if (!location) {
      return "📍 Location unavailable";
    }

    return `📍 My Current Location:
Latitude: ${location.coords.latitude.toFixed(6)}
Longitude: ${location.coords.longitude.toFixed(6)}`;
  };

  // -----------------------------
  // START HOLD
  // -----------------------------
  const handlePressIn = () => {
    if (!contact1 && !contact2) {
      Alert.alert(
        "Emergency Contacts Required",
        "Please save at least one emergency contact from Settings first."
      );
      return;
    }

    setHolding(true);
    setProgress(0);

    let currentProgress = 0;

    intervalRef.current = setInterval(() => {
      currentProgress += 10;

      setProgress(currentProgress);

      if (currentProgress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        setHolding(false);
        setProgress(0);

        Vibration.vibrate(500);

        setShowConfirmation(true);
      }
    }, 300);
  };

  // -----------------------------
  // RELEASE BUTTON
  // -----------------------------
  const handlePressOut = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (progress < 100) {
      setProgress(0);
      setHolding(false);
    }
  };

  // -----------------------------
  // SEND SOS
  // -----------------------------
  const sendSOS = async () => {
    setShowConfirmation(false);

    await getLocation();

    const recipients = [contact1, contact2].filter(Boolean);

    const message = `🚨 EMERGENCY SOS ALERT 🚨

I need immediate help.

This is an emergency alert from Safe Tourism.

${getLocationMessage()}

Please contact me immediately.

— Safe Tourism App`;

    Alert.alert(
      "SOS Ready",
      "Choose how you want to send the emergency alert.",
      [
        {
          text: "SEND SMS",
          onPress: async () => {
            try {
              const available = await SMS.isAvailableAsync();

              if (!available) {
                Alert.alert(
                  "SMS Unavailable",
                  "SMS is not available on this device."
                );
                return;
              }

              await SMS.sendSMSAsync(recipients, message);
            } catch (error) {
              Alert.alert(
                "SMS Error",
                "Unable to open SMS."
              );
            }
          },
        },
        {
          text: "CALL 112",
          onPress: () => {
            Linking.openURL("tel:112");
          },
        },
        {
          text: "CANCEL",
          style: "cancel",
        },
      ]
    );
  };

  // -----------------------------
  // CONFIRMATION SCREEN
  // -----------------------------
  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.confirmScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="shield-checkmark"
                size={25}
                color="#00D4FF"
              />
            </View>

            <View>
              <Text style={styles.headerTitle}>
                Emergency SOS
              </Text>

              <Text style={styles.headerSubtitle}>
                Confirm emergency alert
              </Text>
            </View>
          </View>

          {/* CONFIRM CARD */}
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons
                name="warning"
                size={34}
                color="#FF5368"
              />
            </View>

            <Text style={styles.confirmTitle}>
              Send Emergency Alert?
            </Text>

            <Text style={styles.confirmDescription}>
              Your emergency contacts will receive your
              current location and SOS message.
            </Text>

            {/* CONTACTS */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person"
                  size={20}
                  color="#00D4FF"
                />

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>
                    Emergency Contact 1
                  </Text>

                  <Text style={styles.infoValue}>
                    {contact1 || "Not saved"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons
                  name="person"
                  size={20}
                  color="#00D4FF"
                />

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>
                    Emergency Contact 2
                  </Text>

                  <Text style={styles.infoValue}>
                    {contact2 || "Not saved"}
                  </Text>
                </View>
              </View>
            </View>

            {/* LOCATION */}
            <View style={styles.locationBox}>
              <Ionicons
                name="location"
                size={22}
                color="#00D4FF"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>
                  Current Location
                </Text>

                <Text style={styles.locationText}>
                  {location
                    ? `${location.coords.latitude.toFixed(
                        5
                      )}, ${location.coords.longitude.toFixed(5)}`
                    : "Location unavailable"}
                </Text>
              </View>
            </View>

            {/* ACTION BUTTON */}
            <TouchableOpacity
              style={styles.sendButton}
              activeOpacity={0.85}
              onPress={sendSOS}
            >
              <Ionicons
                name="send"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.sendButtonText}>
                SEND SOS ALERT
              </Text>
            </TouchableOpacity>

            {/* CANCEL */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowConfirmation(false)}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -----------------------------
  // MAIN SOS SCREEN
  // -----------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="shield"
              size={25}
              color="#00D4FF"
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>
              Emergency SOS
            </Text>

            <Text style={styles.headerSubtitle}>
              Safe Tourism Emergency System
            </Text>
          </View>
        </View>

        {/* STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>
            Emergency system ready
          </Text>

          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#39D98A"
          />
        </View>

        {/* SOS BUTTON */}
        <View style={styles.sosSection}>
          <Text style={styles.helpText}>
            Need immediate help?
          </Text>

          <Text style={styles.instruction}>
            Press and hold the button for 3 seconds
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.sosOuter}
          >
            <View style={styles.sosMiddle}>
              <View style={styles.sosButton}>
                {holding ? (
                  <Text style={styles.progressText}>
                    {progress}%
                  </Text>
                ) : (
                  <>
                    <Ionicons
                      name="warning"
                      size={43}
                      color="#FFFFFF"
                    />

                    <Text style={styles.sosText}>
                      SOS
                    </Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.holdText}>
            {holding
              ? "Keep holding..."
              : "Hold for 3 seconds"}
          </Text>
        </View>

        {/* CONTACT STATUS */}
        <View style={styles.contactsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="people"
                size={21}
                color="#00D4FF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                Emergency Contacts
              </Text>

              <Text style={styles.cardSubtitle}>
                Contacts saved in Settings
              </Text>
            </View>

            <Ionicons
              name={
                contact1 || contact2
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={22}
              color={
                contact1 || contact2
                  ? "#39D98A"
                  : "#FFB547"
              }
            />
          </View>

          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <Ionicons
                name="person-circle"
                size={27}
                color="#8FA3BF"
              />

              <Text style={styles.contactNumber}>
                {contact1 || "Not saved"}
              </Text>
            </View>

            <View style={styles.contactItem}>
              <Ionicons
                name="person-circle"
                size={27}
                color="#8FA3BF"
              />

              <Text style={styles.contactNumber}>
                {contact2 || "Not saved"}
              </Text>
            </View>
          </View>
        </View>

        {/* LOCATION CARD */}
        <View style={styles.locationCard}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="location"
              size={21}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              Live Location
            </Text>

            <Text style={styles.cardSubtitle}>
              {loading
                ? "Getting your location..."
                : location
                ? "Location ready to share"
                : "Location unavailable"}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator
              size="small"
              color="#00D4FF"
            />
          ) : (
            <Ionicons
              name={
                location
                  ? "checkmark-circle"
                  : "close-circle"
              }
              size={22}
              color={
                location
                  ? "#39D98A"
                  : "#FF5368"
              }
            />
          )}
        </View>

        {/* INFO */}
        <View style={styles.infoNotice}>
          <Ionicons
            name="information-circle"
            size={21}
            color="#8FA3BF"
          />

          <Text style={styles.noticeText}>
            Your emergency contacts and current location
            will be shown before sending the SOS alert.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },

  confirmScroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#101C32",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    borderWidth: 1,
    borderColor: "#1D3150",
    marginTop: 39,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 39,
  },

  headerSubtitle: {
    color: "#71839F",
    fontSize: 12,
    marginTop: 3,
  },

  statusCard: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: "#0D182A",
    borderWidth: 1,
    borderColor: "#1A2A43",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#39D98A",
    marginRight: 10,
  },

  statusText: {
    flex: 1,
    color: "#B9C7DA",
    fontSize: 13,
    fontWeight: "600",
  },

  sosSection: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 28,
  },

  helpText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 5,
  },

  instruction: {
    color: "#71839F",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 22,
  },

  sosOuter: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#321724",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5B2635",
  },

  sosMiddle: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: "#521D2B",
    alignItems: "center",
    justifyContent: "center",
  },

  sosButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FF5368",
    alignItems: "center",
    justifyContent: "center",
    elevation: 15,
    shadowColor: "#FF5368",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  sosText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 2,
  },

  progressText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  holdText: {
    color: "#FF7181",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 15,
    letterSpacing: 0.5,
  },

  contactsCard: {
    backgroundColor: "#0D182A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1A2A43",
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#102039",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cardSubtitle: {
    color: "#71839F",
    fontSize: 11,
    marginTop: 3,
  },

  contactList: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#1A2A43",
    paddingTop: 8,
  },

  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },

  contactNumber: {
    color: "#C5D1E1",
    fontSize: 13,
    marginLeft: 10,
  },

  locationCard: {
    minHeight: 72,
    backgroundColor: "#0D182A",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#1A2A43",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  infoNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#0B1424",
    borderRadius: 15,
    padding: 14,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#17263D",
  },

  noticeText: {
    flex: 1,
    color: "#71839F",
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 10,
  },

  // CONFIRMATION PAGE

  confirmCard: {
    backgroundColor: "#0D182A",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1A2A43",
    marginTop: 10,
  },

  confirmIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#301824",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  confirmTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  confirmDescription: {
    color: "#71839F",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },

  infoBox: {
    backgroundColor: "#0A1322",
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: "#18283F",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },

  infoTextContainer: {
    marginLeft: 11,
    flex: 1,
  },

  infoLabel: {
    color: "#71839F",
    fontSize: 10,
    marginBottom: 3,
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#18283F",
    marginVertical: 7,
  },

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1322",
    borderRadius: 15,
    padding: 14,
    marginTop: 13,
    borderWidth: 1,
    borderColor: "#18283F",
  },

  locationTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  locationText: {
    color: "#71839F",
    fontSize: 11,
    marginTop: 4,
  },

  sendButton: {
    height: 55,
    borderRadius: 15,
    backgroundColor: "#FF5368",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    gap: 9,
    elevation: 8,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },

  cancelText: {
    color: "#71839F",
    fontSize: 13,
    fontWeight: "600",
  },
});

