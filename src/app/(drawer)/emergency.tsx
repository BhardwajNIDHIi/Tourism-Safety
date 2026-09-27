import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

/* =========================================================
   GOOGLE MAPS API KEY
   Paste your API key here
   ========================================================= */

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/* =========================================================
   TYPES
   ========================================================= */

type ServiceType =
  | "hospital"
  | "clinic"
  | "pharmacy"
  | "police"
  | "fire_station"
  | "fuel"
  | "atm";

type ServiceConfig = {
  type: ServiceType;
  title: string;
  emoji: string;
  googleType: string;
  color: string;
};

type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  openNow?: boolean;
};

/* =========================================================
   SERVICES
   ========================================================= */

const SERVICES: ServiceConfig[] = [
  {
    type: "hospital",
    title: "Hospital",
    emoji: "🏥",
    googleType: "hospital",
    color: "#EF4444",
  },
  {
    type: "clinic",
    title: "Clinic",
    emoji: "🩺",
    googleType: "doctor",
    color: "#F97316",
  },
  {
    type: "pharmacy",
    title: "Pharmacy",
    emoji: "💊",
    googleType: "pharmacy",
    color: "#22C55E",
  },
  {
    type: "police",
    title: "Police",
    emoji: "👮",
    googleType: "police",
    color: "#3B82F6",
  },
  {
    type: "fire_station",
    title: "Fire Station",
    emoji: "🚒",
    googleType: "fire_station",
    color: "#DC2626",
  },
  {
    type: "fuel",
    title: "Fuel Station",
    emoji: "⛽",
    googleType: "gas_station",
    color: "#A855F7",
  },
  {
    type: "atm",
    title: "ATM",
    emoji: "🏧",
    googleType: "atm",
    color: "#06B6D4",
  },
];

/* =========================================================
   GOOGLE MAP HTML
   ========================================================= */

function createMapHTML(
  latitude: number,
  longitude: number,
  service: ServiceConfig
) {
  return `
<!DOCTYPE html>
<html>
<head>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>

<style>

  html,
  body,
  #map {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  html,
  body {
    position: fixed;
    overscroll-behavior: none;
    touch-action: none;
  }

  body {
    background: #0B1220;
    font-family: Arial, sans-serif;
  }

  #map {
    position: absolute;
    inset: 0;
    touch-action: none;
  }

  .user-marker {
    width: 22px;
    height: 22px;
    background: #2563EB;
    border: 4px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0,0,0,.4);
  }

  .place-marker {
    width: 43px;
    height: 43px;
    background: white;
    border-radius: 50%;
    border: 3px solid #111827;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 3px 12px rgba(0,0,0,.4);
  }

  .info {
    min-width: 190px;
    max-width: 260px;
    padding: 3px;
  }

  .info-title {
    font-size: 15px;
    font-weight: bold;
    color: #111827;
    margin-bottom: 5px;
  }

  .info-address {
    font-size: 12px;
    color: #4B5563;
    line-height: 17px;
  }

  .info-rating {
    color: #F59E0B;
    font-size: 12px;
    margin-top: 5px;
  }

</style>

</head>

<body>

<div id="map"></div>

<script>

let map;
let userMarker;
let placeMarkers = [];
let infoWindow;

const USER_LAT = ${latitude};
const USER_LNG = ${longitude};

const SERVICE_TYPE = "${service.googleType}";
const SERVICE_EMOJI = "${service.emoji}";

/* =========================================================
   CLEAR OLD MARKERS
   ========================================================= */

function clearPlaceMarkers() {

  placeMarkers.forEach(function(marker) {
    marker.map = null;
  });

  placeMarkers = [];
}

/* =========================================================
   CREATE MARKER
   ========================================================= */

function createMarkerElement(emoji) {

  const element = document.createElement("div");

  element.className = "place-marker";

  element.innerHTML = emoji;

  return element;
}

/* =========================================================
   SEARCH NEARBY PLACES
   ========================================================= */

async function searchPlaces() {

  clearPlaceMarkers();

  try {

    const request = {

      includedPrimaryTypes: [SERVICE_TYPE],

      locationRestriction: {

        center: {
          lat: USER_LAT,
          lng: USER_LNG
        },

        radius: 2000

      },

      maxResultCount: 20,

      fields: [
        "displayName",
        "formattedAddress",
        "location",
        "rating",
        "id",
        "regularOpeningHours"
      ]

    };

    const result =
      await google.maps.places.Place.searchNearby(request);

    if (!result || !result.places) {

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "NO_RESULTS"
        })
      );

      return;
    }

    result.places.forEach(function(place) {

      if (!place.location) {
        return;
      }

      const position = {

        lat: place.location.lat(),

        lng: place.location.lng()

      };

      const markerElement =
        createMarkerElement(SERVICE_EMOJI);

      const marker =
        new google.maps.marker.AdvancedMarkerElement({

          map: map,

          position: position,

          content: markerElement,

          title:
            place.displayName ||
            "Emergency Service"

        });

      marker.addListener("click", function() {

        if (infoWindow) {
          infoWindow.close();
        }

        let ratingText = "";

        if (place.rating) {

          ratingText =
            '<div class="info-rating">⭐ ' +
            place.rating +
            "</div>";

        }

        const html =

          '<div class="info">' +

            '<div class="info-title">' +

              SERVICE_EMOJI +
              " " +

              (
                place.displayName ||
                "Emergency Service"
              ) +

            "</div>" +

            '<div class="info-address">' +

              (
                place.formattedAddress ||
                "Address unavailable"
              ) +

            "</div>" +

            ratingText +

          "</div>";

        infoWindow =
          new google.maps.InfoWindow({

            content: html,

            position: position

          });

        infoWindow.open({
          map: map
        });

      });

      placeMarkers.push(marker);

      let openNow = undefined;

      if (
        place.regularOpeningHours &&
        typeof place.regularOpeningHours.isOpen === "function"
      ) {

        openNow =
          place.regularOpeningHours.isOpen();

      }

      window.ReactNativeWebView.postMessage(

        JSON.stringify({

          type: "PLACE",

          place: {

            id:
              place.id ||
              Math.random().toString(),

            name:
              place.displayName ||
              "Emergency Service",

            address:
              place.formattedAddress ||
              "Address unavailable",

            latitude:
              position.lat,

            longitude:
              position.lng,

            rating:
              place.rating || null,

            openNow:
              openNow

          }

        })

      );

    });

    window.ReactNativeWebView.postMessage(

      JSON.stringify({
        type: "DONE"
      })

    );

  } catch(error) {

    window.ReactNativeWebView.postMessage(

      JSON.stringify({

        type: "ERROR",

        message: String(error)

      })

    );

  }

}

/* =========================================================
   INITIALIZE GOOGLE MAP
   ========================================================= */

async function initMap() {

  try {

    await google.maps.importLibrary("maps");

    await google.maps.importLibrary("marker");

    await google.maps.importLibrary("places");

    map =
      new google.maps.Map(

        document.getElementById("map"),

        {

          center: {

            lat: USER_LAT,

            lng: USER_LNG

          },

          zoom: 14,

          mapTypeControl: true,

          fullscreenControl: true,

          streetViewControl: false,

          zoomControl: true,

          gestureHandling: "greedy",

          mapId: "SAFE_TOURISM_MAP"

        }

      );

    /* =====================================================
       CURRENT USER LOCATION MARKER
       ===================================================== */

    const userElement =
      document.createElement("div");

    userElement.className =
      "user-marker";

    userMarker =
      new google.maps.marker.AdvancedMarkerElement({

        map: map,

        position: {

          lat: USER_LAT,

          lng: USER_LNG

        },

        content: userElement,

        title: "Your Current Location"

      });

    searchPlaces();

  } catch(error) {

    window.ReactNativeWebView.postMessage(

      JSON.stringify({

        type: "ERROR",

        message: String(error)

      })

    );

  }

}

</script>

<script
  async
  src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=initMap"
></script>

</body>
</html>
`;
}

/* =========================================================
   MAIN SCREEN
   ========================================================= */

export default function EmergencyScreen() {

  const webViewRef =
    useRef<WebView>(null);

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationName, setLocationName] =
    useState("Getting your location...");

  const [selectedService, setSelectedService] =
    useState<ServiceType>("hospital");

  const [places, setPlaces] =
    useState<Place[]>([]);

  const [loadingLocation, setLoadingLocation] =
    useState(true);

  const [loadingPlaces, setLoadingPlaces] =
    useState(false);

  /* =====================================================
     SELECTED SERVICE
     ===================================================== */

  const selectedConfig = useMemo(() => {

    return (
      SERVICES.find(
        (item) =>
          item.type === selectedService
      ) || SERVICES[0]
    );

  }, [selectedService]);

  /* =====================================================
     LOCATION
     ===================================================== */

  useEffect(() => {

    getLocation();

  }, []);

  async function getLocation() {

    try {

      setLoadingLocation(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {

        Alert.alert(

          "Location Required",

          "Please allow location permission to find nearby emergency services."

        );

        setLoadingLocation(false);

        return;
      }

      const current =
        await Location.getCurrentPositionAsync({

          accuracy:
            Location.Accuracy.High

        });

      setLocation(current);

      try {

        const address =
          await Location.reverseGeocodeAsync({

            latitude:
              current.coords.latitude,

            longitude:
              current.coords.longitude

          });

        if (address.length > 0) {

          const item =
            address[0];

          const parts = [

            item.name,

            item.street,

            item.district,

            item.city,

            item.region

          ].filter(Boolean);

          if (parts.length > 0) {

            setLocationName(
              parts.join(", ")
            );

          } else {

            setLocationName(
              "Current Location"
            );

          }

        }

      } catch {

        setLocationName(
          "Current Location"
        );

      }

    } catch (error) {

      console.log(
        "Location error:",
        error
      );

      Alert.alert(

        "Location Error",

        "Unable to get your current location."

      );

    } finally {

      setLoadingLocation(false);

    }

  }

  /* =====================================================
     CHANGE SERVICE
     ===================================================== */

  function changeService(
    type: ServiceType
  ) {

    setSelectedService(type);

    setPlaces([]);

    setLoadingPlaces(true);

  }

  /* =====================================================
     MAP HTML
     ===================================================== */

  const mapHTML =
    useMemo(() => {

      if (!location) {
        return "";
      }

      return createMapHTML(

        location.coords.latitude,

        location.coords.longitude,

        selectedConfig

      );

    }, [
      location,
      selectedConfig
    ]);

  /* =====================================================
     WEBVIEW MESSAGE
     ===================================================== */

  function handleWebViewMessage(
    event: any
  ) {

    try {

      const data =
        JSON.parse(
          event.nativeEvent.data
        );

      if (data.type === "PLACE") {

        const newPlace: Place = {

          id:
            data.place.id,

          name:
            data.place.name,

          address:
            data.place.address,

          latitude:
            data.place.latitude,

          longitude:
            data.place.longitude,

          rating:
            data.place.rating ||
            undefined,

          openNow:
            data.place.openNow

        };

        setPlaces(
          (oldPlaces) => {

            const exists =
              oldPlaces.some(

                (place) =>
                  place.id ===
                  newPlace.id

              );

            if (exists) {

              return oldPlaces;

            }

            return [
              ...oldPlaces,
              newPlace
            ];

          }
        );

      }

      if (data.type === "DONE") {

        setLoadingPlaces(false);

      }

      if (data.type === "NO_RESULTS") {

        setLoadingPlaces(false);

        setPlaces([]);

      }

      if (data.type === "ERROR") {

        setLoadingPlaces(false);

        console.log(

          "Google Maps error:",

          data.message

        );

        Alert.alert(

          "Google Maps Error",

          "Please check your API key and Google Maps APIs."

        );

      }

    } catch (error) {

      console.log(

        "WebView message error:",

        error

      );

    }

  }

  /* =====================================================
     CALL 112
     ===================================================== */

  async function callEmergency() {

    try {

      await Linking.openURL(
        "tel:112"
      );

    } catch {

      Alert.alert(

        "Unable to Call",

        "Your device could not open the phone application."

      );

    }

  }

  /* =====================================================
     SHARE LOCATION
     ===================================================== */

  async function shareLocation() {

    if (!location) {
      return;
    }

    const lat =
      location.coords.latitude;

    const lng =
      location.coords.longitude;

    const url =
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    try {

      await Linking.openURL(

        `sms:?body=My current location: ${url}`

      );

    } catch {

      Alert.alert(

        "Location",

        url

      );

    }

  }

  /* =====================================================
     LOADING SCREEN
     ===================================================== */

  if (loadingLocation) {

    return (

      <SafeAreaView
        style={styles.loadingScreen}
      >

        <StatusBar
          barStyle="light-content"
          backgroundColor="#070B18"
        />

        <View
          style={styles.loadingCircle}
        >

          <Ionicons
            name="location"
            size={34}
            color="#00D4FF"
          />

        </View>

        <ActivityIndicator
          size="large"
          color="#6C63FF"
        />

        <Text
          style={styles.loadingTitle}
        >
          Finding your location
        </Text>

        <Text
          style={styles.loadingSubtitle}
        >
          Preparing nearby emergency services...
        </Text>

      </SafeAreaView>

    );

  }

  /* =====================================================
     MAIN UI
     ===================================================== */

  return (

    <SafeAreaView
      style={styles.container}
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor="#070B18"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            HEADER
           ================================================= */}

        <View style={styles.header}>

          <View style={styles.headerLeft}>

            <View
              style={styles.emergencyBadge}
            >

              <View
                style={styles.redDot}
              />

              <Text
                style={
                  styles.emergencyBadgeText
                }
              >
                EMERGENCY
              </Text>

            </View>

            <Text
              style={styles.headerTitle}
            >
              Emergency Finder
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Find help around your current location
            </Text>

          </View>

          <View style={styles.shield}>

            <Ionicons
              name="shield-checkmark"
              size={27}
              color="#00D4FF"
            />

          </View>

        </View>

        {/* =================================================
            LOCATION
           ================================================= */}

        <View
          style={styles.locationCard}
        >

          <View
            style={styles.locationIcon}
          >

            <Ionicons
              name="location"
              size={23}
              color="#00D4FF"
            />

          </View>

          <View
            style={styles.locationInfo}
          >

            <View
              style={styles.locationTopRow}
            >

              <Text
                style={styles.locationLabel}
              >
                YOUR CURRENT LOCATION
              </Text>

              <View
                style={styles.activeLocation}
              >

                <View
                  style={styles.greenDot}
                />

                <Text
                  style={styles.activeText}
                >
                  Active
                </Text>

              </View>

            </View>

            <Text
              style={styles.locationName}
              numberOfLines={2}
            >
              {locationName}
            </Text>

            {location && (

              <Text
                style={styles.coordinates}
              >

                {location.coords.latitude.toFixed(5)}

                {"  •  "}

                {location.coords.longitude.toFixed(5)}

              </Text>

            )}

          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={getLocation}
          >

            <Ionicons
              name="refresh"
              size={19}
              color="#FFFFFF"
            />

          </TouchableOpacity>

        </View>

        {/* =================================================
            SERVICES
           ================================================= */}

        <View
          style={styles.sectionHeading}
        >

          <View>

            <Text
              style={styles.sectionTitle}
            >
              Emergency Services
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              What kind of help do you need?
            </Text>

          </View>

          <View
            style={styles.nearbyBadge}
          >

            <Text
              style={styles.nearbyBadgeText}
            >
              NEARBY
            </Text>

          </View>

        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={
            styles.serviceScroll
          }
        >

          {SERVICES.map(
            (service) => {

              const active =
                service.type ===
                selectedService;

              return (

                <TouchableOpacity
                  key={service.type}
                  activeOpacity={0.8}
                  onPress={() =>
                    changeService(
                      service.type
                    )
                  }
                  style={[
                    styles.serviceCard,

                    active && {
                      borderColor:
                        service.color,

                      backgroundColor:
                        service.color +
                        "18",
                    },
                  ]}
                >

                  {active && (

                    <View
                      style={[
                        styles.selectedLine,

                        {
                          backgroundColor:
                            service.color,
                        },
                      ]}
                    />

                  )}

                  <View
                    style={[
                      styles.serviceIcon,

                      {
                        backgroundColor:
                          service.color +
                          "20",
                      },
                    ]}
                  >

                    <Text
                      style={
                        styles.serviceEmoji
                      }
                    >
                      {service.emoji}
                    </Text>

                  </View>

                  <Text
                    style={[
                      styles.serviceName,

                      active && {
                        color:
                          "#FFFFFF",
                      },
                    ]}
                  >
                    {service.title}
                  </Text>

                </TouchableOpacity>

              );

            }
          )}

        </ScrollView>

        {/* =================================================
            SELECTED CATEGORY
           ================================================= */}

        <View
          style={styles.selectedCategory}
        >

          <View
            style={[
              styles.selectedCategoryIcon,

              {
                backgroundColor:
                  selectedConfig.color +
                  "20",
              },
            ]}
          >

            <Text
              style={styles.selectedEmoji}
            >
              {selectedConfig.emoji}
            </Text>

          </View>

          <View
            style={styles.selectedCategoryInfo}
          >

            <Text
              style={styles.showingText}
            >
              SHOWING NEARBY
            </Text>

            <Text
              style={
                styles.selectedCategoryTitle
              }
            >
              {selectedConfig.title}
            </Text>

          </View>

          <View
            style={styles.foundBox}
          >

            <Text
              style={styles.foundNumber}
            >
              {places.length}
            </Text>

            <Text
              style={styles.foundText}
            >
              Found
            </Text>

          </View>

        </View>

        {/* =================================================
            MAP HEADER
           ================================================= */}

        <View
          style={styles.mapHeader}
        >

          <View>

            <Text
              style={styles.mapTitle}
            >
              Nearby {selectedConfig.title}
            </Text>

            <Text
              style={styles.mapSubtitle}
            >
              Pinch to zoom • Drag to move • Tap marker for details
            </Text>

          </View>

          {loadingPlaces && (

            <View
              style={styles.searching}
            >

              <ActivityIndicator
                size="small"
                color="#00D4FF"
              />

              <Text
                style={styles.searchingText}
              >
                Searching
              </Text>

            </View>

          )}

        </View>

        {/* =================================================
            MAP
           ================================================= */}

        <View
          style={styles.mapContainer}
        >

          {mapHTML ? (

            <WebView
              ref={webViewRef}

              source={{
                html: mapHTML,
              }}

              onMessage={
                handleWebViewMessage
              }

              javaScriptEnabled={true}

              domStorageEnabled={true}

              originWhitelist={[
                "*"
              ]}

              startInLoadingState={true}

              /*
               * IMPORTANT:
               * WebView document scrolling disabled.
               * Map gestures remain active.
               */

              scrollEnabled={false}

              /*
               * IMPORTANT:
               * Prevent parent ScrollView
               * from scrolling when gesture
               * starts inside WebView.
               */

              nestedScrollEnabled={true}

              bounces={false}

              showsVerticalScrollIndicator={
                false
              }

              showsHorizontalScrollIndicator={
                false
              }

              setBuiltInZoomControls={
                true
              }

              setDisplayZoomControls={
                false
              }

              style={styles.map}

              renderLoading={() => (

                <View
                  style={styles.mapLoading}
                >

                  <ActivityIndicator
                    size="large"
                    color="#6C63FF"
                  />

                  <Text
                    style={
                      styles.mapLoadingText
                    }
                  >
                    Loading map...
                  </Text>

                </View>

              )}

            />

          ) : (

            <View
              style={styles.mapLoading}
            >

              <Text
                style={styles.mapLoadingText}
              >
                Map unavailable
              </Text>

            </View>

          )}

          <View
            style={styles.mapLabel}
          >

            <Text
              style={
                styles.mapLabelEmoji
              }
            >
              {selectedConfig.emoji}
            </Text>

            <Text
              style={styles.mapLabelText}
            >
              {selectedConfig.title}
            </Text>

          </View>

        </View>

        {/* =================================================
            RESULTS
           ================================================= */}

        <View
          style={styles.resultsHeader}
        >

          <View>

            <Text
              style={styles.resultsTitle}
            >
              Nearby Locations
            </Text>

            <Text
              style={styles.resultsSubtitle}
            >
              Within approximately 2 km
            </Text>

          </View>

          <View
            style={styles.resultsCount}
          >

            <Text
              style={
                styles.resultsCountText
              }
            >
              {places.length} found
            </Text>

          </View>

        </View>

        {/* =================================================
            PLACE LIST
           ================================================= */}

        {loadingPlaces &&
        places.length === 0 ? (

          <View
            style={styles.searchCard}
          >

            <ActivityIndicator
              size="small"
              color="#00D4FF"
            />

            <Text
              style={
                styles.searchCardText
              }
            >
              Finding nearby{" "}
              {selectedConfig.title.toLowerCase()}
              s...
            </Text>

          </View>

        ) : places.length === 0 ? (

          <View
            style={styles.emptyCard}
          >

            <Text
              style={styles.emptyEmoji}
            >
              {selectedConfig.emoji}
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No nearby locations found
            </Text>

            <Text
              style={styles.emptySubtitle}
            >
              Try updating your location or selecting
              another emergency service.
            </Text>

          </View>

        ) : (

          places.map(
            (place, index) => (

              <TouchableOpacity
                key={`${place.id}-${index}`}
                activeOpacity={0.8}
                style={styles.placeCard}

                onPress={() => {

                  webViewRef.current?.injectJavaScript(`

                    if (
                      typeof map !== "undefined" &&
                      map
                    ) {

                      map.setCenter({

                        lat: ${place.latitude},

                        lng: ${place.longitude}

                      });

                      map.setZoom(17);

                    }

                    true;

                  `);

                }}

              >

                <View
                  style={[
                    styles.placeIcon,

                    {
                      backgroundColor:
                        selectedConfig.color +
                        "18",
                    },
                  ]}
                >

                  <Text
                    style={
                      styles.placeEmoji
                    }
                  >
                    {selectedConfig.emoji}
                  </Text>

                </View>

                <View
                  style={styles.placeInfo}
                >

                  <Text
                    style={styles.placeName}
                    numberOfLines={1}
                  >
                    {place.name}
                  </Text>

                  <Text
                    style={styles.placeAddress}
                    numberOfLines={2}
                  >
                    {place.address}
                  </Text>

                  <View
                    style={styles.placeMeta}
                  >

                    {place.rating && (

                      <Text
                        style={styles.rating}
                      >
                        ⭐ {place.rating}
                      </Text>

                    )}

                    {place.openNow !==
                      undefined && (

                      <Text
                        style={[
                          styles.openStatus,

                          {
                            color:
                              place.openNow
                                ? "#22C55E"
                                : "#EF4444",
                          },
                        ]}
                      >
                        {place.openNow
                          ? "Open"
                          : "Closed"}
                      </Text>

                    )}

                  </View>

                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#64748B"
                />

              </TouchableOpacity>

            )
          )

        )}

        {/* =================================================
            QUICK HELP
           ================================================= */}

        <Text
          style={styles.quickHelpTitle}
        >
          Quick Help
        </Text>

        <View
          style={styles.quickHelpRow}
        >

          <TouchableOpacity
            style={styles.callCard}
            activeOpacity={0.8}
            onPress={callEmergency}
          >

            <View
              style={styles.callIcon}
            >

              <Ionicons
                name="call"
                size={22}
                color="#FFFFFF"
              />

            </View>

            <View>

              <Text
                style={styles.quickCardSmall}
              >
                EMERGENCY
              </Text>

              <Text
                style={styles.quickCardTitle}
              >
                Call 112
              </Text>

            </View>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareCard}
            activeOpacity={0.8}
            onPress={shareLocation}
          >

            <View
              style={styles.shareIcon}
            >

              <Ionicons
                name="location"
                size={22}
                color="#FFFFFF"
              />

            </View>

            <View>

              <Text
                style={styles.quickCardSmall}
              >
                SHARE
              </Text>

              <Text
                style={styles.quickCardTitle}
              >
                Location
              </Text>

            </View>

          </TouchableOpacity>

        </View>

        <View
          style={styles.bottomSpace}
        />

      </ScrollView>

    </SafeAreaView>

  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#070B18",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#00D4FF15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 18,
  },

  loadingSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 7,
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerLeft: {
    flex: 1,
  },

  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  redDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 7,
  },

  emergencyBadgeText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 5,
  },

  shield: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#00D4FF12",
    borderWidth: 1,
    borderColor: "#00D4FF25",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  locationCard: {
    backgroundColor: "#0B1220",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  locationIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "#00D4FF14",
    alignItems: "center",
    justifyContent: "center",
  },

  locationInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  locationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  locationLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  activeLocation: {
    flexDirection: "row",
    alignItems: "center",
  },

  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },

  activeText: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "700",
  },

  locationName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
    lineHeight: 18,
  },

  coordinates: {
    color: "#475569",
    fontSize: 9,
    marginTop: 3,
  },

  refreshButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
  },

  nearbyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#22C55E12",
  },

  nearbyBadgeText: {
    color: "#22C55E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  serviceScroll: {
    paddingRight: 10,
    paddingBottom: 3,
  },

  serviceCard: {
    width: 100,
    height: 108,
    backgroundColor: "#0B1220",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    overflow: "hidden",
  },

  selectedLine: {
    position: "absolute",
    top: 0,
    left: 17,
    right: 17,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  serviceEmoji: {
    fontSize: 25,
  },

  serviceName: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  selectedCategory: {
    backgroundColor: "#0B1220",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginTop: 17,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCategoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedEmoji: {
    fontSize: 24,
  },

  selectedCategoryInfo: {
    flex: 1,
    marginLeft: 11,
  },

  showingText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  selectedCategoryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  foundBox: {
    alignItems: "center",
    paddingHorizontal: 9,
  },

  foundNumber: {
    color: "#00D4FF",
    fontSize: 19,
    fontWeight: "900",
  },

  foundText: {
    color: "#64748B",
    fontSize: 8,
    marginTop: 1,
  },

  mapHeader: {
    marginTop: 23,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  mapTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  mapSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
    maxWidth: 250,
  },

  searching: {
    flexDirection: "row",
    alignItems: "center",
  },

  searchingText: {
    color: "#64748B",
    fontSize: 10,
    marginLeft: 5,
  },

  mapContainer: {
    height: 370,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#111827",
    position: "relative",
  },

  map: {
    flex: 1,
    backgroundColor: "#111827",
  },

  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
  },

  mapLoadingText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 9,
  },

  mapLabel: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#070B18E8",
    borderWidth: 1,
    borderColor: "#FFFFFF15",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  mapLabelEmoji: {
    fontSize: 16,
  },

  mapLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 5,
  },

  resultsHeader: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultsTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  resultsSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  resultsCount: {
    backgroundColor: "#6C63FF18",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  resultsCountText: {
    color: "#A5B4FC",
    fontSize: 10,
    fontWeight: "800",
  },

  searchCard: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  searchCardText: {
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 9,
  },

  emptyCard: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 17,
    padding: 25,
    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  emptySubtitle: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  placeCard: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 16,
    padding: 12,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  placeEmoji: {
    fontSize: 23,
  },

  placeInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  placeName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  placeAddress: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  placeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  rating: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "700",
    marginRight: 9,
  },

  openStatus: {
    fontSize: 10,
    fontWeight: "800",
  },

  quickHelpTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 22,
    marginBottom: 10,
  },

  quickHelpRow: {
    flexDirection: "row",
    gap: 10,
  },

  callCard: {
    flex: 1,
    backgroundColor: "#EF444418",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EF444435",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  shareCard: {
    flex: 1,
    backgroundColor: "#00D4FF12",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#00D4FF30",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  callIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  shareIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#00A8C8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  quickCardSmall: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  quickCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },

  bottomSpace: {
    height: 30,
  },

});