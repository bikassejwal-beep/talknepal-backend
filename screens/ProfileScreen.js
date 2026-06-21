import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export default function ProfileScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [statusText, setStatusText] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const id = await AsyncStorage.getItem('user_id');
    setUserId(id);
    try {
      const res = await axios.get(`${API}/users/profile/${id}`);
      setName(res.data.name);
      setStatusText(res.data.status_text);
      setPhone(res.data.phone);
    } catch (e) {}
  };

  const saveProfile = async () => {
    try {
      await axios.patch(`${API}/users/profile/${userId}`, { name, status_text: statusText });
      await AsyncStorage.setItem('name', name);
      Alert.alert('Success!', 'Profile update bhayo!');
    } catch (e) { Alert.alert('Error', 'Update bhayena!'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name[0] || '?'}</Text>
        </View>
        <Text style={styles.phone}>{phone}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Naam</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tero naam" placeholderTextColor="#666" />

        <Text style={styles.label}>Status</Text>
        <TextInput style={styles.input} value={statusText} onChangeText={setStatusText} placeholder="Status leakh..." placeholderTextColor="#666" />

        <TouchableOpacity style={styles.btn} onPress={saveProfile}>
          <Text style={styles.btnText}>Save Gara</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#2a2a3e' },
  back: { color: '#6c63ff', fontSize: 22 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avatarBox: { alignItems: 'center', padding: 32 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  phone: { color: '#888', fontSize: 16 },
  form: { backgroundColor: '#2a2a3e', margin: 16, borderRadius: 16, padding: 20 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, height: 48, color: '#fff', fontSize: 15 },
  btn: { backgroundColor: '#6c63ff', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});