import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

type CheckIn = {
  id: string;
  latitude: number;
  longitude: number;
  locationName: string;
  date: string;
  time: string;
};

const STORAGE_KEY = "safetyCheckIns";

export default function SafetyCheckIn() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationName, setLocationName] =
    useState("Getting your location...");

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  const [loadingLocation, setLoadingLocation] = useState(true);

  const [checkingIn, setCheckingIn] = useState(false);

  const [permissionDenied, setPermissionDenied] =
    useState(false);

  // --------------------------------------------------
  // LOAD SAVED CHECK-INS
  // --------------------------------------------------

  useEffect(() => {
    loadCheckIns();
    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Location subscription
  let locationSubscription:
    | Location.LocationSubscription
    | null = null;

  // --------------------------------------------------
  // LOAD CHECK-IN HISTORY
  // --------------------------------------------------

  const loadCheckIns = async () => {
    try {
      const savedData =
        await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setCheckIns(parsedData);
      }
    } catch (error) {
      console.log("LOAD CHECK-IN ERROR:", error);
    }
  };

  // --------------------------------------------------
  // START REAL-TIME LOCATION
  // --------------------------------------------------

  const startLocationTracking = async () => {
    try {
      setLoadingLocation(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        setLoadingLocation(false);

        Alert.alert(
          "Location Permission Required",
          "Please allow location access to use Safety Check-In."
        );

        return;
      }

      setPermissionDenied(false);

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);

      await updateLocationName(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      setLoadingLocation(false);

      // Real-time location updates
      locationSubscription =
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (newLocation) => {
            setLocation(newLocation);

            await updateLocationName(
              newLocation.coords.latitude,
              newLocation.coords.longitude
            );
          }
        );
    } catch (error) {
      console.log("LOCATION ERROR:", error);

      setLoadingLocation(false);

      Alert.alert(
        "Location Error",
        "Unable to get your current location."
      );
    }
  };

  // --------------------------------------------------
  // REVERSE GEOCODING
  // --------------------------------------------------

  const updateLocationName = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const address =
        await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

      if (address.length > 0) {
        const place = address[0];

        const parts = [
          place.name,
          place.city,
          place.region,
        ].filter(Boolean);

        if (parts.length > 0) {
          setLocationName(parts.join(", "));
        } else {
          setLocationName("Current Location");
        }
      }
    } catch (error) {
      console.log("REVERSE GEOCODING ERROR:", error);

      setLocationName("Current Location");
    }
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const getDate = () => {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------

  const getTime = () => {
    return new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // I'M SAFE CHECK-IN
  // --------------------------------------------------

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert(
        "Location Unavailable",
        "Please wait while we detect your current location."
      );

      return;
    }

    try {
      setCheckingIn(true);

      const newCheckIn: CheckIn = {
        id:
          "CHECK-" +
          Date.now().toString(),

        latitude: location.coords.latitude,

        longitude: location.coords.longitude,

        locationName: locationName,

        date: getDate(),

        time: getTime(),
      };

      const updatedCheckIns = [
        newCheckIn,
        ...checkIns,
      ];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedCheckIns)
      );

      setCheckIns(updatedCheckIns);

      setCheckingIn(false);

      Alert.alert(
        "✓ Check-In Successful",
        `You are marked safe at:\n\n${locationName}\n\n${getTime()}`,
        [
          {
            text: "OK",
          },
        ]
      );
    } catch (error) {
      console.log("CHECK-IN ERROR:", error);

      setCheckingIn(false);

      Alert.alert(
        "Check-In Failed",
        "Unable to save your safety check-in."
      );
    }
  };

  // --------------------------------------------------
  // SHARE CURRENT CHECK-IN
  // --------------------------------------------------

  const shareCheckIn = async () => {
    if (!location) {
      Alert.alert(
        "Location Unavailable",
        "Current location is not available."
      );

      return;
    }

    try {
      const message = `
🛡️ SAFE TOURISM - SAFETY UPDATE

✓ I'm Safe

📍 Location:
${locationName}

🕒 Time:
${getTime()}

📌 Coordinates:
${location.coords.latitude.toFixed(6)},
${location.coords.longitude.toFixed(6)}

My current safety status has been updated through Safe Tourism.
      `;

      await Share.share({
        message,
      });
    } catch (error) {
      console.log("SHARE ERROR:", error);
    }
  };

  // --------------------------------------------------
  // REFRESH LOCATION
  // --------------------------------------------------

  const refreshLocation = async () => {
    try {
      setLoadingLocation(true);

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);

      await updateLocationName(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      setLoadingLocation(false);
    } catch (error) {
      console.log("REFRESH LOCATION ERROR:", error);

      setLoadingLocation(false);

      Alert.alert(
        "Location Error",
        "Unable to refresh your location."
      );
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.overline}>
              SAFETY • MONITORING
            </Text>

            <Text style={styles.title}>
              Safety Check-In
            </Text>

            <Text style={styles.subtitle}>
              Your journey. Your safety.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="shield-checkmark"
              size={27}
              color="#00D4FF"
            />
          </View>
        </View>

        {/* LOCATION BAR */}

        <View style={styles.locationBar}>
          <View style={styles.locationLeft}>
            <View style={styles.locationIcon}>
              <Ionicons
                name="location"
                size={18}
                color="#00D4FF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>
                CURRENT LOCATION
              </Text>

              <Text
                style={styles.locationText}
                numberOfLines={2}
              >
                {loadingLocation
                  ? "Detecting location..."
                  : locationName}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={refreshLocation}
            style={styles.refreshButton}
          >
            <Ionicons
              name="refresh"
              size={19}
              color="#00D4FF"
            />
          </TouchableOpacity>
        </View>

        {/* MAIN SAFETY STATUS */}

        <View style={styles.mainCard}>
          <View style={styles.statusCircleOuter}>
            <View style={styles.statusCircle}>
              <Ionicons
                name="checkmark"
                size={38}
                color="#00D4FF"
              />
            </View>
          </View>

          <Text style={styles.safeText}>
            YOU'RE SAFE
          </Text>

          <Text style={styles.statusDescription}>
            Your current location is being monitored
          </Text>

          {checkIns.length > 0 && (
            <Text style={styles.lastCheckIn}>
              Last check-in: {checkIns[0].date} •{" "}
              {checkIns[0].time}
            </Text>
          )}

          <TouchableOpacity
            style={styles.checkInButton}
            activeOpacity={0.85}
            onPress={handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator
                size="small"
                color="#070B18"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#070B18"
                />

                <Text style={styles.checkInButtonText}>
                  I'M SAFE
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CURRENT AREA */}

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Current Area
          </Text>

          <Text style={styles.sectionSubtitle}>
            Location safety status
          </Text>
        </View>

        <View style={styles.zoneCard}>
          <View style={styles.zoneTop}>
            <View style={styles.zoneStatusIcon}>
              <View style={styles.greenDot} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.zoneLabel}>
                LOCATION STATUS
              </Text>

              <Text style={styles.zoneTitle}>
                LOCATION AVAILABLE
              </Text>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                LIVE
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.zoneDescription}>
            Your real-time GPS location is being
            monitored by the application.
          </Text>

          {location && (
            <View style={styles.coordinatesBox}>
              <View>
                <Text style={styles.coordinateLabel}>
                  LATITUDE
                </Text>

                <Text style={styles.coordinateValue}>
                  {location.coords.latitude.toFixed(5)}
                </Text>
              </View>

              <View>
                <Text style={styles.coordinateLabel}>
                  LONGITUDE
                </Text>

                <Text style={styles.coordinateValue}>
                  {location.coords.longitude.toFixed(5)}
                </Text>
              </View>

              <View>
                <Text style={styles.coordinateLabel}>
                  ACCURACY
                </Text>

                <Text style={styles.coordinateValue}>
                  {Math.round(
                    location.coords.accuracy || 0
                  )}
                  m
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ACTIONS */}

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Safety Actions
          </Text>

          <Text style={styles.sectionSubtitle}>
            Keep your trusted people updated
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCheckIn}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={25}
                color="#00D4FF"
              />
            </View>

            <Text style={styles.actionTitle}>
              Check-In
            </Text>

            <Text style={styles.actionSubtitle}>
              Mark me safe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={shareCheckIn}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="share-social-outline"
                size={25}
                color="#00D4FF"
              />
            </View>

            <Text style={styles.actionTitle}>
              Share
            </Text>

            <Text style={styles.actionSubtitle}>
              Share my status
            </Text>
          </TouchableOpacity>
        </View>

        {/* CHECK-IN HISTORY */}

        <View style={styles.sectionTitleContainer}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent Check-Ins
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your safety activity
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {checkIns.length}
            </Text>
          </View>
        </View>

        {checkIns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="time-outline"
              size={30}
              color="#586176"
            />

            <Text style={styles.emptyTitle}>
              No check-ins yet
            </Text>

            <Text style={styles.emptyText}>
              Tap "I'm Safe" when you reach your
              destination.
            </Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {checkIns.slice(0, 5).map((item, index) => (
              <View
                key={item.id}
                style={styles.historyItem}
              >
                <View style={styles.timeline}>
                  <View style={styles.timelineDot}>
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color="#070B18"
                    />
                  </View>

                  {index !==
                    Math.min(checkIns.length, 5) - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.historyContent}>
                  <Text style={styles.historyLocation}>
                    {item.locationName}
                  </Text>

                  <Text style={styles.historyDate}>
                    {item.date} • {item.time}
                  </Text>

                  <Text style={styles.historyCoordinates}>
                    {item.latitude.toFixed(4)},{" "}
                    {item.longitude.toFixed(4)}
                  </Text>
                </View>

                <View style={styles.safeBadge}>
                  <Text style={styles.safeBadgeText}>
                    SAFE
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STATISTICS */}

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Safety Overview
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color="#00D4FF"
            />

            <Text style={styles.statNumber}>
              {checkIns.length}
            </Text>

            <Text style={styles.statLabel}>
              Check-Ins
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="location-outline"
              size={23}
              color="#00D4FF"
            />

            <Text style={styles.statNumber}>
              {new Set(
                checkIns.map(
                  (item) => item.locationName
                )
              ).size}
            </Text>

            <Text style={styles.statLabel}>
              Locations
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color="#00D4FF"
            />

            <Text style={styles.statNumber}>
              100%
            </Text>

            <Text style={styles.statLabel}>
              Status
            </Text>
          </View>
        </View>

        {/* REMINDER */}

        <View style={styles.reminderCard}>
          <View style={styles.reminderIcon}>
            <Ionicons
              name="bulb-outline"
              size={23}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>
              Safety Reminder
            </Text>

            <Text style={styles.reminderText}>
              Check in whenever you reach a new
              destination so your safety activity stays
              updated.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Safe Tourism • Stay connected. Stay safe.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    marginBottom: 18,
  },

  overline: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    color: "#7F879B",
    fontSize: 12,
    marginTop: 5,
  },

  headerIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: "#10182B",
    borderWidth: 1,
    borderColor: "#1D2D49",
    justifyContent: "center",
    alignItems: "center",
  },

  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0D1426",
    borderWidth: 1,
    borderColor: "#192743",
    borderRadius: 17,
    padding: 12,
    marginBottom: 15,
  },

  locationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  locationLabel: {
    color: "#687186",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  locationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#101D32",
    justifyContent: "center",
    alignItems: "center",
  },

  mainCard: {
    backgroundColor: "#0D1426",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#1B3150",
    paddingVertical: 25,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 25,
  },

  statusCircleOuter: {
    width: 125,
    height: 125,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "#1D5066",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  statusCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#10273A",
    justifyContent: "center",
    alignItems: "center",
  },

  safeText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },

  statusDescription: {
    color: "#7E879B",
    fontSize: 11,
    marginTop: 5,
  },

  lastCheckIn: {
    color: "#00D4FF",
    fontSize: 11,
    marginTop: 8,
  },

  checkInButton: {
    width: "100%",
    height: 52,
    borderRadius: 15,
    backgroundColor: "#00D4FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  checkInButtonText: {
    color: "#070B18",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  sectionTitleContainer: {
    marginBottom: 11,
    marginTop: 3,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#697287",
    fontSize: 11,
    marginTop: 3,
  },

  zoneCard: {
    backgroundColor: "#0D1426",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#192743",
    padding: 16,
    marginBottom: 23,
  },

  zoneTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  zoneStatusIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "#10291F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  greenDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#34D399",
  },

  zoneLabel: {
    color: "#687186",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  zoneTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10291F",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    marginRight: 5,
  },

  liveText: {
    color: "#34D399",
    fontSize: 8,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: "#19243A",
    marginVertical: 14,
  },

  zoneDescription: {
    color: "#8A92A4",
    fontSize: 11,
    lineHeight: 17,
  },

  coordinatesBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#090F1D",
    borderRadius: 12,
    padding: 11,
    marginTop: 12,
  },

  coordinateLabel: {
    color: "#5E687D",
    fontSize: 7,
    fontWeight: "800",
    marginBottom: 4,
  },

  coordinateValue: {
    color: "#B8C0CE",
    fontSize: 10,
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 11,
    marginBottom: 24,
  },

  actionCard: {
    flex: 1,
    backgroundColor: "#0D1426",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#192743",
    padding: 14,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  actionTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  actionSubtitle: {
    color: "#697287",
    fontSize: 10,
    marginTop: 3,
  },

  countBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#0D1426",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#192743",
    padding: 25,
    alignItems: "center",
    marginBottom: 23,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 9,
  },

  emptyText: {
    color: "#6F788C",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 5,
  },

  historyCard: {
    backgroundColor: "#0D1426",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#192743",
    padding: 15,
    marginBottom: 23,
  },

  historyItem: {
    flexDirection: "row",
    minHeight: 72,
  },

  timeline: {
    width: 28,
    alignItems: "center",
  },

  timelineDot: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#00D4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#26334A",
    marginVertical: 4,
  },

  historyContent: {
    flex: 1,
    paddingLeft: 10,
  },

  historyLocation: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  historyDate: {
    color: "#7B8497",
    fontSize: 10,
    marginTop: 4,
  },

  historyCoordinates: {
    color: "#4E596D",
    fontSize: 9,
    marginTop: 3,
  },

  safeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#10291F",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  safeBadgeText: {
    color: "#34D399",
    fontSize: 7,
    fontWeight: "900",
  },

  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 15,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#0D1426",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#192743",
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },

  statNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 7,
  },

  statLabel: {
    color: "#687186",
    fontSize: 9,
    marginTop: 3,
  },

  reminderCard: {
    flexDirection: "row",
    backgroundColor: "#0D1426",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1B2D48",
    padding: 15,
    marginTop: 5,
  },

  reminderIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  reminderTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  reminderText: {
    color: "#778094",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  footerText: {
    color: "#4E586C",
    fontSize: 10,
    textAlign: "center",
    marginTop: 25,
  },
});