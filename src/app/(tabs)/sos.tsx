import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { Ionicons } from "@expo/vector-icons";

const SOS_CONTACTS_KEY = "sosEmergencyContacts";

type EmergencyType =
  | "vehicle"
  | "sickness"
  | "crime"
  | "lost"
  | "fire";

type WhoNeedsHelp =
  | "Me"
  | "Someone Else"
  | "Multiple People";

type EmergencyOption = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const EMERGENCY_TYPES: {
  id: EmergencyType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "vehicle",
    title: "Car / Vehicle",
    subtitle: "Vehicle problem",
    icon: "car-outline",
  },
  {
    id: "sickness",
    title: "Sickness / Injury",
    subtitle: "Medical emergency",
    icon: "medkit-outline",
  },
  {
    id: "crime",
    title: "Crime",
    subtitle: "Safety / crime issue",
    icon: "shield-outline",
  },
  {
    id: "lost",
    title: "Lost / Trapped",
    subtitle: "Need help finding a way",
    icon: "location-outline",
  },
  {
    id: "fire",
    title: "Fire",
    subtitle: "Fire or smoke",
    icon: "flame-outline",
  },
];

const EMERGENCY_OPTIONS: Record<
  EmergencyType,
  EmergencyOption[]
> = {
  vehicle: [
    {
      id: "tyre",
      title: "Tyre puncture",
      icon: "ellipse-outline",
    },
    {
      id: "fuel",
      title: "Out of fuel",
      icon: "water-outline",
    },
    {
      id: "breakdown",
      title: "Vehicle breakdown",
      icon: "construct-outline",
    },
    {
      id: "accident",
      title: "Vehicle accident",
      icon: "warning-outline",
    },
    {
      id: "keys",
      title: "Lost / locked keys",
      icon: "key-outline",
    },
    {
      id: "other",
      title: "Other vehicle problem",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ],

  sickness: [
    {
      id: "injury",
      title: "Serious injury",
      icon: "bandage-outline",
    },
    {
      id: "unconscious",
      title: "Person unconscious",
      icon: "person-outline",
    },
    {
      id: "breathing",
      title: "Breathing difficulty",
      icon: "pulse-outline",
    },
    {
      id: "pain",
      title: "Severe pain",
      icon: "heart-outline",
    },
    {
      id: "illness",
      title: "Sudden illness",
      icon: "medkit-outline",
    },
    {
      id: "other",
      title: "Other medical issue",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ],

  crime: [
    {
      id: "theft",
      title: "Theft / Robbery",
      icon: "wallet-outline",
    },
    {
      id: "harassment",
      title: "Harassment",
      icon: "warning-outline",
    },
    {
      id: "assault",
      title: "Assault",
      icon: "hand-left-outline",
    },
    {
      id: "threat",
      title: "Threat / Danger",
      icon: "alert-circle-outline",
    },
    {
      id: "suspicious",
      title: "Suspicious activity",
      icon: "eye-outline",
    },
    {
      id: "other",
      title: "Other crime",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ],

  lost: [
    {
      id: "lost",
      title: "I am lost",
      icon: "map-outline",
    },
    {
      id: "trapped",
      title: "I am trapped",
      icon: "lock-closed-outline",
    },
    {
      id: "unsafe",
      title: "Stuck in unsafe area",
      icon: "warning-outline",
    },
    {
      id: "separated",
      title: "Separated from group",
      icon: "people-outline",
    },
    {
      id: "other",
      title: "Other situation",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ],

  fire: [
    {
      id: "building",
      title: "Building / Hotel fire",
      icon: "business-outline",
    },
    {
      id: "vehicle",
      title: "Vehicle fire",
      icon: "car-outline",
    },
    {
      id: "forest",
      title: "Forest / Outdoor fire",
      icon: "leaf-outline",
    },
    {
      id: "smoke",
      title: "Smoke / Possible fire",
      icon: "cloud-outline",
    },
    {
      id: "other",
      title: "Other fire situation",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ],
};

export default function SOSScreen() {
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationAddress, setLocationAddress] = useState("");

  const [loading, setLoading] = useState(true);

  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  const [showEmergencyTypes, setShowEmergencyTypes] =
    useState(false);

  const [showEmergencyDetails, setShowEmergencyDetails] =
    useState(false);

  const [showWhoNeedsHelp, setShowWhoNeedsHelp] =
    useState(false);

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyType | null>(null);

  const [selectedEmergencyDetail, setSelectedEmergencyDetail] =
    useState("");

  const [customDetails, setCustomDetails] = useState("");

  const [whoNeedsHelp, setWhoNeedsHelp] =
    useState<WhoNeedsHelp>("Me");

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

  // ----------------------------------------------------
  // LOAD CONTACTS
  // ----------------------------------------------------

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        SOS_CONTACTS_KEY
      );

      if (saved) {
        const data = JSON.parse(saved);

        setContact1(data.contact1 || "");
        setContact2(data.contact2 || "");
      }
    } catch (error) {
      console.log("Contact loading error:", error);
    }
  };

  // ----------------------------------------------------
  // GET CURRENT LOCATION
  // ----------------------------------------------------

  const getLocation =
    async (): Promise<Location.LocationObject | null> => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocation(null);
          setLocationAddress("");
          return null;
        }

        const currentLocation =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        setLocation(currentLocation);

        try {
          const address =
            await Location.reverseGeocodeAsync({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

          if (address.length > 0) {
            const place = address[0];

            const parts = [
              place.name,
              place.street,
              place.district,
              place.city,
              place.region,
            ].filter(Boolean);

            setLocationAddress(parts.join(", "));
          }
        } catch (addressError) {
          console.log(
            "Address error:",
            addressError
          );
        }

        return currentLocation;
      } catch (error) {
        console.log("Location error:", error);
        return null;
      } finally {
        setLoading(false);
      }
    };

  // ----------------------------------------------------
  // LOCATION TEXT
  // ----------------------------------------------------

  const getLocationText = (
    currentLocation: Location.LocationObject | null
  ) => {
    if (!currentLocation) {
      return "Location unavailable";
    }

    const latitude =
      currentLocation.coords.latitude.toFixed(6);

    const longitude =
      currentLocation.coords.longitude.toFixed(6);

    return `Latitude: ${latitude}
Longitude: ${longitude}`;
  };

  // ----------------------------------------------------
  // GOOGLE MAP LINK
  // ----------------------------------------------------

  const getGoogleMapsLink = (
    currentLocation: Location.LocationObject | null
  ) => {
    if (!currentLocation) {
      return "";
    }

    const latitude =
      currentLocation.coords.latitude;

    const longitude =
      currentLocation.coords.longitude;

    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  };

  // ----------------------------------------------------
  // CHECK CONTACTS
  // ----------------------------------------------------

  const checkContacts = () => {
    if (!contact1 && !contact2) {
      Alert.alert(
        "Emergency Contacts Required",
        "Please save at least one emergency contact from Settings first."
      );

      return false;
    }

    return true;
  };

  // ----------------------------------------------------
  // START 3 SECOND SOS
  // ----------------------------------------------------

  const handlePressIn = () => {
    if (!checkContacts()) {
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

        // Immediate SOS
        setSelectedEmergency(null);
        setSelectedEmergencyDetail("Immediate SOS");
        setCustomDetails("");
        setWhoNeedsHelp("Me");

        setShowConfirmation(true);
      }
    }, 300);
  };

  // ----------------------------------------------------
  // RELEASE SOS BUTTON
  // ----------------------------------------------------

  const handlePressOut = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (progress < 100) {
      setProgress(0);
      setHolding(false);
    }
  };

  // ----------------------------------------------------
  // START CATEGORY FLOW
  // ----------------------------------------------------

  const openEmergencyTypes = () => {
    if (!checkContacts()) {
      return;
    }

    setShowEmergencyTypes(true);
    setShowEmergencyDetails(false);
    setShowWhoNeedsHelp(false);
    setShowConfirmation(false);
  };

  // ----------------------------------------------------
  // SELECT EMERGENCY TYPE
  // ----------------------------------------------------

  const selectEmergencyType = (
    type: EmergencyType
  ) => {
    setSelectedEmergency(type);
    setSelectedEmergencyDetail("");
    setCustomDetails("");

    setShowEmergencyTypes(false);
    setShowEmergencyDetails(true);

    // Refresh location immediately
    getLocation();
  };

  // ----------------------------------------------------
  // SELECT EMERGENCY DETAIL
  // ----------------------------------------------------

  const selectEmergencyDetail = (
    option: EmergencyOption
  ) => {
    setSelectedEmergencyDetail(option.title);

    if (option.id === "other") {
      return;
    }

    setShowEmergencyDetails(false);
    setShowWhoNeedsHelp(true);
  };

  // ----------------------------------------------------
  // CONTINUE OTHER DETAILS
  // ----------------------------------------------------

  const continueCustomDetails = () => {
    if (!customDetails.trim()) {
      Alert.alert(
        "Details Required",
        "Please briefly describe what happened."
      );
      return;
    }

    setShowEmergencyDetails(false);
    setShowWhoNeedsHelp(true);
  };

  // ----------------------------------------------------
  // SELECT WHO NEEDS HELP
  // ----------------------------------------------------

  const selectWhoNeedsHelp = (
    value: WhoNeedsHelp
  ) => {
    setWhoNeedsHelp(value);

    setShowWhoNeedsHelp(false);
    setShowConfirmation(true);
  };

  // ----------------------------------------------------
  // GET EMERGENCY NAME
  // ----------------------------------------------------

  const getEmergencyName = () => {
    if (!selectedEmergency) {
      return "Immediate SOS";
    }

    const emergency = EMERGENCY_TYPES.find(
      (item) => item.id === selectedEmergency
    );

    return emergency?.title || "Emergency";
  };

  // ----------------------------------------------------
  // GET FINAL DETAIL
  // ----------------------------------------------------

  const getFinalDetail = () => {
    if (selectedEmergencyDetail) {
      if (
        selectedEmergencyDetail.toLowerCase().includes("other")
      ) {
        return customDetails.trim() || selectedEmergencyDetail;
      }

      return selectedEmergencyDetail;
    }

    return "Immediate SOS";
  };

  // ----------------------------------------------------
  // CALL 112
  // ----------------------------------------------------

  const call112 = async () => {
    try {
      const supported = await Linking.canOpenURL(
        "tel:112"
      );

      if (!supported) {
        Alert.alert(
          "Unable to Call",
          "Calling is not available on this device."
        );
        return;
      }

      await Linking.openURL("tel:112");
    } catch (error) {
      Alert.alert(
        "Call Error",
        "Unable to open the emergency call."
      );
    }
  };

  // ----------------------------------------------------
  // FIND NEARBY POLICE
  // ----------------------------------------------------

  const findNearbyPolice = async () => {
    if (!location) {
      const currentLocation = await getLocation();

      if (!currentLocation) {
        Alert.alert(
          "Location Unavailable",
          "Please enable location permission first."
        );
        return;
      }

      const latitude =
        currentLocation.coords.latitude;

      const longitude =
        currentLocation.coords.longitude;

      const url =
        `https://www.google.com/maps/search/?api=1&query=` +
        `police+station+near+${latitude},${longitude}`;

      Linking.openURL(url);
      return;
    }

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      `police+station+near+${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Maps Error",
        "Unable to open Google Maps."
      );
    }
  };

  // ----------------------------------------------------
  // SEND SOS
  // ----------------------------------------------------

  const sendSOS = async () => {
    if (!checkContacts()) {
      return;
    }

    setShowConfirmation(false);

    const currentLocation = await getLocation();

    const recipients = [
      contact1,
      contact2,
    ].filter(Boolean);

    const emergencyName = getEmergencyName();
    const emergencyDetail = getFinalDetail();

    const locationText =
      getLocationText(currentLocation);

    const mapsLink =
      getGoogleMapsLink(currentLocation);

    const addressText =
      locationAddress || "Address unavailable";

    const message = `🚨 SAFE TOURISM SOS ALERT 🚨

EMERGENCY TYPE:
${emergencyName}

WHAT HAPPENED:
${emergencyDetail}

WHO NEEDS HELP:
${whoNeedsHelp}

📍 CURRENT LOCATION:
${locationText}

📌 ADDRESS:
${addressText}

🗺️ LIVE LOCATION:
${mapsLink || "Location link unavailable"}

Please contact me immediately.

This emergency alert was generated by Safe Tourism App.`;

    Alert.alert(
      "SOS READY",
      "Choose how you want to respond.",
      [
        {
          text: "SEND SOS SMS",
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
              console.log("SMS error:", error);

              Alert.alert(
                "SMS Error",
                "Unable to open the emergency SMS."
              );
            }
          },
        },
        {
          text: "CALL 112",
          onPress: call112,
        },
        {
          text: "FIND NEARBY POLICE",
          onPress: findNearbyPolice,
        },
        {
          text: "CANCEL",
          style: "cancel",
        },
      ]
    );
  };

  // ----------------------------------------------------
  // RESET FLOW
  // ----------------------------------------------------

  const resetFlow = () => {
    setShowEmergencyTypes(false);
    setShowEmergencyDetails(false);
    setShowWhoNeedsHelp(false);
    setShowConfirmation(false);

    setSelectedEmergency(null);
    setSelectedEmergencyDetail("");
    setCustomDetails("");
    setWhoNeedsHelp("Me");
  };

  // ====================================================
  // EMERGENCY TYPE SCREEN
  // ====================================================

  if (showEmergencyTypes) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetFlow}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>
                What's the Emergency?
              </Text>

              <Text style={styles.headerSubtitle}>
                Select what happened
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>
              STEP 1
            </Text>

            <Text style={styles.stepTitle}>
              Tell us what happened
            </Text>

            <Text style={styles.stepSubtitle}>
              Choose the emergency category
            </Text>
          </View>

          <View style={styles.categoryGrid}>
            {EMERGENCY_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.categoryCard}
                onPress={() =>
                  selectEmergencyType(item.id)
                }
                activeOpacity={0.8}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={item.icon}
                    size={30}
                    color="#00D4FF"
                  />
                </View>

                <Text style={styles.categoryTitle}>
                  {item.title}
                </Text>

                <Text style={styles.categorySubtitle}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ====================================================
  // EMERGENCY DETAILS SCREEN
  // ====================================================

  if (showEmergencyDetails && selectedEmergency) {
    const selectedType = EMERGENCY_TYPES.find(
      (item) => item.id === selectedEmergency
    );

    const options =
      EMERGENCY_OPTIONS[selectedEmergency];

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowEmergencyDetails(false);
                setShowEmergencyTypes(true);
              }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {selectedType?.title}
              </Text>

              <Text style={styles.headerSubtitle}>
                What exactly happened?
              </Text>
            </View>
          </View>

          {selectedEmergency === "lost" && (
            <View style={styles.locationHighlight}>
              <View style={styles.locationIcon}>
                <Ionicons
                  name="navigate"
                  size={25}
                  color="#00D4FF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.locationHighlightTitle}>
                  Your Current Location
                </Text>

                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#00D4FF"
                    style={{
                      alignSelf: "flex-start",
                      marginTop: 8,
                    }}
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.locationHighlightText
                      }
                    >
                      {locationAddress ||
                        "Location address unavailable"}
                    </Text>

                    {location && (
                      <Text
                        style={
                          styles.coordinatesText
                        }
                      >
                        {location.coords.latitude.toFixed(
                          6
                        )}
                        ,{" "}
                        {location.coords.longitude.toFixed(
                          6
                        )}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          <View style={styles.questionCard}>
            <Text style={styles.questionTitle}>
              What happened?
            </Text>

            <Text style={styles.questionSubtitle}>
              Select the option that describes your situation.
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((option) => {
              const isOther =
                option.id === "other";

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.detailOption,
                    selectedEmergencyDetail ===
                      option.title &&
                      styles.detailOptionSelected,
                  ]}
                  onPress={() =>
                    selectEmergencyDetail(option)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name={option.icon}
                      size={23}
                      color="#00D4FF"
                    />
                  </View>

                  <Text
                    style={styles.detailOptionText}
                  >
                    {option.title}
                  </Text>

                  <Ionicons
                    name={
                      isOther
                        ? "create-outline"
                        : "chevron-forward"
                    }
                    size={21}
                    color="#8892A8"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedEmergencyDetail
            .toLowerCase()
            .includes("other") && (
            <View style={styles.customBox}>
              <Text style={styles.customLabel}>
                Describe what happened
              </Text>

              <TextInput
                value={customDetails}
                onChangeText={setCustomDetails}
                placeholder="Write a short description..."
                placeholderTextColor="#687286"
                multiline
                numberOfLines={4}
                style={styles.customInput}
              />

              <TouchableOpacity
                style={styles.continueButton}
                onPress={continueCustomDetails}
              >
                <Text style={styles.continueButtonText}>
                  CONTINUE
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ====================================================
  // WHO NEEDS HELP SCREEN
  // ====================================================

  if (showWhoNeedsHelp) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowWhoNeedsHelp(false);
                setShowEmergencyDetails(true);
              }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>
                Who Needs Help?
              </Text>

              <Text style={styles.headerSubtitle}>
                Tell us who is in danger
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>
              STEP 3
            </Text>

            <Text style={styles.stepTitle}>
              Who needs emergency help?
            </Text>

            <Text style={styles.stepSubtitle}>
              This information will be included in the SOS alert.
            </Text>
          </View>

          <View style={styles.whoContainer}>
            <TouchableOpacity
              style={styles.whoCard}
              onPress={() =>
                selectWhoNeedsHelp("Me")
              }
              activeOpacity={0.8}
            >
              <View style={styles.whoIcon}>
                <Ionicons
                  name="person"
                  size={30}
                  color="#00D4FF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.whoTitle}>
                  Me
                </Text>

                <Text style={styles.whoSubtitle}>
                  I need help
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#8892A8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whoCard}
              onPress={() =>
                selectWhoNeedsHelp("Someone Else")
              }
              activeOpacity={0.8}
            >
              <View style={styles.whoIcon}>
                <Ionicons
                  name="person-outline"
                  size={30}
                  color="#00D4FF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.whoTitle}>
                  Someone Else
                </Text>

                <Text style={styles.whoSubtitle}>
                  Another person needs help
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#8892A8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whoCard}
              onPress={() =>
                selectWhoNeedsHelp("Multiple People")
              }
              activeOpacity={0.8}
            >
              <View style={styles.whoIcon}>
                <Ionicons
                  name="people"
                  size={30}
                  color="#00D4FF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.whoTitle}>
                  Multiple People
                </Text>

                <Text style={styles.whoSubtitle}>
                  More than one person needs help
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#8892A8"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ====================================================
  // CONFIRMATION SCREEN
  // ====================================================

  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetFlow}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>
                Confirm SOS
              </Text>

              <Text style={styles.headerSubtitle}>
                Review before sending
              </Text>
            </View>
          </View>

          <View style={styles.confirmWarning}>
            <View style={styles.warningIcon}>
              <Ionicons
                name="warning"
                size={30}
                color="#FF4D6D"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>
                Emergency Alert
              </Text>

              <Text style={styles.warningText}>
                Make sure the information below is correct.
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>
              EMERGENCY
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Type
              </Text>

              <Text style={styles.summaryValue}>
                {getEmergencyName()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                What happened
              </Text>

              <Text style={styles.summaryValue}>
                {getFinalDetail()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Who needs help
              </Text>

              <Text style={styles.summaryValue}>
                {whoNeedsHelp}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>
              CURRENT LOCATION
            </Text>

            {loading ? (
              <ActivityIndicator
                size="small"
                color="#00D4FF"
              />
            ) : (
              <>
                <View style={styles.locationSummaryRow}>
                  <Ionicons
                    name="location"
                    size={23}
                    color="#00D4FF"
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={
                        styles.locationSummaryAddress
                      }
                    >
                      {locationAddress ||
                        "Address unavailable"}
                    </Text>

                    {location && (
                      <Text
                        style={
                          styles.locationSummaryCoordinates
                        }
                      >
                        Lat:{" "}
                        {location.coords.latitude.toFixed(
                          6
                        )}
                        {"\n"}
                        Long:{" "}
                        {location.coords.longitude.toFixed(
                          6
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.contactsSummary}>
            <View style={styles.contactsSummaryIcon}>
              <Ionicons
                name="people"
                size={22}
                color="#00D4FF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.contactsSummaryTitle}>
                Emergency Contacts
              </Text>

              <Text
                style={styles.contactsSummaryText}
              >
                {contact1 || "Not available"}
              </Text>

              {contact2 ? (
                <Text
                  style={styles.contactsSummaryText}
                >
                  {contact2}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendSOS}
            activeOpacity={0.85}
          >
            <Ionicons
              name="warning"
              size={25}
              color="#FFFFFF"
            />

            <Text style={styles.sendButtonText}>
              SEND SOS ALERT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callButton}
            onPress={call112}
            activeOpacity={0.85}
          >
            <Ionicons
              name="call"
              size={22}
              color="#FF4D6D"
            />

            <Text style={styles.callButtonText}>
              CALL 112
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.policeButton}
            onPress={findNearbyPolice}
            activeOpacity={0.85}
          >
            <Ionicons
              name="shield"
              size={22}
              color="#00D4FF"
            />

            <Text style={styles.policeButtonText}>
              FIND NEARBY POLICE STATION
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Your current GPS location will be included
            in the SOS message.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ====================================================
  // MAIN SOS SCREEN
  // ====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.mainHeader}>
          <View>
            <Text style={styles.mainTitle}>
              Emergency Center
            </Text>

            <Text style={styles.mainSubtitle}>
              Get immediate help when you need it
            </Text>
          </View>

          <View style={styles.shieldHeader}>
            <Ionicons
              name="shield-checkmark"
              size={25}
              color="#00D4FF"
            />
          </View>
        </View>

        {/* STATUS */}

        <View style={styles.statusCard}>
          <View style={styles.statusDot} />

          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              SOS SYSTEM READY
            </Text>

            <Text style={styles.statusSubtitle}>
              Emergency contacts and location are available
            </Text>
          </View>
        </View>

        {/* MAIN SOS */}

        <View style={styles.sosSection}>
          <Text style={styles.sosSectionTitle}>
            NEED IMMEDIATE HELP?
          </Text>

          <Text style={styles.sosSectionSubtitle}>
            Press and hold the SOS button for 3 seconds
          </Text>

          <View style={styles.sosOuter}>
            <View style={styles.sosMiddle}>
              <TouchableOpacity
                style={styles.sosButton}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="warning"
                  size={52}
                  color="#FFFFFF"
                />

                <Text style={styles.sosText}>
                  SOS
                </Text>

                <Text style={styles.sosHoldText}>
                  {holding
                    ? `${Math.round(progress)}%`
                    : "HOLD 3 SEC"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {holding && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* CATEGORY FLOW */}

        <View style={styles.orContainer}>
          <View style={styles.orLine} />

          <Text style={styles.orText}>
            OR
          </Text>

          <View style={styles.orLine} />
        </View>

        <TouchableOpacity
          style={styles.categoryStartCard}
          onPress={openEmergencyTypes}
          activeOpacity={0.85}
        >
          <View style={styles.categoryStartIcon}>
            <Ionicons
              name="list"
              size={28}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.categoryStartTitle}>
              Tell us what happened
            </Text>

            <Text style={styles.categoryStartSubtitle}>
              Choose an emergency type for a more detailed alert
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={24}
            color="#8892A8"
          />
        </TouchableOpacity>

        {/* LOCATION */}

        <View style={styles.locationCard}>
          <View style={styles.locationCardIcon}>
            <Ionicons
              name="location"
              size={24}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.locationCardTitle}>
              Current Location
            </Text>

            {loading ? (
              <ActivityIndicator
                size="small"
                color="#00D4FF"
                style={{
                  alignSelf: "flex-start",
                  marginTop: 7,
                }}
              />
            ) : (
              <>
                <Text style={styles.locationCardText}>
                  {locationAddress ||
                    "Location address unavailable"}
                </Text>

                {location && (
                  <Text
                    style={styles.locationCoordinates}
                  >
                    {location.coords.latitude.toFixed(
                      6
                    )}
                    ,{" "}
                    {location.coords.longitude.toFixed(
                      6
                    )}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* CONTACTS */}

        <View style={styles.contactsCard}>
          <View style={styles.contactsIcon}>
            <Ionicons
              name="people"
              size={24}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.contactsTitle}>
              Emergency Contacts
            </Text>

            {contact1 || contact2 ? (
              <>
                {contact1 ? (
                  <Text style={styles.contactNumber}>
                    {contact1}
                  </Text>
                ) : null}

                {contact2 ? (
                  <Text style={styles.contactNumber}>
                    {contact2}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.noContactText}>
                No emergency contacts saved
              </Text>
            )}
          </View>
        </View>

        {/* INFO */}

        <View style={styles.infoNotice}>
          <Ionicons
            name="information-circle-outline"
            size={23}
            color="#00D4FF"
          />

          <Text style={styles.infoText}>
            Your SOS alert includes your emergency type,
            details, current GPS location and a Google Maps
            location link.
          </Text>
        </View>

        {/* 112 */}

        <TouchableOpacity
          style={styles.main112Button}
          onPress={call112}
          activeOpacity={0.85}
        >
          <Ionicons
            name="call"
            size={22}
            color="#FFFFFF"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.main112Title}>
              EMERGENCY SERVICES
            </Text>

            <Text style={styles.main112Subtitle}>
              Call 112 for immediate emergency assistance
            </Text>
          </View>

          <Text style={styles.number112}>
            112
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  mainScroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 45,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 45,
  },

  // HEADER

  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  mainTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  mainSubtitle: {
    color: "#8D96AA",
    fontSize: 13,
    marginTop: 5,
  },

  shieldHeader: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#101A31",
    borderWidth: 1,
    borderColor: "#1F3654",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#101A31",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    borderWidth: 1,
    borderColor: "#1F3654",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#8993A8",
    fontSize: 12,
    marginTop: 4,
  },

  // STATUS

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1729",
    borderRadius: 18,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#17304A",
  },

  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#21E6A5",
    marginRight: 12,
  },

  statusTitle: {
    color: "#21E6A5",
    fontSize: 13,
    fontWeight: "800",
  },

  statusSubtitle: {
    color: "#8490A5",
    fontSize: 11,
    marginTop: 3,
  },

  // SOS

  sosSection: {
    alignItems: "center",
    marginTop: 5,
  },

  sosSectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  sosSectionSubtitle: {
    color: "#7F899D",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 22,
  },

  sosOuter: {
    width: 205,
    height: 205,
    borderRadius: 103,
    backgroundColor: "#251427",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A2036",
  },

  sosMiddle: {
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: "#3B1930",
    alignItems: "center",
    justifyContent: "center",
  },

  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FF416C",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#FF416C",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
  },

  sosText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 3,
  },

  sosHoldText: {
    color: "#FFEAF0",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  progressTrack: {
    width: "75%",
    height: 7,
    backgroundColor: "#1B2334",
    borderRadius: 5,
    marginTop: 22,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FF416C",
  },

  // OR

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#202A3E",
  },

  orText: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "800",
    marginHorizontal: 15,
  },

  // CATEGORY START

  categoryStartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1729",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "#21344D",
    marginBottom: 18,
  },

  categoryStartIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#11263A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  categoryStartTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  categoryStartSubtitle: {
    color: "#818B9F",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    paddingRight: 8,
  },

  // LOCATION

  locationCard: {
    flexDirection: "row",
    backgroundColor: "#0D1729",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18344A",
    marginBottom: 14,
  },

  locationCardIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#10263A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  locationCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  locationCardText: {
    color: "#8B95A9",
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },

  locationCoordinates: {
    color: "#00D4FF",
    fontSize: 10,
    marginTop: 4,
  },

  // CONTACTS

  contactsCard: {
    flexDirection: "row",
    backgroundColor: "#0D1729",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1D3148",
    marginBottom: 14,
  },

  contactsIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#10263A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  contactsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  contactNumber: {
    color: "#8B95A9",
    fontSize: 12,
    marginTop: 2,
  },

  noContactText: {
    color: "#FF7189",
    fontSize: 11,
  },

  // INFO

  infoNotice: {
    flexDirection: "row",
    backgroundColor: "#0C1728",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#19364B",
    marginTop: 3,
    marginBottom: 18,
  },

  infoText: {
    flex: 1,
    color: "#8290A6",
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 10,
  },

  // 112

  main112Button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#421D2B",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#713044",
  },

  main112Title: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  main112Subtitle: {
    color: "#B58A97",
    fontSize: 10,
    marginTop: 3,
  },

  number112: {
    color: "#FF5575",
    fontSize: 22,
    fontWeight: "900",
    marginLeft: 10,
  },

  // STEP

  stepCard: {
    backgroundColor: "#0D1729",
    borderRadius: 19,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1C334B",
  },

  stepNumber: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  stepTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 6,
  },

  stepSubtitle: {
    color: "#7F8A9E",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 17,
  },

  // CATEGORY GRID

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  categoryCard: {
    width: "48%",
    backgroundColor: "#0D1729",
    borderRadius: 19,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1D3148",
    minHeight: 145,
  },

  categoryIcon: {
    width: 53,
    height: 53,
    borderRadius: 16,
    backgroundColor: "#10263A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  categoryTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  categorySubtitle: {
    color: "#788398",
    fontSize: 10,
    marginTop: 5,
    lineHeight: 15,
  },

  // QUESTION

  questionCard: {
    marginBottom: 15,
  },

  questionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  questionSubtitle: {
    color: "#7E899D",
    fontSize: 11,
    marginTop: 4,
  },

  // DETAILS

  optionsContainer: {
    marginBottom: 15,
  },

  detailOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1729",
    borderRadius: 17,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#1D3148",
  },

  detailOptionSelected: {
    borderColor: "#00D4FF",
    backgroundColor: "#0E2030",
  },

  detailIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#10263A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  detailOptionText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // CUSTOM

  customBox: {
    backgroundColor: "#0D1729",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#21344D",
  },

  customLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },

  customInput: {
    minHeight: 100,
    backgroundColor: "#080F1D",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#23344B",
    color: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    textAlignVertical: "top",
    fontSize: 12,
  },

  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 8,
  },

  // LOCATION HIGHLIGHT

  locationHighlight: {
    flexDirection: "row",
    backgroundColor: "#0C1C2B",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#15516A",
    marginBottom: 20,
  },

  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#102E40",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  locationHighlightTitle: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "900",
  },

  locationHighlightText: {
    color: "#D2D8E3",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  coordinatesText: {
    color: "#6BBDCF",
    fontSize: 10,
    marginTop: 4,
  },

  // WHO

  whoContainer: {
    marginTop: 3,
  },

  whoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1729",
    borderRadius: 19,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#1D3148",
  },

  whoIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#10263A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  whoTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  whoSubtitle: {
    color: "#7D899D",
    fontSize: 11,
    marginTop: 4,
  },

  // CONFIRMATION

  confirmWarning: {
    flexDirection: "row",
    backgroundColor: "#28151F",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5A293B",
    marginBottom: 15,
  },

  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#3B1A29",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  warningTitle: {
    color: "#FF6A84",
    fontSize: 14,
    fontWeight: "900",
  },

  warningText: {
    color: "#A58B94",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: "#0D1729",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1D3148",
    marginBottom: 13,
  },

  summaryHeading: {
    color: "#6D7890",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  summaryLabel: {
    width: 105,
    color: "#707B91",
    fontSize: 11,
  },

  summaryValue: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#1B283B",
    marginVertical: 12,
  },

  locationSummaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  locationSummaryAddress: {
    color: "#D4D9E3",
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 10,
  },

  locationSummaryCoordinates: {
    color: "#00D4FF",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
    marginLeft: 10,
  },

  contactsSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1729",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#1D3148",
    marginBottom: 15,
  },

  contactsSummaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#10263A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  contactsSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },

  contactsSummaryText: {
    color: "#7F8A9D",
    fontSize: 11,
    marginTop: 2,
  },

  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF416C",
    borderRadius: 17,
    paddingVertical: 17,
    marginBottom: 10,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 9,
  },

  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24131C",
    borderRadius: 17,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#63283A",
    marginBottom: 10,
  },

  callButtonText: {
    color: "#FF5A78",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 9,
  },

  policeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D1C2A",
    borderRadius: 17,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#17445A",
  },

  policeButtonText: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 9,
  },

  footerNote: {
    color: "#657086",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 16,
    paddingHorizontal: 20,
  },
});