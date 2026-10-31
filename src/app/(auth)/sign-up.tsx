
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
const API_BASE_URL = "http://192.168.1.36:5001/api";

const TOURIST_ROUTE = "/(drawer)";
const AGENT_ROUTE = "/(agent)";
const SIGN_IN_ROUTE = "/(auth)/sign-in";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email OTP verification states
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const currentEmail = normalizeEmail(email);
  const isCurrentEmailVerified =
    emailVerified && verifiedEmail === currentEmail;

  const handleEmailChange = (value: string) => {
    setEmail(value);

    // If the email changes, require verification again.
    if (normalizeEmail(value) !== verifiedEmail) {
      setEmailVerified(false);
      setVerifiedEmail("");
      setOtpSent(false);
      setOtp("");
    }
  };

  const handleSendOtp = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setOtpSent(true);
      setEmailVerified(false);
      setVerifiedEmail("");
      setOtp("");

      Alert.alert(
        "OTP Sent",
        `A verification code has been sent to ${normalizedEmail}. Check your inbox.`
      );
    } catch (error) {
      Alert.alert(
        "OTP Error",
        error instanceof Error
          ? `${error.message}\n\nCheck that your Mac and phone are on the same Wi-Fi and the backend is running.`
          : "Could not connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!otpSent) {
      Alert.alert("OTP Required", "Please request an OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      Alert.alert("Invalid OTP", "Enter the 6-digit OTP received by email.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setEmailVerified(true);
      setVerifiedEmail(normalizedEmail);

      Alert.alert(
        "Email Verified",
        "Your email address has been verified successfully."
      );
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  
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
    Alert.alert("Missing Details", "Please fill in all required fields.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
  }

  if (!isCurrentEmailVerified) {
    Alert.alert(
      "Email Not Verified",
      "Please verify your current email address before creating your account."
    );
    return;
  }

  if (!/^\d{10}$/.test(normalizedPhone)) {
    Alert.alert("Invalid Phone", "Enter a valid 10-digit mobile number.");
    return;
  }

  if (password.length < 8) {
    Alert.alert("Weak Password", "Password must contain at least 8 characters.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Password Mismatch", "Passwords do not match.");
    return;
  }

  if (
    role === "Agent" &&
    (!hotelName.trim() || !hotelAddress.trim() || !normalizedAgentId)
  ) {
    Alert.alert(
      "Agent Details Required",
      "Please enter hotel name, address and Agent ID."
    );
    return;
  }

  setLoading(true);

  try {
    // Load existing local records without blocking signup because of them.
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    let accounts: DemoAccount[] = [];

    if (storedData) {
      const parsedData: unknown = JSON.parse(storedData);

      if (!Array.isArray(parsedData)) {
        throw new Error(
          "Saved account data is not in the expected format."
        );
      }

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
          item?.verificationStatus === "not_required" ||
          String(item?.role ?? "").toLowerCase() === "tourist"
            ? "not_required"
            : "pending",
      }));
    }

    // MongoDB backend is responsible for checking whether an account
    // already exists. Do not block signup using old local records.
    
const signupPayload = {
  name: cleanName,
  email: normalizedEmail,
  phone: normalizedPhone,
  password,
  role,
  ...(role === "Agent"
    ? {
        hotelName: hotelName.trim(),
        hotelAddress: hotelAddress.trim(),
        agentId: normalizedAgentId,
        agentVerificationCode: "AGT-PAN-2048",
      }
    : {}),
};


    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signupPayload),
    });

    const responseData = await response.json();

    if (!response.ok || !responseData.success) {
      throw new Error(
        responseData.message || "Unable to create your account."
      );
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

    // Replace the same email's local entry, if one exists.
    // Preserve all other locally saved accounts.
    const updatedAccounts = [
      ...accounts.filter(
        (account) => normalizeEmail(account.email) !== normalizedEmail
      ),
      newAccount,
    ];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedAccounts)
    );

    if (role === "Agent") {
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

      await AsyncStorage.setItem("touristName", newAccount.name);
      await AsyncStorage.setItem("touristPhone", newAccount.phone);

      Alert.alert(
        "Registration Successful",
        "Your Agent account has been created. Agent verification is still pending.",
        [
          {
            text: "Continue",
            onPress: () => router.replace(AGENT_ROUTE as any),
          },
        ]
      );
    } else {
      await AsyncStorage.removeItem("safeTourismCurrentUser");

      Alert.alert(
        "Registration Successful",
        "Your Tourist account has been created. Please sign in using your registered email and password.",
        [
          {
            text: "Continue",
            onPress: () => router.replace(SIGN_IN_ROUTE as any),
          },
        ]
      );
    }
  } catch (error) {
    console.error("Signup error:", error);

    Alert.alert(
      "Signup Failed",
      error instanceof Error
        ? error.message
        : "Could not create your account. Please try again."
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
              onPress={() => router.replace(SIGN_IN_ROUTE as any)}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
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
            {(
              [
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
              ] as const
            ).map((item) => {
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
            handleEmailChange,
            "mail-outline",
            {
              keyboardType: "email-address",
              autoCapitalize: "none",
            }
          )}

          {/* Email OTP verification */}
          <View style={styles.verificationBox}>
            <View style={styles.verificationHeader}>
              <Ionicons
                name={
                  isCurrentEmailVerified
                    ? "checkmark-circle"
                    : "mail-outline"
                }
                size={21}
                color={isCurrentEmailVerified ? "#34D399" : "#00D4FF"}
              />

              <Text style={styles.verificationTitle}>
                Email Verification
              </Text>

              {isCurrentEmailVerified && (
                <Text style={styles.verifiedBadge}>VERIFIED</Text>
              )}
            </View>

            <Text style={styles.verificationDescription}>
              Verify your email address using the OTP sent to your inbox.
            </Text>

            <TouchableOpacity
              style={[
                styles.otpButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={loading || isCurrentEmailVerified}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#00D4FF" />
              ) : (
                <Text style={styles.otpButtonText}>
                  {isCurrentEmailVerified
                    ? "Email Verified"
                    : otpSent
                    ? "Resend OTP"
                    : "Send Email OTP"}
                </Text>
              )}
            </TouchableOpacity>

            {otpSent && !isCurrentEmailVerified && (
              <>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#707B90"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(value) =>
                    setOtp(value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                />

                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      Verify OTP
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {renderInput(
            "MOBILE NUMBER *",
            "Enter 10-digit mobile number",
            phone,
            (value) => setPhone(normalizePhone(value).slice(0, 10)),
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
              onPress={() => router.replace(SIGN_IN_ROUTE as any)}
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

  selectedText: {
    color: "#00D4FF",
  },

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

  verificationBox: {
    marginTop: 14,
    marginBottom: 5,
    padding: 14,
    backgroundColor: "#10182A",
    borderWidth: 1,
    borderColor: "#273B55",
    borderRadius: 14,
  },

  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  verificationTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },

  verifiedBadge: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },

  verificationDescription: {
    color: "#9BA6BB",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 12,
  },

  otpButton: {
    backgroundColor: "#142A40",
    borderWidth: 1,
    borderColor: "#00A8D0",
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
  },

  otpButtonText: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "700",
  },

  otpInput: {
    marginTop: 12,
    backgroundColor: "#080D1B",
    borderWidth: 1,
    borderColor: "#27334A",
    borderRadius: 11,
    color: "#FFFFFF",
    padding: 13,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 6,
  },

  verifyButton: {
    marginTop: 10,
    backgroundColor: "#167D68",
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
  },

  verifyButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
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
