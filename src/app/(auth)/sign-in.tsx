
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

type AccountUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  hotelName?: string;
  hotelAddress?: string;
  agentId?: string;
  verificationStatus?: string;
};

const API_BASE_URL = "http://192.168.1.36:5001/api";
const AGENT_VERIFICATION_CODE = "AGENT2026";

const normalizeEmail = (value: string) =>
  value.trim().toLowerCase();

const normalizeAgentId = (value: string) =>
  value.trim().replace(/\s+/g, "").toUpperCase();

export default function SignInScreen() {
  const [role, setRole] = useState<UserRole>("Tourist");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [agentId, setAgentId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminSecretCode, setAdminSecretCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;

    const email = normalizeEmail(identifier);
    const cleanPassword = password;
    const enteredAgentId = normalizeAgentId(agentId);
    const enteredVerificationCode =
      verificationCode.trim().toUpperCase();

    if (!email || !cleanPassword) {
      Alert.alert(
        "Missing Details",
        "Please enter your registered email and password."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid registered email address."
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
          "The Agent verification code is incorrect."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password: cleanPassword,
          role: role.toLowerCase(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        Alert.alert(
          "Sign In Failed",
          result.message ||
            "Unable to sign in. Please check your email and password."
        );
        return;
      }

      const user: AccountUser =
        result.user ?? result.data?.user ?? result.data ?? {};

      const token: string | undefined =
        result.token ?? result.data?.token;

      if (!user.email) {
        Alert.alert(
          "Sign In Failed",
          "The server did not return your account details. Please check the backend sign-in response."
        );
        return;
      }

      const savedEmail = normalizeEmail(user.email);

      if (savedEmail !== email) {
        Alert.alert(
          "Account Mismatch",
          "The server returned an account that does not match the entered email."
        );
        return;
      }

      const savedRole = String(user.role ?? "")
        .trim()
        .toLowerCase();

      if (savedRole !== "tourist" && savedRole !== "agent") {
        Alert.alert(
          "Account Error",
          "Your account role is missing or invalid. Please contact the administrator."
        );
        return;
      }

      if (role === "Agent" && savedRole !== "agent") {
        Alert.alert(
          "Role Mismatch",
          "This account is not registered as an Agent."
        );
        return;
      }

      if (role === "Tourist" && savedRole !== "tourist") {
        Alert.alert(
          "Role Mismatch",
          "This account is not registered as a Tourist."
        );
        return;
      }

      if (savedRole === "agent") {
        const savedAgentId = normalizeAgentId(user.agentId ?? "");

        if (!savedAgentId) {
          Alert.alert(
            "Agent ID Missing",
            "Your registered account does not contain an Agent ID. Please contact the administrator."
          );
          return;
        }

        if (savedAgentId !== enteredAgentId) {
          Alert.alert(
            "Invalid Agent ID",
            "The Agent ID does not match your registered account."
          );
          return;
        }
      }

      const currentUser = {
        id: user._id ?? user.id ?? "",
        name: user.name ?? "",
        email: savedEmail,
        phone: user.phone ?? "",
        role: savedRole,
        hotelName: user.hotelName ?? "",
        hotelAddress: user.hotelAddress ?? "",
        agentId: user.agentId ?? "",
        verificationStatus:
          user.verificationStatus ??
          (savedRole === "agent" ? "pending" : "not_required"),
      };

      await AsyncStorage.setItem(
        "safeTourismCurrentUser",
        JSON.stringify(currentUser)
      );

      if (token) {
        await AsyncStorage.setItem("safeTourismToken", token);
      } else {
        await AsyncStorage.removeItem("safeTourismToken");
      }

      if (savedRole === "agent") {
        router.replace("/(agent)" as any);
      } else {
        router.replace("/(drawer)" as any);
      }
    } catch (error) {
      console.error("Sign-in error:", error);

      Alert.alert(
        "Connection Failed",
        "Could not connect to the Safe Tourism backend. Check that your backend is running and your phone and Mac are connected to the same Wi-Fi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (loading) return;

    if (!adminSecretCode.trim()) {
      Alert.alert(
        "Missing Code",
        "Please enter the Admin secret code."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            secretCode: adminSecretCode.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        Alert.alert(
          "Access Denied",
          result.message || "Invalid Admin secret code."
        );
        return;
      }

      const token: string | undefined =
        result.token ?? result.data?.token;

      if (!token) {
        Alert.alert(
          "Login Error",
          "The server did not return an Admin authentication token."
        );
        return;
      }

      const adminUser = {
        ...(result.user ?? result.data?.user ?? {}),
        role: "admin",
      };

      await AsyncStorage.setItem(
        "safeTourismCurrentUser",
        JSON.stringify(adminUser)
      );

      await AsyncStorage.setItem("safeTourismToken", token);

      setAdminSecretCode("");
      router.replace("/(admin)/dashboard" as any);
    } catch (error) {
      console.error("Admin login error:", error);

      Alert.alert(
        "Connection Failed",
        "Could not connect to the backend. Check that your server is running."
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
              disabled={loading}
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
              disabled={loading}
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

          <Text style={styles.label}>Registered Email Address</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#8993AD"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your registered email"
              placeholderTextColor="#69738D"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              autoComplete="email"
              editable={!loading}
              returnKeyType="next"
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
              autoComplete="current-password"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              activeOpacity={0.7}
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
                    Enter the Agent ID used during registration and
                    the demo verification code.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Agent ID</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="card-outline"
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
                  editable={!loading}
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
                  editable={!loading}
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
              disabled={loading}
              onPress={() => router.push("/(auth)/sign-up" as any)}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.adminLoginLink}
            activeOpacity={0.8}
            disabled={loading}
            onPress={() => {
              setShowAdminLogin(!showAdminLogin);
              setAdminSecretCode("");
              setShowAdminCode(false);
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color="#A99FFF"
            />
            <Text style={styles.adminLoginText}>Enter as Admin</Text>
            <Ionicons
              name={showAdminLogin ? "chevron-up" : "chevron-down"}
              size={17}
              color="#A99FFF"
            />
          </TouchableOpacity>

          {showAdminLogin && (
            <View style={styles.adminBox}>
              <Text style={styles.adminTitle}>
                Administrator Access
              </Text>

              <Text style={styles.adminDescription}>
                Enter your private Admin secret code to continue.
              </Text>

              {/* Updated Admin password field with show/hide icon */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#8993AD"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter Admin secret code"
                  placeholderTextColor="#69738D"
                  value={adminSecretCode}
                  onChangeText={setAdminSecretCode}
                  secureTextEntry={!showAdminCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleAdminLogin}
                />

                <TouchableOpacity
                  onPress={() => setShowAdminCode(!showAdminCode)}
                  disabled={loading}
                  activeOpacity={0.7}
                  accessibilityLabel={
                    showAdminCode
                      ? "Hide Admin secret code"
                      : "Show Admin secret code"
                  }
                >
                  <Ionicons
                    name={
                      showAdminCode
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#8993AD"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.signInButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleAdminLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.signInButtonText}>
                      Verify & Continue
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
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

  adminInputContainer: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#5149C8",
    backgroundColor: "#090F1E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 11,
    marginBottom: 17,
  },

  adminInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 13,
  },

  adminEyeButton: {
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
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
  adminLoginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 20,
    paddingVertical: 10,
  },
  adminLoginText: {
    color: "#A99FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  adminBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#111A30",
    borderWidth: 1,
    borderColor: "#5149C8",
  },
  adminTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  adminDescription: {
    color: "#9AA8C2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
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
