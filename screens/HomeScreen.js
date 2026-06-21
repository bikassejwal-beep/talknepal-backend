import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export default function HomeScreen({ navigation }) {
  const [tab, setTab] = useState('chats');
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const id = await AsyncStorage.getItem('user_id');
    const name = await AsyncStorage.getItem('name');
    setUserId(id);
    if (id) loadContacts(id);
  };

  const loadContacts = async (id) => {
    try {
      const res = await axios.get(`${API}/users/contacts/${id}`);
      setContacts(res.data.contacts);
    } catch (e) {}
  };

  const searchUsers = async (text) => {
    setSearch(text);
    if (text.length < 2) return setSearchResults([]);
    try {
      const res = await axios.get(`${API}/users/search?phone=${text}`);
      setSearchResults(res.data.users);
    } catch (e) {}
  };

  const addContact = async (contactId) => {
    try {
      await axios.post(`${API}/users/contacts/${userId}/add/${contactId}`);
      loadContacts(userId);
      setSearch('');
      setSearchResults([]);
    } catch (e) {}
  };

  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>TalkNepal</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.iconBtn}>
            <Text style={styles.icon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Phone number bata sathi khoj..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={searchUsers}
      />

      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.map(u => (
            <TouchableOpacity key={u._id} style={styles.searchItem} onPress={() => addContact(u._id)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{u.name[0]}</Text></View>
              <View>
                <Text style={styles.contactName}>{u.name}</Text>
                <Text style={styles.contactPhone}>{u.phone} — tap garera add gara</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.tabs}>
        {['chats', 'status'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === 'chats' ? '💬 Chats' : '🔵 Status'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'chats' ? (
        <FlatList
          data={contacts}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.contactItem} onPress={() => navigation.navigate('Chat', { contact: item, userId })}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}><Text>📞</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}><Text>📹</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sathi xaina abhai!</Text>
              <Text style={styles.emptySubText}>Maathi phone number bata khoja!</Text>
            </View>
          }
        />
      ) : (
        <TouchableOpacity style={styles.statusBtn} onPress={() => navigation.navigate('Status')}>
          <Text style={styles.statusBtnText}>🔵 Status herna / lagauna</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 48, backgroundColor: '#2a2a3e' },
  appName: { color: '#6c63ff', fontSize: 22, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  icon: { fontSize: 20 },
  search: { backgroundColor: '#2a2a3e', margin: 12, borderRadius: 12, padding: 12, color: '#fff', fontSize: 14 },
  searchResults: { backgroundColor: '#2a2a3e', marginHorizontal: 12, borderRadius: 12, marginBottom: 8 },
  searchItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  tabs: { flexDirection: 'row', backgroundColor: '#2a2a3e', marginHorizontal: 12, borderRadius: 12, marginBottom: 8, padding: 4 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#6c63ff' },
  tabText: { color: '#888', fontSize: 14 },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#2a2a3e' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  contactInfo: { flex: 1 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  contactPhone: { color: '#888', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptySubText: { color: '#888', fontSize: 14, marginTop: 8 },
  statusBtn: { margin: 16, backgroundColor: '#2a2a3e', borderRadius: 12, padding: 16, alignItems: 'center' },
  statusBtnText: { color: '#6c63ff', fontSize: 16, fontWeight: 'bold' },
});