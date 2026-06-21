import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://localhost:8000/api';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!phone || !password) return Alert.alert('Error', 'Phone ra password bharnu parxa!');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { phone, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user_id', res.data.user_id);
      await AsyncStorage.setItem('name', res.data.name);
      navigation.replace('Home');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Login bhayena!');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoIcon}>💬</Text>
        <Text style={styles.appName}>TalkNepal</Text>
        <Text style={styles.tagline}>Chat. Call. Connect.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputRow}>
          <Text style={styles.flag}>🇳🇵 +977</Text>
          <TextInput
            style={styles.input}
            placeholder="98XXXXXXXX"
            placeholderTextColor="#666"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, styles.fullInput]}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>Account xaina? <Text style={styles.linkBold}>Signup gara</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { fontSize: 56 },
  appName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  tagline: { color: '#aaa', fontSize: 14, marginTop: 4 },
  form: { backgroundColor: '#2a2a3e', borderRadius: 16, padding: 24 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  flag: { color: '#6c63ff', fontSize: 14, marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  fullInput: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, height: 48, color: '#fff', fontSize: 15 },
  btn: { backgroundColor: '#6c63ff', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#888', textAlign: 'center', marginTop: 16, fontSize: 14 },
  linkBold: { color: '#6c63ff', fontWeight: 'bold' },
});