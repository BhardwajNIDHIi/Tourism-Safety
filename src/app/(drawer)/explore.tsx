
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AIResult = {
  title: string;
  content: string;
};

export default function ExploreScreen() {
  const [destination, setDestination] = useState("");
  const [situation, setSituation] = useState("");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("");
  const [interest, setInterest] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  // ==================================================
  // GEMINI API
  // ==================================================

  const askGemini = async (prompt: string, title: string) => {
    try {
      setLoading(true);
      setResult(null);

      // IMPORTANT:
      // Paste your NEW Gemini API key here.
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

      // Check only whether the key is empty.
      // DO NOT compare it with the actual key.
      if (!API_KEY.trim()) {
        Alert.alert(
          "API Key Missing",
          "Please add your Gemini API key in explore.tsx."
        );
        return;
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      console.log("Gemini Response:", data);

      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          "Gemini API request failed.";

        throw new Error(errorMessage);
      }

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(
          "No response received from Gemini."
        );
      }

      setResult({
        title,
        content: text,
      });
    } catch (error: any) {
      console.log("Gemini Error:", error);

      Alert.alert(
        "AI Error",
        error?.message ||
          "Unable to get AI response. Please check your API key and internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // DESTINATION EXPLORER
  // ==================================================

  const exploreDestination = () => {
    if (!destination.trim()) {
      Alert.alert(
        "Enter Destination",
        "Please enter a destination first."
      );
      return;
    }

    const prompt = `
You are an AI travel assistant inside a Tourist Safety Enhancement System.

The tourist wants information about:

Destination:
${destination}

Provide useful and concise travel information.

Use the following structure:

📍 DESTINATION OVERVIEW

🏝️ POPULAR PLACES
- Mention important tourist attractions.

🎯 THINGS TO DO
- Mention interesting activities.

🚕 LOCAL TRAVEL TIPS
- Give practical transportation and travel suggestions.

🛡️ SAFETY PRECAUTIONS
- Give important safety advice for tourists.

⚠️ AREAS OR SITUATIONS TO BE CAREFUL ABOUT
- Mention common tourist safety concerns.

🎒 EMERGENCY PREPARATION
- Explain what tourists should keep ready.

Important instructions:
- Keep the response simple and useful.
- Do not invent emergency phone numbers.
- Do not invent exact crime statistics.
- Do not provide false information.
- If information can vary by location, clearly say so.
- Focus on practical tourist safety.
`;

    askGemini(prompt, "Destination Guide");
  };

  // ==================================================
  // SITUATION BASED SAFETY
  // ==================================================

  const getSafetyAdvice = () => {
    if (!situation.trim()) {
      Alert.alert(
        "Describe Your Situation",
        "Please tell us what is happening."
      );
      return;
    }

    const prompt = `
You are a safety assistant inside a Tourist Safety Enhancement System.

A tourist has described the following situation:

"${situation}"

Provide calm, practical and immediate safety guidance.

Use this structure:

🚨 IMMEDIATE ACTIONS
- What should the tourist do right now?

❌ WHAT TO AVOID
- What actions should the tourist avoid?

📍 MOVE TO SAFETY
- Suggest safe public places or trusted locations where appropriate.

📞 GET HELP
- Explain how the tourist can contact appropriate local emergency services or trusted emergency contacts.

📱 INFORMATION TO SHARE
- Explain what information the tourist should share with emergency contacts.

🛡️ EXTRA SAFETY TIP
- Give one or two additional practical suggestions.

Important instructions:
- Stay calm and practical.
- Do not make medical or legal diagnoses.
- Do not invent emergency phone numbers.
- Do not assume the exact location of the tourist.
- If the situation appears immediately dangerous, clearly advise the tourist to contact local emergency services or their saved emergency contacts.
`;

    askGemini(prompt, "Safety Advice");
  };

  // ==================================================
  // AI ITINERARY GENERATOR
  // ==================================================

  const generateItinerary = () => {
    if (!destination.trim()) {
      Alert.alert(
        "Enter Destination",
        "Please enter a destination."
      );
      return;
    }

    if (!days.trim()) {
      Alert.alert(
        "Enter Days",
        "Please enter number of days."
      );
      return;
    }

    const prompt = `
You are an AI travel itinerary assistant for a Tourist Safety Enhancement System.

Create a practical and safe tourist itinerary.

Destination:
${destination}

Number of days:
${days}

Budget:
${budget || "Not specified"}

Interests:
${interest || "General sightseeing"}

Create a day-by-day itinerary.

For every day include:

DAY [NUMBER]

🌅 Morning
- Suggested activities

☀️ Afternoon
- Suggested activities

🌆 Evening
- Suggested activities

🛡️ Safety Tip
- One practical safety tip for that day.

After the itinerary also include:

💰 TRAVEL STYLE
- Budget / Moderate / Premium based on the information provided.

🎒 THINGS TO CARRY
- Useful items for the trip.

🛡️ GENERAL SAFETY PRECAUTIONS
- Important tourist safety advice.

Important instructions:
- Do not invent exact ticket prices.
- Do not invent emergency phone numbers.
- Keep the itinerary realistic.
- Avoid overly packed schedules.
- Consider reasonable travel time.
- Keep the response easy to read.
`;

    askGemini(prompt, "AI Itinerary");
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.heading}>
            Explore
          </Text>

          <Text style={styles.subtitle}>
            Discover places. Plan smarter. Travel safer.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="sparkles"
            size={25}
            color="#00D4FF"
          />
        </View>
      </View>

      {/* DESTINATION EXPLORER */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons
              name="location"
              size={22}
              color="#00D4FF"
            />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>
              Destination Explorer
            </Text>

            <Text style={styles.cardSubtitle}>
              Discover places and travel safely
            </Text>
          </View>
        </View>

        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Manali, Goa, Jaipur"
          placeholderTextColor="#777B8F"
          style={styles.input}
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={exploreDestination}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons
            name="search"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            Explore Destination
          </Text>
        </TouchableOpacity>
      </View>

      {/* SITUATION BASED SAFETY */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons
              name="shield-checkmark"
              size={22}
              color="#00D4FF"
            />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>
              Situation-Based Safety
            </Text>

            <Text style={styles.cardSubtitle}>
              Tell us what's happening
            </Text>
          </View>
        </View>

        <TextInput
          value={situation}
          onChangeText={setSituation}
          placeholder="Example: I am lost in an unfamiliar area..."
          placeholderTextColor="#777B8F"
          style={[
            styles.input,
            styles.textArea,
          ]}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={getSafetyAdvice}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons
            name="shield"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            Get Safety Advice
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI ITINERARY */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons
              name="map"
              size={22}
              color="#00D4FF"
            />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>
              AI Itinerary Generator
            </Text>

            <Text style={styles.cardSubtitle}>
              Create your personalized trip
            </Text>
          </View>
        </View>

        <Text style={styles.label}>
          Destination
        </Text>

        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Kerala"
          placeholderTextColor="#777B8F"
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>
              Days
            </Text>

            <TextInput
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor="#777B8F"
              style={styles.input}
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>
              Budget
            </Text>

            <TextInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholder="₹20000"
              placeholderTextColor="#777B8F"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>
          Interests
        </Text>

        <TextInput
          value={interest}
          onChangeText={setInterest}
          placeholder="Nature, beaches, adventure..."
          placeholderTextColor="#777B8F"
          style={styles.input}
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={generateItinerary}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sparkles"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            Generate Itinerary
          </Text>
        </TouchableOpacity>
      </View>

      {/* LOADING */}

      {loading && (
        <View style={styles.loadingCard}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="sparkles"
              size={25}
              color="#00D4FF"
            />
          </View>

          <ActivityIndicator
            size="large"
            color="#00D4FF"
            style={styles.loader}
          />

          <Text style={styles.loadingTitle}>
            AI is thinking...
          </Text>

          <Text style={styles.loadingText}>
            Preparing useful travel information for you.
          </Text>
        </View>
      )}

      {/* AI RESULT */}

      {result && !loading && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <Ionicons
                name="sparkles"
                size={20}
                color="#00D4FF"
              />
            </View>

            <View style={styles.resultTitleContainer}>
              <Text style={styles.resultTitle}>
                {result.title}
              </Text>

              <Text style={styles.resultSubtitle}>
                AI Travel Assistant
              </Text>
            </View>
          </View>

          <View style={styles.resultDivider} />

          <Text style={styles.resultText}>
            {result.content}
          </Text>
        </View>
      )}

      {/* INFORMATION */}

      <View style={styles.noteCard}>
        <Ionicons
          name="information-circle"
          size={21}
          color="#00D4FF"
        />

        <Text style={styles.noteText}>
          AI suggestions are for travel assistance
          only. For emergencies, use the SOS feature
          and contact appropriate local emergency
          services.
        </Text>
      </View>
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  headerTextContainer: {
    flex: 1,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "#8E93A7",
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#11182B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1D2942",
    marginLeft: 12,
  },

  card: {
    backgroundColor: "#0D1426",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1B2740",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  cardHeaderText: {
    flex: 1,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  cardSubtitle: {
    color: "#7F869A",
    fontSize: 12,
    marginTop: 4,
  },

  input: {
    backgroundColor: "#080D1B",
    borderWidth: 1,
    borderColor: "#202C45",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 12,
  },

  textArea: {
    height: 110,
    paddingTop: 14,
  },

  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.55,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  label: {
    color: "#AEB4C7",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  halfInput: {
    flex: 1,
  },

  loadingCard: {
    backgroundColor: "#0D1426",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1B2740",
  },

  loadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  loader: {
    marginTop: 4,
  },

  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  loadingText: {
    color: "#7F869A",
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },

  resultCard: {
    backgroundColor: "#0D1426",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#27365A",
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#101F35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  resultTitleContainer: {
    flex: 1,
  },

  resultTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  resultSubtitle: {
    color: "#737B91",
    fontSize: 11,
    marginTop: 3,
  },

  resultDivider: {
    height: 1,
    backgroundColor: "#1B2740",
    marginVertical: 15,
  },

  resultText: {
    color: "#D4D8E5",
    fontSize: 14,
    lineHeight: 23,
  },

  noteCard: {
    flexDirection: "row",
    backgroundColor: "#0B1222",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1A2945",
    gap: 10,
  },

  noteText: {
    flex: 1,
    color: "#8E96AA",
    fontSize: 11,
    lineHeight: 17,
  },
});

