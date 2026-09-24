import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

/* =========================================================
   GOOGLE MAPS API KEY

   Paste your Google Maps API key here.
========================================================= */

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/* =========================================================
   TYPES
========================================================= */

type LocationData = {
  latitude: number;
  longitude: number;
  area: string;
  city: string;
};

type ServiceType = "Hospital" | "Police Station";

type EmergencyService = {
  id: string;
  name: string;
  type: ServiceType;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  googleMapsURI?: string;
};

/* =========================================================
   HOME
========================================================= */

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);

  const [touristName, setTouristName] =
    useState("Tourist");

  const [location, setLocation] =
    useState<LocationData | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [servicesLoading, setServicesLoading] =
    useState(false);

  const [selectedFilter, setSelectedFilter] =
    useState<
      "All" | "Hospital" | "Police Station"
    >("All");

  const [nearbyServices, setNearbyServices] =
    useState<EmergencyService[]>([]);

  /* =========================================================
     LOAD TOURIST NAME
  ========================================================= */

  useEffect(() => {
    loadTouristName();
  }, []);

  const loadTouristName = async () => {
    try {
      const name =
        await AsyncStorage.getItem("touristName");

      if (name && name.trim()) {
        setTouristName(name.trim());
      }
    } catch (error) {
      console.log(
        "Name loading error:",
        error
      );
    }
  };

  /* =========================================================
     LOCATION
  ========================================================= */

  useEffect(() => {
    let subscription:
      | Location.LocationSubscription
      | null = null;

    const startLocation = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationLoading(false);

          Alert.alert(
            "Location Permission Required",
            "Please allow location access to use live location and nearby emergency services."
          );

          return;
        }

        const current =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        await updateLocation(current);

        subscription =
          await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 15000,
              distanceInterval: 50,
            },
            async (newLocation) => {
              await updateLocation(newLocation);
            }
          );
      } catch (error) {
        console.log(
          "Location error:",
          error
        );

        setLocationLoading(false);

        Alert.alert(
          "Location Error",
          "Unable to get your current location."
        );
      }
    };

    startLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  /* =========================================================
     UPDATE LOCATION
  ========================================================= */

  const updateLocation = async (
    loc: Location.LocationObject
  ) => {
    try {
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      let area = "Current Area";
      let city = "India";

      try {
        const address =
          await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

        if (address.length > 0) {
          const item = address[0];

          area =
            item.district ||
            item.subregion ||
            item.city ||
            "Current Area";

          city =
            item.city ||
            item.subregion ||
            item.region ||
            "India";
        }
      } catch (error) {
        console.log(
          "Reverse geocode error:",
          error
        );
      }

      const newLocation: LocationData = {
        latitude,
        longitude,
        area,
        city,
      };

      setLocation(newLocation);
      setLocationLoading(false);

      /* -----------------------------------------------
         Send updated location to existing WebView
      ------------------------------------------------ */

      setTimeout(() => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "updateLocation",
            latitude,
            longitude,
          })
        );
      }, 500);
    } catch (error) {
      console.log(
        "Update location error:",
        error
      );

      setLocationLoading(false);
    }
  };

  /* =========================================================
     GOOGLE MAP + REAL GOOGLE PLACES
  ========================================================= */

  const mapHTML = useMemo(() => {
    if (!location) {
      return "";
    }

    return `
<!DOCTYPE html>

<html>

<head>

<meta
  name="viewport"
  content="width=device-width,
  initial-scale=1.0,
  maximum-scale=1.0,
  user-scalable=no"
/>

<style>

html,
body,
#map {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
}

</style>

<script>

let map;
let currentMarker;

let serviceMarkers = [];

let currentLat = ${location.latitude};
let currentLng = ${location.longitude};

/* =========================================================
   SEND MESSAGE TO REACT NATIVE
========================================================= */

function sendMessage(data) {

  window.ReactNativeWebView.postMessage(
    JSON.stringify(data)
  );

}

/* =========================================================
   CALCULATE DISTANCE
========================================================= */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI /
    180;

  const dLon =
    (lon2 - lon1) *
    Math.PI /
    180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(
      lat1 * Math.PI / 180
    ) *

    Math.cos(
      lat2 * Math.PI / 180
    ) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;

}

/* =========================================================
   CLEAR OLD SERVICE MARKERS
========================================================= */

function clearServiceMarkers() {

  serviceMarkers.forEach(
    function(marker) {

      marker.setMap(null);

    }
  );

  serviceMarkers = [];

}

/* =========================================================
   REAL NEARBY HOSPITAL + POLICE SEARCH
========================================================= */

async function findNearbyServices() {

  try {

    sendMessage({
      type: "servicesLoading"
    });

    clearServiceMarkers();

    /*
      Google Places API (New)
    */

    const placesLibrary =
      await google.maps.importLibrary(
        "places"
      );

    const Place =
      placesLibrary.Place;

    const SearchNearbyRankPreference =
      placesLibrary.SearchNearbyRankPreference;

    const request = {

      fields: [
        "displayName",
        "location",
        "formattedAddress",
        "googleMapsURI",
        "primaryType",
        "id"
      ],

      locationRestriction: {

        center: {
          lat: currentLat,
          lng: currentLng
        },

        radius: 2000

      },

      includedPrimaryTypes: [
        "hospital",
        "police"
      ],

      maxResultCount: 20,

      rankPreference:
        SearchNearbyRankPreference.DISTANCE

    };

    const response =
      await Place.searchNearby(
        request
      );

    const places =
      response.places || [];

    const services = [];

    /* =====================================================
       PROCESS RESULTS
    ===================================================== */

    places.forEach(
      function(place) {

        if (!place.location) {
          return;
        }

        const latitude =
          place.location.lat();

        const longitude =
          place.location.lng();

        const distance =
          calculateDistance(
            currentLat,
            currentLng,
            latitude,
            longitude
          );

        /*
          Only show services within
          exactly 2 KM.
        */

        if (distance > 2) {
          return;
        }

        let type =
          "Hospital";

        if (
          place.primaryType ===
          "police"
        ) {

          type =
            "Police Station";

        }

        /* =================================================
           MAP MARKER
        ================================================= */

        const marker =
          new google.maps.Marker({

            map: map,

            position: {
              lat: latitude,
              lng: longitude
            },

            title:
              place.displayName?.text ||
              type,

            icon: {

              url:
                type === "Hospital"

                  ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"

                  : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"

            }

          });

        serviceMarkers.push(
          marker
        );

        /* =================================================
           INFO WINDOW
        ================================================= */

        const infoWindow =
          new google.maps.InfoWindow({

            content: \`
              <div
                style="
                  min-width:200px;
                  padding:8px;
                  font-family:Arial;
                "
              >

                <strong>
                  \${place.displayName?.text || type}
                </strong>

                <br/>

                <span>
                  \${type}
                </span>

                <br/>

                <span>
                  \${distance.toFixed(2)} km away
                </span>

                <br/>

                <small>
                  \${place.formattedAddress || "Address unavailable"}
                </small>

              </div>
            \`

          });

        marker.addListener(
          "click",
          function() {

            infoWindow.open({
              map: map,
              anchor: marker
            });

          }
        );

        /* =================================================
           SEND SERVICE TO REACT NATIVE
        ================================================= */

        services.push({

          id:
            place.id ||
            (
              Math.random()
                .toString()
            ),

          name:
            place.displayName?.text ||
            type,

          type:
            type,

          address:
            place.formattedAddress ||
            "Address unavailable",

          distance:
            distance,

          latitude:
            latitude,

          longitude:
            longitude,

          googleMapsURI:
            place.googleMapsURI ||
            ""

        });

      }
    );

    /* =====================================================
       SORT BY DISTANCE
    ===================================================== */

    services.sort(
      function(a, b) {

        return (
          a.distance -
          b.distance
        );

      }
    );

    /* =====================================================
       SEND RESULTS TO REACT NATIVE
    ===================================================== */

    sendMessage({

      type:
        "nearbyServices",

      services:
        services

    });

  } catch (error) {

    console.log(
      "GOOGLE PLACES ERROR:",
      error
    );

    sendMessage({

      type:
        "servicesError",

      message:
        "Google Places could not load nearby hospitals and police stations."

    });

  }

}

/* =========================================================
   INITIALIZE GOOGLE MAP
========================================================= */

async function initMap() {

  try {

    const mapsLibrary =
      await google.maps.importLibrary(
        "maps"
      );

    const Map =
      mapsLibrary.Map;

    const position = {

      lat: currentLat,
      lng: currentLng

    };

    map =
      new Map(
        document.getElementById(
          "map"
        ),
        {

          center:
            position,

          zoom:
            15,

          mapTypeId:
            "roadmap",

          mapTypeControl:
            true,

          mapTypeControlOptions: {

            style:
              google.maps.MapTypeControlStyle.HORIZONTAL_BAR,

            position:
              google.maps.ControlPosition.TOP_RIGHT,

            mapTypeIds: [
              "roadmap",
              "satellite"
            ]

          },

          streetViewControl:
            false,

          fullscreenControl:
            false,

          zoomControl:
            true,

          gestureHandling:
            "greedy"

        }
      );

    /* =====================================================
       CURRENT LOCATION MARKER
    ===================================================== */

    currentMarker =
      new google.maps.Marker({

        position:
          position,

        map:
          map,

        title:
          "Your Current Location",

        icon: {

          url:
            "https://maps.google.com/mapfiles/ms/icons/green-dot.png"

        }

      });

    /* =====================================================
       FIND REAL SERVICES
    ===================================================== */

    findNearbyServices();

  } catch (error) {

    console.log(
      "MAP ERROR:",
      error
    );

    sendMessage({

      type:
        "servicesError",

      message:
        "Google Maps could not be loaded."

    });

  }

}

/* =========================================================
   UPDATE CURRENT LOCATION
========================================================= */

function updateLocation(
  latitude,
  longitude
) {

  currentLat =
    latitude;

  currentLng =
    longitude;

  if (
    !map ||
    !currentMarker
  ) {

    return;

  }

  const position = {

    lat:
      latitude,

    lng:
      longitude

  };

  currentMarker.setPosition(
    position
  );

  map.setCenter(
    position
  );

  /*
    Automatically search again
    around new location.
  */

  findNearbyServices();

}

/* =========================================================
   FOCUS SERVICE
========================================================= */

function focusLocation(
  latitude,
  longitude
) {

  if (!map) {
    return;
  }

  map.setCenter({

    lat:
      latitude,

    lng:
      longitude

  });

  map.setZoom(
    17
  );

}

/* =========================================================
   RECEIVE MESSAGE
========================================================= */

function handleMessage(
  event
) {

  try {

    const data =
      JSON.parse(
        event.data
      );

    /* UPDATE LOCATION */

    if (
      data.type ===
      "updateLocation"
    ) {

      updateLocation(
        data.latitude,
        data.longitude
      );

    }

    /* VIEW SERVICE ON MAP */

    if (
      data.type ===
      "focusLocation"
    ) {

      focusLocation(
        data.latitude,
        data.longitude
      );

    }

    /* REFRESH SERVICES */

    if (
      data.type ===
      "refreshServices"
    ) {

      findNearbyServices();

    }

  } catch (error) {

    console.log(
      "WebView message error:",
      error
    );

  }

}

/* =========================================================
   MESSAGE LISTENERS
========================================================= */

document.addEventListener(
  "message",
  handleMessage
);

window.addEventListener(
  "message",
  handleMessage
);

</script>

<script
  async
  defer
  src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap">
</script>

</head>

<body>

<div id="map"></div>

</body>

</html>
`;
  }, [
    location?.latitude,
    location?.longitude,
  ]);

  /* =========================================================
     FILTER SERVICES
  ========================================================= */

  const filteredServices =
    selectedFilter === "All"
      ? nearbyServices
      : nearbyServices.filter(
          (service) =>
            service.type ===
            selectedFilter
        );

  /* =========================================================
     VIEW SERVICE ON MAP
  ========================================================= */

  const viewOnMap = (
    service: EmergencyService
  ) => {

    webViewRef.current?.postMessage(
      JSON.stringify({

        type:
          "focusLocation",

        latitude:
          service.latitude,

        longitude:
          service.longitude,

      })
    );

  };

  /* =========================================================
     REFRESH REAL SERVICES
  ========================================================= */

  const refreshServices = () => {

    if (!location) {

      Alert.alert(
        "Location Required",
        "Please wait until your current location is available."
      );

      return;

    }

    setServicesLoading(
      true
    );

    /*
      This now actually calls
      Google Places Nearby Search
      inside the WebView.
    */

    webViewRef.current?.postMessage(
      JSON.stringify({

        type:
          "refreshServices",

      })
    );

  };

  /* =========================================================
     MY LOCATION
  ========================================================= */

  const goToMyLocation = () => {

    if (!location) {
      return;
    }

    webViewRef.current?.postMessage(
      JSON.stringify({

        type:
          "focusLocation",

        latitude:
          location.latitude,

        longitude:
          location.longitude,

      })
    );

  };

  /* =========================================================
     FORMAT DISTANCE
  ========================================================= */

  const formatDistance = (
    distance: number
  ) => {

    if (distance < 1) {

      return `${Math.round(
        distance * 1000
      )} m`;

    }

    return `${distance.toFixed(
      1
    )} km`;

  };

  /* =========================================================
     SERVICE CARD
  ========================================================= */

  const ServiceCard = ({
    service,
  }: {
    service: EmergencyService;
  }) => {

    const isHospital =
      service.type ===
      "Hospital";

    return (

      <View
        style={
          styles.serviceCard
        }
      >

        {/* ICON */}

        <View
          style={[
            styles.serviceIcon,
            {
              backgroundColor:
                isHospital
                  ? "rgba(255,77,103,0.12)"
                  : "rgba(0,212,255,0.12)",
            },
          ]}
        >

          <Ionicons
            name={
              isHospital
                ? "medkit"
                : "shield-checkmark"
            }
            size={23}
            color={
              isHospital
                ? "#FF4D67"
                : "#00D4FF"
            }
          />

        </View>

        {/* DETAILS */}

        <View
          style={
            styles.serviceDetails
          }
        >

          <Text
            style={
              styles.serviceName
            }
            numberOfLines={1}
          >
            {service.name}
          </Text>

          <Text
            style={[
              styles.serviceType,
              {
                color:
                  isHospital
                    ? "#FF4D67"
                    : "#00D4FF",
              },
            ]}
          >
            {service.type}
          </Text>

          <Text
            style={
              styles.serviceAddress
            }
            numberOfLines={2}
          >
            {service.address}
          </Text>

          {/* VIEW MAP */}

          <TouchableOpacity
            style={
              styles.viewMapButton
            }
            onPress={() =>
              viewOnMap(service)
            }
          >

            <Text
              style={
                styles.viewMapText
              }
            >
              View on Map
            </Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color="#6C63FF"
            />

          </TouchableOpacity>

        </View>

        {/* DISTANCE */}

        <View
          style={
            styles.distanceBox
          }
        >

          <Text
            style={
              styles.distance
            }
          >
            {formatDistance(
              service.distance
            )}
          </Text>

          <Text
            style={
              styles.away
            }
          >
            away
          </Text>

        </View>

      </View>

    );

  };

  /* =========================================================
     UI
  ========================================================= */

  return (

    <SafeAreaView
      style={
        styles.container
      }
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor="#070B18"
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={
            styles.header
          }
        >

          <View>

            <Text
              style={
                styles.hello
              }
            >
              Hello, {touristName} 👋
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Ready for a safe journey?
            </Text>

          </View>

          <TouchableOpacity
            style={
              styles.notificationButton
            }
          >

            <Ionicons
              name="notifications-outline"
              size={22}
              color="#FFFFFF"
            />

          </TouchableOpacity>

        </View>

        {/* =================================================
            SAFE AREA
        ================================================= */}

        <View
          style={
            styles.safeCard
          }
        >

          <View
            style={
              styles.safeIcon
            }
          >

            <Ionicons
              name="shield-checkmark"
              size={23}
              color="#32D583"
            />

          </View>

          <View
            style={
              styles.safeContent
            }
          >

            <Text
              style={
                styles.safeTitle
              }
            >
              YOU'RE IN A SAFE AREA
            </Text>

            <Text
              style={
                styles.safeSubtitle
              }
            >
              Location monitoring is active
            </Text>

          </View>

          <View
            style={
              styles.greenDot
            }
          />

        </View>

        {/* =================================================
            LIVE LOCATION HEADER
        ================================================= */}

        <View
          style={
            styles.sectionHeader
          }
        >

          <View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Live Location
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Your current location
            </Text>

          </View>

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
              LIVE
            </Text>

          </View>

        </View>

        {/* =================================================
            MAP
        ================================================= */}

        <View
          style={
            styles.mapContainer
          }
        >

          {locationLoading ? (

            <View
              style={
                styles.mapLoading
              }
            >

              <ActivityIndicator
                size="large"
                color="#6C63FF"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Getting your location...
              </Text>

            </View>

          ) : location ? (

            <WebView
              ref={
                webViewRef
              }
              source={{
                html:
                  mapHTML,
              }}
              originWhitelist={[
                "*",
              ]}
              javaScriptEnabled
              domStorageEnabled
              geolocationEnabled
              startInLoadingState
              style={
                styles.webview
              }
              onMessage={(
                event: WebViewMessageEvent
              ) => {

                try {

                  const data =
                    JSON.parse(
                      event
                        .nativeEvent
                        .data
                    );

                  /* =====================================
                     SERVICES LOADING
                  ===================================== */

                  if (
                    data.type ===
                    "servicesLoading"
                  ) {

                    setServicesLoading(
                      true
                    );

                    return;

                  }

                  /* =====================================
                     SERVICES RECEIVED
                  ===================================== */

                  if (
                    data.type ===
                    "nearbyServices"
                  ) {

                    setServicesLoading(
                      false
                    );

                    setNearbyServices(
                      data.services ||
                        []
                    );

                    return;

                  }

                  /* =====================================
                     SERVICES ERROR
                  ===================================== */

                  if (
                    data.type ===
                    "servicesError"
                  ) {

                    setServicesLoading(
                      false
                    );

                    setNearbyServices(
                      []
                    );

                    Alert.alert(
                      "Nearby Services",
                      data.message ||
                        "Unable to load nearby services."
                    );

                    return;

                  }

                } catch (error) {

                  console.log(
                    "Message parsing error:",
                    error
                  );

                }

              }}
            />

          ) : (

            <View
              style={
                styles.mapLoading
              }
            >

              <Ionicons
                name="location-outline"
                size={40}
                color="#FF4D67"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Location unavailable
              </Text>

            </View>

          )}

          {/* MY LOCATION BUTTON */}

          <TouchableOpacity
            style={
              styles.myLocationButton
            }
            onPress={
              goToMyLocation
            }
          >

            <Ionicons
              name="locate"
              size={23}
              color="#FFFFFF"
            />

          </TouchableOpacity>

        </View>

        {/* =================================================
            CURRENT LOCATION
        ================================================= */}

        {location && (

          <View
            style={
              styles.currentLocationCard
            }
          >

            <View
              style={
                styles.locationIcon
              }
            >

              <Ionicons
                name="location"
                size={21}
                color="#00D4FF"
              />

            </View>

            <View
              style={
                styles.locationInfo
              }
            >

              <Text
                style={
                  styles.locationTitle
                }
              >
                Current Location
              </Text>

              <Text
                style={
                  styles.areaName
                }
                numberOfLines={1}
              >
                {location.area},{" "}
                {location.city}
              </Text>

              <Text
                style={
                  styles.coordinates
                }
              >
                {location.latitude.toFixed(
                  5
                )}
                ,{" "}
                {location.longitude.toFixed(
                  5
                )}
              </Text>

              <Text
                style={
                  styles.updated
                }
              >
                Updated just now
              </Text>

            </View>

          </View>

        )}

        {/* =================================================
            NEARBY SERVICES HEADER
        ================================================= */}

        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 25,
            },
          ]}
        >

          <View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Nearby Emergency Services
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Hospitals & police near you
            </Text>

          </View>

          <View
            style={
              styles.kmBadge
            }
          >

            <Ionicons
              name="navigate-outline"
              size={14}
              color="#00D4FF"
            />

            <Text
              style={
                styles.kmText
              }
            >
              2 KM
            </Text>

          </View>

        </View>

        {/* =================================================
            FILTER
        ================================================= */}

        <View
          style={
            styles.filterContainer
          }
        >

          {/* ALL */}

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter ===
                "All" &&
                styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilter(
                "All"
              )
            }
          >

            <Text
              style={[
                styles.filterText,
                selectedFilter ===
                  "All" &&
                  styles.activeFilterText,
              ]}
            >
              All
            </Text>

          </TouchableOpacity>

          {/* HOSPITAL */}

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter ===
                "Hospital" &&
                styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilter(
                "Hospital"
              )
            }
          >

            <Text
              style={[
                styles.filterText,
                selectedFilter ===
                  "Hospital" &&
                  styles.activeFilterText,
              ]}
            >
              🏥 Hospitals
            </Text>

          </TouchableOpacity>

          {/* POLICE */}

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter ===
                "Police Station" &&
                styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilter(
                "Police Station"
              )
            }
          >

            <Text
              style={[
                styles.filterText,
                selectedFilter ===
                  "Police Station" &&
                  styles.activeFilterText,
              ]}
            >
              👮 Police
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            SERVICES LOADING
        ================================================= */}

        {servicesLoading ? (

          <View
            style={
              styles.loadingServices
            }
          >

            <ActivityIndicator
              size="small"
              color="#6C63FF"
            />

            <Text
              style={
                styles.serviceLoadingText
              }
            >
              Finding nearby services...
            </Text>

          </View>

        ) : filteredServices.length >
          0 ? (

          /* =================================================
             SERVICE LIST
          ================================================= */

          <View
            style={
              styles.serviceList
            }
          >

            {filteredServices.map(
              (service) => (

                <ServiceCard
                  key={
                    service.id
                  }
                  service={
                    service
                  }
                />

              )
            )}

          </View>

        ) : (

          <View
            style={
              styles.noServices
            }
          >

            <Ionicons
              name="search-outline"
              size={30}
              color="#6C63FF"
            />

            <Text
              style={
                styles.noServicesTitle
              }
            >
              No services found
            </Text>

            <Text
              style={
                styles.noServicesText
              }
            >
              No{" "}
              {selectedFilter ===
              "All"
                ? "hospital or police station"
                : selectedFilter.toLowerCase()}{" "}
              found within 2 km.
            </Text>

          </View>

        )}

        {/* =================================================
            REFRESH
        ================================================= */}

        <TouchableOpacity
          style={
            styles.refreshButton
          }
          onPress={
            refreshServices
          }
        >

          <Ionicons
            name="refresh-outline"
            size={18}
            color="#8D99AE"
          />

          <Text
            style={
              styles.refreshText
            }
          >
            Refresh Nearby Services
          </Text>

        </TouchableOpacity>

        {/* =================================================
            MONITORING
        ================================================= */}

        <View
          style={
            styles.monitoringCard
          }
        >

          <View
            style={
              styles.monitoringIcon
            }
          >

            <Ionicons
              name="location"
              size={18}
              color="#32D583"
            />

          </View>

          <View
            style={
              styles.monitoringInfo
            }
          >

            <Text
              style={
                styles.monitoringTitle
              }
            >
              Location is being monitored
            </Text>

            <Text
              style={
                styles.monitoringText
              }
            >
              Your current location updates
              automatically.
            </Text>

          </View>

          <View
            style={
              styles.monitoringDot
            }
          />

        </View>

        <View
          style={
            styles.bottomSpace
          }
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  hello: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#8D99AE",
    fontSize: 14,
    marginTop: 5,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor: "#17233B",
    justifyContent: "center",
    alignItems: "center",
  },

  /* SAFE */

  safeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor:
      "rgba(50,213,131,0.25)",
    borderRadius: 18,
    padding: 15,
    marginBottom: 22,
  },

  safeIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor:
      "rgba(50,213,131,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  safeContent: {
    flex: 1,
    marginLeft: 12,
  },

  safeTitle: {
    color: "#32D583",
    fontSize: 13,
    fontWeight: "800",
  },

  safeSubtitle: {
    color: "#8D99AE",
    fontSize: 12,
    marginTop: 4,
  },

  greenDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#32D583",
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  /* LIVE */

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(50,213,131,0.10)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#32D583",
    marginRight: 5,
  },

  liveText: {
    color: "#32D583",
    fontSize: 10,
    fontWeight: "800",
  },

  /* MAP */

  mapContainer: {
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#17233B",
    marginBottom: 12,
    position: "relative",
  },

  webview: {
    flex: 1,
  },

  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D1628",
  },

  loadingText: {
    color: "#8D99AE",
    fontSize: 13,
    marginTop: 10,
  },

  myLocationButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor: "#263653",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  /* CURRENT LOCATION */

  currentLocationCard: {
    flexDirection: "row",
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor: "#17233B",
    borderRadius: 17,
    padding: 14,
    marginBottom: 5,
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor:
      "rgba(0,212,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  locationTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  areaName: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  coordinates: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  updated: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
  },

  /* KM */

  kmBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(0,212,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(0,212,255,0.18)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  kmText: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 4,
  },

  /* FILTER */

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#0D1628",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#17233B",
    padding: 4,
    marginBottom: 12,
  },

  filterButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
  },

  activeFilter: {
    backgroundColor: "#6C63FF",
  },

  filterText: {
    color: "#8D99AE",
    fontSize: 11,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  /* SERVICES */

  serviceList: {
    gap: 10,
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor: "#17233B",
    borderRadius: 17,
    padding: 13,
  },

  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  serviceDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 7,
  },

  serviceName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  serviceType: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  serviceAddress: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },

  viewMapButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  viewMapText: {
    color: "#6C63FF",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },

  distanceBox: {
    alignItems: "flex-end",
  },

  distance: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  away: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 2,
  },

  /* LOADING */

  loadingServices: {
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor: "#17233B",
    borderRadius: 17,
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  serviceLoadingText: {
    color: "#8D99AE",
    fontSize: 12,
    marginLeft: 9,
  },

  /* NO SERVICES */

  noServices: {
    backgroundColor: "#0D1628",
    borderWidth: 1,
    borderColor: "#17233B",
    borderRadius: 17,
    padding: 25,
    alignItems: "center",
  },

  noServicesTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 9,
  },

  noServicesText: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 17,
  },

  /* REFRESH */

  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  refreshText: {
    color: "#8D99AE",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },

  /* MONITORING */

  monitoringCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(50,213,131,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(50,213,131,0.15)",
    borderRadius: 16,
    padding: 13,
  },

  monitoringIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      "rgba(50,213,131,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  monitoringInfo: {
    flex: 1,
    marginLeft: 10,
  },

  monitoringTitle: {
    color: "#32D583",
    fontSize: 12,
    fontWeight: "700",
  },

  monitoringText: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  monitoringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#32D583",
  },

  bottomSpace: {
    height: 30,
  },

});