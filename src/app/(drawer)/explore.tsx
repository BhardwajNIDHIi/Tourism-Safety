import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Place = {
  id: string;
  name: string;
  type: string;
  lat: string;
  lon: string;
  address?: string;
};

type Category = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const categories: Category[] = [
  {
    id: "places",
    title: "Places to Visit",
    icon: "map-outline",
  },
  {
    id: "things",
    title: "Things to Do",
    icon: "sparkles-outline",
  },
  {
    id: "food",
    title: "Food & Markets",
    icon: "restaurant-outline",
  },
  {
    id: "photo",
    title: "Photo Spots",
    icon: "camera-outline",
  },
];

export default function Explore() {
  const [location, setLocation] = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState("places");

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  // =====================================================
  // SEARCH LOCATION
  // =====================================================

  const searchLocation = async () => {
    if (!location.trim()) {
      Alert.alert(
        "Enter Location",
        "Please enter a city or destination."
      );
      return;
    }

    try {
      setLoading(true);
      setSearched(false);
      setPlaces([]);

      const query = encodeURIComponent(
        location.trim()
      );

      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=json&limit=1&q=${query}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "SafeTourismApp/1.0",
        },
      });

      const text = await response.text();

      console.log(
        "Nominatim status:",
        response.status
      );

      console.log(
        "Nominatim response:",
        text.substring(0, 200)
      );

      if (!response.ok) {
        throw new Error(
          `Nominatim error ${response.status}`
        );
      }

      if (text.trim().startsWith("<")) {
        throw new Error(
          "Nominatim returned HTML"
        );
      }

      const data = JSON.parse(text);

      if (!data || data.length === 0) {
        Alert.alert(
          "Location Not Found",
          "Please try another city or destination."
        );

        return;
      }

      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);

      if (
        Number.isNaN(lat) ||
        Number.isNaN(lon)
      ) {
        throw new Error(
          "Invalid coordinates"
        );
      }

      setLatitude(lat);
      setLongitude(lon);

      const displayName =
        data[0].display_name ||
        location.trim();

      setSearchedLocation(
        displayName
          .split(",")
          .slice(0, 3)
          .join(",")
      );

      setSelectedCategory("places");

      await fetchPlaces(
        lat,
        lon,
        "places"
      );

      setSearched(true);
    } catch (error) {
      console.log(
        "Location error:",
        error
      );

      Alert.alert(
        "Search Error",
        "Unable to search this location. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH REAL PLACES FROM OPENSTREETMAP
  // =====================================================

  const fetchPlaces = async (
    lat: number,
    lon: number,
    category: string
  ) => {
    try {
      setLoading(true);
      setPlaces([]);

      const radius = 10000;

      let query = "";

      // ---------------------------------------------
      // PLACES TO VISIT
      // ---------------------------------------------

      if (category === "places") {
        query = `
          [out:json][timeout:25];
          (
            node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|artwork"](around:${radius},${lat},${lon});
            way["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|artwork"](around:${radius},${lat},${lon});
            relation["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|artwork"](around:${radius},${lat},${lon});

            node["historic"](around:${radius},${lat},${lon});
            way["historic"](around:${radius},${lat},${lon});
            relation["historic"](around:${radius},${lat},${lon});
          );
          out center;
        `;
      }

      // ---------------------------------------------
      // THINGS TO DO
      // ---------------------------------------------

      if (category === "things") {
        query = `
          [out:json][timeout:25];
          (
            node["leisure"~"park|sports_centre|water_park|stadium|pitch"](around:${radius},${lat},${lon});
            way["leisure"~"park|sports_centre|water_park|stadium|pitch"](around:${radius},${lat},${lon});

            node["sport"](around:${radius},${lat},${lon});

            node["tourism"~"theme_park|attraction"](around:${radius},${lat},${lon});
            way["tourism"~"theme_park|attraction"](around:${radius},${lat},${lon});
          );
          out center;
        `;
      }

      // ---------------------------------------------
      // FOOD & MARKETS
      // ---------------------------------------------

      if (category === "food") {
        query = `
          [out:json][timeout:25];
          (
            node["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"](around:${radius},${lat},${lon});
            way["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"](around:${radius},${lat},${lon});

            node["shop"~"supermarket|convenience|mall|department_store|marketplace"](around:${radius},${lat},${lon});
            way["shop"~"supermarket|convenience|mall|department_store|marketplace"](around:${radius},${lat},${lon});
          );
          out center;
        `;
      }

      // ---------------------------------------------
      // PHOTO SPOTS
      // ---------------------------------------------

      if (category === "photo") {
        query = `
          [out:json][timeout:25];
          (
            node["tourism"="viewpoint"](around:${radius},${lat},${lon});
            way["tourism"="viewpoint"](around:${radius},${lat},${lon});

            node["natural"~"peak|waterfall|beach|cliff|cave"](around:${radius},${lat},${lon});
            way["natural"~"peak|waterfall|beach|cliff|cave"](around:${radius},${lat},${lon});
          );
          out center;
        `;
      }

      if (!query) {
        return;
      }

      const encodedQuery =
        encodeURIComponent(query);

      // =================================================
      // MULTIPLE OVERPASS SERVERS
      // If one server fails, next one will be tried.
      // =================================================

      const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
      ];

      let data: any = null;

      for (const endpoint of endpoints) {
        try {
          const url =
            `${endpoint}?data=${encodedQuery}`;

          console.log(
            "Trying Overpass:",
            endpoint
          );

          const response =
            await fetch(url);

          const text =
            await response.text();

          console.log(
            "Overpass status:",
            response.status
          );

          console.log(
            "Response preview:",
            text.substring(0, 150)
          );

          if (!response.ok) {
            continue;
          }

          if (
            text.trim().startsWith("<")
          ) {
            console.log(
              "Server returned HTML, trying next server..."
            );

            continue;
          }

          try {
            data = JSON.parse(text);
            break;
          } catch {
            console.log(
              "Invalid JSON, trying next server..."
            );
          }
        } catch (error) {
          console.log(
            "Endpoint failed:",
            endpoint,
            error
          );
        }
      }

      // =================================================
      // NO SERVER WORKED
      // =================================================

      if (!data) {
        throw new Error(
          "All Overpass servers failed"
        );
      }

      // =================================================
      // FORMAT RESULTS
      // =================================================

      if (
        !data.elements ||
        !Array.isArray(data.elements)
      ) {
        throw new Error(
          "Invalid Overpass data"
        );
      }

      const formattedPlaces: Place[] =
        data.elements
          .filter((item: any) => {
            const name =
              item.tags?.name;

            return (
              name &&
              typeof name === "string" &&
              name.trim().length > 0
            );
          })
          .map((item: any) => {
            const itemLat =
              item.lat ??
              item.center?.lat ??
              lat;

            const itemLon =
              item.lon ??
              item.center?.lon ??
              lon;

            return {
              id: `${item.type}-${item.id}`,

              name:
                item.tags.name.trim(),

              type:
                item.tags.tourism ||
                item.tags.amenity ||
                item.tags.leisure ||
                item.tags.shop ||
                item.tags.sport ||
                item.tags.natural ||
                item.tags.historic ||
                "Place",

              lat: String(itemLat),

              lon: String(itemLon),

              address:
                item.tags["addr:street"] ||
                item.tags["addr:city"] ||
                item.tags["addr:place"] ||
                "",
            };
          });

      // =================================================
      // REMOVE DUPLICATE NAMES
      // =================================================

      const uniquePlaces =
        formattedPlaces.filter(
          (place, index, self) =>
            index ===
            self.findIndex(
              (p) =>
                p.name.toLowerCase() ===
                place.name.toLowerCase()
            )
        );

      setPlaces(
        uniquePlaces.slice(0, 30)
      );
    } catch (error) {
      console.log(
        "Places error:",
        error
      );

      Alert.alert(
        "Places Error",
        "Unable to load places right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE CATEGORY
  // =====================================================

  const changeCategory = async (
    category: string
  ) => {
    setSelectedCategory(category);

    if (
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    await fetchPlaces(
      latitude,
      longitude,
      category
    );
  };

  // =====================================================
  // GOOGLE MAP DIRECTIONS
  // =====================================================

  const openDirections = async (
    place: Place
  ) => {
    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${place.lat},${place.lon}`;

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Maps Error",
          "Unable to open Google Maps."
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Unable to open Google Maps."
      );
    }
  };

  // =====================================================
  // PLACE DETAILS
  // =====================================================

  const openPlace = (
    place: Place
  ) => {
    Alert.alert(
      place.name,
      `${place.type}\n\n${
        place.address ||
        "Location available"
      }`,
      [
        {
          text: "Get Directions",
          onPress: () =>
            openDirections(place),
        },
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              SAFE TOURISM
            </Text>

            <Text style={styles.title}>
              Explore
            </Text>

            <Text style={styles.subtitle}>
              Discover what's around your
              destination
            </Text>
          </View>

          <View style={styles.compass}>
            <Ionicons
              name="compass-outline"
              size={29}
              color="#00D4FF"
            />
          </View>
        </View>

        {/* SEARCH BOX */}

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#7C879B"
          />

          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter city or destination"
            placeholderTextColor="#687286"
            style={styles.input}
            onSubmitEditing={
              searchLocation
            }
            returnKeyType="search"
          />

          {location.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                setLocation("")
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#687286"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH BUTTON */}

        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchLocation}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Ionicons
                name="search"
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.searchButtonText
                }
              >
                Explore Destination
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* LOCATION RESULT */}

        {searched && (
          <View
            style={styles.locationCard}
          >
            <View
              style={styles.locationIcon}
            >
              <Ionicons
                name="location"
                size={21}
                color="#00D4FF"
              />
            </View>

            <View
              style={styles.locationInfo}
            >
              <Text
                style={styles.locationLabel}
              >
                EXPLORING
              </Text>

              <Text
                style={styles.locationName}
                numberOfLines={2}
              >
                {searchedLocation}
              </Text>

              <Text
                style={styles.locationSub}
              >
                Real places found around
                this location
              </Text>
            </View>
          </View>
        )}

        {/* CATEGORIES */}

        {searched && (
          <>
            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                What do you want to explore?
              </Text>

              <Text
                style={styles.sectionSub}
              >
                Select a category
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categoryScroll
              }
            >
              {categories.map(
                (category) => {
                  const active =
                    selectedCategory ===
                    category.id;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.category,
                        active &&
                          styles.activeCategory,
                      ]}
                      onPress={() =>
                        changeCategory(
                          category.id
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={
                          category.icon
                        }
                        size={21}
                        color={
                          active
                            ? "#FFFFFF"
                            : "#00D4FF"
                        }
                      />

                      <Text
                        style={[
                          styles.categoryText,
                          active &&
                            styles.activeCategoryText,
                        ]}
                      >
                        {
                          category.title
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>

            {/* RESULTS HEADER */}

            <View
              style={styles.resultsHeader}
            >
              <View>
                <Text
                  style={styles.resultsTitle}
                >
                  {
                    categories.find(
                      (c) =>
                        c.id ===
                        selectedCategory
                    )?.title
                  }
                </Text>

                <Text
                  style={styles.resultsSub}
                >
                  Real places near{" "}
                  {searchedLocation}
                </Text>
              </View>

              {places.length > 0 && (
                <View
                  style={styles.countBadge}
                >
                  <Text
                    style={styles.countText}
                  >
                    {places.length}
                  </Text>
                </View>
              )}
            </View>

            {/* LOADING */}

            {loading && (
              <View
                style={styles.loadingBox}
              >
                <ActivityIndicator
                  size="large"
                  color="#00D4FF"
                />

                <Text
                  style={styles.loadingText}
                >
                  Finding places nearby...
                </Text>
              </View>
            )}

            {/* RESULTS */}

            {!loading &&
              places.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() =>
                    openPlace(place)
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={styles.placeIcon}
                  >
                    <Ionicons
                      name={
                        selectedCategory ===
                        "food"
                          ? "restaurant-outline"
                          : selectedCategory ===
                            "photo"
                          ? "camera-outline"
                          : selectedCategory ===
                            "things"
                          ? "sparkles-outline"
                          : "location-outline"
                      }
                      size={25}
                      color="#00D4FF"
                    />
                  </View>

                  <View
                    style={styles.placeInfo}
                  >
                    <Text
                      style={
                        styles.placeName
                      }
                      numberOfLines={2}
                    >
                      {place.name}
                    </Text>

                    <Text
                      style={
                        styles.placeType
                      }
                      numberOfLines={1}
                    >
                      {place.type}
                    </Text>

                    {place.address ? (
                      <Text
                        style={
                          styles.placeAddress
                        }
                        numberOfLines={1}
                      >
                        {place.address}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={
                      styles.directionButton
                    }
                    onPress={() =>
                      openDirections(
                        place
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

            {/* NO RESULTS */}

            {!loading &&
              places.length === 0 && (
                <View
                  style={styles.empty}
                >
                  <View
                    style={
                      styles.emptyIcon
                    }
                  >
                    <Ionicons
                      name="search-outline"
                      size={35}
                      color="#00D4FF"
                    />
                  </View>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No places found
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Try another category
                    or search a nearby
                    city.
                  </Text>
                </View>
              )}
          </>
        )}

        {/* INITIAL STATE */}

        {!searched &&
          !loading && (
            <View
              style={styles.initial}
            >
              <View
                style={
                  styles.initialIcon
                }
              >
                <Ionicons
                  name="earth-outline"
                  size={48}
                  color="#00D4FF"
                />
              </View>

              <Text
                style={
                  styles.initialTitle
                }
              >
                Start Exploring
              </Text>

              <Text
                style={
                  styles.initialText
                }
              >
                Enter a destination above
                and discover real tourist
                places, activities, food,
                markets and photo spots
                around it.
              </Text>

              <View
                style={
                  styles.initialFeatures
                }
              >
                <Feature
                  icon="map-outline"
                  text="Places to Visit"
                />

                <Feature
                  icon="sparkles-outline"
                  text="Things to Do"
                />

                <Feature
                  icon="restaurant-outline"
                  text="Food & Markets"
                />

                <Feature
                  icon="camera-outline"
                  text="Photo Spots"
                />
              </View>
            </View>
          )}

        {/* ATTRIBUTION */}

        {searched && (
          <Text
            style={styles.attribution}
          >
            Place information powered by
            OpenStreetMap
          </Text>
        )}

        <View
          style={{ height: 30 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// FEATURE COMPONENT
// =====================================================

function Feature({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.feature}>
      <Ionicons
        name={icon}
        size={18}
        color="#00D4FF"
      />

      <Text
        style={styles.featureText}
      >
        {text}
      </Text>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  brand: {
    color: "#6C63FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "800",
    marginTop: 4,
  },

  subtitle: {
    color: "#7F899C",
    fontSize: 12,
    marginTop: 4,
  },

  compass: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#222D45",
    justifyContent: "center",
    alignItems: "center",
  },

  searchBox: {
    height: 56,
    borderRadius: 17,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#263149",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 10,
  },

  searchButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#6C63FF",
    marginTop: 11,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },

  locationCard: {
    marginTop: 17,
    backgroundColor: "#0E202B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#193D4C",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#102D3A",
    justifyContent: "center",
    alignItems: "center",
  },

  locationInfo: {
    flex: 1,
    marginLeft: 11,
  },

  locationLabel: {
    color: "#00D4FF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  locationName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },

  locationSub: {
    color: "#748094",
    fontSize: 10,
    marginTop: 3,
  },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  sectionSub: {
    color: "#737D91",
    fontSize: 11,
    marginTop: 3,
  },

  categoryScroll: {
    paddingBottom: 5,
  },

  category: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#222D45",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 9,
  },

  activeCategory: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  categoryText: {
    color: "#C4CAD5",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 7,
  },

  activeCategoryText: {
    color: "#FFFFFF",
  },

  resultsHeader: {
    marginTop: 25,
    marginBottom: 13,
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  resultsTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  resultsSub: {
    color: "#737D91",
    fontSize: 10,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 31,
    height: 31,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "#102D3A",
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#00D4FF",
    fontSize: 12,
    fontWeight: "800",
  },

  placeCard: {
    backgroundColor: "#10182A",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#202A42",
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  placeIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#102A38",
    justifyContent: "center",
    alignItems: "center",
  },

  placeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  placeName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  placeType: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "capitalize",
  },

  placeAddress: {
    color: "#6F798D",
    fontSize: 10,
    marginTop: 3,
  },

  directionButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  loadingText: {
    color: "#7C879A",
    fontSize: 12,
    marginTop: 12,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: "#102A38",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 14,
  },

  emptyText: {
    color: "#707A8E",
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 280,
    lineHeight: 17,
  },

  initial: {
    alignItems: "center",
    paddingTop: 65,
    paddingBottom: 20,
  },

  initialIcon: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: "#102633",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C3D4B",
  },

  initialTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
  },

  initialText: {
    color: "#737D91",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 310,
  },

  initialFeatures: {
    width: "100%",
    marginTop: 25,
  },

  feature: {
    backgroundColor: "#10182A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#202A42",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  featureText: {
    color: "#D3D7E0",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 10,
  },

  attribution: {
    color: "#4F596C",
    fontSize: 9,
    textAlign: "center",
    marginTop: 22,
  },
});