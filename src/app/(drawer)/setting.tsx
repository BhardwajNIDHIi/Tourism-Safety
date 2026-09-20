import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const SOS_CONTACTS_KEY = "sosEmergencyContacts";

export default function Settings() {
  // Profile
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Emergency Contacts
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");

  // Settings
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dangerAlerts, setDangerAlerts] = useState(true);

  // Privacy Settings
  const [privacyLocation, setPrivacyLocation] = useState(true);
  const [sosLocationSharing, setSosLocationSharing] = useState(true);
  const [privacyAlerts, setPrivacyAlerts] = useState(true);

  // Modals
  const [showContacts, setShowContacts] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Load saved data
  const loadSettings = async () => {
    try {
      // Load emergency contacts
      const savedContacts = await AsyncStorage.getItem(
        SOS_CONTACTS_KEY
      );

      if (savedContacts) {
        const contacts = JSON.parse(savedContacts);

        setContact1(contacts.contact1 || "");
        setContact2(contacts.contact2 || "");
      }

      // Load profile
      const savedName = await AsyncStorage.getItem("touristName");
      const savedPhone = await AsyncStorage.getItem("touristPhone");

      if (savedName) {
        setName(savedName);
      }

      if (savedPhone) {
        setPhone(savedPhone);
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  };

  // Save emergency contacts
  const saveEmergencyContacts = async () => {
    if (!contact1.trim() || !contact2.trim()) {
      Alert.alert(
        "Emergency Contacts Required",
        "Please enter both emergency contacts."
      );
      return;
    }

    if (contact1.length < 10 || contact2.length < 10) {
      Alert.alert(
        "Invalid Number",
        "Please enter valid 10-digit mobile numbers."
      );
      return;
    }

    try {
      const contacts = {
        contact1,
        contact2,
      };

      await AsyncStorage.setItem(
        SOS_CONTACTS_KEY,
        JSON.stringify(contacts)
      );

      Alert.alert(
        "Contacts Saved",
        "Your emergency contacts have been saved successfully."
      );

      setShowContacts(false);
    } catch (error) {
      console.log("Error saving contacts:", error);

      Alert.alert(
        "Error",
        "Unable to save emergency contacts."
      );
    }
  };

  // Save profile
  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Name Required",
        "Please enter your name."
      );
      return;
    }

    if (!phone.trim() || phone.length < 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      await AsyncStorage.setItem(
        "touristName",
        name.trim()
      );

      await AsyncStorage.setItem(
        "touristPhone",
        phone.trim()
      );

      setShowProfileEdit(false);

      Alert.alert(
        "Profile Saved",
        "Your profile information has been updated."
      );
    } catch (error) {
      console.log("Error saving profile:", error);

      Alert.alert(
        "Error",
        "Unable to save profile information."
      );
    }
  };

  // Clear saved data
  const clearSavedData = () => {
    Alert.alert(
      "Clear Saved Data",
      "This will remove your saved profile and emergency contact information from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "touristName",
                "touristPhone",
                SOS_CONTACTS_KEY,
              ]);

              setName("");
              setPhone("");
              setContact1("");
              setContact2("");

              Alert.alert(
                "Data Cleared",
                "Your saved personal and emergency contact information has been removed."
              );
            } catch (error) {
              console.log("Error clearing data:", error);

              Alert.alert(
                "Error",
                "Unable to clear saved data."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.subtitle}>
            Manage your safety preferences
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="settings-outline"
            size={24}
            color="#00D4FF"
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* PROFILE */}
        <Text style={styles.sectionTitle}>
          PROFILE
        </Text>

        <View style={styles.card}>

          <View style={styles.profileIcon}>
            <Ionicons
              name="person"
              size={28}
              color="#00D4FF"
            />
          </View>

          <View style={styles.profileInfo}>

            <Text style={styles.profileName}>
              {name || "Tourist"}
            </Text>

            <Text style={styles.profilePhone}>
              {phone || "Phone number not added"}
            </Text>

          </View>

          {/* EDIT PROFILE */}
          <TouchableOpacity
            onPress={() => setShowProfileEdit(true)}
          >
            <Ionicons
              name="create-outline"
              size={23}
              color="#8F91A3"
            />
          </TouchableOpacity>

        </View>


        {/* EMERGENCY */}
        <Text style={styles.sectionTitle}>
          EMERGENCY & SOS
        </Text>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => setShowContacts(true)}
        >

          <View style={styles.settingIconSOS}>
            <Ionicons
              name="call"
              size={23}
              color="#FF5B6E"
            />
          </View>

          <View style={styles.settingTextContainer}>

            <Text style={styles.settingTitle}>
              Emergency Contacts
            </Text>

            <Text style={styles.settingDescription}>
              Add 2 contacts for SOS alerts
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#777A8C"
          />

        </TouchableOpacity>


        {/* CONTACT STATUS */}
        <View style={styles.contactStatus}>

          <View style={styles.statusDot} />

          <Text style={styles.statusText}>
            {contact1 && contact2
              ? "2 emergency contacts saved"
              : "Emergency contacts not completely set"}
          </Text>

        </View>


        {/* SAFETY SETTINGS */}
        <Text style={styles.sectionTitle}>
          SAFETY SETTINGS
        </Text>


        {/* LOCATION */}
        <View style={styles.settingCard}>

          <View style={styles.settingIcon}>
            <Ionicons
              name="location"
              size={23}
              color="#00D4FF"
            />
          </View>

          <View style={styles.settingTextContainer}>

            <Text style={styles.settingTitle}>
              Location Services
            </Text>

            <Text style={styles.settingDescription}>
              Allow Safe Tourism to track your location
            </Text>

          </View>

          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{
              false: "#303342",
              true: "#343A73",
            }}
            thumbColor={
              locationEnabled
                ? "#00D4FF"
                : "#777"
            }
          />

        </View>


        {/* NOTIFICATIONS */}
        <View style={styles.settingCard}>

          <View style={styles.settingIcon}>
            <Ionicons
              name="notifications"
              size={23}
              color="#6C63FF"
            />
          </View>

          <View style={styles.settingTextContainer}>

            <Text style={styles.settingTitle}>
              Safety Notifications
            </Text>

            <Text style={styles.settingDescription}>
              Receive important safety alerts
            </Text>

          </View>

          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{
              false: "#303342",
              true: "#343A73",
            }}
            thumbColor={
              notificationsEnabled
                ? "#6C63FF"
                : "#777"
            }
          />

        </View>


        {/* DANGER ALERT */}
        <View style={styles.settingCard}>

          <View style={styles.settingIconDanger}>
            <Ionicons
              name="warning"
              size={23}
              color="#FFB547"
            />
          </View>

          <View style={styles.settingTextContainer}>

            <Text style={styles.settingTitle}>
              Danger Zone Alerts
            </Text>

            <Text style={styles.settingDescription}>
              Alert me when entering unsafe areas
            </Text>

          </View>

          <Switch
            value={dangerAlerts}
            onValueChange={setDangerAlerts}
            trackColor={{
              false: "#303342",
              true: "#343A73",
            }}
            thumbColor={
              dangerAlerts
                ? "#FFB547"
                : "#777"
            }
          />

        </View>


        {/* PRIVACY */}
        <Text style={styles.sectionTitle}>
          PRIVACY & INFORMATION
        </Text>


        {/* PRIVACY & SECURITY */}
        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => setShowPrivacySecurity(true)}
        >

          <View style={styles.settingIcon}>
            <Ionicons
              name="shield-checkmark"
              size={23}
              color="#6C63FF"
            />
          </View>

          <View style={styles.settingTextContainer}>

            <Text style={styles.settingTitle}>
              Privacy & Security
            </Text>

            <Text style={styles.settingDescription}>
              Manage your personal data and privacy
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#777A8C"
          />

        </TouchableOpacity>


        {/* ABOUT */}
        <TouchableOpacity
          style={styles.settingCard}
        >

          <View style={styles.settingIcon}>
            <Ionicons
              name="information-circle"
              size={23}
              color="#00D4FF"
            />
          </View>

          <View style={styles.settingTextContainer}>

            <Text style={styles.settingTitle}>
              About Safe Tourism
            </Text>

            <Text style={styles.settingDescription}>
              Version 1.0.0
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#777A8C"
          />

        </TouchableOpacity>


        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert(
              "Logout",
              "Are you sure you want to logout?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Logout",
                  style: "destructive",
                },
              ]
            )
          }
        >

          <Ionicons
            name="log-out-outline"
            size={22}
            color="#FF5B6E"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>

        </TouchableOpacity>


        {/* FOOTER */}
        <Text style={styles.footer}>
          SAFE TOURISM{"\n"}
          Travel Safe. Explore Freely.
        </Text>

      </ScrollView>


      {/* ========================================= */}
      {/* PROFILE EDIT MODAL */}
      {/* ========================================= */}

      <Modal
        visible={showProfileEdit}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowProfileEdit(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContainer}>

            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Edit Profile
                </Text>

                <Text style={styles.modalSubtitle}>
                  Update your personal information
                </Text>

              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowProfileEdit(false)
                }
              >

                <Ionicons
                  name="close-circle"
                  size={28}
                  color="#777A8C"
                />

              </TouchableOpacity>

            </View>


            {/* NAME */}
            <Text style={styles.inputLabel}>
              Your Name
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#666A7A"
              style={styles.input}
            />


            {/* PHONE */}
            <Text style={styles.inputLabel}>
              Phone Number
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor="#666A7A"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />


            {/* SAVE PROFILE */}
            <TouchableOpacity
              style={styles.saveContactsButton}
              onPress={saveProfile}
            >

              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#FFFFFF"
              />

              <Text style={styles.saveContactsText}>
                Save Profile
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>


      {/* ========================================= */}
      {/* EMERGENCY CONTACT MODAL */}
      {/* ========================================= */}

      <Modal
        visible={showContacts}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowContacts(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContainer}>

            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Emergency Contacts
                </Text>

                <Text style={styles.modalSubtitle}>
                  These contacts will receive your SOS alert
                </Text>

              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowContacts(false)
                }
              >

                <Ionicons
                  name="close-circle"
                  size={28}
                  color="#777A8C"
                />

              </TouchableOpacity>

            </View>


            {/* WARNING */}
            <View style={styles.warningBox}>

              <Ionicons
                name="shield-checkmark"
                size={24}
                color="#FFB547"
              />

              <Text style={styles.warningText}>
                Add two trusted people who can help you
                during an emergency.
              </Text>

            </View>


            {/* CONTACT 1 */}
            <Text style={styles.inputLabel}>
              Emergency Contact 1
            </Text>

            <View style={styles.phoneInput}>

              <Ionicons
                name="person"
                size={20}
                color="#777A8C"
              />

              <TextInput
                value={contact1}
                onChangeText={setContact1}
                placeholder="10-digit mobile number"
                placeholderTextColor="#666A7A"
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.phoneTextInput}
              />

            </View>


            {/* CONTACT 2 */}
            <Text style={styles.inputLabel}>
              Emergency Contact 2
            </Text>

            <View style={styles.phoneInput}>

              <Ionicons
                name="person"
                size={20}
                color="#777A8C"
              />

              <TextInput
                value={contact2}
                onChangeText={setContact2}
                placeholder="10-digit mobile number"
                placeholderTextColor="#666A7A"
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.phoneTextInput}
              />

            </View>


            {/* SAVE CONTACTS */}
            <TouchableOpacity
              style={styles.saveContactsButton}
              onPress={saveEmergencyContacts}
            >

              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#FFFFFF"
              />

              <Text style={styles.saveContactsText}>
                Save Emergency Contacts
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>


      {/* ========================================= */}
      {/* PRIVACY & SECURITY MODAL */}
      {/* ========================================= */}

      <Modal
        visible={showPrivacySecurity}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowPrivacySecurity(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.privacyModalContainer}>

            {/* PRIVACY HEADER */}
            <View style={styles.modalHeader}>

              <View style={styles.privacyHeaderLeft}>

                <View style={styles.privacyShield}>
                  <Ionicons
                    name="shield-checkmark"
                    size={27}
                    color="#6C63FF"
                  />
                </View>

                <View style={styles.privacyHeaderText}>

                  <Text style={styles.modalTitle}>
                    Privacy & Security
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Control your privacy and safety data
                  </Text>

                </View>

              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowPrivacySecurity(false)
                }
              >

                <Ionicons
                  name="close-circle"
                  size={28}
                  color="#777A8C"
                />

              </TouchableOpacity>

            </View>


            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.privacyScroll}
            >

              {/* PRIVACY INTRO */}
              <View style={styles.privacyIntro}>

                <Ionicons
                  name="lock-closed"
                  size={21}
                  color="#00D4FF"
                />

                <View style={styles.privacyIntroText}>

                  <Text style={styles.privacyIntroTitle}>
                    Your Privacy Matters
                  </Text>

                  <Text style={styles.privacyIntroDescription}>
                    Safe Tourism uses your information to provide
                    location-based safety, emergency assistance
                    and SOS services.
                  </Text>

                </View>

              </View>


              {/* LOCATION SHARING */}
              <View style={styles.privacySettingCard}>

                <View style={styles.privacySettingIcon}>
                  <Ionicons
                    name="location"
                    size={21}
                    color="#00D4FF"
                  />
                </View>

                <View style={styles.privacySettingText}>

                  <Text style={styles.privacySettingTitle}>
                    Location Sharing
                  </Text>

                  <Text style={styles.privacySettingDescription}>
                    Control the use of your live location for
                    maps and safety features.
                  </Text>

                </View>

                <Switch
                  value={privacyLocation}
                  onValueChange={(value) => {
                    setPrivacyLocation(value);
                    setLocationEnabled(value);
                  }}
                  trackColor={{
                    false: "#303342",
                    true: "#343A73",
                  }}
                  thumbColor={
                    privacyLocation
                      ? "#00D4FF"
                      : "#777"
                  }
                />

              </View>


              {/* SOS LOCATION */}
              <View style={styles.privacySettingCard}>

                <View style={styles.privacySettingIconSOS}>
                  <Ionicons
                    name="navigate"
                    size={21}
                    color="#FF5B6E"
                  />
                </View>

                <View style={styles.privacySettingText}>

                  <Text style={styles.privacySettingTitle}>
                    SOS Location Sharing
                  </Text>

                  <Text style={styles.privacySettingDescription}>
                    Allow your location to be shared with
                    emergency contacts during SOS.
                  </Text>

                </View>

                <Switch
                  value={sosLocationSharing}
                  onValueChange={setSosLocationSharing}
                  trackColor={{
                    false: "#303342",
                    true: "#343A73",
                  }}
                  thumbColor={
                    sosLocationSharing
                      ? "#FF5B6E"
                      : "#777"
                  }
                />

              </View>


              {/* SAFETY ALERTS */}
              <View style={styles.privacySettingCard}>

                <View style={styles.privacySettingIconPurple}>
                  <Ionicons
                    name="notifications"
                    size={21}
                    color="#6C63FF"
                  />
                </View>

                <View style={styles.privacySettingText}>

                  <Text style={styles.privacySettingTitle}>
                    Safety Alerts
                  </Text>

                  <Text style={styles.privacySettingDescription}>
                    Receive important safety and danger-zone
                    notifications.
                  </Text>

                </View>

                <Switch
                  value={privacyAlerts}
                  onValueChange={(value) => {
                    setPrivacyAlerts(value);
                    setNotificationsEnabled(value);
                  }}
                  trackColor={{
                    false: "#303342",
                    true: "#343A73",
                  }}
                  thumbColor={
                    privacyAlerts
                      ? "#6C63FF"
                      : "#777"
                  }
                />

              </View>


              {/* EMERGENCY CONTACT PRIVACY */}
              <View style={styles.privacyInfoCard}>

                <View style={styles.privacyInfoIcon}>
                  <Ionicons
                    name="people"
                    size={21}
                    color="#FFB547"
                  />
                </View>

                <View style={styles.privacyInfoText}>

                  <Text style={styles.privacyInfoTitle}>
                    Emergency Contact Access
                  </Text>

                  <Text style={styles.privacyInfoDescription}>
                    Your saved emergency contacts are used
                    for SOS alert functionality.
                  </Text>

                </View>

              </View>


              {/* DATA PROTECTION */}
              <View style={styles.privacyInfoCard}>

                <View style={styles.privacyInfoIconBlue}>
                  <Ionicons
                    name="shield"
                    size={21}
                    color="#00D4FF"
                  />
                </View>

                <View style={styles.privacyInfoText}>

                  <Text style={styles.privacyInfoTitle}>
                    Personal Data
                  </Text>

                  <Text style={styles.privacyInfoDescription}>
                    Your profile and emergency contact details
                    are saved locally on this device for app
                    functionality.
                  </Text>

                </View>

              </View>


              {/* PRIVACY STATUS */}
              <View style={styles.privacyStatusCard}>

                <Text style={styles.privacyStatusTitle}>
                  Privacy Status
                </Text>

                <View style={styles.privacyStatusRow}>

                  <View style={styles.statusDot} />

                  <Text style={styles.privacyStatusText}>
                    Location Sharing
                  </Text>

                  <Text style={styles.privacyStatusValue}>
                    {privacyLocation ? "ON" : "OFF"}
                  </Text>

                </View>

                <View style={styles.privacyStatusRow}>

                  <View style={styles.statusDot} />

                  <Text style={styles.privacyStatusText}>
                    SOS Location
                  </Text>

                  <Text style={styles.privacyStatusValue}>
                    {sosLocationSharing ? "ON" : "OFF"}
                  </Text>

                </View>

                <View style={styles.privacyStatusRow}>

                  <View style={styles.statusDot} />

                  <Text style={styles.privacyStatusText}>
                    Safety Alerts
                  </Text>

                  <Text style={styles.privacyStatusValue}>
                    {privacyAlerts ? "ON" : "OFF"}
                  </Text>

                </View>

              </View>


              {/* CLEAR DATA */}
              <TouchableOpacity
                style={styles.clearDataButton}
                onPress={clearSavedData}
              >

                <View style={styles.clearDataIcon}>
                  <Ionicons
                    name="trash-outline"
                    size={21}
                    color="#FF5B6E"
                  />
                </View>

                <View style={styles.clearDataTextContainer}>

                  <Text style={styles.clearDataTitle}>
                    Clear Saved Data
                  </Text>

                  <Text style={styles.clearDataDescription}>
                    Remove saved profile and emergency
                    contact information
                  </Text>

                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#777A8C"
                />

              </TouchableOpacity>


              {/* CLOSE */}
              <TouchableOpacity
                style={styles.closePrivacyButton}
                onPress={() =>
                  setShowPrivacySecurity(false)
                }
              >

                <Text style={styles.closePrivacyText}>
                  Done
                </Text>

              </TouchableOpacity>

            </ScrollView>

          </View>

        </View>

      </Modal>

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },


  // HEADER
  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 14,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    color: "#777A8C",
    fontSize: 13,
    marginTop: 3,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#11182B",

    alignItems: "center",
    justifyContent: "center",
  },


  // SCROLL
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },


  // SECTION TITLE
  sectionTitle: {
    color: "#777A8C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,

    marginTop: 15,
    marginBottom: 9,
  },


  // PROFILE CARD
  card: {
    backgroundColor: "#10172A",
    borderRadius: 18,

    padding: 16,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#1C253D",
  },

  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,

    backgroundColor: "#17223A",

    alignItems: "center",
    justifyContent: "center",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  profilePhone: {
    color: "#777A8C",
    fontSize: 13,
    marginTop: 3,
  },


  // SETTINGS CARD
  settingCard: {
    backgroundColor: "#10172A",
    borderRadius: 17,

    padding: 15,
    marginBottom: 9,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#1B2439",
  },

  settingIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,

    backgroundColor: "#151D34",

    alignItems: "center",
    justifyContent: "center",
  },

  settingIconSOS: {
    width: 45,
    height: 45,
    borderRadius: 14,

    backgroundColor: "#291923",

    alignItems: "center",
    justifyContent: "center",
  },

  settingIconDanger: {
    width: 45,
    height: 45,
    borderRadius: 14,

    backgroundColor: "#292318",

    alignItems: "center",
    justifyContent: "center",
  },

  settingTextContainer: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  settingTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  settingDescription: {
    color: "#777A8C",
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
  },


  // CONTACT STATUS
  contactStatus: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 1,
    marginBottom: 2,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 10,

    backgroundColor: "#00D4FF",

    marginLeft: 5,
    marginRight: 8,
  },

  statusText: {
    color: "#777A8C",
    fontSize: 11,
  },


  // LOGOUT
  logoutButton: {
    height: 52,
    borderRadius: 15,

    borderWidth: 1,
    borderColor: "#3A2029",

    backgroundColor: "#17121C",

    marginTop: 25,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  logoutText: {
    color: "#FF5B6E",
    fontSize: 15,
    fontWeight: "700",
  },


  // FOOTER
  footer: {
    textAlign: "center",

    color: "#41475A",

    fontSize: 10,
    lineHeight: 17,

    marginTop: 28,

    letterSpacing: 1,
  },


  // MODAL
  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.75)",

    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#0D1425",

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    padding: 22,
    paddingBottom: 35,

    borderTopWidth: 1,
    borderColor: "#27304A",
  },

  modalHeader: {
    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "flex-start",

    marginBottom: 18,
  },

  modalTitle: {
    color: "#FFFFFF",

    fontSize: 22,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#777A8C",

    fontSize: 12,

    marginTop: 5,

    maxWidth: 280,
  },


  // INPUT
  inputLabel: {
    color: "#A7AABC",

    fontSize: 12,
    fontWeight: "600",

    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#080D1A",

    borderRadius: 12,

    borderWidth: 1,
    borderColor: "#252D42",

    color: "#FFFFFF",

    paddingHorizontal: 14,

    height: 48,
  },


  // WARNING
  warningBox: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#211C13",

    borderWidth: 1,
    borderColor: "#3B321F",

    borderRadius: 14,

    padding: 12,

    marginBottom: 12,
  },

  warningText: {
    flex: 1,

    color: "#B8A982",

    fontSize: 11.5,

    lineHeight: 17,

    marginLeft: 10,
  },


  // PHONE INPUT
  phoneInput: {
    height: 52,

    backgroundColor: "#080D1A",

    borderRadius: 14,

    borderWidth: 1,
    borderColor: "#252D42",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,

    marginBottom: 8,
  },

  phoneTextInput: {
    flex: 1,

    color: "#FFFFFF",

    fontSize: 15,

    marginLeft: 10,
  },


  // SAVE BUTTON
  saveContactsButton: {
    height: 52,

    borderRadius: 15,

    backgroundColor: "#6C63FF",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 15,

    gap: 8,
  },

  saveContactsText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",
  },


  // =========================================
  // PRIVACY & SECURITY
  // =========================================

  privacyModalContainer: {
    backgroundColor: "#0D1425",

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 25,

    maxHeight: "88%",

    borderTopWidth: 1,
    borderColor: "#27304A",
  },

  privacyScroll: {
    paddingBottom: 10,
  },

  privacyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  privacyHeaderText: {
    marginLeft: 12,
    flex: 1,
  },

  privacyShield: {
    width: 48,
    height: 48,
    borderRadius: 15,

    backgroundColor: "#181A3A",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#302B66",
  },

  privacyIntro: {
    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: "#101B30",

    borderWidth: 1,
    borderColor: "#20314A",

    borderRadius: 16,

    padding: 14,

    marginBottom: 12,
  },

  privacyIntroText: {
    flex: 1,
    marginLeft: 11,
  },

  privacyIntroTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  privacyIntroDescription: {
    color: "#85899B",
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 5,
  },

  privacySettingCard: {
    backgroundColor: "#10172A",

    borderRadius: 16,

    padding: 12,

    marginBottom: 9,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#1B2439",
  },

  privacySettingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: "#102936",

    alignItems: "center",
    justifyContent: "center",
  },

  privacySettingIconSOS: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: "#291923",

    alignItems: "center",
    justifyContent: "center",
  },

  privacySettingIconPurple: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: "#211E3D",

    alignItems: "center",
    justifyContent: "center",
  },

  privacySettingText: {
    flex: 1,
    marginLeft: 11,
    marginRight: 5,
  },

  privacySettingTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },

  privacySettingDescription: {
    color: "#777A8C",
    fontSize: 10.5,
    lineHeight: 15,

    marginTop: 3,
  },

  privacyInfoCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#10172A",

    borderRadius: 15,

    padding: 12,

    marginBottom: 9,

    borderWidth: 1,
    borderColor: "#1B2439",
  },

  privacyInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: "#292318",

    alignItems: "center",
    justifyContent: "center",
  },

  privacyInfoIconBlue: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: "#102936",

    alignItems: "center",
    justifyContent: "center",
  },

  privacyInfoText: {
    flex: 1,
    marginLeft: 11,
  },

  privacyInfoTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },

  privacyInfoDescription: {
    color: "#777A8C",
    fontSize: 10.5,
    lineHeight: 15,

    marginTop: 3,
  },

  privacyStatusCard: {
    backgroundColor: "#0A1020",

    borderRadius: 15,

    padding: 14,

    marginTop: 3,
    marginBottom: 10,

    borderWidth: 1,
    borderColor: "#202A42",
  },

  privacyStatusTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",

    marginBottom: 9,
  },

  privacyStatusRow: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 5,
  },

  privacyStatusText: {
    color: "#85899B",
    fontSize: 11.5,

    flex: 1,
  },

  privacyStatusValue: {
    color: "#00D4FF",
    fontSize: 10.5,
    fontWeight: "800",
  },

  clearDataButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#17121C",

    borderRadius: 15,

    padding: 12,

    borderWidth: 1,
    borderColor: "#3A2029",

    marginBottom: 12,
  },

  clearDataIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: "#291923",

    alignItems: "center",
    justifyContent: "center",
  },

  clearDataTextContainer: {
    flex: 1,
    marginLeft: 11,
    marginRight: 5,
  },

  clearDataTitle: {
    color: "#FF5B6E",
    fontSize: 13.5,
    fontWeight: "700",
  },

  clearDataDescription: {
    color: "#777A8C",
    fontSize: 10.5,
    lineHeight: 15,

    marginTop: 3,
  },

  closePrivacyButton: {
    height: 50,

    borderRadius: 14,

    backgroundColor: "#6C63FF",

    alignItems: "center",
    justifyContent: "center",
  },

  closePrivacyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

});