
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import MapView, {
  Marker,
  UrlTile,
} from "react-native-maps";
import * as Location from "expo-location";

export default function Home() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startLocation = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLoading(false);
          return;
        }

        const current =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        setLocation(current);
        setLoading(false);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } catch (error) {
        console.log("Location error:", error);
        setLoading(false);
      }
    };

    startLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Getting your location...
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loading}>
        <Text>Location permission is required.</Text>
      </View>
    );
  }

  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="none"
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomEnabled={true}
        zoomControlEnabled={true}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
          zIndex={1}
        />

        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
          title="You are here"
          description="Your live location"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: "100%",
    height: "100%",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

