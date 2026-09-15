import React, { useEffect, useState } from "react";
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

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* =========================================================
   TYPES
========================================================= */

type ServiceType =
  | "hospital"
  | "clinic"
  | "police"
  | "pharmacy"
  | "fire"
  | "fuel";

type EmergencyService = {
  id: string;
  name: string;
  type: ServiceType;
  distance: number;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
};

type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
};

/* =========================================================
   OVERPASS SERVERS
========================================================= */

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/* =========================================================
   DISTANCE
========================================================= */

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

/* =========================================================
   DEFAULT NAME
========================================================= */

function getDefaultName(type: ServiceType) {
  switch (type) {
    case "hospital":
      return "Nearby Hospital";

    case "clinic":
      return "Nearby Clinic";

    case "police":
      return "Nearby Police Station";

    case "pharmacy":
      return "Nearby Pharmacy";

    case "fire":
      return "Nearby Fire Station";

    case "fuel":
      return "Nearby Fuel Station";

    default:
      return "Emergency Service";
  }
}

/* =========================================================
   SERVICE TITLE
========================================================= */

function getServiceTitle(type: ServiceType) {
  switch (type) {
    case "hospital":
      return "Hospital";

    case "clinic":
      return "Clinic";

    case "police":
      return "Police";

    case "pharmacy":
      return "Pharmacy";

    case "fire":
      return "Fire Station";

    case "fuel":
      return "Fuel Station";

    default:
      return "Service";
  }
}

/* =========================================================
   AMENITY → SERVICE TYPE
========================================================= */

function getServiceType(
  amenity?: string
): ServiceType | null {
  switch (amenity) {
    case "hospital":
      return "hospital";

    case "clinic":
      return "clinic";

    case "police":
      return "police";

    case "pharmacy":
      return "pharmacy";

    case "fire_station":
      return "fire";

    case "fuel":
      return "fuel";

    default:
      return null;
  }
}

/* =========================================================
   ADDRESS
========================================================= */

function getAddress(tags: any) {
  const houseNumber =
    tags["addr:housenumber"];

  const street =
    tags["addr:street"];

  const suburb =
    tags["addr:suburb"];

  const district =
    tags["addr:district"];

  const city =
    tags["addr:city"];

  const address = [
    [houseNumber, street]
      .filter(Boolean)
      .join(" "),
    suburb,
    district,
    city,
  ]
    .filter(Boolean)
    .join(", ");

  return address || "Address unavailable";
}

/* =========================================================
   FETCH ALL REAL SERVICES
   ONE REQUEST FOR ALL SERVICES
========================================================= */

async function getNearbyServices(
  latitude: number,
  longitude: number
): Promise<EmergencyService[]> {
  const query = `
[out:json][timeout:25];

(
  nwr["amenity"="hospital"](around:5000,${latitude},${longitude});
  nwr["amenity"="clinic"](around:5000,${latitude},${longitude});
  nwr["amenity"="police"](around:5000,${latitude},${longitude});
  nwr["amenity"="pharmacy"](around:5000,${latitude},${longitude});
  nwr["amenity"="fire_station"](around:5000,${latitude},${longitude});
  nwr["amenity"="fuel"](around:5000,${latitude},${longitude});
);

out center tags;
`;

  let lastError: any = null;

  /* =======================================================
     TRY OVERPASS SERVERS
  ======================================================= */

  for (const server of OVERPASS_SERVERS) {
    try {
      console.log(
        "OVERPASS REQUEST:",
        server
      );

      const controller =
        new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 20000);

      const response =
        await fetch(server, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept: "application/json",
          },

          body:
            "data=" +
            encodeURIComponent(query),

          signal:
            controller.signal,
        });

      clearTimeout(timeout);

      console.log(
        "OVERPASS STATUS:",
        response.status
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.log(
          "OVERPASS ERROR RESPONSE:",
          errorText.substring(0, 300)
        );

        throw new Error(
          `Overpass HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      const elements =
        data?.elements || [];

      console.log(
        "OVERPASS ELEMENTS:",
        elements.length
      );

      const services: EmergencyService[] =
        elements
          .map((item: any) => {
            const serviceLatitude =
              item.lat ??
              item.center?.lat;

            const serviceLongitude =
              item.lon ??
              item.center?.lon;

            if (
              typeof serviceLatitude !==
                "number" ||
              typeof serviceLongitude !==
                "number"
            ) {
              return null;
            }

            const tags =
              item.tags || {};

            const type =
              getServiceType(
                tags.amenity
              );

            if (!type) {
              return null;
            }

            const distance =
              calculateDistance(
                latitude,
                longitude,
                serviceLatitude,
                serviceLongitude
              );

            return {
              id: `${item.type}-${item.id}`,

              name:
                tags.name ||
                getDefaultName(type),

              type,

              distance,

              address:
                getAddress(tags),

              phone:
                tags.phone ||
                tags["contact:phone"] ||
                undefined,

              latitude:
                serviceLatitude,

              longitude:
                serviceLongitude,
            };
          })
          .filter(
            (
              service: EmergencyService | null
            ): service is EmergencyService =>
              service !== null
          );

      /* =====================================================
         REMOVE DUPLICATES
      ===================================================== */

      const uniqueServices =
        Array.from(
          new Map(
            services.map(
              (service) => [
                service.id,
                service,
              ]
            )
          ).values()
        );

      /* =====================================================
         SORT NEAREST FIRST
      ===================================================== */

      uniqueServices.sort(
        (a, b) =>
          a.distance - b.distance
      );

      console.log(
        "REAL SERVICES FOUND:",
        uniqueServices.length
      );

      return uniqueServices.slice(
        0,
        30
      );
    } catch (error) {
      lastError = error;

      console.log(
        "OVERPASS SERVER FAILED:",
        server,
        error
      );

      continue;
    }
  }

  console.log(
    "ALL OVERPASS SERVERS FAILED:",
    lastError
  );

  throw new Error(
    "Unable to connect to OpenStreetMap services."
  );
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function EmergencyScreen() {
  const [locationText, setLocationText] =
    useState(
      "Detecting your location..."
    );

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [services, setServices] =
    useState<EmergencyService[]>([]);

  const [loadingServices, setLoadingServices] =
    useState(true);

  const [serviceError, setServiceError] =
    useState(false);

  const [contacts, setContacts] =
    useState<EmergencyContact[]>([]);

  const [showAddContact, setShowAddContact] =
    useState(false);

  const [contactName, setContactName] =
    useState("");

  const [contactPhone, setContactPhone] =
    useState("");

  const [selectedService, setSelectedService] =
    useState<ServiceType | "all">("all");

  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {
    initializeEmergency();
  }, []);

  async function initializeEmergency() {
    await loadContacts();
    await getCurrentLocation();
  }

  /* =======================================================
     CURRENT LOCATION
  ======================================================= */

  async function getCurrentLocation() {
    try {
      setLoadingServices(true);
      setServiceError(false);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationText(
          "Location permission unavailable"
        );

        setLoadingServices(false);

        Alert.alert(
          "Location Required",
          "Please allow location access to find nearby emergency services."
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.Balanced,
          }
        );

      const currentLatitude =
        location.coords.latitude;

      const currentLongitude =
        location.coords.longitude;

      setLatitude(
        currentLatitude
      );

      setLongitude(
        currentLongitude
      );

      console.log(
        "CURRENT LOCATION:",
        currentLatitude,
        currentLongitude
      );

      /* =====================================================
         REVERSE GEOCODE
      ===================================================== */

      try {
        const address =
          await Location.reverseGeocodeAsync(
            {
              latitude:
                currentLatitude,
              longitude:
                currentLongitude,
            }
          );

        if (address.length > 0) {
          const place =
            address[0];

          const locationName =
            [
              place.name,
              place.district,
              place.city,
            ]
              .filter(Boolean)
              .join(", ");

          setLocationText(
            locationName ||
              "Current location detected"
          );
        } else {
          setLocationText(
            "Current location detected"
          );
        }
      } catch {
        setLocationText(
          "Current location detected"
        );
      }

      /* =====================================================
         FETCH REAL SERVICES
      ===================================================== */

      await fetchAllServices(
        currentLatitude,
        currentLongitude
      );
    } catch (error) {
      console.log(
        "LOCATION/SERVICE ERROR:",
        error
      );

      setLocationText(
        "Unable to detect location"
      );

      setServiceError(true);
    } finally {
      setLoadingServices(false);
    }
  }

  /* =======================================================
     FETCH SERVICES
  ======================================================= */

  async function fetchAllServices(
    currentLatitude: number,
    currentLongitude: number
  ) {
    try {
      setLoadingServices(true);
      setServiceError(false);

      const result =
        await getNearbyServices(
          currentLatitude,
          currentLongitude
        );

      setServices(result);
    } catch (error) {
      console.log(
        "SERVICES ERROR:",
        error
      );

      setServices([]);
      setServiceError(true);
    } finally {
      setLoadingServices(false);
    }
  }

  /* =======================================================
     REFRESH
  ======================================================= */

  async function refreshServices() {
    if (
      latitude === null ||
      longitude === null
    ) {
      await getCurrentLocation();
      return;
    }

    await fetchAllServices(
      latitude,
      longitude
    );
  }

  /* =======================================================
     LOAD CONTACTS
  ======================================================= */

  async function loadContacts() {
    try {
      const saved =
        await AsyncStorage.getItem(
          "safeTourismEmergencyContacts"
        );

      if (saved) {
        setContacts(
          JSON.parse(saved)
        );
      }
    } catch (error) {
      console.log(
        "LOAD CONTACT ERROR:",
        error
      );
    }
  }

  /* =======================================================
     ADD CONTACT
  ======================================================= */

  async function addContact() {
    if (
      !contactName.trim() ||
      !contactPhone.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please enter contact name and phone number."
      );

      return;
    }

    const newContact: EmergencyContact =
      {
        id: Date.now().toString(),
        name: contactName.trim(),
        phone: contactPhone.trim(),
      };

    const updatedContacts = [
      ...contacts,
      newContact,
    ];

    try {
      await AsyncStorage.setItem(
        "safeTourismEmergencyContacts",
        JSON.stringify(
          updatedContacts
        )
      );

      setContacts(
        updatedContacts
      );

      setContactName("");
      setContactPhone("");
      setShowAddContact(false);

      Alert.alert(
        "Contact Added",
        `${newContact.name} has been added to emergency contacts.`
      );
    } catch (error) {
      console.log(
        "SAVE CONTACT ERROR:",
        error
      );
    }
  }

  /* =======================================================
     DELETE CONTACT
  ======================================================= */

  function deleteContact(
    contactId: string
  ) {
    Alert.alert(
      "Remove Contact",
      "Do you want to remove this emergency contact?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Remove",
          style: "destructive",

          onPress: async () => {
            const updated =
              contacts.filter(
                (contact) =>
                  contact.id !==
                  contactId
              );

            setContacts(
              updated
            );

            await AsyncStorage.setItem(
              "safeTourismEmergencyContacts",
              JSON.stringify(
                updated
              )
            );
          },
        },
      ]
    );
  }

  /* =======================================================
     CALL
  ======================================================= */

  async function callNumber(
    phone?: string
  ) {
    if (!phone) {
      Alert.alert(
        "Phone Not Available",
        "This service does not have a phone number listed in OpenStreetMap."
      );

      return;
    }

    const cleanPhone =
      phone
        .split(";")[0]
        .trim();

    try {
      await Linking.openURL(
        `tel:${cleanPhone}`
      );
    } catch {
      Alert.alert(
        "Call Error",
        "Unable to open phone dialer."
      );
    }
  }

  /* =======================================================
     DIRECTIONS
  ======================================================= */

  async function openDirections(
    service: EmergencyService
  ) {
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;

    try {
      await Linking.openURL(
        url
      );
    } catch {
      Alert.alert(
        "Error",
        "Unable to open maps."
      );
    }
  }

  /* =======================================================
     SOS
  ======================================================= */

  function triggerSOS() {
    if (contacts.length === 0) {
      Alert.alert(
        "Emergency Contacts Required",
        "Please add at least one emergency contact before using SOS.",
        [
          {
            text: "Add Contact",
            onPress: () =>
              setShowAddContact(
                true
              ),
          },

          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );

      return;
    }

    Alert.alert(
      "🚨 Emergency SOS",
      `Your emergency contacts are ready to be alerted.\n\nLocation: ${locationText}\n\nContacts: ${contacts.length}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "SEND SOS",
          style: "destructive",

          onPress: async () => {
            try {
              const message =
                `🚨 SAFE TOURISM SOS\n\nI need emergency assistance.\n\nMy current location: ${locationText}\n\nCoordinates: ${latitude}, ${longitude}`;

              const firstContact =
                contacts[0];

              const smsUrl =
                `sms:${firstContact.phone}?body=${encodeURIComponent(
                  message
                )}`;

              await Linking.openURL(
                smsUrl
              );

              Alert.alert(
                "SOS Ready",
                "Emergency SMS has been opened with your location. Please press Send."
              );
            } catch {
              Alert.alert(
                "SOS Error",
                "Unable to open the SMS application."
              );
            }
          },
        },
      ]
    );
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredServices =
    selectedService === "all"
      ? services
      : services.filter(
          (service) =>
            service.type ===
            selectedService
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

        <View
          style={styles.header}
        >
          <View>
            <Text
              style={
                styles.smallTitle
              }
            >
              EMERGENCY ASSISTANCE
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Need Help?
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Quick access to emergency
              services and trusted contacts.
            </Text>
          </View>

          <View
            style={
              styles.headerIcon
            }
          >
            <Ionicons
              name="alert"
              size={27}
              color="#EF4444"
            />
          </View>
        </View>

        {/* SOS */}

        <View
          style={
            styles.sosCard
          }
        >
          <View
            style={
              styles.sosTop
            }
          >
            <View>
              <Text
                style={
                  styles.sosLabel
                }
              >
                EMERGENCY SOS
              </Text>

              <Text
                style={
                  styles.sosTitle
                }
              >
                Get Immediate Help
              </Text>

              <Text
                style={
                  styles.sosDescription
                }
              >
                Alert your emergency
                contacts with your current
                location.
              </Text>
            </View>

            <View
              style={
                styles.sosIconBox
              }
            >
              <Ionicons
                name="notifications"
                size={24}
                color="#FFFFFF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.sosButton
            }
            onPress={
              triggerSOS
            }
          >
            <Ionicons
              name="warning"
              size={25}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.sosButtonText
              }
            >
              ACTIVATE SOS
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.sosHint
            }
          >
            Opens an emergency SMS with
            your current location.
          </Text>
        </View>

        {/* LOCATION */}

        <View
          style={
            styles.locationCard
          }
        >
          <View
            style={
              styles.locationIcon
            }
          >
            <Ionicons
              name="location"
              size={22}
              color="#00D4FF"
            />
          </View>

          <View
            style={
              styles.locationContent
            }
          >
            <Text
              style={
                styles.cardLabel
              }
            >
              CURRENT LOCATION
            </Text>

            <Text
              style={
                styles.locationText
              }
              numberOfLines={2}
            >
              {locationText}
            </Text>
          </View>

          <View
            style={
              styles.liveSmall
            }
          >
            <View
              style={
                styles.liveSmallDot
              }
            />

            <Text
              style={
                styles.liveSmallText
              }
            >
              LIVE
            </Text>
          </View>
        </View>

        {/* SERVICES HEADER */}

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
              Nearby Emergency Services
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Real services within 5 km
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.refreshButton
            }
            onPress={
              refreshServices
            }
          >
            <Ionicons
              name="refresh"
              size={19}
              color="#00D4FF"
            />
          </TouchableOpacity>
        </View>

        {/* FILTERS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContainer
          }
        >
          <FilterButton
            title="All"
            active={
              selectedService ===
              "all"
            }
            onPress={() =>
              setSelectedService(
                "all"
              )
            }
          />

          <FilterButton
            title="Hospitals"
            active={
              selectedService ===
              "hospital"
            }
            onPress={() =>
              setSelectedService(
                "hospital"
              )
            }
          />

          <FilterButton
            title="Police"
            active={
              selectedService ===
              "police"
            }
            onPress={() =>
              setSelectedService(
                "police"
              )
            }
          />

          <FilterButton
            title="Pharmacy"
            active={
              selectedService ===
              "pharmacy"
            }
            onPress={() =>
              setSelectedService(
                "pharmacy"
              )
            }
          />

          <FilterButton
            title="Fire"
            active={
              selectedService ===
              "fire"
            }
            onPress={() =>
              setSelectedService(
                "fire"
              )
            }
          />

          <FilterButton
            title="Fuel"
            active={
              selectedService ===
              "fuel"
            }
            onPress={() =>
              setSelectedService(
                "fuel"
              )
            }
          />
        </ScrollView>

        {/* LOADING */}

        {loadingServices ? (
          <View
            style={
              styles.loadingCard
            }
          >
            <ActivityIndicator
              size="large"
              color="#6C63FF"
            />

            <Text
              style={
                styles.loadingTitle
              }
            >
              Finding nearby services...
            </Text>

            <Text
              style={
                styles.loadingText
              }
            >
              Searching OpenStreetMap around
              your current location.
            </Text>
          </View>
        ) : serviceError ? (
          <View
            style={
              styles.emptyServiceCard
            }
          >
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color="#EF4444"
            />

            <Text
              style={
                styles.emptyServiceTitle
              }
            >
              Unable to load services
            </Text>

            <Text
              style={
                styles.emptyServiceText
              }
            >
              OpenStreetMap could not be reached
              right now. Please try again.
            </Text>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={
                refreshServices
              }
            >
              <Ionicons
                name="refresh"
                size={16}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredServices.length ===
          0 ? (
          <View
            style={
              styles.emptyServiceCard
            }
          >
            <Ionicons
              name="location-outline"
              size={35}
              color="#6C63FF"
            />

            <Text
              style={
                styles.emptyServiceTitle
              }
            >
              No services found
            </Text>

            <Text
              style={
                styles.emptyServiceText
              }
            >
              No nearby services were found
              within 5 km.
            </Text>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={
                refreshServices
              }
            >
              <Ionicons
                name="refresh"
                size={16}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={
              styles.servicesGrid
            }
          >
            {filteredServices.map(
              (service) => {
                const serviceColor =
                  getServiceColor(
                    service.type
                  );

                return (
                  <View
                    key={
                      service.id
                    }
                    style={
                      styles.serviceCard
                    }
                  >
                    <View
                      style={
                        styles.serviceTop
                      }
                    >
                      <View
                        style={[
                          styles.serviceIcon,
                          {
                            backgroundColor:
                              `${serviceColor}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getServiceIcon(
                            service.type
                          )}
                          size={23}
                          color={
                            serviceColor
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.availableBadge
                        }
                      >
                        <View
                          style={
                            styles.availableDot
                          }
                        />

                        <Text
                          style={
                            styles.availableText
                          }
                        >
                          NEARBY
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.serviceType
                      }
                    >
                      {getServiceTitle(
                        service.type
                      )}
                    </Text>

                    <Text
                      style={
                        styles.serviceName
                      }
                      numberOfLines={2}
                    >
                      {service.name}
                    </Text>

                    <View
                      style={
                        styles.serviceInfo
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#7F8BA5"
                      />

                      <Text
                        style={
                          styles.serviceInfoText
                        }
                      >
                        {service.distance.toFixed(
                          1
                        )}{" "}
                        km
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.addressText
                      }
                      numberOfLines={2}
                    >
                      {service.address}
                    </Text>

                    <View
                      style={
                        styles.serviceActions
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.callButton
                        }
                        onPress={() =>
                          callNumber(
                            service.phone
                          )
                        }
                      >
                        <Ionicons
                          name="call"
                          size={16}
                          color="#22C55E"
                        />

                        <Text
                          style={
                            styles.callText
                          }
                        >
                          {service.phone
                            ? "Call"
                            : "No phone"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.directionButton
                        }
                        onPress={() =>
                          openDirections(
                            service
                          )
                        }
                      >
                        <Ionicons
                          name="navigate"
                          size={16}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.directionText
                          }
                        >
                          Directions
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* EMERGENCY CONTACTS */}

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
              Emergency Contacts
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              People who can be alerted during SOS
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.addIconButton
            }
            onPress={() =>
              setShowAddContact(
                !showAddContact
              )
            }
          >
            <Ionicons
              name={
                showAddContact
                  ? "close"
                  : "add"
              }
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* ADD CONTACT */}

        {showAddContact && (
          <View
            style={
              styles.addContactCard
            }
          >
            <Text
              style={
                styles.addContactTitle
              }
            >
              Add Emergency Contact
            </Text>

            <TextInput
              value={contactName}
              onChangeText={
                setContactName
              }
              placeholder="Contact name"
              placeholderTextColor="#69758F"
              style={
                styles.contactInput
              }
            />

            <TextInput
              value={contactPhone}
              onChangeText={
                setContactPhone
              }
              placeholder="Phone number"
              placeholderTextColor="#69758F"
              keyboardType="phone-pad"
              style={
                styles.contactInput
              }
            />

            <TouchableOpacity
              style={
                styles.addContactButton
              }
              onPress={
                addContact
              }
            >
              <Ionicons
                name="person-add"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.addContactButtonText
                }
              >
                Add Contact
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CONTACT LIST */}

        {contacts.length === 0 ? (
          <View
            style={
              styles.emptyContactCard
            }
          >
            <View
              style={
                styles.emptyContactIcon
              }
            >
              <Ionicons
                name="people-outline"
                size={26}
                color="#A78BFA"
              />
            </View>

            <Text
              style={
                styles.emptyContactTitle
              }
            >
              No emergency contacts
            </Text>

            <Text
              style={
                styles.emptyContactText
              }
            >
              Add trusted contacts so they
              can be notified during an SOS.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyAddButton
              }
              onPress={() =>
                setShowAddContact(
                  true
                )
              }
            >
              <Ionicons
                name="add"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.emptyAddText
                }
              >
                Add Contact
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          contacts.map(
            (contact) => (
              <View
                key={
                  contact.id
                }
                style={
                  styles.contactCard
                }
              >
                <View
                  style={
                    styles.contactAvatar
                  }
                >
                  <Text
                    style={
                      styles.contactAvatarText
                    }
                  >
                    {contact.name
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View
                  style={
                    styles.contactInfo
                  }
                >
                  <Text
                    style={
                      styles.contactName
                    }
                  >
                    {contact.name}
                  </Text>

                  <Text
                    style={
                      styles.contactPhone
                    }
                  >
                    {contact.phone}
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.contactCall
                  }
                  onPress={() =>
                    callNumber(
                      contact.phone
                    )
                  }
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color="#22C55E"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.deleteContact
                  }
                  onPress={() =>
                    deleteContact(
                      contact.id
                    )
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            )
          )
        )}

        {/* IMPORTANT NUMBERS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Important Emergency Numbers
        </Text>

        <View
          style={
            styles.numberCard
          }
        >
          <EmergencyNumber
            icon="shield"
            title="Police"
            number="112"
            color="#3B82F6"
            onPress={() =>
              callNumber("112")
            }
          />

          <EmergencyNumber
            icon="medical"
            title="Ambulance"
            number="108"
            color="#EF4444"
            onPress={() =>
              callNumber("108")
            }
          />

          <EmergencyNumber
            icon="flame"
            title="Fire"
            number="101"
            color="#F97316"
            onPress={() =>
              callNumber("101")
            }
          />
        </View>

        {/* NOTE */}

        <View
          style={
            styles.noteCard
          }
        >
          <Ionicons
            name="information-circle"
            size={22}
            color="#00D4FF"
          />

          <Text
            style={
              styles.noteText
            }
          >
            Nearby services are retrieved
            from OpenStreetMap using your
            current GPS location. Distance is
            calculated from your location.
            Phone numbers depend on OSM data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   SERVICE ICON
========================================================= */

function getServiceIcon(
  type: ServiceType
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "hospital":
      return "medical";

    case "clinic":
      return "medkit";

    case "police":
      return "shield";

    case "pharmacy":
      return "medkit-outline";

    case "fire":
      return "flame";

    case "fuel":
      return "car";

    default:
      return "help-circle";
  }
}

/* =========================================================
   SERVICE COLOR
========================================================= */

function getServiceColor(
  type: ServiceType
): string {
  switch (type) {
    case "hospital":
      return "#EF4444";

    case "clinic":
      return "#F97316";

    case "police":
      return "#3B82F6";

    case "pharmacy":
      return "#22C55E";

    case "fire":
      return "#F97316";

    case "fuel":
      return "#A78BFA";

    default:
      return "#00D4FF";
  }
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        active &&
          styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          active &&
            styles.filterTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   EMERGENCY NUMBER
========================================================= */

function EmergencyNumber({
  icon,
  title,
  number,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  number: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={
        styles.emergencyNumber
      }
      onPress={onPress}
    >
      <View
        style={[
          styles.numberIcon,
          {
            backgroundColor:
              `${color}20`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
        />
      </View>

      <View
        style={
          styles.numberContent
        }
      >
        <Text
          style={
            styles.numberTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.numberValue
          }
        >
          {number}
        </Text>
      </View>

      <View
        style={
          styles.callCircle
        }
      >
        <Ionicons
          name="call"
          size={16}
          color="#22C55E"
        />
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#070B18",
    },

    container: {
      padding: 18,
      paddingBottom: 45,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    smallTitle: {
      color: "#EF4444",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.7,
    },

    title: {
      color: "#FFFFFF",
      fontSize: 30,
      fontWeight: "900",
      marginTop: 5,
    },

    subtitle: {
      color: "#8994AE",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
      maxWidth: 290,
    },

    headerIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: "#29151B",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#552832",
    },

    sosCard: {
      backgroundColor: "#21131A",
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: "#6B2936",
    },

    sosTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    sosLabel: {
      color: "#EF4444",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.3,
    },

    sosTitle: {
      color: "#FFFFFF",
      fontSize: 21,
      fontWeight: "900",
      marginTop: 4,
    },

    sosDescription: {
      color: "#A99AA0",
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
      maxWidth: 270,
    },

    sosIconBox: {
      width: 47,
      height: 47,
      borderRadius: 15,
      backgroundColor: "#5C202C",
      justifyContent: "center",
      alignItems: "center",
    },

    sosButton: {
      height: 53,
      borderRadius: 16,
      backgroundColor: "#D92D45",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 17,
    },

    sosButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.7,
      marginLeft: 8,
    },

    sosHint: {
      color: "#9E858D",
      fontSize: 9,
      textAlign: "center",
      marginTop: 9,
    },

    locationCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 15,
      marginTop: 15,
      borderWidth: 1,
      borderColor: "#26345A",
    },

    locationIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: "#102A3B",
      justifyContent: "center",
      alignItems: "center",
    },

    locationContent: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    cardLabel: {
      color: "#7F8BA5",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },

    locationText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      marginTop: 4,
    },

    liveSmall: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#112A24",
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 9,
    },

    liveSmallDot: {
      width: 6,
      height: 6,
      borderRadius: 5,
      backgroundColor: "#22C55E",
      marginRight: 5,
    },

    liveSmallText: {
      color: "#22C55E",
      fontSize: 8,
      fontWeight: "900",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 25,
      marginBottom: 12,
    },

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 19,
      fontWeight: "900",
    },

    sectionSubtitle: {
      color: "#737F99",
      fontSize: 11,
      marginTop: 3,
    },

    refreshButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#102238",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#214B69",
    },

    filterContainer: {
      paddingBottom: 13,
    },

    filterButton: {
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 12,
      backgroundColor: "#10172B",
      borderWidth: 1,
      borderColor: "#26345A",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },

    filterButtonActive: {
      backgroundColor: "#6C63FF",
      borderColor: "#6C63FF",
    },

    filterText: {
      color: "#8994AE",
      fontSize: 11,
      fontWeight: "800",
    },

    filterTextActive: {
      color: "#FFFFFF",
    },

    loadingCard: {
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 30,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#26345A",
    },

    loadingTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
      marginTop: 15,
    },

    loadingText: {
      color: "#7F8BA5",
      fontSize: 10,
      marginTop: 5,
      textAlign: "center",
    },

    emptyServiceCard: {
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#26345A",
    },

    emptyServiceTitle: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      marginTop: 10,
    },

    emptyServiceText: {
      color: "#7F8BA5",
      fontSize: 11,
      marginTop: 5,
      textAlign: "center",
    },

    retryButton: {
      height: 40,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: "#6C63FF",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 15,
    },

    retryText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      marginLeft: 6,
    },

    servicesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },

    serviceCard: {
      width: "48.5%",
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 13,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#26345A",
    },

    serviceTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    serviceIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },

    availableBadge: {
      flexDirection: "row",
      alignItems: "center",
    },

    availableDot: {
      width: 5,
      height: 5,
      borderRadius: 5,
      backgroundColor: "#22C55E",
      marginRight: 4,
    },

    availableText: {
      color: "#718099",
      fontSize: 7,
      fontWeight: "900",
    },

    serviceType: {
      color: "#7F8BA5",
      fontSize: 9,
      fontWeight: "800",
      marginTop: 12,
      textTransform: "uppercase",
    },

    serviceName: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
      marginTop: 3,
      minHeight: 34,
    },

    serviceInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 7,
    },

    serviceInfoText: {
      color: "#7F8BA5",
      fontSize: 10,
      marginLeft: 4,
      fontWeight: "700",
    },

    addressText: {
      color: "#69758F",
      fontSize: 9,
      lineHeight: 13,
      marginTop: 5,
      minHeight: 26,
    },

    serviceActions: {
      flexDirection: "row",
      marginTop: 12,
    },

    callButton: {
      flex: 1,
      height: 35,
      borderRadius: 10,
      backgroundColor: "#112A24",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      marginRight: 4,
    },

    callText: {
      color: "#22C55E",
      fontSize: 9,
      fontWeight: "900",
      marginLeft: 4,
    },

    directionButton: {
      flex: 1,
      height: 35,
      borderRadius: 10,
      backgroundColor: "#6C63FF",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      marginLeft: 4,
    },

    directionText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "900",
      marginLeft: 3,
    },

    addIconButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#6C63FF",
      justifyContent: "center",
      alignItems: "center",
    },

    addContactCard: {
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: "#40366D",
      marginBottom: 12,
    },

    addContactTitle: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 12,
    },

    contactInput: {
      height: 48,
      borderRadius: 13,
      backgroundColor: "#151E35",
      borderWidth: 1,
      borderColor: "#26345A",
      color: "#FFFFFF",
      paddingHorizontal: 13,
      fontSize: 13,
      marginBottom: 10,
    },

    addContactButton: {
      height: 46,
      borderRadius: 13,
      backgroundColor: "#6C63FF",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    addContactButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
      marginLeft: 7,
    },

    emptyContactCard: {
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#26345A",
    },

    emptyContactIcon: {
      width: 55,
      height: 55,
      borderRadius: 18,
      backgroundColor: "#211D43",
      justifyContent: "center",
      alignItems: "center",
    },

    emptyContactTitle: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      marginTop: 12,
    },

    emptyContactText: {
      color: "#7F8BA5",
      fontSize: 11,
      textAlign: "center",
      lineHeight: 17,
      marginTop: 5,
      maxWidth: 280,
    },

    emptyAddButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#6C63FF",
      paddingHorizontal: 17,
      height: 40,
      borderRadius: 12,
      marginTop: 13,
    },

    emptyAddText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      marginLeft: 5,
    },

    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#10172B",
      borderRadius: 18,
      padding: 13,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: "#26345A",
    },

    contactAvatar: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor: "#211D43",
      justifyContent: "center",
      alignItems: "center",
    },

    contactAvatarText: {
      color: "#A78BFA",
      fontSize: 18,
      fontWeight: "900",
    },

    contactInfo: {
      flex: 1,
      marginLeft: 11,
    },

    contactName: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },

    contactPhone: {
      color: "#7F8BA5",
      fontSize: 11,
      marginTop: 3,
    },

    contactCall: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#112A24",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 7,
    },

    deleteContact: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#29151B",
      justifyContent: "center",
      alignItems: "center",
    },

    numberCard: {
      backgroundColor: "#10172B",
      borderRadius: 20,
      padding: 8,
      borderWidth: 1,
      borderColor: "#26345A",
      marginTop: 12,
    },

    emergencyNumber: {
      flexDirection: "row",
      alignItems: "center",
      padding: 9,
    },

    numberIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
    },

    numberContent: {
      flex: 1,
      marginLeft: 11,
    },

    numberTitle: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },

    numberValue: {
      color: "#7F8BA5",
      fontSize: 11,
      marginTop: 2,
    },

    callCircle: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: "#112A24",
      justifyContent: "center",
      alignItems: "center",
    },

    noteCard: {
      flexDirection: "row",
      backgroundColor: "#102238",
      borderRadius: 18,
      padding: 15,
      marginTop: 17,
      borderWidth: 1,
      borderColor: "#214B69",
    },

    noteText: {
      flex: 1,
      color: "#AFC4D9",
      fontSize: 10,
      lineHeight: 17,
      marginLeft: 9,
    },
  });