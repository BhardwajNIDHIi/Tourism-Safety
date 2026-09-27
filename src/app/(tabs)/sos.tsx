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

type EmergencyType = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const EMERGENCY_TYPES: EmergencyType[] = [
  {
    id: "vehicle",
    title: "Car or Vehicle Issue",
    icon: "car",
  },
  {
    id: "sickness",
    title: "Sickness or Injury",
    icon: "medkit",
  },
  {
    id: "crime",
    title: "Crime",
    icon: "shield",
  },
  {
    id: "lost",
    title: "Lost or Trapped",
    icon: "location",
  },
  {
    id: "fire",
    title: "Fire",
    icon: "flame",
  },
];

export default function SOSScreen() {
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  const [showWhoNeedsHelp, setShowWhoNeedsHelp] =
    useState(false);

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyType | null>(null);

  const [whoNeedsHelp, setWhoNeedsHelp] =
    useState<string>("");

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadContacts();
    getLocation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // -----------------------------
  // LOAD EMERGENCY CONTACTS
  // -----------------------------
  const loadContacts = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(SOS_CONTACTS_KEY);

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
  // START 3 SECOND HOLD
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

        // Direct SOS
        setSelectedEmergency(null);
        setWhoNeedsHelp("Me");
        setShowConfirmation(true);
      }
    }, 300);
  };

  // -----------------------------
  // RELEASE SOS BUTTON
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
  // SELECT EMERGENCY TYPE
  // -----------------------------
  const selectEmergency = (emergency: EmergencyType) => {
    if (!contact1 && !contact2) {
      Alert.alert(
        "Emergency Contacts Required",
        "Please save at least one emergency contact from Settings first."
      );
      return;
    }

    setSelectedEmergency(emergency);
    setWhoNeedsHelp("");
    setShowWhoNeedsHelp(true);
  };

  // -----------------------------
  // SELECT WHO NEEDS HELP
  // -----------------------------
  const selectWhoNeedsHelp = (person: string) => {
    setWhoNeedsHelp(person);
    setShowWhoNeedsHelp(false);
    setShowConfirmation(true);
  };

  // -----------------------------
  // SEND SOS
  // -----------------------------
  const sendSOS = async () => {
    setShowConfirmation(false);

    await getLocation();

    const recipients = [contact1, contact2].filter(Boolean);

    const emergencyName =
      selectedEmergency?.title || "General Emergency";

    const message = `🚨 EMERGENCY SOS ALERT 🚨

Emergency Type: ${emergencyName}

Who needs help: ${whoNeedsHelp || "Me"}

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
              const available =
                await SMS.isAvailableAsync();

              if (!available) {
                Alert.alert(
                  "SMS Unavailable",
                  "SMS is not available on this device."
                );
                return;
              }

              await SMS.sendSMSAsync(
                recipients,
                message
              );
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
  // WHO NEEDS HELP SCREEN
  // -----------------------------
  if (showWhoNeedsHelp) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.confirmScroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowWhoNeedsHelp(false);
              setSelectedEmergency(null);
            }}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="warning"
                size={25}
                color="#FF5368"
              />
            </View>

            <View>
              <Text style={styles.headerTitle}>
                Emergency Details
              </Text>

              <Text style={styles.headerSubtitle}>
                Tell us who needs help
              </Text>
            </View>
          </View>

          {/* SELECTED EMERGENCY */}
          <View style={styles.selectedEmergencyCard}>
            <View style={styles.selectedEmergencyIcon}>
              <Ionicons
                name={
                  selectedEmergency?.icon || "warning"
                }
                size={25}
                color="#FF5368"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>
                EMERGENCY TYPE
              </Text>

              <Text style={styles.selectedEmergencyTitle}>
                {selectedEmergency?.title}
              </Text>
            </View>
          </View>

          <Text style={styles.questionTitle}>
            Who needs help?
          </Text>

          <Text style={styles.questionSubtitle}>
            Select the person or people who need emergency
            assistance.
          </Text>

          {/* ME */}
          <TouchableOpacity
            style={styles.personOption}
            activeOpacity={0.8}
            onPress={() =>
              selectWhoNeedsHelp("Me")
            }
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name="person"
                size={25}
                color="#00D4FF"
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Me
              </Text>

              <Text style={styles.optionSubtitle}>
                I need emergency assistance
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={21}
              color="#71839F"
            />
          </TouchableOpacity>

          {/* SOMEONE ELSE */}
          <TouchableOpacity
            style={styles.personOption}
            activeOpacity={0.8}
            onPress={() =>
              selectWhoNeedsHelp("Someone Else")
            }
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name="person-add"
                size={25}
                color="#00D4FF"
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Someone Else
              </Text>

              <Text style={styles.optionSubtitle}>
                Another person needs help
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={21}
              color="#71839F"
            />
          </TouchableOpacity>

          {/* MULTIPLE PEOPLE */}
          <TouchableOpacity
            style={styles.personOption}
            activeOpacity={0.8}
            onPress={() =>
              selectWhoNeedsHelp("Multiple People")
            }
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name="people"
                size={25}
                color="#00D4FF"
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Multiple People
              </Text>

              <Text style={styles.optionSubtitle}>
                More than one person needs help
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={21}
              color="#71839F"
            />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              emergency details and current location.
            </Text>

            {/* EMERGENCY TYPE */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Ionicons
                  name={
                    selectedEmergency?.icon ||
                    "warning"
                  }
                  size={21}
                  color="#FF5368"
                />

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>
                    Emergency Type
                  </Text>

                  <Text style={styles.infoValue}>
                    {selectedEmergency?.title ||
                      "General Emergency"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Ionicons
                  name="people"
                  size={21}
                  color="#00D4FF"
                />

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>
                    Who Needs Help
                  </Text>

                  <Text style={styles.infoValue}>
                    {whoNeedsHelp || "Me"}
                  </Text>
                </View>
              </View>
            </View>

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
                      )}, ${location.coords.longitude.toFixed(
                        5
                      )}`
                    : "Location unavailable"}
                </Text>
              </View>
            </View>

            {/* SEND */}
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

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowConfirmation(false);
                setSelectedEmergency(null);
                setWhoNeedsHelp("");
              }}
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

        {/* DIVIDER */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />

          <Text style={styles.orText}>
            OR
          </Text>

          <View style={styles.orLine} />
        </View>

        {/* EMERGENCY TYPE SECTION */}
        <View style={styles.emergencySection}>
          <Text style={styles.emergencySectionTitle}>
            What's the emergency?
          </Text>

          <Text style={styles.emergencySectionSubtitle}>
            Choose what is happening to get the right
            emergency response.
          </Text>

          <View style={styles.emergencyGrid}>
            {EMERGENCY_TYPES.map((emergency) => (
              <TouchableOpacity
                key={emergency.id}
                style={styles.emergencyCard}
                activeOpacity={0.8}
                onPress={() =>
                  selectEmergency(emergency)
                }
              >
                <View style={styles.emergencyIcon}>
                  <Ionicons
                    name={emergency.icon}
                    size={24}
                    color="#00D4FF"
                  />
                </View>

                <Text style={styles.emergencyTitle}>
                  {emergency.title}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color="#71839F"
                  style={styles.emergencyArrow}
                />
              </TouchableOpacity>
            ))}
          </View>
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
            Hold SOS for 3 seconds for an immediate
            emergency alert, or select the emergency
            type below.
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
    marginBottom: 22,
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

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1A2A43",
  },

  orText: {
    color: "#52657F",
    fontSize: 11,
    fontWeight: "800",
    marginHorizontal: 12,
  },

  emergencySection: {
    marginBottom: 20,
  },

  emergencySectionTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 5,
  },

  emergencySectionSubtitle: {
    color: "#71839F",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },

  emergencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  emergencyCard: {
    width: "48.3%",
    minHeight: 112,
    backgroundColor: "#0D182A",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1A2A43",
    padding: 13,
    marginBottom: 12,
    position: "relative",
  },

  emergencyIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#102039",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emergencyTitle: {
    color: "#DCE5F2",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    paddingRight: 15,
  },

  emergencyArrow: {
    position: "absolute",
    right: 11,
    bottom: 12,
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

  // -----------------------------
  // WHO NEEDS HELP
  // -----------------------------

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#101C32",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1D3150",
  },

  selectedEmergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D182A",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#1A2A43",
    marginBottom: 28,
  },

  selectedEmergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#301824",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  smallLabel: {
    color: "#71839F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  selectedEmergencyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  questionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },

  questionSubtitle: {
    color: "#71839F",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },

  personOption: {
    minHeight: 82,
    backgroundColor: "#0D182A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1A2A43",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#102039",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  optionTextContainer: {
    flex: 1,
  },

  optionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  optionSubtitle: {
    color: "#71839F",
    fontSize: 11,
    marginTop: 4,
  },

  // -----------------------------
  // CONFIRMATION
  // -----------------------------

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

  summaryBox: {
    backgroundColor: "#0A1322",
    borderRadius: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: "#18283F",
    marginBottom: 13,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
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