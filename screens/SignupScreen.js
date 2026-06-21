import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!name || !phone || !password) return Alert.alert('Error', 'Sabai fill gara!');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/signup`, { name, phone, password });
      Alert.alert('OTP Pathaiyo!', 'CMD ma OTP herau!');
      setStep(2);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Signup bhayena!');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'OTP bharnu parxa!');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-otp`, { phone, otp });
      Alert.alert('Success!', 'Account ready bhayo!');
      navigation.replace('Login');
    } catch (e) {
      Alert.alert('Error', 'OTP galat xa!');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoIcon}>✨</Text>
        <Text style={styles.appName}>Account Banaau</Text>
        <Text style={styles.tagline}>TalkNepal ma join gara</Text>
      </View>

      <View style={styles.form}>
        {step === 1 ? (
          <>
            <Text style={styles.label}>Naam</Text>
            <TextInput style={styles.input} placeholder="Tero naam" placeholderTextColor="#666" value={name} onChangeText={setName} />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="98XXXXXXXX" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.btn} onPress={signup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Account Banaau</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.otpTitle}>OTP Enter Gara</Text>
            <Text style={styles.otpSub}>CMD window ma OTP herau!</Text>
            <TextInput style={[styles.input, styles.otpInput]} placeholder="6-digit OTP" placeholderTextColor="#666" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
            <TouchableOpacity style={styles.btn} onPress={verifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Gara</Text>}
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Account xa? <Text style={styles.linkBold}>Login gara</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 48 },
  appName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  tagline: { color: '#aaa', fontSize: 13, marginTop: 4 },
  form: { backgroundColor: '#2a2a3e', borderRadius: 16, padding: 24 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, height: 48, color: '#fff', fontSize: 15, marginBottom: 4 },
  btn: { backgroundColor: '#6c63ff', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#888', textAlign: 'center', marginTop: 16, fontSize: 14 },
  linkBold: { color: '#6c63ff', fontWeight: 'bold' },
  otpTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  otpSub: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8 },
});