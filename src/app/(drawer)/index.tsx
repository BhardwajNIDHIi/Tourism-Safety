import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

type Coords = {
  latitude: number;
  longitude: number;
};

// Returns "Good Morning" / "Good Afternoon" / "Good Evening" based on real time
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({});
        setLocation(pos.coords);
      } catch (error) {
        setErrorMsg('Could not get your location');
      }
    })();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ---------- HEADER ---------- */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subGreeting}>Here's your safety overview</Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#0B1220" />
            </View>
          </View>
        </SafeAreaView>

        {/* ---------- CONTENT ---------- */}
        <View style={styles.body}>

          {/* Safety status */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(61, 220, 151, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#3DDC97" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>You're in a safe zone</Text>
              <Text style={styles.cardSubtitle}>No active alerts nearby</Text>
            </View>
          </View>

          {/* Weather */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(242, 169, 59, 0.15)' }]}>
              <Ionicons name="partly-sunny" size={20} color="#F2A93B" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>28°C, Partly Cloudy</Text>
              <Text style={styles.cardSubtitle}>Feels like 30°C</Text>
            </View>
          </View>

          {/* Live map */}
          <Text style={styles.sectionLabel}>Live Location</Text>
          <View style={styles.mapBox}>
            {location ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="You are here"
                  pinColor="#F2A93B"
                />
              </MapView>
            ) : (
              <View style={styles.mapFallback}>
                <Ionicons name="map-outline" size={24} color="#5C7096" />
                <Text style={styles.mapText}>
                  {errorMsg ? errorMsg : 'Getting your location...'}
                </Text>
              </View>
            )}
          </View>

          {/* Quick actions */}
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.actionsRow}>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75}>
              <View style={[styles.actionIcon, { backgroundColor: '#2A1418' }]}>
                <Ionicons name="medkit" size={22} color="#E9645F" />
              </View>
              <Text style={styles.actionLabel}>Hospital</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75}>
              <View style={[styles.actionIcon, { backgroundColor: '#13203A' }]}>
                <Ionicons name="shield" size={22} color="#5B8DEF" />
              </View>
              <Text style={styles.actionLabel}>Police</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75}>
              <View style={[styles.actionIcon, { backgroundColor: '#2E2410' }]}>
                <Ionicons name="sparkles" size={22} color="#F2A93B" />
              </View>
              <Text style={styles.actionLabel}>AI Tips</Text>
            </TouchableOpacity>

          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ---------- STYLES ----------
// One consistent spacing unit (20px) used everywhere so nothing feels random.
const GAP = 20;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    paddingHorizontal: GAP,
    paddingBottom: GAP,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subGreeting: {
    color: '#8FA3BF',
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2A93B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    paddingHorizontal: GAP,
    paddingBottom: GAP,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16233B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8FA3BF',
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 10,
  },

  mapBox: {
    height: 170,
    borderRadius: 16,
    backgroundColor: '#16233B',
    overflow: 'hidden',
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#8FA3BF',
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D7E1EF',
    textAlign: 'center',
  },
});