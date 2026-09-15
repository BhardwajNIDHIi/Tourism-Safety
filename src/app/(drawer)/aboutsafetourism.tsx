
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AboutSafeTourism() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* App Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="shield-checkmark"
              size={42}
              color="#00D4FF"
            />
          </View>

          <Text style={styles.appName}>Safe Tourism</Text>

          <Text style={styles.tagline}>
            Travel Safe. Explore Freely.
          </Text>
        </View>

        {/* About the System */}
        <View style={styles.card}>
          <SectionTitle
            icon="globe-outline"
            title="About the System"
          />

          <Text style={styles.description}>
            Safe Tourism is a smart tourist safety
            application designed to help travellers
            explore destinations while staying aware,
            connected and prepared during their journey.
          </Text>

          <Text style={styles.description}>
            The main purpose of this application is to
            improve tourist safety through technology,
            location monitoring and emergency assistance.
          </Text>
        </View>

        {/* Our Mission */}
        <View style={styles.card}>
          <SectionTitle
            icon="flag-outline"
            title="Our Mission"
          />

          <Text style={styles.description}>
            Our mission is to make tourism safer,
            smarter and more confident by providing
            tourists with real-time safety information,
            emergency support and location-based alerts.
          </Text>
        </View>

        {/* Key Safety Features */}
        <View style={styles.card}>
          <SectionTitle
            icon="shield-checkmark-outline"
            title="Key Safety Features"
          />

          <FeatureRow
            icon="location-outline"
            title="Geofencing"
            description="Identify safe, moderate and danger zones."
          />

          <FeatureRow
            icon="alert-circle-outline"
            title="SOS Alerts"
            description="Send emergency alerts to saved contacts."
          />

          <FeatureRow
            icon="navigate-outline"
            title="Live Location"
            description="Monitor your current location during travel."
          />

          <FeatureRow
            icon="medkit-outline"
            title="Nearby Emergency Services"
            description="Find hospitals, police and other nearby help."
          />

          <FeatureRow
            icon="warning-outline"
            title="Danger Zone Alerts"
            description="Receive warnings about risky areas."
          />

          <FeatureRow
            icon="sparkles-outline"
            title="AI Safety Tips"
            description="Get smart safety guidance for your journey."
          />
        </View>

        {/* Privacy */}
        <View style={styles.card}>
          <SectionTitle
            icon="lock-closed-outline"
            title="Your Safety & Privacy"
          />

          <Text style={styles.description}>
            Your location may be used to provide
            safety-related services such as live
            monitoring, nearby assistance and
            geofencing alerts.
          </Text>

          <Text style={styles.description}>
            Location sharing should be enabled only
            when required. Your personal information
            should be handled securely and shared
            responsibly.
          </Text>
        </View>

        {/* Who Can Use It */}
        <View style={styles.card}>
          <SectionTitle
            icon="people-outline"
            title="Who Can Use It?"
          />

          <FeatureRow
            icon="person-outline"
            title="Solo Travellers"
            description="For safer and more confident solo journeys."
          />

          <FeatureRow
            icon="people-outline"
            title="Families"
            description="Stay connected and prepared during trips."
          />

          <FeatureRow
            icon="school-outline"
            title="Students"
            description="Explore new destinations with safety awareness."
          />

          <FeatureRow
            icon="airplane-outline"
            title="International Tourists"
            description="Get useful safety information while travelling."
          />
        </View>

        {/* Why Safe Tourism */}
        <View style={styles.card}>
          <SectionTitle
            icon="bulb-outline"
            title="Why Safe Tourism?"
          />

          <Text style={styles.description}>
            Travellers may face unfamiliar locations,
            unsafe areas and unexpected emergencies.
            Safe Tourism aims to bring important
            safety information and assistance into
            one convenient application.
          </Text>

          <View style={styles.missionBox}>
            <Text style={styles.missionText}>
              Making every journey safer, smarter
              and more confident.
            </Text>
          </View>
        </View>

        {/* Emergency Support */}
        <View style={styles.card}>
          <SectionTitle
            icon="call-outline"
            title="Emergency Support"
          />

          <Text style={styles.description}>
            In case of an emergency, use the SOS
            feature to alert your saved emergency
            contacts and access available assistance.
          </Text>

          <View style={styles.emergencyBox}>
            <Ionicons
              name="call"
              size={24}
              color="#FF6B6B"
            />

            <View style={styles.emergencyTextBox}>
              <Text style={styles.emergencyTitle}>
                Emergency Number
              </Text>

              <Text style={styles.emergencyNumber}>
                112
              </Text>

              <Text style={styles.smallText}>
                India Emergency Helpline
              </Text>
            </View>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.card}>
          <SectionTitle
            icon="information-circle-outline"
            title="App Information"
          />

          <InfoRow
            label="App Name"
            value="Safe Tourism"
          />

          <InfoRow
            label="Version"
            value="1.0.0"
          />

          <InfoRow
            label="Project"
            value="Tourist Safety Enhancement System"
          />

          <InfoRow
            label="Developed By"
            value="Your Team Name"
          />

          <InfoRow
            label="Project Type"
            value="Academic Project"
          />
        </View>

        <Text style={styles.footer}>
          Safe Tourism{"\n"}
          Travel Safe. Explore Freely.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

/* Section Title */

function SectionTitle({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons
        name={icon}
        size={24}
        color="#00D4FF"
      />

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

/* Feature Row */

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={23}
          color="#00D4FF"
        />
      </View>

      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

/* Information Row */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
    paddingTop: 15,
  },

  logoCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#111A35",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#24345F",
    marginBottom: 15,
  },

  appName: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  tagline: {
    fontSize: 14,
    color: "#A5B4D4",
    marginTop: 6,
  },

  card: {
    backgroundColor: "#0F162B",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#202B48",
  },

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
    flex: 1,
  },

  description: {
    fontSize: 14,
    lineHeight: 23,
    color: "#B5C0D9",
    marginBottom: 10,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#172442",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#A5B4D4",
  },

  missionBox: {
    backgroundColor: "#171D40",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#6C63FF",
  },

  missionText: {
    color: "#D9D8FF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
  },

  emergencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#251B2C",
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#59304A",
  },

  emergencyTextBox: {
    marginLeft: 14,
  },

  emergencyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  emergencyNumber: {
    color: "#FF6B6B",
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 2,
  },

  smallText: {
    color: "#B5C0D9",
    fontSize: 12,
    marginTop: 2,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#202B48",
    paddingVertical: 12,
    gap: 10,
  },

  infoLabel: {
    color: "#A5B4D4",
    fontSize: 13,
    flex: 1,
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  footer: {
    textAlign: "center",
    color: "#71809F",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },
});