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
  View,
} from "react-native";

import MapView, {
  Circle,
  Marker,
  Polyline,
} from "react-native-maps";

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

/* =========================================================
   TYPES
========================================================= */

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ZoneType = "SAFE" | "MODERATE" | "DANGER";

type Zone = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: ZoneType;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

/* =========================================================
   DEFAULT LOCATION
========================================================= */

const DEFAULT_LOCATION: Coordinate = {
  latitude: 28.6139,
  longitude: 77.209,
};

/* =========================================================
   SAFETY ZONES
   Demo zones for college project
========================================================= */

const SAFETY_ZONES: Zone[] = [
  /* SAFE */
  {
    id: "safe-1",
    name: "Connaught Place Safe Zone",
    latitude: 28.6315,
    longitude: 77.2167,
    radius: 1000,
    type: "SAFE",
  },

  {
    id: "safe-2",
    name: "India Gate Safe Zone",
    latitude: 28.6129,
    longitude: 77.2295,
    radius: 900,
    type: "SAFE",
  },

  /* MODERATE */
  {
    id: "moderate-1",
    name: "Old Delhi Moderate Zone",
    latitude: 28.6562,
    longitude: 77.241,
    radius: 850,
    type: "MODERATE",
  },

  {
    id: "moderate-2",
    name: "Central Delhi Moderate Zone",
    latitude: 28.625,
    longitude: 77.205,
    radius: 750,
    type: "MODERATE",
  },

  /* DANGER */
  {
    id: "danger-1",
    name: "Isolated Road Danger Zone",
    latitude: 28.59,
    longitude: 77.17,
    radius: 700,
    type: "DANGER",
  },

  {
    id: "danger-2",
    name: "Low Activity Area",
    latitude: 28.67,
    longitude: 77.29,
    radius: 650,
    type: "DANGER",
  },
];

/* =========================================================
   HELPER
========================================================= */

function getZoneColor(type: ZoneType): string {
  switch (type) {
    case "DANGER":
      return "#EF4444";

    case "MODERATE":
      return "#F59E0B";

    default:
      return "#22C55E";
  }
}

/* =========================================================
   DISTANCE
========================================================= */

function calculateDistance(
  first: Coordinate,
  second: Coordinate
): number {
  const earthRadius = 6371000;

  const latitudeDifference =
    ((second.latitude - first.latitude) * Math.PI) / 180;

  const longitudeDifference =
    ((second.longitude - first.longitude) * Math.PI) / 180;

  const latitude1 =
    (first.latitude * Math.PI) / 180;

  const latitude2 =
    (second.latitude * Math.PI) / 180;

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

/* =========================================================
   CURRENT SAFETY STATUS
========================================================= */

function getCurrentSafetyStatus(
  location: Coordinate | null
): {
  type: ZoneType;
  name: string;
  distance: number | null;
} {
  if (!location) {
    return {
      type: "SAFE",
      name: "Location unavailable",
      distance: null,
    };
  }

  let nearestZone: Zone | undefined;
  let nearestDistance = Infinity;

  SAFETY_ZONES.forEach((zone) => {
    const distance = calculateDistance(
      location,
      {
        latitude: zone.latitude,
        longitude: zone.longitude,
      }
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestZone = zone;
    }
  });

  if (!nearestZone) {
    return {
      type: "SAFE",
      name: "No safety zone nearby",
      distance: null,
    };
  }

  if (
    nearestDistance <=
    nearestZone.radius
  ) {
    return {
      type: nearestZone.type,
      name: nearestZone.name,
      distance: nearestDistance,
    };
  }

  return {
    type: "SAFE",
    name: "No active risk zone nearby",
    distance: nearestDistance,
  };
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function ExploreScreen() {
  const mapRef =
    useRef<MapView | null>(null);

  const locationSubscription =
    useRef<Location.LocationSubscription | null>(
      null
    );

  const [currentLocation, setCurrentLocation] =
    useState<Coordinate | null>(
      DEFAULT_LOCATION
    );

  const [searchText, setSearchText] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<SearchResult[]>([]);

  const [destination, setDestination] =
    useState<Coordinate | null>(null);

  const [destinationName, setDestinationName] =
    useState("");

  const [routeCoordinates, setRouteCoordinates] =
    useState<Coordinate[]>([]);

  const [routeDistance, setRouteDistance] =
    useState<number | null>(null);

  const [routeDuration, setRouteDuration] =
    useState<number | null>(null);

  const [loadingLocation, setLoadingLocation] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [loadingRoute, setLoadingRoute] =
    useState(false);

  const [savedDestination, setSavedDestination] =
    useState("");

  /* =======================================================
     START LOCATION
  ======================================================= */

  useEffect(() => {
    startLocationTracking();

    return () => {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, []);

  /* =======================================================
     LOAD SAVED DESTINATION
  ======================================================= */

  useEffect(() => {
    loadSavedDestination();
  }, []);

  /* =======================================================
     LOCATION
  ======================================================= */

  async function startLocationTracking() {
    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setCurrentLocation(DEFAULT_LOCATION);

        Alert.alert(
          "Location Permission",
          "Location permission was not granted. Demo map is showing Delhi."
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const coordinates: Coordinate = {
        latitude:
          location.coords.latitude,
        longitude:
          location.coords.longitude,
      };

      setCurrentLocation(coordinates);

      mapRef.current?.animateToRegion(
        {
          latitude:
            coordinates.latitude,
          longitude:
            coordinates.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        700
      );

      locationSubscription.current =
        await Location.watchPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            const updatedLocation: Coordinate = {
              latitude:
                newLocation.coords.latitude,
              longitude:
                newLocation.coords.longitude,
            };

            setCurrentLocation(
              updatedLocation
            );
          }
        );
    } catch (error) {
      console.log(
        "LOCATION ERROR:",
        error
      );

      setCurrentLocation(
        DEFAULT_LOCATION
      );
    } finally {
      setLoadingLocation(false);
    }
  }

  /* =======================================================
     SEARCH DESTINATION
  ======================================================= */

  async function searchDestination() {
    const query =
      searchText.trim();

    if (!query) {
      Alert.alert(
        "Search Destination",
        "Please enter a destination."
      );
      return;
    }

    try {
      setSearching(true);

      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?q=${encodeURIComponent(query)}` +
        "&format=jsonv2" +
        "&limit=5" +
        "&countrycodes=in";

      const response =
        await fetch(url, {
          headers: {
            Accept:
              "application/json",
            "User-Agent":
              "SafeTourismApp/1.0",
          },
        });

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status}`
        );
      }

      const data: SearchResult[] =
        await response.json();

      setSearchResults(data);

      if (data.length === 0) {
        Alert.alert(
          "Not Found",
          "No destination found."
        );
      }
    } catch (error) {
      console.log(
        "SEARCH ERROR:",
        error
      );

      Alert.alert(
        "Search Error",
        "Unable to search destination."
      );
    } finally {
      setSearching(false);
    }
  }

  /* =======================================================
     SELECT DESTINATION
  ======================================================= */

  async function selectDestination(
    result: SearchResult
  ) {
    const selectedLocation: Coordinate = {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    };

    const shortName =
      result.display_name.split(",")[0];

    setDestination(
      selectedLocation
    );

    setDestinationName(
      shortName
    );

    setSearchText(
      shortName
    );

    setSearchResults([]);

    mapRef.current?.animateToRegion(
      {
        latitude:
          selectedLocation.latitude,
        longitude:
          selectedLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      700
    );

    if (currentLocation) {
      await getRoute(
        currentLocation,
        selectedLocation
      );
    }
  }

  /* =======================================================
     OSRM ROUTE
  ======================================================= */

  async function getRoute(
    start: Coordinate,
    end: Coordinate
  ) {
    try {
      setLoadingRoute(true);

      const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${start.longitude},${start.latitude};` +
        `${end.longitude},${end.latitude}` +
        "?overview=full&geometries=geojson";

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Route failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        data.code !== "Ok" ||
        !data.routes ||
        data.routes.length === 0
      ) {
        Alert.alert(
          "Route Not Found",
          "No route could be found."
        );
        return;
      }

      const route =
        data.routes[0];

      const coordinates: Coordinate[] =
        route.geometry.coordinates.map(
          (item: number[]) => ({
            longitude: item[0],
            latitude: item[1],
          })
        );

      setRouteCoordinates(
        coordinates
      );

      setRouteDistance(
        route.distance
      );

      setRouteDuration(
        route.duration
      );

      if (
        coordinates.length > 0
      ) {
        mapRef.current?.fitToCoordinates(
          coordinates,
          {
            edgePadding: {
              top: 100,
              right: 40,
              bottom: 120,
              left: 40,
            },
            animated: true,
          }
        );
      }
    } catch (error) {
      console.log(
        "ROUTE ERROR:",
        error
      );

      Alert.alert(
        "Route Error",
        "Unable to load route."
      );
    } finally {
      setLoadingRoute(false);
    }
  }

  /* =======================================================
     SAVE DESTINATION
  ======================================================= */

  async function saveDestination() {
    if (!destinationName) {
      Alert.alert(
        "No Destination",
        "Please select a destination first."
      );
      return;
    }

    try {
      await AsyncStorage.setItem(
        "safeTourismSavedDestination",
        destinationName
      );

      setSavedDestination(
        destinationName
      );

      Alert.alert(
        "Saved",
        "Destination saved successfully."
      );
    } catch (error) {
      console.log(
        "SAVE ERROR:",
        error
      );
    }
  }

  /* =======================================================
     LOAD SAVED DESTINATION
  ======================================================= */

  async function loadSavedDestination() {
    try {
      const saved =
        await AsyncStorage.getItem(
          "safeTourismSavedDestination"
        );

      if (saved) {
        setSavedDestination(
          saved
        );
      }
    } catch (error) {
      console.log(
        "LOAD ERROR:",
        error
      );
    }
  }

  /* =======================================================
     EXTERNAL NAVIGATION
  ======================================================= */

  async function openExternalNavigation() {
    if (!destination) {
      Alert.alert(
        "Select Destination",
        "Please select a destination first."
      );
      return;
    }

    const url =
      "https://www.google.com/maps/dir/?api=1" +
      `&destination=${destination.latitude},${destination.longitude}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Error",
        "Unable to open maps."
      );
    }
  }

  /* =======================================================
     CENTER USER
  ======================================================= */

  function centerOnUser() {
    if (!currentLocation) {
      Alert.alert(
        "Location Unavailable",
        "Current location is not available."
      );
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude:
          currentLocation.latitude,
        longitude:
          currentLocation.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      700
    );
  }

  /* =======================================================
     FORMAT DISTANCE
  ======================================================= */

  function formatDistance(
    meters: number
  ): string {
    if (meters < 1000) {
      return `${Math.round(
        meters
      )} m`;
    }

    return `${(
      meters / 1000
    ).toFixed(1)} km`;
  }

  /* =======================================================
     FORMAT TIME
  ======================================================= */

  function formatDuration(
    seconds: number
  ): string {
    const minutes =
      Math.round(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours =
      Math.floor(minutes / 60);

    const remaining =
      minutes % 60;

    return `${hours}h ${remaining}m`;
  }

  /* =======================================================
     SAFETY STATUS
  ======================================================= */

  const safetyStatus =
    getCurrentSafetyStatus(
      currentLocation
    );

  const zoneColor =
    getZoneColor(
      safetyStatus.type
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text
              style={styles.smallTitle}
            >
              SAFE TOURISM
            </Text>

            <Text
              style={styles.title}
            >
              Explore Safely
            </Text>

            <Text
              style={styles.subtitle}
            >
              Discover destinations with
              intelligent safety guidance
            </Text>
          </View>

          <View
            style={styles.headerIcon}
          >
            <Ionicons
              name="compass"
              size={28}
              color="#00D4FF"
            />
          </View>
        </View>

        {/* SEARCH */}

        <View
          style={styles.searchBox}
        >
          <Ionicons
            name="search"
            size={21}
            color="#8E99B2"
          />

          <TextInput
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setSearchResults([]);
            }}
            placeholder="Search destination..."
            placeholderTextColor="#717C96"
            style={
              styles.searchInput
            }
            returnKeyType="search"
            onSubmitEditing={
              searchDestination
            }
          />

          <TouchableOpacity
            style={
              styles.searchButton
            }
            onPress={
              searchDestination
            }
          >
            {searching ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* SEARCH RESULTS */}

        {searchResults.length >
          0 && (
          <View
            style={
              styles.resultsBox
            }
          >
            {searchResults.map(
              (result, index) => (
                <TouchableOpacity
                  key={`${result.lat}-${result.lon}-${index}`}
                  style={
                    styles.resultItem
                  }
                  onPress={() =>
                    selectDestination(
                      result
                    )
                  }
                >
                  <View
                    style={
                      styles.resultIcon
                    }
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color="#00D4FF"
                    />
                  </View>

                  <Text
                    style={
                      styles.resultText
                    }
                    numberOfLines={2}
                  >
                    {
                      result.display_name
                    }
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* STATUS ROW */}

        <View
          style={
            styles.statusRow
          }
        >
          <View
            style={
              styles.liveBadge
            }
          >
            <View
              style={
                styles.liveDot
              }
            />

            <Text
              style={
                styles.liveText
              }
            >
              LIVE LOCATION
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.locationButton
            }
            onPress={
              centerOnUser
            }
          >
            <Ionicons
              name="locate"
              size={17}
              color="#00D4FF"
            />

            <Text
              style={
                styles.locationButtonText
              }
            >
              My Location
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            LIVE SAFETY MAP
        ================================================= */}

        <View
          style={styles.mapCard}
        >
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude:
                DEFAULT_LOCATION.latitude,
              longitude:
                DEFAULT_LOCATION.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation={
              true
            }
            showsMyLocationButton={
              false
            }
            showsCompass={true}
            loadingEnabled={true}
            mapType="standard"
          >

            {/* SAFETY ZONES */}

            {SAFETY_ZONES.map(
              (zone) => (
                <React.Fragment
                  key={zone.id}
                >

                  <Circle
                    center={{
                      latitude:
                        zone.latitude,
                      longitude:
                        zone.longitude,
                    }}
                    radius={
                      zone.radius
                    }
                    strokeColor={getZoneColor(
                      zone.type
                    )}
                    fillColor={`${getZoneColor(
                      zone.type
                    )}35`}
                    strokeWidth={3}
                  />

                  <Marker
                    coordinate={{
                      latitude:
                        zone.latitude,
                      longitude:
                        zone.longitude,
                    }}
                    title={
                      zone.name
                    }
                    description={`${zone.type} SAFETY ZONE`}
                  >
                    <View
                      style={[
                        styles.zoneMarker,
                        {
                          backgroundColor:
                            getZoneColor(
                              zone.type
                            ),
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          zone.type ===
                          "DANGER"
                            ? "warning"
                            : zone.type ===
                              "MODERATE"
                            ? "alert"
                            : "shield-checkmark"
                        }
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                  </Marker>

                </React.Fragment>
              )
            )}

            {/* DESTINATION */}

            {destination && (
              <Marker
                coordinate={
                  destination
                }
                title={
                  destinationName
                }
                description="Selected destination"
                pinColor="#6C63FF"
              />
            )}

            {/* ROUTE */}

            {routeCoordinates.length >
              0 && (
              <Polyline
                coordinates={
                  routeCoordinates
                }
                strokeColor="#00D4FF"
                strokeWidth={5}
              />
            )}

          </MapView>

          {/* MAP TITLE */}

          <View
            style={styles.mapLabel}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.mapLabelText
              }
            >
              Live Safety Map
            </Text>
          </View>

          {/* MAP LEGEND */}

          <View
            style={
              styles.mapLegend
            }
          >
            <MapLegendItem
              color="#22C55E"
              text="Safe"
            />

            <MapLegendItem
              color="#F59E0B"
              text="Moderate"
            />

            <MapLegendItem
              color="#EF4444"
              text="Danger"
            />
          </View>

          {/* LOADING */}

          {loadingLocation && (
            <View
              style={
                styles.mapLoading
              }
            >
              <ActivityIndicator
                size="small"
                color="#00D4FF"
              />

              <Text
                style={
                  styles.mapLoadingText
                }
              >
                Getting location...
              </Text>
            </View>
          )}

          {/* CENTER BUTTON */}

          <TouchableOpacity
            style={
              styles.mapLocationButton
            }
            onPress={
              centerOnUser
            }
          >
            <Ionicons
              name="locate"
              size={22}
              color="#00D4FF"
            />
          </TouchableOpacity>
        </View>

        {/* SAFETY CARD */}

        <View
          style={[
            styles.safetyCard,
            {
              borderColor:
                zoneColor,
            },
          ]}
        >
          <View
            style={[
              styles.safetyIcon,
              {
                backgroundColor:
                  `${zoneColor}20`,
              },
            ]}
          >
            <Ionicons
              name={
                safetyStatus.type ===
                "DANGER"
                  ? "warning"
                  : safetyStatus.type ===
                    "MODERATE"
                  ? "alert-circle"
                  : "shield-checkmark"
              }
              size={28}
              color={zoneColor}
            />
          </View>

          <View
            style={
              styles.safetyContent
            }
          >
            <Text
              style={
                styles.cardLabel
              }
            >
              CURRENT SAFETY
            </Text>

            <Text
              style={[
                styles.safetyStatus,
                {
                  color:
                    zoneColor,
                },
              ]}
            >
              {
                safetyStatus.type
              }
            </Text>

            <Text
              style={
                styles.zoneName
              }
            >
              {
                safetyStatus.name
              }
            </Text>

            {safetyStatus.distance !==
              null && (
              <Text
                style={
                  styles.distanceText
                }
              >
                Nearest zone:{" "}
                {formatDistance(
                  safetyStatus.distance
                )}
              </Text>
            )}
          </View>
        </View>

        {/* ROUTE CARD */}

        {destination && (
          <View
            style={
              styles.routeCard
            }
          >
            <View
              style={
                styles.routeHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.cardLabel
                  }
                >
                  SELECTED DESTINATION
                </Text>

                <Text
                  style={
                    styles.routeTitle
                  }
                >
                  {
                    destinationName
                  }
                </Text>
              </View>

              <Ionicons
                name="navigate"
                size={25}
                color="#00D4FF"
              />
            </View>

            {loadingRoute && (
              <View
                style={
                  styles.routeLoading
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#00D4FF"
                />

                <Text
                  style={
                    styles.routeLoadingText
                  }
                >
                  Calculating route...
                </Text>
              </View>
            )}

            {routeDistance !==
              null &&
              routeDuration !==
                null && (
                <View
                  style={
                    styles.routeStats
                  }
                >
                  <View
                    style={
                      styles.routeStat
                    }
                  >
                    <Ionicons
                      name="map-outline"
                      size={18}
                      color="#A78BFA"
                    />

                    <Text
                      style={
                        styles.routeStatText
                      }
                    >
                      {formatDistance(
                        routeDistance
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.routeStat
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#00D4FF"
                    />

                    <Text
                      style={
                        styles.routeStatText
                      }
                    >
                      {formatDuration(
                        routeDuration
                      )}
                    </Text>
                  </View>
                </View>
              )}

            <View
              style={
                styles.actionRow
              }
            >
              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  saveDestination
                }
              >
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color="#00D4FF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.directionButton
                }
                onPress={
                  openExternalNavigation
                }
              >
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.directionButtonText
                  }
                >
                  Directions
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SAVED DESTINATION */}

        {savedDestination !==
          "" && (
          <View
            style={
              styles.savedCard
            }
          >
            <Ionicons
              name="bookmark"
              size={20}
              color="#A78BFA"
            />

            <View
              style={
                styles.savedContent
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                SAVED DESTINATION
              </Text>

              <Text
                style={
                  styles.savedText
                }
              >
                {
                  savedDestination
                }
              </Text>
            </View>
          </View>
        )}

        {/* SAFETY GUIDE */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Safety Zone Guide
        </Text>

        <View
          style={
            styles.legendCard
          }
        >
          <LegendItem
            color="#22C55E"
            title="Safe Zone"
            description="Low-risk area"
          />

          <LegendItem
            color="#F59E0B"
            title="Moderate Zone"
            description="Stay alert"
          />

          <LegendItem
            color="#EF4444"
            title="Danger Zone"
            description="Avoid if possible"
          />
        </View>

        {/* OFFLINE MAP */}

        <View
          style={
            styles.offlineCard
          }
        >
          <View
            style={
              styles.offlineIcon
            }
          >
            <Ionicons
              name="cloud-download-outline"
              size={25}
              color="#A78BFA"
            />
          </View>

          <View
            style={
              styles.offlineContent
            }
          >
            <Text
              style={
                styles.offlineTitle
              }
            >
              Offline Map
            </Text>

            <Text
              style={
                styles.offlineText
              }
            >
              Downloaded map areas can
              help tourists navigate when
              internet connectivity is
              unavailable.
            </Text>
          </View>
        </View>

        {/* NETWORK */}

        <View
          style={
            styles.networkCard
          }
        >
          <View
            style={
              styles.networkIcon
            }
          >
            <Ionicons
              name="cellular"
              size={23}
              color="#22C55E"
            />
          </View>

          <View
            style={
              styles.networkContent
            }
          >
            <Text
              style={
                styles.networkTitle
              }
            >
              Network Coverage
            </Text>

            <Text
              style={
                styles.networkText
              }
            >
              Cellular coverage can be
              integrated with external
              tower datasets for
              approximate availability.
            </Text>
          </View>

          <View
            style={
              styles.estimateBadge
            }
          >
            <Text
              style={
                styles.estimateText
              }
            >
              ESTIMATE
            </Text>
          </View>
        </View>

        {/* INFO */}

        <View
          style={
            styles.infoCard
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#00D4FF"
          />

          <Text
            style={
              styles.infoText
            }
          >
            Safe, Moderate and Danger
            zones are demo project data.
            In the final system, these
            zones can be managed through
            MongoDB Atlas and GeoJSON.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   MAP LEGEND
========================================================= */

function MapLegendItem({
  color,
  text,
}: {
  color: string;
  text: string;
}) {
  return (
    <View
      style={
        styles.mapLegendItem
      }
    >
      <View
        style={[
          styles.mapLegendDot,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={
          styles.mapLegendText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function LegendItem({
  color,
  title,
  description,
}: {
  color: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={
        styles.legendItem
      }
    >
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <View>
        <Text
          style={
            styles.legendTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.legendDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    safeArea: {
      flex: 1,
      backgroundColor:
        "#070B18",
    },

    container: {
      padding: 18,
      paddingBottom: 40,
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    smallTitle: {
      color: "#00D4FF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 2,
    },

    title: {
      color: "#FFFFFF",
      fontSize: 29,
      fontWeight: "900",
      marginTop: 4,
    },

    subtitle: {
      color: "#8994AE",
      fontSize: 13,
      marginTop: 5,
      maxWidth: 285,
      lineHeight: 19,
    },

    headerIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor:
        "#101A31",
      justifyContent:
        "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "#27375B",
    },

    searchBox: {
      height: 58,
      backgroundColor:
        "#10172B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#26345A",
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 15,
      paddingRight: 7,
    },

    searchInput: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 14,
      marginLeft: 10,
    },

    searchButton: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor:
        "#6C63FF",
      justifyContent:
        "center",
      alignItems: "center",
    },

    resultsBox: {
      backgroundColor:
        "#111A30",
      borderRadius: 17,
      marginTop: 7,
      borderWidth: 1,
      borderColor:
        "#26345A",
      overflow: "hidden",
    },

    resultItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#202B47",
    },

    resultIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        "#102A3B",
      justifyContent:
        "center",
      alignItems: "center",
    },

    resultText: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 13,
      marginLeft: 10,
      lineHeight: 18,
    },

    statusRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginVertical: 15,
    },

    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#101A2C",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 8,
      backgroundColor:
        "#22C55E",
      marginRight: 7,
    },

    liveText: {
      color: "#DCE4F4",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    locationButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#101A2C",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },

    locationButtonText: {
      color: "#00D4FF",
      fontSize: 11,
      fontWeight: "800",
      marginLeft: 6,
    },

    /* MAP */

    mapCard: {
      height: 350,
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        "#26345A",
      backgroundColor:
        "#10172B",
    },

    map: {
      width: "100%",
      height: "100%",
    },

    zoneMarker: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent:
        "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor:
        "#FFFFFF",
    },

    mapLabel: {
      position: "absolute",
      top: 14,
      left: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#070B18EE",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 15,
    },

    mapLabelText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
      marginLeft: 6,
    },

    mapLegend: {
      position: "absolute",
      top: 14,
      right: 14,
      backgroundColor:
        "#070B18EE",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
    },

    mapLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 2,
    },

    mapLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 5,
      marginRight: 6,
    },

    mapLegendText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },

    mapLocationButton: {
      position: "absolute",
      bottom: 15,
      right: 15,
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor:
        "#070B18EE",
      justifyContent:
        "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "#26345A",
    },

    mapLoading: {
      position: "absolute",
      bottom: 15,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#070B18EE",
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 15,
    },

    mapLoadingText: {
      color: "#FFFFFF",
      fontSize: 12,
      marginLeft: 8,
    },

    /* SAFETY */

    safetyCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#10172B",
      borderRadius: 22,
      padding: 16,
      marginTop: 17,
      borderWidth: 1,
    },

    safetyIcon: {
      width: 58,
      height: 58,
      borderRadius: 18,
      justifyContent:
        "center",
      alignItems: "center",
    },

    safetyContent: {
      flex: 1,
      marginLeft: 14,
    },

    cardLabel: {
      color: "#7F8BA5",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    safetyStatus: {
      fontSize: 22,
      fontWeight: "900",
      marginTop: 2,
    },

    zoneName: {
      color: "#E2E8F5",
      fontSize: 13,
      marginTop: 2,
    },

    distanceText: {
      color: "#7F8BA5",
      fontSize: 11,
      marginTop: 5,
    },

    /* ROUTE */

    routeCard: {
      backgroundColor:
        "#10172B",
      borderRadius: 22,
      padding: 16,
      marginTop: 17,
      borderWidth: 1,
      borderColor:
        "#26345A",
    },

    routeHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    routeTitle: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "900",
      marginTop: 4,
      maxWidth: 270,
    },

    routeLoading: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 15,
    },

    routeLoadingText: {
      color: "#00D4FF",
      fontSize: 12,
      marginLeft: 8,
    },

    routeStats: {
      flexDirection: "row",
      marginTop: 17,
    },

    routeStat: {
      flex: 1,
      height: 45,
      borderRadius: 13,
      backgroundColor:
        "#151E35",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      marginRight: 5,
    },

    routeStatText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
      marginLeft: 8,
    },

    actionRow: {
      flexDirection: "row",
      marginTop: 15,
    },

    saveButton: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#00D4FF",
      justifyContent:
        "center",
      alignItems: "center",
      flexDirection: "row",
      marginRight: 5,
    },

    saveButtonText: {
      color: "#00D4FF",
      fontSize: 13,
      fontWeight: "800",
      marginLeft: 6,
    },

    directionButton: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      backgroundColor:
        "#6C63FF",
      justifyContent:
        "center",
      alignItems: "center",
      flexDirection: "row",
      marginLeft: 5,
    },

    directionButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
      marginLeft: 6,
    },

    /* SAVED */

    savedCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#15132C",
      borderRadius: 18,
      padding: 15,
      marginTop: 15,
      borderWidth: 1,
      borderColor:
        "#40366D",
    },

    savedContent: {
      flex: 1,
      marginLeft: 12,
    },

    savedText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      marginTop: 4,
    },

    /* GUIDE */

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "900",
      marginTop: 25,
      marginBottom: 13,
    },

    legendCard: {
      backgroundColor:
        "#10172B",
      borderRadius: 20,
      padding: 15,
      borderWidth: 1,
      borderColor:
        "#26345A",
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 7,
    },

    legendDot: {
      width: 13,
      height: 13,
      borderRadius: 20,
      marginRight: 12,
    },

    legendTitle: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },

    legendDescription: {
      color: "#7F8BA5",
      fontSize: 11,
      marginTop: 2,
    },

    /* OFFLINE */

    offlineCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#15132C",
      borderRadius: 20,
      padding: 15,
      marginTop: 17,
      borderWidth: 1,
      borderColor:
        "#40366D",
    },

    offlineIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor:
        "#211D43",
      justifyContent:
        "center",
      alignItems: "center",
    },

    offlineContent: {
      flex: 1,
      marginLeft: 12,
    },

    offlineTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },

    offlineText: {
      color: "#8994AE",
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    /* NETWORK */

    networkCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#10172B",
      borderRadius: 20,
      padding: 15,
      marginTop: 12,
      borderWidth: 1,
      borderColor:
        "#26345A",
    },

    networkIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor:
        "#112A24",
      justifyContent:
        "center",
      alignItems: "center",
    },

    networkContent: {
      flex: 1,
      marginLeft: 12,
    },

    networkTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },

    networkText: {
      color: "#8994AE",
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    estimateBadge: {
      backgroundColor:
        "#162A24",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },

    estimateText: {
      color: "#22C55E",
      fontSize: 8,
      fontWeight: "900",
    },

    /* INFO */

    infoCard: {
      flexDirection: "row",
      backgroundColor:
        "#102238",
      borderRadius: 18,
      padding: 15,
      marginTop: 17,
      borderWidth: 1,
      borderColor:
        "#214B69",
    },

    infoText: {
      flex: 1,
      color: "#AFC4D9",
      fontSize: 11,
      lineHeight: 18,
      marginLeft: 10,
    },
  });