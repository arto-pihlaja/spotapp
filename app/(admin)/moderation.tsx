import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import UserManagement from '@/features/admin/components/UserManagement';
import SpotModeration from '@/features/admin/components/SpotModeration';
import AuditLog from '@/features/admin/components/AuditLog';
import InvitationCodes from '@/features/admin/components/InvitationCodes';

type Tab = 'users' | 'spots' | 'codes' | 'audit';

export default function ModerationScreen() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('users');

  if (!user || user.role !== 'ADMIN') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Access denied</Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <UserManagement />;
      case 'spots': return <SpotModeration />;
      case 'codes': return <InvitationCodes />;
      case 'audit': return <AuditLog />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moderation</Text>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'spots' && styles.activeTab]}
          onPress={() => setActiveTab('spots')}
        >
          <Text style={[styles.tabText, activeTab === 'spots' && styles.activeTabText]}>Spots</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'codes' && styles.activeTab]}
          onPress={() => setActiveTab('codes')}
        >
          <Text style={[styles.tabText, activeTab === 'codes' && styles.activeTabText]}>Codes</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'audit' && styles.activeTab]}
          onPress={() => setActiveTab('audit')}
        >
          <Text style={[styles.tabText, activeTab === 'audit' && styles.activeTabText]}>Audit Log</Text>
        </Pressable>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16, paddingBottom: 12 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#EF4444', fontSize: 16 },
});
