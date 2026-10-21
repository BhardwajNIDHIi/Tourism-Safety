
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type UserRole = "Tourist" | "Agent" | "Publisher";

export default function SignInScreen() {
  const [role, setRole] = useState<UserRole>("Tourist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const identifier = email.trim();

    if (!identifier || !password.trim()) {
      Alert.alert(
        "Missing Details",
        "Please enter your email/phone and password."
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // Authentication API will be connected here.
      // Do not navigate to protected dashboards until
      // credentials and the assigned role are verified.

      Alert.alert(
        "Authentication Not Connected",
        "Sign-in UI is ready. Connect your authentication API to log in securely."
      );
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles: {
    title: UserRole;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      title: "Tourist",
      subtitle: "Explore safely",
      icon: "person-outline",
    },
    {
      title: "Agent",
      subtitle: "Verify stays",
      icon: "business-outline",
    },
    {
      title: "Publisher",
      subtitle: "Monitor records",
      icon: "analytics-outline",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={39} color="#00D4FF" />
            </View>

            <Text style={styles.appName}>SAFE TOURISM</Text>
            <Text style={styles.tagline}>
              Travel Safe. Explore Freely.
            </Text>
          </View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.heading}>Welcome Back!</Text>
            <Text style={styles.description}>
              Sign in to continue your safe journey.
            </Text>
          </View>

          {/* Role Selection */}
          <Text style={styles.label}>CONTINUE AS</Text>

          <View style={styles.roleContainer}>
            {roles.map((item) => {
              const selected = role === item.title;

              return (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.8}
                  style={[
                    styles.roleCard,
                    selected && styles.roleCardSelected,
                  ]}
                  onPress={() => setRole(item.title)}
                >
                  <Ionicons
                    name={item.icon}
                    size={25}
                    color={selected ? "#00D4FF" : "#8B95AA"}
                  />

                  <Text
                    style={[
                      styles.roleTitle,
                      selected && styles.selectedText,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.roleSubtitle}>
                    {item.subtitle}
                  </Text>

                  {selected && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons
                        name="checkmark-circle"
                        size={17}
                        color="#00D4FF"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Email / Phone */}
          <Text style={styles.label}>EMAIL OR PHONE NUMBER</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#8B95AA"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter email or phone number"
              placeholderTextColor="#707B90"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>PASSWORD</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#8B95AA"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#707B90"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#8B95AA"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() =>
              Alert.alert(
                "Forgot Password",
                "Password recovery will be available after authentication is connected."
              )
            }
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.signInButtonText}>Sign In Securely</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>NEW TO SAFE TOURISM?</Text>
            <View style={styles.divider} />
          </View>

          {/* Sign Up */}
          <TouchableOpacity
            style={styles.signUpButton}
            activeOpacity={0.8}
            onPress={() => router.push("../(auth)/sign-up")}
          >
            <Text style={styles.signUpText}>
              Create New Account
            </Text>
            <Ionicons
              name="person-add-outline"
              size={19}
              color="#00D4FF"
            />
          </TouchableOpacity>

          {/* Security Footer */}
          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#00D4FF"
            />
            <Text style={styles.footerText}>
              Your safety and privacy matter to us.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#080D1B",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 35,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#111C32",
    borderWidth: 1,
    borderColor: "#243B5B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    color: "#8B95AA",
    fontSize: 13,
    marginTop: 7,
    letterSpacing: 0.4,
  },
  headingContainer: {
    marginBottom: 25,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    color: "#9BA6BB",
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    color: "#B9C4D8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 10,
    marginTop: 17,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 9,
  },
  roleCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: "#10182A",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#202C42",
    paddingVertical: 14,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    position: "relative",
  },
  roleCardSelected: {
    backgroundColor: "#10253A",
    borderColor: "#00D4FF",
  },
  roleTitle: {
    color: "#E0E6F0",
    fontSize: 12,
    fontWeight: "700",
  },
  selectedText: {
    color: "#00D4FF",
  },
  roleSubtitle: {
    color: "#8792A8",
    fontSize: 9,
    textAlign: "center",
  },
  selectedIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  inputContainer: {
    minHeight: 54,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#27334A",
    borderRadius: 13,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 14,
  },
  forgotContainer: {
    alignSelf: "flex-end",
    marginTop: 13,
  },
  forgotText: {
    color: "#00D4FF",
    fontSize: 12,
    fontWeight: "600",
  },
  signInButton: {
    marginTop: 25,
    minHeight: 55,
    backgroundColor: "#635BEE",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#253047",
  },
  dividerText: {
    color: "#8792A8",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  signUpButton: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#34425D",
    borderRadius: 14,
    backgroundColor: "#0D1424",
  },
  signUpText: {
    color: "#E5EAF4",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 28,
  },
  footerText: {
    color: "#8792A8",
    fontSize: 11,
  },
});