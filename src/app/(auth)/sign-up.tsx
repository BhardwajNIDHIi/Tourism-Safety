
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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

const TOURIST_ROUTE = "/(drawer)";
const AGENT_ROUTE = "/(agent)";

const normalizeEmail = (value: string) =>
  value.trim().toLowerCase();

const normalizePhone = (value: string) =>
  value.replace(/\D/g, "");

const normalizeAgentId = (value: string) =>
  value.trim().replace(/\s+/g, "").toUpperCase();

export default function SignUpScreen() {
  const [role, setRole] = useState<UserRole>("Tourist");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [agentId, setAgentId] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;

    const cleanName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const normalizedAgentId = normalizeAgentId(agentId);

    if (
      !cleanName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing Details",
        "Please fill in all required fields."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      Alert.alert(
        "Invalid Phone",
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak Password",
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );
      return;
    }

    if (
      role === "Agent" &&
      (!hotelName.trim() ||
        !hotelAddress.trim() ||
        !normalizedAgentId)
    ) {
      Alert.alert(
        "Agent Details Required",
        "Please enter hotel name, address and Agent ID."
      );
      return;
    }

    setLoading(true);

    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);

      let accounts: DemoAccount[] = [];

      if (storedData) {
        const parsedData: unknown = JSON.parse(storedData);

        if (!Array.isArray(parsedData)) {
          throw new Error(
            "Saved account data is not in the expected format."
          );
        }

        // Older demo accounts may not contain every newer field.
        accounts = parsedData.map((item: any) => ({
          name: String(item?.name ?? ""),
          email: String(item?.email ?? ""),
          phone: String(item?.phone ?? ""),
          password: String(item?.password ?? ""),
          role:
            String(item?.role ?? "").toLowerCase() === "agent"
              ? "agent"
              : "tourist",
          hotelName: String(item?.hotelName ?? ""),
          hotelAddress: String(item?.hotelAddress ?? ""),
          agentId: String(item?.agentId ?? ""),
          verificationStatus:
            item?.verificationStatus === "not_required"
              ? "not_required"
              : item?.role === "tourist"
                ? "not_required"
                : "pending",
        }));
      }

      // Email uniqueness check across all account roles.
      const emailExists = accounts.some(
        (account) =>
          normalizeEmail(account.email) === normalizedEmail
      );

      if (emailExists) {
        Alert.alert(
          "Account Already Exists",
          "This email is already registered. Please sign in or use another email."
        );
        return;
      }

      // Phone uniqueness check across all account roles.
      const phoneExists = accounts.some(
        (account) =>
          normalizePhone(account.phone) === normalizedPhone
      );

      if (phoneExists) {
        Alert.alert(
          "Phone Already Registered",
          "This mobile number is already registered. Please sign in or use another number."
        );
        return;
      }

      // Only Agent accounts participate in Agent ID uniqueness.
      if (role === "Agent") {
        const duplicateAgent = accounts.find(
          (account) =>
            account.role === "agent" &&
            normalizeAgentId(account.agentId) === normalizedAgentId
        );

        if (duplicateAgent) {
          Alert.alert(
            "Agent ID Already Exists",
            `The Agent ID "${normalizedAgentId}" is already saved for an Agent account.\n\nPlease enter a different Agent ID. A new email or mobile number does not make a repeated Agent ID unique.`
          );
          return;
        }
      }

      const newAccount: DemoAccount = {
        name: cleanName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        role: role.toLowerCase() as "tourist" | "agent",
        hotelName: role === "Agent" ? hotelName.trim() : "",
        hotelAddress: role === "Agent" ? hotelAddress.trim() : "",
        agentId: role === "Agent" ? normalizedAgentId : "",
        verificationStatus:
          role === "Agent" ? "pending" : "not_required",
      };

      const updatedAccounts = [...accounts, newAccount];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedAccounts)
      );

      // Save the signed-in demo user's details for the next screen.
      await AsyncStorage.setItem(
        "safeTourismCurrentUser",
        JSON.stringify({
          name: newAccount.name,
          email: newAccount.email,
          phone: newAccount.phone,
          role: newAccount.role,
          hotelName: newAccount.hotelName,
          hotelAddress: newAccount.hotelAddress,
          agentId: newAccount.agentId,
          verificationStatus: newAccount.verificationStatus,
        })
      );

      Alert.alert(
        "Registration Successful",
        role === "Agent"
          ? "Your demo Agent account has been created. Agent verification is still pending."
          : "Your Tourist account has been created.",
        [
          {
            text: "Continue",
            onPress: () => {
              if (role === "Agent") {
                router.replace(AGENT_ROUTE as any);
              } else {
                router.replace(TOURIST_ROUTE as any);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Signup error:", error);

      Alert.alert(
        "Signup Failed",
        "Could not save your demo account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (value: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    options: {
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      maxLength?: number;
    } = {}
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#8B95AA" />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#707B90"
          value={value}
          onChangeText={onChangeText}
          keyboardType={options.keyboardType || "default"}
          autoCapitalize={options.autoCapitalize || "sentences"}
          autoCorrect={false}
          maxLength={options.maxLength}
        />
      </View>
    </>
  );

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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(auth)/sign-in" as any)}
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

          <View style={styles.headingContainer}>
            <Text style={styles.heading}>Create Account</Text>

            <Text style={styles.description}>
              Register as a tourist or a tourism partner.
            </Text>
          </View>

          <Text style={styles.label}>SELECT YOUR ROLE</Text>

          <View style={styles.roleContainer}>
            {([
              {
                title: "Tourist",
                subtitle: "Travel safely",
                icon: "person-outline",
              },
              {
                title: "Agent",
                subtitle: "Hotel partner",
                icon: "business-outline",
              },
            ] as const).map((item) => {
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
                    <Ionicons
                      name="checkmark-circle"
                      size={17}
                      color="#00D4FF"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {renderInput(
            "FULL NAME *",
            "Enter your full name",
            name,
            setName,
            "person-outline",
            { autoCapitalize: "words" }
          )}

          {renderInput(
            "EMAIL ADDRESS *",
            "Enter your email",
            email,
            setEmail,
            "mail-outline",
            {
              keyboardType: "email-address",
              autoCapitalize: "none",
            }
          )}

          {renderInput(
            "MOBILE NUMBER *",
            "Enter 10-digit mobile number",
            phone,
            (value) =>
              setPhone(normalizePhone(value).slice(0, 10)),
            "call-outline",
            { keyboardType: "phone-pad", maxLength: 10 }
          )}

          {role === "Agent" && (
            <View style={styles.agentSection}>
              <View style={styles.agentHeader}>
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color="#00D4FF"
                />

                <Text style={styles.agentHeading}>
                  Agent Verification Details
                </Text>
              </View>

              <Text style={styles.agentDescription}>
                Enter your hotel and agent details for demo registration.
              </Text>

              {renderInput(
                "HOTEL / PROPERTY NAME *",
                "Enter hotel name",
                hotelName,
                setHotelName,
                "business-outline",
                { autoCapitalize: "words" }
              )}

              {renderInput(
                "HOTEL ADDRESS *",
                "Enter complete hotel address",
                hotelAddress,
                setHotelAddress,
                "location-outline"
              )}

              {renderInput(
                "AGENT ID *",
                "Enter a unique demo Agent ID",
                agentId,
                setAgentId,
                "card-outline",
                { autoCapitalize: "characters" }
              )}

              <View style={styles.notice}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#FBBF24"
                />

                <Text style={styles.noticeText}>
                  Demo mode only. Agent ID is not officially verified.
                  Verification status will be Pending.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.label}>PASSWORD *</Text>

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
              autoCorrect={false}
              autoComplete="new-password"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#8B95AA"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>CONFIRM PASSWORD *</Text>

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
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
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
                  {role === "Agent"
                    ? "Submit for Verification"
                    : "Create Account"}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.replace("/(auth)/sign-in" as any)
              }
            >
              <Text style={styles.signInLink}> Sign In</Text>
            </TouchableOpacity>
          </View>

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
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#080D1B" },

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

  headingContainer: { marginBottom: 15 },

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
    gap: 12,
  },

  roleCard: {
    flex: 1,
    minHeight: 105,
    backgroundColor: "#10182A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#202C42",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 6,
    position: "relative",
  },

  roleCardSelected: {
    backgroundColor: "#10253A",
    borderColor: "#00D4FF",
  },

  roleTitle: {
    color: "#E0E6F0",
    fontSize: 13,
    fontWeight: "700",
  },

  selectedText: { color: "#00D4FF" },

  roleSubtitle: {
    color: "#8792A8",
    fontSize: 10,
  },

  checkIcon: {
    position: "absolute",
    top: 6,
    right: 6,
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

  agentSection: {
    marginTop: 22,
    padding: 15,
    backgroundColor: "#0D1728",
    borderWidth: 1,
    borderColor: "#25425A",
    borderRadius: 15,
  },

  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  agentHeading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  agentDescription: {
    color: "#9BA6BB",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
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
    fontSize: 11,
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

  buttonDisabled: { opacity: 0.7 },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
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
