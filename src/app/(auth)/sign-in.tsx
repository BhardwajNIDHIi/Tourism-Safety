
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UserRole = "Tourist" | "Agent";

type DemoAccount = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "tourist" | "agent";
  hotelName: string;
  hotelAddress: string;
  agentId: string;
  verificationStatus: "pending" | "not_required";
};

const STORAGE_KEY = "safeTourismDemoAccounts";
const AGENT_VERIFICATION_CODE = "AGENT2026";

export default function SignInScreen() {
  const [role, setRole] = useState<UserRole>("Tourist");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [agentId, setAgentId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password;
    const enteredAgentId = agentId.trim().replace(/\s+/g, "").toUpperCase();
    const enteredVerificationCode = verificationCode.trim().toUpperCase();

    if (!cleanIdentifier || !cleanPassword) {
      Alert.alert(
        "Missing Details",
        "Please enter your email or phone number and password."
      );
      return;
    }

    if (role === "Agent") {
      if (!enteredAgentId || !enteredVerificationCode) {
        Alert.alert(
          "Missing Agent Details",
          "Please enter your Agent ID and verification code."
        );
        return;
      }

      if (enteredVerificationCode !== AGENT_VERIFICATION_CODE) {
        Alert.alert(
          "Verification Failed",
          "The verification code is incorrect. Please check it and try again."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedData: unknown = storedData ? JSON.parse(storedData) : [];

      if (!Array.isArray(parsedData)) {
        Alert.alert(
          "Sign In Failed",
          "Saved account data could not be read. Please try again."
        );
        return;
      }

      const accounts = parsedData as DemoAccount[];

      const digitsOnly = (value: unknown) =>
        String(value ?? "").replace(/\D/g, "");

      const enteredPhone = digitsOnly(identifier);

      const account = accounts.find((item) => {
        const savedEmail = String(item?.email ?? "")
          .trim()
          .toLowerCase();

        const savedPhone = digitsOnly(item?.phone);

        return (
          savedEmail === cleanIdentifier ||
          (enteredPhone.length > 0 && savedPhone === enteredPhone)
        );
      });

      if (!account) {
        Alert.alert(
          "Account Not Found",
          "No account was found with these details. Please sign up first."
        );
        return;
      }

      if (String(account.password ?? "") !== cleanPassword) {
        Alert.alert(
          "Incorrect Password",
          "The password you entered is incorrect."
        );
        return;
      }

      const savedRole = String(account.role ?? "").trim().toLowerCase();

      if (role === "Agent" && savedRole !== "agent") {
        Alert.alert(
          "Role Mismatch",
          "This account is registered as a Tourist. Please select Tourist to sign in."
        );
        return;
      }

      if (role === "Tourist" && savedRole !== "tourist") {
        Alert.alert(
          "Role Mismatch",
          "This account is registered as an Agent. Please select Agent to sign in."
        );
        return;
      }

      if (role === "Agent") {
        const savedAgentId = String(account.agentId ?? "")
          .trim()
          .replace(/\s+/g, "")
          .toUpperCase();

        if (!savedAgentId) {
          Alert.alert(
            "Agent ID Missing",
            "Agent ID is not saved in this account. Please check the ID used during registration."
          );
          return;
        }

        if (savedAgentId !== enteredAgentId) {
          Alert.alert(
            "Invalid Agent ID",
            "The Agent ID does not match the ID saved during registration. Enter the same ID you used when creating this account."
          );
          return;
        }

        // Agent session: existing Agent flow preserved.
        await AsyncStorage.setItem(
          "safeTourismCurrentUser",
          JSON.stringify({
            name: account.name,
            email: account.email,
            phone: account.phone,
            role: account.role,
            hotelName: account.hotelName ?? "",
            hotelAddress: account.hotelAddress ?? "",
            agentId: account.agentId ?? "",
            verificationStatus:
              account.verificationStatus ?? "pending",
          })
        );

        router.replace("/(agent)" as any);
      } else {
        // Tourist session: save profile details for Settings.
        await AsyncStorage.setItem(
          "safeTourismCurrentUser",
          JSON.stringify({
            name: account.name ?? "",
            email: account.email ?? "",
            phone: account.phone ?? "",
            role: "tourist",
          })
        );

        router.replace("/(drawer)" as any);
      }
    } catch (error) {
      console.error("Sign-in error:", error);

      Alert.alert(
        "Sign In Failed",
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons
                name="shield-checkmark"
                size={36}
                color="#00D4FF"
              />
            </View>

            <Text style={styles.brand}>SAFE TOURISM</Text>
            <Text style={styles.tagline}>
              Travel Safe. Explore Freely.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your safe journey.
            </Text>

            <Text style={styles.sectionLabel}>SIGN IN AS</Text>

            <View style={styles.roleContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.roleButton,
                  role === "Tourist" && styles.selectedRole,
                ]}
                onPress={() => setRole("Tourist")}
              >
                <Ionicons
                  name="person-outline"
                  size={21}
                  color={role === "Tourist" ? "#FFFFFF" : "#8993AD"}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === "Tourist" && styles.selectedRoleText,
                  ]}
                >
                  Tourist
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.roleButton,
                  role === "Agent" && styles.selectedRole,
                ]}
                onPress={() => setRole("Agent")}
              >
                <Ionicons
                  name="business-outline"
                  size={21}
                  color={role === "Agent" ? "#FFFFFF" : "#8993AD"}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === "Agent" && styles.selectedRoleText,
                  ]}
                >
                  Agent
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Email or Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#8993AD"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter email or phone"
                placeholderTextColor="#69738D"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8993AD"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#69738D"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#8993AD"
                />
              </TouchableOpacity>
            </View>

            {role === "Agent" && (
              <>
                <View style={styles.agentNotice}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={21}
                    color="#00D4FF"
                  />
                  <View style={styles.noticeTextContainer}>
                    <Text style={styles.noticeTitle}>
                      Agent Verification
                    </Text>
                    <Text style={styles.noticeDescription}>
                      Enter the Agent ID used during registration and the
                      demo verification code.
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>Agent ID</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="id-card-outline"
                    size={20}
                    color="#8993AD"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your registered Agent ID"
                    placeholderTextColor="#69738D"
                    value={agentId}
                    onChangeText={setAgentId}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <Text style={styles.label}>Verification Code</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color="#8993AD"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter verification code"
                    placeholderTextColor="#69738D"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <Text style={styles.helperText}>
                  Demo code: AGENT2026
                </Text>
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.signInButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(auth)/sign-up" as any)
                }
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color="#69738D"
            />
            <Text style={styles.footerText}>
              Your journey, your safety, our priority.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#080D1B",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#121D35",
    borderWidth: 1,
    borderColor: "#263958",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    color: "#8993AD",
    fontSize: 13,
    marginTop: 7,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#0D1426",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#202B43",
    padding: 22,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },
  subtitle: {
    color: "#8993AD",
    fontSize: 13,
    marginTop: 7,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionLabel: {
    color: "#8993AD",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 23,
  },
  roleButton: {
    flex: 1,
    minHeight: 53,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#29344D",
    backgroundColor: "#101A2E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  selectedRole: {
    backgroundColor: "#5149C8",
    borderColor: "#7770FF",
  },
  roleText: {
    color: "#8993AD",
    fontSize: 14,
    fontWeight: "700",
  },
  selectedRoleText: {
    color: "#FFFFFF",
  },
  label: {
    color: "#DCE4F5",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 9,
    marginTop: 3,
  },
  inputContainer: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#29344D",
    backgroundColor: "#090F1E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 11,
    marginBottom: 17,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 13,
  },
  agentNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#101F32",
    borderColor: "#203D55",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 17,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },
  noticeDescription: {
    color: "#9AA8C2",
    fontSize: 12,
    lineHeight: 18,
  },
  helperText: {
    color: "#00D4FF",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 18,
  },
  signInButton: {
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: "#635BEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 7,
    shadowColor: "#635BEE",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.65,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 23,
    flexWrap: "wrap",
  },
  signupText: {
    color: "#8993AD",
    fontSize: 13,
  },
  signupLink: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 23,
  },
  footerText: {
    color: "#69738D",
    fontSize: 11,
  },
});
