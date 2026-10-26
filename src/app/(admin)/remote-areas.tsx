
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type RemoteArea = {
  id: string;
  name: string;
  district: string;
  description: string;
  latitude: string;
  longitude: string;
  riskLevel: RiskLevel;
  assignedAgentId: string;
  createdAt: string;
};

type Agent = {
  id: string;
  name: string;
  hotelName: string;
  phone: string;
  email: string;
};

const AREA_KEY = "safeTourismRemoteAreas";
const AGENT_KEYS = [
  "safeTourismAgents",
  "safeTourismDemoAccounts",
  "registeredAgents",
];

const COLORS = {
  bg: "#080D1B",
  card: "#11182A",
  card2: "#171F34",
  border: "#28334B",
  purple: "#6C63FF",
  cyan: "#00D4FF",
  white: "#FFFFFF",
  muted: "#8D99B5",
  green: "#30D6A0",
  yellow: "#FFBE55",
  orange: "#FF8C42",
  red: "#FF5268",
};

const RISK_OPTIONS: RiskLevel[] = ["Low", "Medium", "High", "Critical"];

const emptyForm = {
  name: "",
  district: "",
  description: "",
  latitude: "",
  longitude: "",
  riskLevel: "Medium" as RiskLevel,
  assignedAgentId: "",
};

function getRiskColor(risk: RiskLevel) {
  switch (risk) {
    case "Low":
      return COLORS.green;
    case "Medium":
      return COLORS.yellow;
    case "High":
      return COLORS.orange;
    default:
      return COLORS.red;
  }
}

function normalizeAgents(data: any): Agent[] {
  // Supports common account storage formats.
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.agents)
      ? data.agents
      : Array.isArray(data?.users)
        ? data.users
        : [];

  return list
    .filter((item: any) => {
      const role = String(item?.role || "").toLowerCase();
      return role === "agent" || Boolean(item?.hotelName || item?.agentId);
    })
    .map((item: any, index: number) => ({
      id: String(item._id || item.id || item.agentId || item.email || index),
      name: String(item.name || item.agentName || item.fullName || "Agent"),
      hotelName: String(item.hotelName || item.hotel || "Registered hotel"),
      phone: String(item.phone || item.mobile || ""),
      email: String(item.email || ""),
    }));
}

export default function RemoteAreasScreen() {
  const [areas, setAreas] = useState<RemoteArea[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | RiskLevel>("All");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [agentPickerVisible, setAgentPickerVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const storedAreas = await AsyncStorage.getItem(AREA_KEY);
      setAreas(storedAreas ? JSON.parse(storedAreas) : []);

      let foundAgents: Agent[] = [];
      for (const key of AGENT_KEYS) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        try {
          const parsed = JSON.parse(raw);
          const normalized = normalizeAgents(parsed);
          if (normalized.length) {
            foundAgents = normalized;
            break;
          }
        } catch {
          // Continue to the next possible storage key.
        }
      }
      setAgents(foundAgents);
    } catch {
      Alert.alert("Error", "Could not load remote area data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const persistAreas = async (updated: RemoteArea[]) => {
    await AsyncStorage.setItem(AREA_KEY, JSON.stringify(updated));
    setAreas(updated);
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (area: RemoteArea) => {
    setEditingId(area.id);
    setForm({
      name: area.name,
      district: area.district,
      description: area.description,
      latitude: area.latitude,
      longitude: area.longitude,
      riskLevel: area.riskLevel,
      assignedAgentId: area.assignedAgentId,
    });
    setModalVisible(true);
  };

  const saveArea = async () => {
    if (!form.name.trim() || !form.district.trim()) {
      Alert.alert("Required fields", "Area name aur district fill karo.");
      return;
    }

    const coordinatePattern = /^-?\d+(\.\d+)?$/;
    const hasLatitude = form.latitude.trim() !== "";
    const hasLongitude = form.longitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      Alert.alert(
        "Invalid coordinates",
        "Latitude aur longitude dono enter karo, ya dono blank chhodo."
      );
      return;
    }

    if (hasLatitude) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);

      if (
        !coordinatePattern.test(form.latitude.trim()) ||
        !coordinatePattern.test(form.longitude.trim()) ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        Alert.alert("Invalid coordinates", "Valid latitude aur longitude enter karo.");
        return;
      }
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      const item: RemoteArea = {
        ...form,
        name: form.name.trim(),
        district: form.district.trim(),
        description: form.description.trim(),
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
        id: editingId || `${Date.now()}`,
        createdAt:
          areas.find((area) => area.id === editingId)?.createdAt || now,
      };

      const updated = editingId
        ? areas.map((area) => (area.id === editingId ? item : area))
        : [item, ...areas];

      await persistAreas(updated);
      setModalVisible(false);
      setForm(emptyForm);
      Alert.alert(
        "Success",
        editingId ? "Remote area updated." : "Remote area added."
      );
    } catch {
      Alert.alert("Error", "Area save nahi ho paaya. Dobara try karo.");
    } finally {
      setSaving(false);
    }
  };

  const deleteArea = (area: RemoteArea) => {
    Alert.alert(
      "Delete Remote Area",
      `Are you sure you want to delete "${area.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await persistAreas(areas.filter((item) => item.id !== area.id));
            } catch {
              Alert.alert("Error", "Area delete nahi ho paaya.");
            }
          },
        },
      ]
    );
  };

  const assignAgent = async (agentId: string) => {
    if (!editingId) {
      setForm((current) => ({ ...current, assignedAgentId: agentId }));
      setAgentPickerVisible(false);
      return;
    }

    const updated = areas.map((area) =>
      area.id === editingId ? { ...area, assignedAgentId: agentId } : area
    );

    try {
      await persistAreas(updated);
      setForm((current) => ({ ...current, assignedAgentId: agentId }));
      setAgentPickerVisible(false);
    } catch {
      Alert.alert("Error", "Agent assignment save nahi ho paaya.");
    }
  };

  const getAgentName = (agentId: string) =>
    agents.find((agent) => agent.id === agentId);

  const filteredAreas = areas.filter((area) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      area.name.toLowerCase().includes(query) ||
      area.district.toLowerCase().includes(query) ||
      (getAgentName(area.assignedAgentId)?.name || "")
        .toLowerCase()
        .includes(query);

    return matchesSearch && (riskFilter === "All" || area.riskLevel === riskFilter);
  });

  const highRiskCount = areas.filter(
    (area) => area.riskLevel === "High" || area.riskLevel === "Critical"
  ).length;
  const assignedCount = areas.filter((area) => area.assignedAgentId).length;

  const updateField = <K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>ADMIN CONTROL CENTER</Text>
          <Text style={styles.headerTitle}>Remote Areas</Text>
          <Text style={styles.headerSubtitle}>
            Manage high-risk locations and agent coverage
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="map" size={25} color={COLORS.cyan} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <StatCard
            icon="location"
            label="Total Areas"
            value={areas.length}
            color={COLORS.cyan}
          />
          <StatCard
            icon="warning"
            label="High Risk"
            value={highRiskCount}
            color={COLORS.red}
          />
          <StatCard
            icon="people"
            label="Assigned"
            value={assignedCount}
            color={COLORS.green}
          />
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={22} color={COLORS.cyan} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Safety coverage overview</Text>
            <Text style={styles.infoText}>
              Identify remote locations, monitor their risk level and assign
              registered tourism agents.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Remote Area</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search area, district or agent..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {(["All", ...RISK_OPTIONS] as const).map((risk) => {
            const selected = riskFilter === risk;
            const color = risk === "All" ? COLORS.cyan : getRiskColor(risk);

            return (
              <TouchableOpacity
                key={risk}
                style={[
                  styles.filterChip,
                  selected && {
                    borderColor: color,
                    backgroundColor: `${color}18`,
                  },
                ]}
                onPress={() => setRiskFilter(risk)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && { color, fontWeight: "800" },
                  ]}
                >
                  {risk === "All" ? "All Areas" : risk}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Area Directory</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredAreas.length} location{filteredAreas.length === 1 ? "" : "s"} found
            </Text>
          </View>
          <Ionicons name="list-outline" size={23} color={COLORS.muted} />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.cyan}
            style={{ marginTop: 36 }}
          />
        ) : filteredAreas.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="map-outline" size={34} color={COLORS.cyan} />
            </View>
            <Text style={styles.emptyTitle}>
              {areas.length === 0 ? "No Remote Areas Yet" : "No Matching Areas"}
            </Text>
            <Text style={styles.emptyText}>
              {areas.length === 0
                ? "Add a remote or sensitive location to start managing safety coverage."
                : "Try another search term or select a different risk filter."}
            </Text>
            {areas.length === 0 && (
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Create First Area</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredAreas.map((area) => {
            const agent = getAgentName(area.assignedAgentId);
            const riskColor = getRiskColor(area.riskLevel);

            return (
              <View key={area.id} style={styles.areaCard}>
                <View style={styles.areaCardTop}>
                  <View style={styles.areaIcon}>
                    <Ionicons
                      name="location"
                      size={23}
                      color={COLORS.cyan}
                    />
                  </View>

                  <View style={styles.areaMain}>
                    <Text style={styles.areaName}>{area.name}</Text>
                    <Text style={styles.areaDistrict}>
                      <Ionicons name="navigate-outline" size={13} /> {area.district}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.riskBadge,
                      {
                        borderColor: `${riskColor}66`,
                        backgroundColor: `${riskColor}18`,
                      },
                    ]}
                  >
                    <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
                    <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                      {area.riskLevel}
                    </Text>
                  </View>
                </View>

                {area.description ? (
                  <Text style={styles.descriptionText}>{area.description}</Text>
                ) : null}

                {(area.latitude || area.longitude) && (
                  <View style={styles.coordinateRow}>
                    <Ionicons name="navigate" size={15} color={COLORS.muted} />
                    <Text style={styles.coordinateText}>
                      {area.latitude}, {area.longitude}
                    </Text>
                  </View>
                )}

                <View style={styles.agentBox}>
                  <View style={styles.agentIcon}>
                    <Ionicons
                      name="person-circle-outline"
                      size={27}
                      color={agent ? COLORS.green : COLORS.yellow}
                    />
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentLabel}>ASSIGNED AGENT</Text>
                    <Text style={styles.agentName}>
                      {agent ? agent.name : "No agent assigned"}
                    </Text>
                    {agent && (
                      <Text style={styles.agentHotel}>{agent.hotelName}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.assignSmallButton}
                    onPress={() => openEditModal(area)}
                  >
                    <Ionicons name="person-add-outline" size={16} color={COLORS.cyan} />
                    <Text style={styles.assignSmallText}>
                      {agent ? "Manage" : "Assign"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.createdText}>
                    Added {new Date(area.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openEditModal(area)}
                      accessibilityLabel={`Edit ${area.name}`}
                    >
                      <Ionicons name="create-outline" size={19} color={COLORS.cyan} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteIconButton]}
                      onPress={() => deleteArea(area)}
                      accessibilityLabel={`Delete ${area.name}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={17} color={COLORS.muted} />
          <Text style={styles.footerNoteText}>
            Frontend demo: data is saved on this device. Shared access across
            devices will be enabled after backend integration.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editingId ? "Edit Remote Area" : "Add Remote Area"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Enter location and safety details
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <FieldLabel>Area Name *</FieldLabel>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => updateField("name", v)}
                placeholder="e.g. Remote Mountain Route"
                placeholderTextColor={COLORS.muted}
              />

              <FieldLabel>District / Region *</FieldLabel>
              <TextInput
                style={styles.input}
                value={form.district}
                onChangeText={(v) => updateField("district", v)}
                placeholder="Enter district or region"
                placeholderTextColor={COLORS.muted}
              />

              <FieldLabel>Description</FieldLabel>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={form.description}
                onChangeText={(v) => updateField("description", v)}
                placeholder="Describe the location or safety concern"
                placeholderTextColor={COLORS.muted}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.twoColumns}>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Latitude</FieldLabel>
                  <TextInput
                    style={styles.input}
                    value={form.latitude}
                    onChangeText={(v) => updateField("latitude", v)}
                    placeholder="28.6139"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Longitude</FieldLabel>
                  <TextInput
                    style={styles.input}
                    value={form.longitude}
                    onChangeText={(v) => updateField("longitude", v)}
                    placeholder="77.2090"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <FieldLabel>Risk Level</FieldLabel>
              <View style={styles.riskOptions}>
                {RISK_OPTIONS.map((risk) => {
                  const selected = form.riskLevel === risk;
                  const color = getRiskColor(risk);
                  return (
                    <TouchableOpacity
                      key={risk}
                      onPress={() => updateField("riskLevel", risk)}
                      style={[
                        styles.riskOption,
                        selected && {
                          borderColor: color,
                          backgroundColor: `${color}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.riskOptionText,
                          selected && { color, fontWeight: "800" },
                        ]}
                      >
                        {risk}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <FieldLabel>Assign Tourism Agent</FieldLabel>
              <TouchableOpacity
                style={styles.agentPicker}
                onPress={() => setAgentPickerVisible(true)}
              >
                <Ionicons name="person-outline" size={20} color={COLORS.cyan} />
                <Text style={styles.agentPickerText}>
                  {form.assignedAgentId
                    ? getAgentName(form.assignedAgentId)?.name || "Selected agent"
                    : "Select registered agent"}
                </Text>
                <Ionicons name="chevron-down" size={19} color={COLORS.muted} />
              </TouchableOpacity>

              {form.assignedAgentId ? (
                <TouchableOpacity
                  style={styles.clearAssignment}
                  onPress={() => updateField("assignedAgentId", "")}
                >
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.red} />
                  <Text style={styles.clearAssignmentText}>Remove assignment</Text>
                </TouchableOpacity>
              ) : null}

              {agents.length === 0 && (
                <Text style={styles.helperText}>
                  No registered agents were found in the supported local storage
                  keys. You can save the area and connect the agent list after
                  checking your signup storage structure.
                </Text>
              )}

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={saveArea}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>
                      {editingId ? "Save Changes" : "Create Remote Area"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={agentPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAgentPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Agent</Text>
                <Text style={styles.modalSubtitle}>
                  Choose an available registered agent
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAgentPickerVisible(false)}>
                <Ionicons name="close-circle" size={27} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {agents.length === 0 ? (
                <Text style={styles.noAgentsText}>
                  No agents found. Register an agent first, or connect this list
                  to the actual agent account storage.
                </Text>
              ) : (
                agents.map((agent) => (
                  <TouchableOpacity
                    key={agent.id}
                    style={styles.agentChoice}
                    onPress={() => assignAgent(agent.id)}
                  >
                    <View style={styles.agentChoiceIcon}>
                      <Ionicons name="person" size={20} color={COLORS.cyan} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agentChoiceName}>{agent.name}</Text>
                      <Text style={styles.agentChoiceHotel}>{agent.hotelName}</Text>
                      {!!agent.phone && (
                        <Text style={styles.agentChoiceHotel}>{agent.phone}</Text>
                      )}
                    </View>
                    <Ionicons
                      name={
                        form.assignedAgentId === agent.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={21}
                      color={
                        form.assignedAgentId === agent.id
                          ? COLORS.cyan
                          : COLORS.muted
                      }
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  headerTitle: { color: COLORS.white, fontSize: 23, fontWeight: "900" },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#00D4FF12",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  content: { padding: 16, paddingBottom: 35 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 12,
    minHeight: 112,
  },
  statIcon: {
    height: 35,
    width: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { color: COLORS.white, fontSize: 23, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  infoBanner: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    backgroundColor: "#101E30",
    borderWidth: 1,
    borderColor: "#214052",
    borderRadius: 16,
    marginBottom: 15,
  },
  infoTextWrap: { flex: 1 },
  infoTitle: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  infoText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  addButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    backgroundColor: COLORS.purple,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 15,
  },
  addButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 12, paddingVertical: 13, marginLeft: 8 },
  filters: { gap: 8, paddingBottom: 20 },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filterText: { color: COLORS.muted, fontSize: 11 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  sectionSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#00D4FF12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  emptyText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8 },
  emptyButton: { backgroundColor: COLORS.purple, borderRadius: 11, paddingHorizontal: 17, paddingVertical: 11, marginTop: 17 },
  emptyButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 12 },
  areaCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 13,
  },
  areaCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  areaIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#00D4FF12", alignItems: "center", justifyContent: "center" },
  areaMain: { flex: 1 },
  areaName: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  areaDistrict: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  riskBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 },
  riskDot: { height: 6, width: 6, borderRadius: 3 },
  riskBadgeText: { fontSize: 10, fontWeight: "800" },
  descriptionText: { color: "#B4BED2", fontSize: 12, lineHeight: 18, marginTop: 12 },
  coordinateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  coordinateText: { color: COLORS.muted, fontSize: 10 },
  agentBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#0C1323", borderRadius: 13, padding: 10, marginTop: 13 },
  agentIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  agentInfo: { flex: 1 },
  agentLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  agentName: { color: COLORS.white, fontWeight: "700", fontSize: 12, marginTop: 4 },
  agentHotel: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  assignSmallButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 8 },
  assignSmallText: { color: COLORS.cyan, fontSize: 10, fontWeight: "800" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  createdText: { color: COLORS.muted, fontSize: 10 },
  actionButtons: { flexDirection: "row", gap: 8 },
  iconButton: { height: 35, width: 35, borderRadius: 11, backgroundColor: "#00D4FF12", alignItems: "center", justifyContent: "center" },
  deleteIconButton: { backgroundColor: "#FF526812" },
  footerNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10, paddingHorizontal: 3 },
  footerNoteText: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: "#000000B8", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.bg, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 30, maxHeight: "92%", borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  modalSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  closeButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.card2, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  fieldLabel: { color: "#DCE4F5", fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, color: COLORS.white, paddingHorizontal: 13, paddingVertical: 13, fontSize: 12 },
  multilineInput: { minHeight: 85, textAlignVertical: "top" },
  twoColumns: { flexDirection: "row", gap: 10 },
  riskOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  riskOption: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: COLORS.card },
  riskOptionText: { color: COLORS.muted, fontSize: 11 },
  agentPicker: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14 },
  agentPickerText: { color: COLORS.white, flex: 1, fontSize: 12 },
  clearAssignment: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginTop: 10 },
  clearAssignmentText: { color: COLORS.red, fontSize: 11, fontWeight: "700" },
  helperText: { color: COLORS.yellow, fontSize: 11, lineHeight: 17, marginTop: 10 },
  saveButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: COLORS.purple, borderRadius: 13, padding: 15, marginTop: 22 },
  saveButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  pickerOverlay: { flex: 1, backgroundColor: "#000000C0", justifyContent: "center", padding: 20 },
  pickerCard: { backgroundColor: COLORS.bg, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border, maxHeight: "80%" },
  noAgentsText: { color: COLORS.muted, fontSize: 12, lineHeight: 19, paddingVertical: 18 },
  agentChoice: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  agentChoiceIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#00D4FF12", alignItems: "center", justifyContent: "center" },
  agentChoiceName: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  agentChoiceHotel: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
});
