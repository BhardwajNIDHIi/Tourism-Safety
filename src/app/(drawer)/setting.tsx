import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Image,
} from 'react-native';

// ---------- Types ----------

interface SettingItemProps {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

interface ToggleItemProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

interface SettingsScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

// ---------- Reusable Components ----------

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingItem: React.FC<SettingItemProps> = ({
  label,
  subtitle,
  onPress,
  rightElement,
  danger,
}) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.itemLabel, danger && styles.dangerText]}>
        {label}
      </Text>
      {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
    </View>
    {rightElement ? rightElement : <Text style={styles.chevron}>›</Text>}
  </TouchableOpacity>
);

const ToggleItem: React.FC<ToggleItemProps> = ({
  label,
  value,
  onValueChange,
}) => (
  <View style={styles.item}>
    <Text style={styles.itemLabel}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

// ---------- Main Screen ----------

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [twoFactor, setTwoFactor] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://placehold.co/80x80' }}
            style={styles.avatar}
          />
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.name}>Rohit Sharma</Text>
            <Text style={styles.email}>rohit.sharma@example.com</Text>
          </View>
        </View>

        {/* Account Settings */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <SettingItem
            label="Edit Profile"
            onPress={() => navigation?.navigate('EditProfile')}
          />
          <SettingItem
            label="Change Password"
            onPress={() => navigation?.navigate('ChangePassword')}
          />
          <ToggleItem
            label="Two-Factor Authentication"
            value={twoFactor}
            onValueChange={setTwoFactor}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <ToggleItem
            label="Push Notifications"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
          <ToggleItem
            label="Email Notifications"
            value={emailEnabled}
            onValueChange={setEmailEnabled}
          />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <View style={styles.card}>
          <ToggleItem
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingItem
            label="Language"
            subtitle="English"
            onPress={() => navigation?.navigate('LanguageSettings')}
          />
        </View>

        {/* Privacy & Security */}
        <SectionHeader title="Privacy & Security" />
        <View style={styles.card}>
          <SettingItem
            label="Blocked Users"
            onPress={() => navigation?.navigate('BlockedUsers')}
          />
          <SettingItem
            label="Login History"
            onPress={() => navigation?.navigate('LoginHistory')}
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <SettingItem
            label="Help Center"
            onPress={() => navigation?.navigate('HelpCenter')}
          />
          <SettingItem
            label="Contact Us"
            onPress={() => navigation?.navigate('ContactUs')}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Account Actions" />
        <View style={styles.card}>
          <SettingItem
            label="Log Out"
            onPress={() => console.log('Logout pressed')}
            danger
          />
          <SettingItem
            label="Delete Account"
            onPress={() => console.log('Delete account pressed')}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ddd',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  email: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  itemLabel: {
    fontSize: 15,
    color: '#111',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  dangerText: {
    color: '#E53935',
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
  },
});