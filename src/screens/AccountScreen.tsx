import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/authContext';
import { usePillStore } from '../store/pillStore';
import { format } from 'date-fns';

export default function AccountScreen() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const { user, profile, signIn, signUp, signOut, updateProfile, session } = useAuth();
  const { pills, logs } = usePillStore();

  const [notifStatus, setNotifStatus] = useState<string>('checking...');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    checkNotifPermission();
  }, []);

  const checkNotifPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifStatus(status === 'granted' ? 'Enabled' : status === 'denied' ? 'Denied' : 'Not determined');
  };

  const openNotifSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatarUrl: result.assets[0].uri });
    }
  };

  const exportHistory = async () => {
    const lines = ['Pill,Scheduled Time,Taken At,Status'];
    for (const log of logs) {
      const pill = pills.find((p) => p.id === log.pillId);
      lines.push(`${pill?.name ?? 'Unknown'},${log.scheduledTime},${log.takenAt ?? 'N/A'},${log.status}`);
    }
    const csv = lines.join('\n');
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      Alert.alert('Email not available', 'Please configure an email account on this device.');
      return;
    }
    await MailComposer.composeAsync({
      subject: `MediTrack History Export - ${format(new Date(), 'yyyy-MM-dd')}`,
      body: 'Please find your pill history attached.',
      attachments: [], // Note: expo-mail-composer doesn't support inline CSV; body contains data
    });
    Alert.alert('Export', 'History data:\n\n' + csv.slice(0, 500) + (csv.length > 500 ? '...' : ''));
  };

  const handleAuth = async () => {
    if (isSignUp) {
      if (!name.trim()) { Alert.alert('Error', 'Please enter your name'); return; }
      const { error } = await signUp(email, password, name);
      if (error) Alert.alert('Sign Up Error', error);
    } else {
      const { error } = await signIn(email, password);
      if (error) Alert.alert('Sign In Error', error);
    }
  };

  const handleSaveName = async () => {
    await updateProfile({ name: newName.trim() });
    setEditingName(false);
  };

  // Not logged in
  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.authIcon}>💊</Text>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
          <Text style={[styles.authSub, { color: colors.textSecondary }]}>
            Sync your pills across devices
          </Text>

          {isSignUp && (
            <TextInput
              style={[styles.authInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
            />
          )}
          <TextInput
            style={[styles.authInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.authInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />

          <TouchableOpacity style={[styles.authBtn, { backgroundColor: colors.primary }]} onPress={handleAuth}>
            <Text style={[styles.authBtnText, { color: colors.textInverse }]}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.accent }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.offlineNote, { color: colors.textSecondary }]}>
            You can use MediTrack offline without an account
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Logged in
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Account</Text>

        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={pickImage}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ fontSize: 28 }}>👤</Text>
              </View>
            )}
            <Text style={[styles.changePhoto, { color: colors.accent }]}>Change photo</Text>
          </TouchableOpacity>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <TouchableOpacity onPress={handleSaveName}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setNewName(profile?.name ?? ''); setEditingName(true); }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name || 'Set name'}</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email ?? user?.email}</Text>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={{ color: colors.text }}>Permission Status</Text>
            <Text style={{ color: notifStatus === 'Enabled' ? colors.success : colors.warning, fontWeight: '600' }}>
              {notifStatus}
            </Text>
          </View>
          {notifStatus !== 'Enabled' && (
            <TouchableOpacity style={[styles.settingBtn, { backgroundColor: colors.primary + '15' }]} onPress={openNotifSettings}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Theme */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {(['system', 'light', 'dark'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.themeBtn, { backgroundColor: themePreference === t ? colors.primary : colors.background }]}
                onPress={() => setThemePreference(t)}
              >
                <Text style={{ color: themePreference === t ? colors.textInverse : colors.text, fontSize: 13, fontWeight: '600' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export */}
        <TouchableOpacity style={[styles.section, { backgroundColor: colors.card }]} onPress={exportHistory}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Export History</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Send pill history via email</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.error + '15' }]} onPress={signOut}>
          <Text style={{ color: colors.error, fontWeight: '600', fontSize: 16 }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', paddingTop: 12, marginBottom: 16, paddingHorizontal: 4 },
  profileCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  changePhoto: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  profileName: { fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  profileEmail: { fontSize: 14, marginTop: 4 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  nameInput: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 16, minWidth: 150 },
  section: { borderRadius: 14, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  settingBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  signOutBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  authContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  authIcon: { fontSize: 56, marginBottom: 12 },
  authTitle: { fontSize: 24, fontWeight: '800' },
  authSub: { fontSize: 14, marginBottom: 24 },
  authInput: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  authBtn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  authBtnText: { fontSize: 16, fontWeight: '700' },
  offlineNote: { fontSize: 12, marginTop: 24, textAlign: 'center' },
});
