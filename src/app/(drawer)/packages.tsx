
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PackageType = {
  id: string;
  place: string;
  title: string;
  days: string;
  price: number;
  rating: string;
  category: string;
  image: string;
  description: string;
  places: string[];
  hiddenGems: string[];
};

const packages: PackageType[] = [
  {
    id: "1",
    place: "Manali",
    title: "Manali Mountain Escape",
    days: "5 Days / 4 Nights",
    price: 12999,
    rating: "4.8",
    category: "Adventure",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80",
    description:
      "Explore mountains, valleys, local culture and peaceful places around Manali.",
    places: [
      "Solang Valley",
      "Hadimba Temple",
      "Old Manali",
      "Vashisht",
      "Mall Road",
    ],
    hiddenGems: [
      "Jagatsukh Village",
      "Kothi Village",
      "Rahala Waterfall",
    ],
  },

  {
    id: "2",
    place: "Shimla",
    title: "Shimla Hills Retreat",
    days: "4 Days / 3 Nights",
    price: 9999,
    rating: "4.7",
    category: "Nature",
    image:
      "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=1000&q=80",
    description:
      "Enjoy mountain views, colonial architecture, shopping and peaceful hill locations.",
    places: [
      "Mall Road",
      "The Ridge",
      "Kufri",
      "Jakhu Temple",
      "Christ Church",
    ],
    hiddenGems: [
      "Mashobra",
      "Shoghi",
      "Craignano Nature Park",
    ],
  },

  {
    id: "3",
    place: "Goa",
    title: "Goa Beach Escape",
    days: "4 Days / 3 Nights",
    price: 14499,
    rating: "4.9",
    category: "Beach",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
    description:
      "Discover beaches, local food, nightlife and peaceful coastal experiences.",
    places: [
      "Baga Beach",
      "Calangute",
      "Fort Aguada",
      "Panaji",
      "Anjuna",
    ],
    hiddenGems: [
      "Butterfly Beach",
      "Galjibaga Beach",
      "Chorla Ghats",
    ],
  },

  {
    id: "4",
    place: "Udaipur",
    title: "Royal Udaipur Experience",
    days: "3 Days / 2 Nights",
    price: 8999,
    rating: "4.7",
    category: "Heritage",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80",
    description:
      "Experience royal palaces, lakes, heritage streets and Rajasthani culture.",
    places: [
      "City Palace",
      "Lake Pichola",
      "Jag Mandir",
      "Sajjangarh",
      "Bagore Ki Haveli",
    ],
    hiddenGems: [
      "Badi Lake",
      "Menar Village",
      "Jawai-style rural experiences",
    ],
  },

  {
    id: "5",
    place: "Kerala",
    title: "Kerala Nature & Backwaters",
    days: "6 Days / 5 Nights",
    price: 18999,
    rating: "4.9",
    category: "Nature",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
    description:
      "Experience Kerala's backwaters, greenery, beaches and local culture.",
    places: [
      "Alleppey",
      "Munnar",
      "Kochi",
      "Thekkady",
      "Varkala",
    ],
    hiddenGems: [
      "Marari Beach",
      "Vagamon",
      "Munroe Island",
    ],
  },

  {
    id: "6",
    place: "Jaisalmer",
    title: "Golden Desert Adventure",
    days: "3 Days / 2 Nights",
    price: 8499,
    rating: "4.6",
    category: "Adventure",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80",
    description:
      "Explore golden forts, desert landscapes, cultural experiences and camel safaris.",
    places: [
      "Jaisalmer Fort",
      "Sam Sand Dunes",
      "Patwon Ki Haveli",
      "Gadisar Lake",
    ],
    hiddenGems: [
      "Kuldhara",
      "Khuri Village",
      "Desert National Park",
    ],
  },

  {
    id: "7",
    place: "Kedarnath",
    title: "Kedarnath Spiritual Journey",
    days: "5 Days / 4 Nights",
    price: 15999,
    rating: "4.9",
    category: "Spiritual",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80",
    description:
      "A spiritual journey through the beautiful Himalayan landscape.",
    places: [
      "Kedarnath Temple",
      "Gaurikund",
      "Sonprayag",
      "Guptkashi",
    ],
    hiddenGems: [
      "Triyuginarayan",
      "Ukhimath",
      "Chopta",
    ],
  },
];

export default function PackagesScreen() {
  const [search, setSearch] = useState("");

  const [selectedPackage, setSelectedPackage] =
    useState<PackageType | null>(null);

  const [showBooking, setShowBooking] = useState(false);

  const [showCustomize, setShowCustomize] =
    useState(false);

  const [showBookings, setShowBookings] =
    useState(false);

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [bookings, setBookings] = useState<any[]>([]);

  // Booking form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("2");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");

  // Customize trip
  const [customDestination, setCustomDestination] =
    useState("");

  const [customPeople, setCustomPeople] =
    useState("2");

  const [customDays, setCustomDays] =
    useState("5");

  const [customBudget, setCustomBudget] =
    useState("25000");

  const [interests, setInterests] =
    useState<string[]>([]);

  // Load saved bookings
  useEffect(() => {
  if (showBookings) {
    loadBookings();
  }
}, [showBookings]);

  const loadBookings = async () => {
  try {
    const data = await AsyncStorage.getItem("touristBookings");

    if (data) {
      const savedBookings = JSON.parse(data);
      setBookings(savedBookings);
    } else {
      setBookings([]);
    }
  } catch (error) {
    console.log("LOAD BOOKINGS ERROR:", error);
  }
};

  const filteredPackages = packages.filter(
    (item) =>
      item.place
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.title
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // ==============================
  // OPEN PACKAGE
  // ==============================

  const openPackage = (item: PackageType) => {
    setSelectedPackage(item);
  };

  // ==============================
  // BOOK PACKAGE
  // ==============================

 const openBooking = (item: PackageType) => {
  // Package details modal close
  setSelectedPackage(null);

  // Selected package set
  setSelectedPackage(item);

  // Calculate total price
  setBudget(
    (item.price * Number(people || 2)).toString()
  );

  // Open booking form
  setShowBooking(true);
};

  // ==============================
  // CONFIRM BOOKING
  // ==============================

 const confirmBooking = async () => {
  if (!name.trim() || !phone.trim() || !date.trim()) {
    Alert.alert(
      "Missing Details",
      "Please fill your name, phone number and travel date."
    );
    return;
  }

  if (phone.length !== 10) {
    Alert.alert(
      "Invalid Phone",
      "Please enter a valid 10 digit phone number."
    );
    return;
  }

  if (!selectedPackage) {
    Alert.alert(
      "Error",
      "Please select a package first."
    );
    return;
  }

  const travellerCount = Number(people) || 1;

  const newBooking = {
    id:
      "ST-" +
      Math.floor(Math.random() * 900000 + 100000),

    name: name.trim(),
    phone: phone.trim(),

    packageName: selectedPackage.title,
    destination: selectedPackage.place,

    people: travellerCount,
    date: date.trim(),

    budget:
      selectedPackage.price * travellerCount,

    status: "Confirmed",

    createdAt: new Date().toISOString(),
  };

  try {
    // Get latest bookings directly from AsyncStorage
    const storedData =
      await AsyncStorage.getItem("touristBookings");

    const existingBookings = storedData
      ? JSON.parse(storedData)
      : [];

    // Add new booking at the beginning
    const updatedBookings = [
      newBooking,
      ...existingBookings,
    ];

    // Save permanently
    await AsyncStorage.setItem(
      "touristBookings",
      JSON.stringify(updatedBookings)
    );

    // Update app state
    setBookings(updatedBookings);

    // Close booking modal
    setShowBooking(false);

    // Close package details modal also
    setSelectedPackage(null);

    // Show success
    setShowSuccess(true);

    // Reset form
    setName("");
    setPhone("");
    setPeople("2");
    setDate("");
    setBudget("");

    console.log(
      "BOOKING SAVED:",
      newBooking
    );

  } catch (error) {
    console.log(
      "SAVE BOOKING ERROR:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to save booking. Please try again."
    );
  }
};

  // ==============================
  // CUSTOM ITINERARY
  // ==============================

  const generateTrip = () => {
    if (!customDestination) {
      Alert.alert(
        "Destination Required",
        "Please enter your destination."
      );
      return;
    }

    setShowCustomize(false);

    Alert.alert(
      "✨ Trip Plan Created",
      `Your ${customDays}-day ${customDestination} trip for ${customPeople} travellers has been planned within ₹${Number(
        customBudget
      ).toLocaleString("en-IN")}.`
    );
  };

  const toggleInterest = (
    interest: string
  ) => {
    if (interests.includes(interest)) {
      setInterests(
        interests.filter(
          (item) => item !== interest
        )
      );
    } else {
      setInterests([
        ...interests,
        interest,
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* =================================
            HEADER
        ================================= */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              EXPLORE • PLAN • TRAVEL
            </Text>

            <Text style={styles.title}>
              Smart Travel Planner
            </Text>

            <Text style={styles.subtitle}>
              Plan your perfect journey.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bookingIcon}
          onPress={async () => {
  await loadBookings();
  setShowBookings(true);
}}
          >
            <Ionicons
              name="briefcase-outline"
              size={23}
              color="#00D4FF"
            />

            {bookings.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {bookings.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* =================================
            SEARCH
        ================================= */}

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#7D869B"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Manali, Goa, Kerala..."
            placeholderTextColor="#687186"
            style={styles.searchInput}
          />

          <Ionicons
            name="location-outline"
            size={20}
            color="#6C63FF"
          />
        </View>

        {/* =================================
            CUSTOM TRIP
        ================================= */}

        <TouchableOpacity
          style={styles.customCard}
          onPress={() =>
            setShowCustomize(true)
          }
        >
          <View style={styles.customIcon}>
            <Ionicons
              name="sparkles-outline"
              size={27}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.customTitle}>
              Customize Your Trip
            </Text>

            <Text style={styles.customText}>
              Choose people, budget, days and
              your travel interests.
            </Text>

            <Text style={styles.customLink}>
              Create My Itinerary →
            </Text>
          </View>
        </TouchableOpacity>

        {/* =================================
            FAMILY DEALS
        ================================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Family Deals
          </Text>

          <Text style={styles.offerText}>
            SPECIAL OFFER
          </Text>
        </View>

        <View style={styles.familyCard}>
          <View style={styles.familyIcon}>
            <Ionicons
              name="people-outline"
              size={27}
              color="#FFFFFF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.familyTitle}>
              Family Holiday Special
            </Text>

            <Text style={styles.familyText}>
              Save more when travelling with
              family or groups.
            </Text>

            <View style={styles.discountRow}>
              <Text style={styles.discount}>
                UP TO 15% OFF
              </Text>

              <Text style={styles.familySmall}>
                • Selected packages
              </Text>
            </View>
          </View>
        </View>

        {/* =================================
            PACKAGES
        ================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Explore Travel Packages
            </Text>

            <Text style={styles.sectionSub}>
              Popular destinations & complete
              travel plans
            </Text>
          </View>
        </View>

        {filteredPackages.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.packageCard}
            activeOpacity={0.9}
            onPress={() =>
              openPackage(item)
            }
          >
            <Image
              source={{
                uri: item.image,
              }}
              style={styles.packageImage}
            />

            <View style={styles.packageBody}>
              <View style={styles.packageTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packageTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.packagePlace}>
                    📍 {item.place}
                  </Text>
                </View>

                <View style={styles.rating}>
                  <Ionicons
                    name="star"
                    size={12}
                    color="#FFD166"
                  />

                  <Text style={styles.ratingText}>
                    {item.rating}
                  </Text>
                </View>
              </View>

              <View style={styles.packageInfo}>
                <Info
                  icon="calendar-outline"
                  text={item.days}
                />

                <Info
                  icon="bed-outline"
                  text="Hotel"
                />

                <Info
                  icon="car-outline"
                  text="Transport"
                />
              </View>

              <View style={styles.packageBottom}>
                <View>
                  <Text style={styles.starting}>
                    Starting from
                  </Text>

                  <Text style={styles.price}>
                    ₹
                    {item.price.toLocaleString(
                      "en-IN"
                    )}
                  </Text>

                  <Text style={styles.perPerson}>
                    per person
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    openPackage(item)
                  }
                >
                  <Text
                    style={
                      styles.viewButtonText
                    }
                  >
                    View Details
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* =================================
            HIDDEN GEMS
        ================================= */}

        <View
          style={[
            styles.sectionHeader,
            { marginTop: 15 },
          ]}
        >
          <View>
            <Text style={styles.sectionTitle}>
              Discover Beyond the Crowds
            </Text>

            <Text style={styles.sectionSub}>
              Lesser-known places worth exploring
            </Text>
          </View>
        </View>

        {packages.slice(0, 3).map((item) => (
          <View
            key={item.id}
            style={styles.gemCard}
          >
            <View style={styles.gemIcon}>
              <Ionicons
                name="leaf-outline"
                size={22}
                color="#00D4FF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.gemPlace}>
                {item.place}
              </Text>

              <Text style={styles.gemName}>
                {item.hiddenGems[0]}
              </Text>

              <Text style={styles.gemText}>
                A quieter experience away from
                the busiest tourist spots.
              </Text>
            </View>
          </View>
        ))}

        {/* =================================
            MY BOOKINGS
        ================================= */}

        <TouchableOpacity
          style={styles.myBookings}
          onPress={() =>
            setShowBookings(true)
          }
        >
          <View style={styles.myBookingIcon}>
            <Ionicons
              name="ticket-outline"
              size={23}
              color="#00D4FF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.myBookingTitle}
            >
              My Bookings
            </Text>

            <Text style={styles.myBookingText}>
              {bookings.length} booking
              {bookings.length !== 1
                ? "s"
                : ""}{" "}
              saved
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color="#687186"
          />
        </TouchableOpacity>
      </ScrollView>

      {/* =================================
          PACKAGE DETAILS MODAL
      ================================= */}

      <Modal
        visible={selectedPackage !== null}
        animationType="slide"
        onRequestClose={() =>
          setSelectedPackage(null)
        }
      >
        {selectedPackage && (
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <View>
                <Image
                  source={{
                    uri: selectedPackage.image,
                  }}
                  style={styles.detailImage}
                />

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() =>
                    setSelectedPackage(null)
                  }
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <Text style={styles.detailPlace}>
                  {selectedPackage.place}
                </Text>

                <Text style={styles.detailTitle}>
                  {selectedPackage.title}
                </Text>

                <View style={styles.detailRating}>
                  <Ionicons
                    name="star"
                    size={14}
                    color="#FFD166"
                  />

                  <Text
                    style={styles.detailRatingText}
                  >
                    {selectedPackage.rating}
                  </Text>

                  <Text
                    style={styles.detailRatingText}
                  >
                    • Excellent choice
                  </Text>
                </View>

                <Text style={styles.detailHeading}>
                  About this package
                </Text>

                <Text style={styles.description}>
                  {selectedPackage.description}
                </Text>

                {/* PACKAGE INFO */}
                <View style={styles.detailInfoRow}>
                  <DetailInfo
                    icon="calendar-outline"
                    title="Duration"
                    value={selectedPackage.days}
                  />

                  <DetailInfo
                    icon="bed-outline"
                    title="Stay"
                    value="Hotel Included"
                  />

                  <DetailInfo
                    icon="car-outline"
                    title="Travel"
                    value="Transport"
                  />
                </View>

                {/* PLACES */}
                <Text style={styles.detailHeading}>
                  Places You Will Explore
                </Text>

                <View style={styles.placesBox}>
                  {selectedPackage.places.map(
                    (place) => (
                      <View
                        style={styles.placeRow}
                        key={place}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={17}
                          color="#00D4FF"
                        />

                        <Text
                          style={styles.placeText}
                        >
                          {place}
                        </Text>
                      </View>
                    )
                  )}
                </View>

                {/* HIDDEN GEMS */}
                <Text style={styles.detailHeading}>
                  Discover Beyond the Crowds
                </Text>

                <Text style={styles.hiddenSub}>
                  Explore lesser-known places around{" "}
                  {selectedPackage.place}.
                </Text>

                {selectedPackage.hiddenGems.map(
                  (gem) => (
                    <View
                      style={styles.hiddenCard}
                      key={gem}
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={20}
                        color="#00D4FF"
                      />

                      <Text
                        style={styles.hiddenText}
                      >
                        {gem}
                      </Text>
                    </View>
                  )
                )}

                {/* PRICE */}
                <View style={styles.detailPriceBox}>
                  <View>
                    <Text style={styles.starting}>
                      Starting from
                    </Text>

                    <Text style={styles.detailPrice}>
                      ₹
                      {selectedPackage.price.toLocaleString(
                        "en-IN"
                      )}
                    </Text>

                    <Text style={styles.perPerson}>
                      per person
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() =>
                      openBooking(
                        selectedPackage
                      )
                    }
                  >
                    <Text
                      style={styles.bookButtonText}
                    >
                      Book Now
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* =================================
          CUSTOMIZE TRIP MODAL
      ================================= */}

      <Modal
        visible={showCustomize}
        animationType="slide"
        onRequestClose={() =>
          setShowCustomize(false)
        }
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={
              styles.formContent
            }
          >
            <TouchableOpacity
              style={styles.modalBack}
              onPress={() =>
                setShowCustomize(false)
              }
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              Customize Your Trip
            </Text>

            <Text style={styles.formSubtitle}>
              Create a travel plan based on your
              budget and preferences.
            </Text>

            <Input
              label="Where do you want to go?"
              icon="location-outline"
              value={customDestination}
              onChangeText={
                setCustomDestination
              }
              placeholder="e.g. Manali"
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Travellers"
                  icon="people-outline"
                  value={customPeople}
                  onChangeText={setCustomPeople}
                  placeholder="2"
                  numeric
                />
              </View>

              <View style={{ flex: 1 }}>
                <Input
                  label="Days"
                  icon="calendar-outline"
                  value={customDays}
                  onChangeText={setCustomDays}
                  placeholder="5"
                  numeric
                />
              </View>
            </View>

            <Input
              label="Your Total Budget"
              icon="cash-outline"
              value={customBudget}
              onChangeText={setCustomBudget}
              placeholder="25000"
              numeric
            />

            <Text style={styles.interestTitle}>
              What do you want to explore?
            </Text>

            <View style={styles.interests}>
              {[
                "Nature",
                "Adventure",
                "Food",
                "Culture",
                "Shopping",
                "Spiritual",
                "Hidden Places",
              ].map((interest) => {
                const active =
                  interests.includes(interest);

                return (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestChip,
                      active &&
                        styles.activeInterest,
                    ]}
                    onPress={() =>
                      toggleInterest(interest)
                    }
                  >
                    <Text
                      style={[
                        styles.interestText,
                        active &&
                          styles.activeInterestText,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateTrip}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.generateText}
              >
                Generate My Trip Plan
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* =================================
          BOOKING MODAL
      ================================= */}

      <Modal
        visible={showBooking}
        animationType="slide"
        onRequestClose={() =>
          setShowBooking(false)
        }
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={
              styles.formContent
            }
          >
            <TouchableOpacity
              style={styles.modalBack}
              onPress={() =>
                setShowBooking(false)
              }
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              Book Your Trip
            </Text>

            {selectedPackage && (
              <View style={styles.selectedBox}>
                <Text
                  style={styles.selectedLabel}
                >
                  SELECTED PACKAGE
                </Text>

                <Text
                  style={styles.selectedTitle}
                >
                  {selectedPackage.title}
                </Text>

                <Text
                  style={styles.selectedInfo}
                >
                  📍 {selectedPackage.place} •{" "}
                  {selectedPackage.days}
                </Text>

                <Text
                  style={styles.selectedPrice}
                >
                  ₹
                  {selectedPackage.price.toLocaleString(
                    "en-IN"
                  )}{" "}
                  / person
                </Text>
              </View>
            )}

            <Text style={styles.formSection}>
              Traveller Details
            </Text>

            <Input
              label="Full Name *"
              icon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            <Input
              label="Phone Number *"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="10 digit phone number"
              numeric
            />

            <Input
              label="Travel Date *"
              icon="calendar-outline"
              value={date}
              onChangeText={setDate}
              placeholder="DD/MM/YYYY"
            />

            <Input
              label="Number of Travellers *"
              icon="people-outline"
              value={people}
              onChangeText={(value) => {
                setPeople(value);

                if (selectedPackage) {
                  setBudget(
                    (
                      selectedPackage.price *
                      Number(value || 1)
                    ).toString()
                  );
                }
              }}
              placeholder="2"
              numeric
            />

            <View style={styles.totalBox}>
              <View>
                <Text
                  style={styles.totalLabel}
                >
                  Estimated Trip Cost
                </Text>

                <Text
                  style={styles.totalSmall}
                >
                  {people || 1} traveller(s)
                </Text>
              </View>

              <Text style={styles.totalPrice}>
                ₹
                {selectedPackage
                  ? (
                      selectedPackage.price *
                      Number(people || 1)
                    ).toLocaleString("en-IN")
                  : "0"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmBooking}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={styles.confirmText}
              >
                Confirm Booking
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* =================================
          BOOKING SUCCESS MODAL
      ================================= */}

      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successCircle}>
              <Ionicons
                name="checkmark"
                size={45}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.successTitle}>
              Booking Confirmed!
            </Text>

            <Text style={styles.successText}>
              Your trip has been successfully
              booked.
            </Text>

            <View style={styles.successDetails}>
              <Text style={styles.successLabel}>
                BOOKING ID
              </Text>

              <Text
                style={styles.successBookingId}
              >
                {bookings[0]?.id}
              </Text>

              <View
                style={styles.successLine}
              />

              <Text
                style={styles.successPackage}
              >
                {bookings[0]?.packageName}
              </Text>

              <Text
                style={styles.successInfo}
              >
                📍 {bookings[0]?.destination}
              </Text>

              <Text
                style={styles.successInfo}
              >
                👥 {bookings[0]?.people} Travellers
              </Text>

              <Text
                style={styles.successInfo}
              >
                📅 {bookings[0]?.date}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() =>
                setShowSuccess(false)
              }
            >
              <Text
                style={styles.successButtonText}
              >
                Continue Exploring
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewBookingButton}
              onPress={() => {
                setShowSuccess(false);
                setShowBookings(true);
              }}
            >
              <Text
                style={
                  styles.viewBookingButtonText
                }
              >
                View My Bookings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================
          MY BOOKINGS MODAL
      ================================= */}

      <Modal
        visible={showBookings}
        animationType="slide"
        onRequestClose={() =>
          setShowBookings(false)
        }
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={
              styles.formContent
            }
          >
            <TouchableOpacity
              style={styles.modalBack}
              onPress={() =>
                setShowBookings(false)
              }
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              My Bookings
            </Text>

            <Text style={styles.formSubtitle}>
              Your upcoming and confirmed trips.
            </Text>

            {bookings.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="ticket-outline"
                  size={48}
                  color="#6C63FF"
                />

                <Text style={styles.emptyTitle}>
                  No bookings yet
                </Text>

                <Text style={styles.emptyText}>
                  Explore packages and book your
                  next adventure.
                </Text>
              </View>
            ) : (
              bookings.map((booking) => (
                <View
                  key={booking.id}
                  style={styles.bookingCard}
                >
                  <View
                    style={styles.bookingTop}
                  >
                    <View
                      style={
                        styles.bookingLocation
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={21}
                        color="#00D4FF"
                      />
                    </View>

                    <View
                      style={{ flex: 1 }}
                    >
                      <Text
                        style={
                          styles.bookingTitle
                        }
                      >
                        {booking.packageName}
                      </Text>

                      <Text
                        style={styles.bookingPlace}
                      >
                        {booking.destination}
                      </Text>
                    </View>

                    <View
                      style={styles.status}
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.bookingLine}
                  />

                  <View
                    style={
                      styles.bookingDetails
                    }
                  >
                    <BookingDetail
                      title="DATE"
                      value={booking.date}
                    />

                    <BookingDetail
                      title="TRAVELLERS"
                      value={String(
                        booking.people
                      )}
                    />

                    <BookingDetail
                      title="BUDGET"
                      value={`₹${Number(
                        booking.budget
                      ).toLocaleString(
                        "en-IN"
                      )}`}
                    />
                  </View>

                  <Text
                    style={styles.bookingId}
                  >
                    Booking ID: {booking.id}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================
   SMALL COMPONENTS
========================================= */

function Info({
  icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <View style={styles.info}>
      <Ionicons
        name={icon}
        size={15}
        color="#00D4FF"
      />

      <Text style={styles.infoText}>
        {text}
      </Text>
    </View>
  );
}

function DetailInfo({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <View style={styles.detailInfo}>
      <Ionicons
        name={icon}
        size={19}
        color="#00D4FF"
      />

      <Text style={styles.detailInfoTitle}>
        {title}
      </Text>

      <Text style={styles.detailInfoValue}>
        {value}
      </Text>
    </View>
  );
}

function Input({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  numeric,
}: {
  label: string;
  icon: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View style={styles.inputBox}>
        <Ionicons
          name={icon}
          size={18}
          color="#6C63FF"
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#687186"
          keyboardType={
            numeric ? "numeric" : "default"
          }
          style={styles.input}
        />
      </View>
    </View>
  );
}

function BookingDetail({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.bookingDetailLabel}>
        {title}
      </Text>

      <Text style={styles.bookingDetailValue}>
        {value}
      </Text>
    </View>
  );
}

/* =========================================
   STYLES
========================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  eyebrow: {
    color: "#6C63FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 4,
  },

  subtitle: {
    color: "#81899D",
    fontSize: 12,
    marginTop: 4,
  },

  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#101729",
    borderWidth: 1,
    borderColor: "#222D47",
    justifyContent: "center",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    right: -3,
    top: -4,
    backgroundColor: "#6C63FF",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  searchBox: {
    height: 55,
    borderRadius: 16,
    backgroundColor: "#101729",
    borderWidth: 1,
    borderColor: "#222D47",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    marginHorizontal: 10,
  },

  customCard: {
    flexDirection: "row",
    padding: 17,
    borderRadius: 20,
    backgroundColor: "#11182C",
    borderWidth: 1,
    borderColor: "#292651",
    marginBottom: 25,
  },

  customIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#191D3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  customTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  customText: {
    color: "#828B9F",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  customLink: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 7,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSub: {
    color: "#697287",
    fontSize: 11,
    marginTop: 4,
  },

  offerText: {
    color: "#00D4FF",
    fontSize: 9,
    fontWeight: "900",
  },

  familyCard: {
    flexDirection: "row",
    backgroundColor: "#14152A",
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: "#302A54",
    marginBottom: 25,
  },

  familyIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  familyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  familyText: {
    color: "#81899D",
    fontSize: 11,
    marginTop: 4,
  },

  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  discount: {
    color: "#00D4FF",
    fontSize: 10,
    fontWeight: "900",
  },

  familySmall: {
    color: "#697287",
    fontSize: 9,
    marginLeft: 5,
  },

  packageCard: {
    backgroundColor: "#101729",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#202A45",
    marginBottom: 16,
  },

  packageImage: {
    width: "100%",
    height: 175,
  },

  packageBody: {
    padding: 15,
  },

  packageTop: {
    flexDirection: "row",
  },

  packageTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  packagePlace: {
    color: "#7F899D",
    fontSize: 11,
    marginTop: 4,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191C2B",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    gap: 4,
  },

  ratingText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  packageInfo: {
    flexDirection: "row",
    gap: 13,
    marginVertical: 15,
  },

  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  infoText: {
    color: "#8A93A7",
    fontSize: 10,
  },

  packageBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  starting: {
    color: "#687186",
    fontSize: 9,
  },

  price: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 2,
  },

  perPerson: {
    color: "#687186",
    fontSize: 9,
  },

  viewButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  gemCard: {
    flexDirection: "row",
    backgroundColor: "#0F1725",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1D3040",
    marginBottom: 10,
  },

  gemIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#102632",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  gemPlace: {
    color: "#6C63FF",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  gemName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },

  gemText: {
    color: "#7F899D",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  myBookings: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101729",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: "#202A45",
    marginTop: 15,
  },

  myBookingIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#151E35",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  myBookingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  myBookingText: {
    color: "#707A8F",
    fontSize: 10,
    marginTop: 3,
  },

  /* MODALS */

  modalContainer: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  detailImage: {
    width: "100%",
    height: 280,
  },

  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  detailBody: {
    padding: 18,
    paddingBottom: 40,
  },

  detailPlace: {
    color: "#00D4FF",
    fontSize: 11,
    fontWeight: "800",
  },

  detailTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 5,
  },

  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },

  detailRatingText: {
    color: "#8A93A7",
    fontSize: 11,
  },

  detailHeading: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 25,
    marginBottom: 10,
  },

  description: {
    color: "#858EA2",
    fontSize: 12,
    lineHeight: 19,
  },

  detailInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },

  detailInfo: {
    flex: 1,
    backgroundColor: "#101729",
    borderRadius: 13,
    padding: 11,
    borderWidth: 1,
    borderColor: "#202A45",
  },

  detailInfoTitle: {
    color: "#687186",
    fontSize: 8,
    marginTop: 6,
  },

  detailInfoValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  placesBox: {
    backgroundColor: "#101729",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#202A45",
  },

  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },

  placeText: {
    color: "#9DA5B8",
    fontSize: 12,
  },

  hiddenSub: {
    color: "#697287",
    fontSize: 11,
    marginBottom: 10,
  },

  hiddenCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0F1725",
    borderRadius: 13,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1D3040",
  },

  hiddenText: {
    color: "#C0C6D3",
    fontSize: 12,
    fontWeight: "700",
  },

  detailPriceBox: {
    marginTop: 25,
    padding: 16,
    backgroundColor: "#11182B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#292651",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailPrice: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },

  bookButton: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  /* FORM */

  formContent: {
    padding: 18,
    paddingBottom: 45,
  },

  modalBack: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#101729",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  formTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },

  formSubtitle: {
    color: "#7D869B",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 25,
  },

  selectedBox: {
    backgroundColor: "#11182B",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#292651",
    marginBottom: 25,
  },

  selectedLabel: {
    color: "#00D4FF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  selectedTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 5,
  },

  selectedInfo: {
    color: "#858EA2",
    fontSize: 11,
    marginTop: 5,
  },

  selectedPrice: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 9,
  },

  formSection: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
  },

  inputWrapper: {
    marginBottom: 15,
  },

  inputLabel: {
    color: "#A6AEC0",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },

  inputBox: {
    height: 51,
    backgroundColor: "#101729",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#202A45",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    marginLeft: 9,
  },

  formRow: {
    flexDirection: "row",
    gap: 10,
  },

  interestTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
    marginBottom: 12,
  },

  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#101729",
    borderWidth: 1,
    borderColor: "#202A45",
  },

  activeInterest: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  interestText: {
    color: "#8B94A8",
    fontSize: 11,
    fontWeight: "600",
  },

  activeInterestText: {
    color: "#FFFFFF",
  },

  generateButton: {
    height: 53,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 30,
  },

  generateText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  totalBox: {
    backgroundColor: "#151E35",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  totalLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  totalSmall: {
    color: "#737D92",
    fontSize: 10,
    marginTop: 3,
  },

  totalPrice: {
    color: "#00D4FF",
    fontSize: 20,
    fontWeight: "900",
  },

  confirmButton: {
    height: 53,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 17,
  },

  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  /* SUCCESS */

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 20,
  },

  successCard: {
    backgroundColor: "#101729",
    borderRadius: 25,
    padding: 22,
    borderWidth: 1,
    borderColor: "#293451",
  },

  successCircle: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#00A878",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 15,
  },

  successText: {
    color: "#7D869B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  successDetails: {
    backgroundColor: "#0A1020",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
  },

  successLabel: {
    color: "#00D4FF",
    fontSize: 8,
    fontWeight: "900",
  },

  successBookingId: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },

  successLine: {
    height: 1,
    backgroundColor: "#202A45",
    marginVertical: 13,
  },

  successPackage: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  successInfo: {
    color: "#8B94A8",
    fontSize: 11,
    marginTop: 7,
  },

  successButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  successButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  viewBookingButton: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#293451",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 9,
  },

  viewBookingButtonText: {
    color: "#A5ADBE",
    fontSize: 12,
    fontWeight: "700",
  },

  /* BOOKINGS */

  empty: {
    backgroundColor: "#101729",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#202A45",
    marginTop: 20,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },

  emptyText: {
    color: "#7D869B",
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
  },

  bookingCard: {
    backgroundColor: "#101729",
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: "#202A45",
    marginBottom: 15,
  },

  bookingTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  bookingLocation: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#102632",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  bookingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  bookingPlace: {
    color: "#737D92",
    fontSize: 10,
    marginTop: 4,
  },

  status: {
    backgroundColor: "#123128",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusText: {
    color: "#48D597",
    fontSize: 8,
    fontWeight: "900",
  },

  bookingLine: {
    height: 1,
    backgroundColor: "#202A45",
    marginVertical: 15,
  },

  bookingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  bookingDetailLabel: {
    color: "#626C80",
    fontSize: 8,
    fontWeight: "800",
  },

  bookingDetailValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },

  bookingId: {
    color: "#586276",
    fontSize: 8,
    marginTop: 14,
  },
});
