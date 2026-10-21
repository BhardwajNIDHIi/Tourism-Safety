
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

export default function SignUpScreen() {
  const [role, setRole] = useState<UserRole>("Tourist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const roles: {
    title: UserRole;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      title: "Tourist",
      subtitle: "Travel safely",
      icon: "person-outline",
    },
    {
      title: "Agent",
      subtitle: "Hotel staff",
      icon: "business-outline",
    },
    {
      title: "Publisher",
      subtitle: "Monitor records",
      icon: "analytics-outline",
    },
  ];

  const handleSignUp = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing Details", "Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak Password",
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Password and confirm password do not match."
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // TODO: Connect the registration API here.
      // Agent and Publisher registrations must be approved
      // before they can access their protected dashboards.

      Alert.alert(
        "Registration UI Ready",
        `Selected role: ${role}\n\nConnect the authentication backend to create your account securely.`,
        [
          {
            text: "Go to Sign In",
            onPress: () => router.replace("/(auth)/sign-in"),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Registration Failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(auth)/sign-in")}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.logoCircle}>
              <Ionicons
                name="shield-checkmark"
                size={34}
                color="#00D4FF"
              />
            </View>

            <Text style={styles.appName}>SAFE TOURISM</Text>
            <Text style={styles.tagline}>
              Begin your safer journey with us.
            </Text>
          </View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.description}>
              Enter your details to get started.
            </Text>
          </View>

          {/* Role selection */}
          <Text style={styles.label}>SELECT YOUR ROLE</Text>

          <View style={styles.roleContainer}>
            {roles.map((item) => {
              const selected = role === item.title;

              return (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.8}
                  onPress={() => setRole(item.title)}
                  style={[
                    styles.roleCard,
                    selected && styles.roleCardSelected,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={23}
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
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#00D4FF"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Full name */}
          <Text style={styles.label}>FULL NAME</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#8B95AA"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#707B90"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#8B95AA"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#707B90"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Phone */}
          <Text style={styles.label}>MOBILE NUMBER</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#8B95AA"
            />

            <Text style={styles.countryCode}>+91</Text>

            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#707B90"
              value={phone}
              onChangeText={(value) =>
                setPhone(value.replace(/\D/g, "").slice(0, 10))
              }
              keyboardType="phone-pad"
              maxLength={10}
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
              placeholder="Minimum 8 characters"
              placeholderTextColor="#707B90"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
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

          {/* Confirm password */}
          <Text style={styles.label}>CONFIRM PASSWORD</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#8B95AA"
            />

            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#707B90"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              accessibilityLabel={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color="#8B95AA"
              />
            </TouchableOpacity>
          </View>

          {/* Role access notice */}
          {role !== "Tourist" && (
            <View style={styles.notice}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#FBBF24"
              />

              <Text style={styles.noticeText}>
                {role} accounts require authorization before
                accessing the dashboard.
              </Text>
            </View>
          )}

          {/* Create account */}
          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.createButtonText}>
                  Create Account
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Sign in link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/sign-in")}
            >
              <Text style={styles.signInLink}> Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
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
    paddingTop: 20,
    paddingBottom: 35,
  },
  header: {
    alignItems: "center",
    marginBottom: 25,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#111C32",
    borderWidth: 1,
    borderColor: "#25334C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoCircle: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: "#111C32",
    borderWidth: 1,
    borderColor: "#243B5B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    color: "#8B95AA",
    fontSize: 12,
    marginTop: 7,
  },
  headingContainer: {
    marginBottom: 15,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginBottom: 7,
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
    letterSpacing: 1,
    marginTop: 17,
    marginBottom: 9,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 9,
  },
  roleCard: {
    flex: 1,
    minHeight: 103,
    backgroundColor: "#10182A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#202C42",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    paddingVertical: 12,
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
  checkIcon: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  inputContainer: {
    minHeight: 53,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#27334A",
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 13,
  },
  countryCode: {
    color: "#D1D9E8",
    fontSize: 14,
    fontWeight: "600",
    paddingRight: 3,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#241F16",
    borderWidth: 1,
    borderColor: "#514023",
    borderRadius: 12,
    padding: 12,
    marginTop: 17,
  },
  noticeText: {
    flex: 1,
    color: "#E8D7B0",
    fontSize: 12,
    lineHeight: 18,
  },
  createButton: {
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
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 23,
  },
  signInPrompt: {
    color: "#9BA6BB",
    fontSize: 13,
  },
  signInLink: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 25,
  },
  footerText: {
    color: "#8792A8",
    fontSize: 11,
  },
});