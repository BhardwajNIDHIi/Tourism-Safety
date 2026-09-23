import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Location from "expo-location";
import MapView, {
  Circle,
  Marker,
  UrlTile,
} from "react-native-maps";

import { Ionicons } from "@expo/vector-icons";

type ServiceType =
  | "hospital"
  | "police"
  | "pharmacy"
  | "fire_station"
  | "clinic"
  | "fuel";

type EmergencyPlace = {
  id: string;
  name: string;
  type: ServiceType;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  distance?: number;
};

const SERVICE_INFO: Record<
  ServiceType,
  {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  hospital: {
    title: "Hospitals",
    icon: "medical",
    color: "#FF4D6D",
  },
  police: {
    title: "Police Stations",
    icon: "shield-checkmark",
    color: "#4D8DFF",
  },
  pharmacy: {
    title: "Pharmacies",
    icon: "medkit",
    color: "#20C997",
  },
  fire_station: {
    title: "Fire Stations",
    icon: "flame",
    color: "#FF8A3D",
  },
  clinic: {
    title: "Clinics",
    icon: "fitness",
    color: "#A66CFF",
  },
  fuel: {
    title: "Fuel Stations",
    icon: "car",
    color: "#FFC107",
  },
};

const SERVICE_ORDER: ServiceType[] = [
  "hospital",
  "police",
  "pharmacy",
  "fire_station",
  "clinic",
  "fuel",
];

export default function Emergency() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [places, setPlaces] = useState<EmergencyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] =
    useState<ServiceType | "all">("all");

  const getCurrentLocation = async () => {
    try {
      setError("");

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError(
          "Location permission is required to find nearby emergency services."
        );
        setLoading(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);

      return currentLocation;
    } catch (err) {
      console.log("Location error:", err);
      setError("Unable to get your current location.");
      setLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getOverpassQuery = (latitude: number, longitude: number) => {
    return `
      [out:json][timeout:25];

      (
        node["amenity"="hospital"](around:5000,${latitude},${longitude});
        way["amenity"="hospital"](around:5000,${latitude},${longitude});
        relation["amenity"="hospital"](around:5000,${latitude},${longitude});

        node["amenity"="clinic"](around:5000,${latitude},${longitude});
        way["amenity"="clinic"](around:5000,${latitude},${longitude});
        relation["amenity"="clinic"](around:5000,${latitude},${longitude});

        node["amenity"="pharmacy"](around:5000,${latitude},${longitude});
        way["amenity"="pharmacy"](around:5000,${latitude},${longitude});
        relation["amenity"="pharmacy"](around:5000,${latitude},${longitude});

        node["amenity"="police"](around:5000,${latitude},${longitude});
        way["amenity"="police"](around:5000,${latitude},${longitude});
        relation["amenity"="police"](around:5000,${latitude},${longitude});

        node["amenity"="fire_station"](around:5000,${latitude},${longitude});
        way["amenity"="fire_station"](around:5000,${latitude},${longitude});
        relation["amenity"="fire_station"](around:5000,${latitude},${longitude});

        node["amenity"="fuel"](around:5000,${latitude},${longitude});
        way["amenity"="fuel"](around:5000,${latitude},${longitude});
        relation["amenity"="fuel"](around:5000,${latitude},${longitude});
      );

      out center tags;
    `;
  };

  const getServiceType = (
    tags: any
  ): ServiceType | null => {
    const amenity = tags?.amenity;

    if (amenity === "hospital") return "hospital";
    if (amenity === "police") return "police";
    if (amenity === "pharmacy") return "pharmacy";
    if (amenity === "fire_station") return "fire_station";
    if (amenity === "clinic") return "clinic";
    if (amenity === "fuel") return "fuel";

    return null;
  };

  const fetchNearbyServices = async (
    currentLocation?: Location.LocationObject
  ) => {
    try {
      const activeLocation =
        currentLocation || location;

      if (!activeLocation) {
        return;
      }

      setError("");

      const latitude = activeLocation.coords.latitude;
      const longitude = activeLocation.coords.longitude;

      const query = getOverpassQuery(latitude, longitude);

      const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `data=${encodeURIComponent(query)}`,
        }
      );

      if (!response.ok) {
        throw new Error("Overpass API error");
      }

      const data = await response.json();

      const result: EmergencyPlace[] = [];

      for (const item of data.elements || []) {
        const type = getServiceType(item.tags);

        if (!type) continue;

        const itemLatitude =
          item.lat ?? item.center?.lat;

        const itemLongitude =
          item.lon ?? item.center?.lon;

        if (
          typeof itemLatitude !== "number" ||
          typeof itemLongitude !== "number"
        ) {
          continue;
        }

        const name =
          item.tags?.name ||
          `${SERVICE_INFO[type].title.replace("s", "")}`;

        const addressParts = [
          item.tags?.["addr:housenumber"],
          item.tags?.["addr:street"],
          item.tags?.["addr:city"],
        ].filter(Boolean);

        const address =
          addressParts.length > 0
            ? addressParts.join(", ")
            : "Address not available";

        const distance = calculateDistance(
          latitude,
          longitude,
          itemLatitude,
          itemLongitude
        );

        result.push({
          id: `${item.type}-${item.id}`,
          name,
          type,
          latitude: itemLatitude,
          longitude: itemLongitude,
          address,
          phone:
            item.tags?.phone ||
            item.tags?.["contact:phone"],
          distance,
        });
      }

      result.sort(
        (a, b) =>
          (a.distance || 0) - (b.distance || 0)
      );

      setPlaces(result);
    } catch (err) {
      console.log("Emergency services error:", err);

      setError(
        "Unable to load nearby services. Please try again."
      );
    }
  };

  const loadEmergencyData = async () => {
    setLoading(true);

    const currentLocation =
      await getCurrentLocation();

    if (currentLocation) {
      await fetchNearbyServices(currentLocation);
    }

    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);

    const currentLocation =
      await getCurrentLocation();

    if (currentLocation) {
      await fetchNearbyServices(currentLocation);
    }

    setRefreshing(false);
  };

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const filteredPlaces = useMemo(() => {
    if (selectedType === "all") {
      return places;
    }

    return places.filter(
      (place) => place.type === selectedType
    );
  }, [places, selectedType]);

  const openDirections = (place: EmergencyPlace) => {
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${place.latitude},${place.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Maps Error",
        "Unable to open maps."
      );
    });
  };

  const callPlace = (place: EmergencyPlace) => {
    if (!place.phone) {
      Alert.alert(
        "Phone Number Not Available",
        "This place does not have a phone number listed."
      );
      return;
    }

    const cleanPhone =
      place.phone.replace(/[^\d+]/g, "");

    Linking.openURL(`tel:${cleanPhone}`).catch(
      () => {
        Alert.alert(
          "Call Error",
          "Unable to open phone dialer."
        );
      }
    );
  };

  const callEmergencyNumber = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert(
        "Call Error",
        "Unable to open phone dialer."
      );
    });
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined) {
      return "";
    }

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }

    return `${distance.toFixed(1)} km`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#070B18"
        />

        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="large"
            color="#00D4FF"
          />

          <Text style={styles.loadingTitle}>
            Finding Emergency Services
          </Text>

          <Text style={styles.loadingText}>
            Getting your current location and
            nearby help...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const latitude =
    location?.coords.latitude || 28.6139;

  const longitude =
    location?.coords.longitude || 77.2090;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#070B18"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor="#00D4FF"
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Emergency Services
            </Text>

            <Text style={styles.headerSubtitle}>
              Find help near your current location
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshData}
          >
            <Ionicons
              name="refresh"
              size={21}
              color="#00D4FF"
            />
          </TouchableOpacity>
        </View>

        {/* EMERGENCY CALL BAR */}
        <View style={styles.emergencyBar}>
          <View style={styles.emergencyIcon}>
            <Ionicons
              name="warning"
              size={24}
              color="#FF4D6D"
            />
          </View>

          <View style={styles.emergencyTextBox}>
            <Text style={styles.emergencyTitle}>
              Need immediate help?
            </Text>

            <Text style={styles.emergencySubtitle}>
              Call emergency services
            </Text>
          </View>

          <TouchableOpacity
            style={styles.call112Button}
            onPress={() =>
              callEmergencyNumber("112")
            }
          >
            <Ionicons
              name="call"
              size={17}
              color="#FFFFFF"
            />

            <Text style={styles.call112Text}>
              112
            </Text>
          </TouchableOpacity>
        </View>

        {/* MAP */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.045,
              longitudeDelta: 0.045,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            loadingEnabled={true}
          >
            {/* OPENSTREETMAP TILES */}
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />

            {/* CURRENT LOCATION AREA */}
            <Circle
              center={{
                latitude,
                longitude,
              }}
              radius={150}
              fillColor="rgba(0, 212, 255, 0.12)"
              strokeColor="rgba(0, 212, 255, 0.5)"
              strokeWidth={1}
            />

            {/* EMERGENCY MARKERS */}
            {places.map((place) => {
              const info =
                SERVICE_INFO[place.type];

              return (
                <Marker
                  key={place.id}
                  coordinate={{
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }}
                  title={place.name}
                  description={`${info.title} • ${formatDistance(
                    place.distance
                  )}`}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        backgroundColor:
                          info.color,
                      },
                    ]}
                  >
                    <Ionicons
                      name={info.icon}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* MAP LABEL */}
          <View style={styles.mapLabel}>
            <View style={styles.liveDot} />

            <Text style={styles.mapLabelText}>
              LIVE LOCATION
            </Text>
          </View>
        </View>

        {/* LOCATION INFO */}
        {location && (
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons
                name="location"
                size={20}
                color="#00D4FF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>
                Your Current Location
              </Text>

              <Text style={styles.coordinates}>
                {latitude.toFixed(5)},{" "}
                {longitude.toFixed(5)}
              </Text>
            </View>

            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>
                LIVE
              </Text>
            </View>
          </View>
        )}

        {/* ERROR */}
        {error !== "" && (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle"
              size={22}
              color="#FFB4C2"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              onPress={refreshData}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECTION TITLE */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Nearby Emergency Services
            </Text>

            <Text style={styles.sectionSubtitle}>
              Services within 5 km of you
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {places.length}
            </Text>
          </View>
        </View>

        {/* FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filterContainer
          }
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === "all" &&
                styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType("all")}
          >
            <Ionicons
              name="apps"
              size={17}
              color={
                selectedType === "all"
                  ? "#FFFFFF"
                  : "#9CA3AF"
              }
            />

            <Text
              style={[
                styles.filterText,
                selectedType === "all" &&
                  styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {SERVICE_ORDER.map((type) => {
            const info = SERVICE_INFO[type];

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedType(type)
                }
              >
                <Ionicons
                  name={info.icon}
                  size={17}
                  color={
                    selectedType === type
                      ? "#FFFFFF"
                      : info.color
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    selectedType === type &&
                      styles.filterTextActive,
                  ]}
                >
                  {info.title.replace(
                    " Stations",
                    ""
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* SERVICE CARDS */}
        <View style={styles.servicesContainer}>
          {filteredPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="search-outline"
                size={42}
                color="#596174"
              />

              <Text style={styles.emptyTitle}>
                No services found
              </Text>

              <Text style={styles.emptyText}>
                No nearby services were found for
                this category.
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={refreshData}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.retryButtonText}>
                  Search Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredPlaces.map((place) => {
              const info =
                SERVICE_INFO[place.type];

              return (
                <View
                  key={place.id}
                  style={styles.serviceCard}
                >
                  {/* ICON */}
                  <View
                    style={[
                      styles.serviceIcon,
                      {
                        backgroundColor:
                          `${info.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={info.icon}
                      size={25}
                      color={info.color}
                    />
                  </View>

                  {/* DETAILS */}
                  <View style={styles.serviceDetails}>
                    <View
                      style={styles.serviceTitleRow}
                    >
                      <Text
                        style={styles.serviceName}
                        numberOfLines={1}
                      >
                        {place.name}
                      </Text>

                      <Text
                        style={[
                          styles.distance,
                          {
                            color: info.color,
                          },
                        ]}
                      >
                        {formatDistance(
                          place.distance
                        )}
                      </Text>
                    </View>

                    <Text
                      style={styles.serviceType}
                    >
                      {info.title.replace(
                        " Stations",
                        ""
                      )}
                    </Text>

                    <Text
                      style={styles.serviceAddress}
                      numberOfLines={2}
                    >
                      {place.address}
                    </Text>

                    {/* BUTTONS */}
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.directionButton}
                        onPress={() =>
                          openDirections(place)
                        }
                      >
                        <Ionicons
                          name="navigate"
                          size={16}
                          color="#00D4FF"
                        />

                        <Text
                          style={
                            styles.directionText
                          }
                        >
                          Directions
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() =>
                          callPlace(place)
                        }
                      >
                        <Ionicons
                          name="call"
                          size={16}
                          color="#FFFFFF"
                        />

                        <Text
                          style={styles.callText}
                        >
                          Call
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#697386"
          />

          <Text style={styles.footerText}>
            Nearby places are provided from
            OpenStreetMap data. Availability and
            phone information may vary.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#070B18",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingBox: {
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 18,
  },

  loadingText: {
    color: "#8992A5",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#8992A5",
    fontSize: 13,
    marginTop: 5,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#11182A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#202B43",
  },

  emergencyBar: {
    marginHorizontal: 16,
    marginBottom: 15,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "#171321",
    borderWidth: 1,
    borderColor: "#392034",
    flexDirection: "row",
    alignItems: "center",
  },

  emergencyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FF4D6D15",
    justifyContent: "center",
    alignItems: "center",
  },

  emergencyTextBox: {
    flex: 1,
    marginLeft: 11,
  },

  emergencyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  emergencySubtitle: {
    color: "#8992A5",
    fontSize: 12,
    marginTop: 3,
  },

  call112Button: {
    backgroundColor: "#FF4D6D",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  call112Text: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  mapContainer: {
    marginHorizontal: 16,
    height: 310,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#202B43",
  },

  map: {
    flex: 1,
  },

  mapLabel: {
    position: "absolute",
    top: 13,
    left: 13,
    backgroundColor: "#070B18DD",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00D4FF",
    marginRight: 6,
  },

  mapLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  locationCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 13,
    backgroundColor: "#0E1526",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#202B43",
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#00D4FF15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  locationTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  coordinates: {
    color: "#778197",
    fontSize: 11,
    marginTop: 3,
  },

  liveBadge: {
    backgroundColor: "#20C99718",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  liveBadgeText: {
    color: "#20C997",
    fontSize: 9,
    fontWeight: "900",
  },

  errorCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#2A1720",
    borderWidth: 1,
    borderColor: "#4A2531",
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    flex: 1,
    color: "#FFB4C2",
    fontSize: 12,
    marginLeft: 9,
    lineHeight: 18,
  },

  retryText: {
    color: "#00D4FF",
    fontSize: 12,
    fontWeight: "800",
  },

  sectionHeader: {
    marginTop: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#697386",
    fontSize: 12,
    marginTop: 4,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#6C63FF20",
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#8B83FF",
    fontSize: 13,
    fontWeight: "800",
  },

  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },

  filterButton: {
    height: 39,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#0E1526",
    borderWidth: 1,
    borderColor: "#202B43",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  filterButtonActive: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  filterText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  servicesContainer: {
    paddingHorizontal: 16,
  },

  serviceCard: {
    backgroundColor: "#0E1526",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1D2840",
    flexDirection: "row",
  },

  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  serviceDetails: {
    flex: 1,
    marginLeft: 12,
  },

  serviceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  serviceName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },

  distance: {
    fontSize: 11,
    fontWeight: "800",
  },

  serviceType: {
    color: "#7C8497",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  serviceAddress: {
    color: "#9CA3AF",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },

  directionButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#00D4FF10",
    borderWidth: 1,
    borderColor: "#00D4FF30",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  directionText: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "800",
  },

  callButton: {
    flex: 0.65,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  callText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#0E1526",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1D2840",
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },

  emptyText: {
    color: "#778197",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: "#6C63FF",
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  footerText: {
    flex: 1,
    color: "#596174",
    fontSize: 10,
    lineHeight: 15,
  },
});