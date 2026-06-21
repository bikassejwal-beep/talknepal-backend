import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://localhost:8000/api';
const COLORS = ['#6c63ff', '#ff6584', '#3ecfcf', '#f9a825', '#e91e63', '#00bcd4'];

export default function StatusScreen({ navigation }) {
  const [statuses, setStatuses] = useState([]);
  const [userId, setUserId] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [bgColor, setBgColor] = useState('#6c63ff');

  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => { setUserId(id); loadStatuses(id); });
  }, []);

  const loadStatuses = async (id) => {
    try {
      const res = await axios.get(`${API}/status/feed/${id}`);
      setStatuses(res.data.statuses);
    } catch (e) {}
  };

  const postStatus = async () => {
    if (!statusText.trim()) return Alert.alert('Error', 'Status leakh!');
    try {
      await axios.post(`${API}/status/text`, { user_id: userId, text: statusText, bg_color: bgColor });
      Alert.alert('Success!', 'Status lagaiyo!');
      setShowPost(false);
      setStatusText('');
      loadStatuses(userId);
    } catch (e) { Alert.alert('Error', 'Status lagauna bhayena!'); }
  };

  const viewStatus = async (statusId) => {
    await axios.post(`${API}/status/view/${statusId}?viewer_id=${userId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Status</Text>
        <TouchableOpacity onPress={() => setShowPost(!showPost)}>
          <Text style={styles.addBtn}>+ New</Text>
        </TouchableOpacity>
      </View>

      {showPost && (
        <View style={styles.postBox}>
          <TextInput
            style={[styles.statusInput, { backgroundColor: bgColor }]}
            placeholder="K sochiraxau? Leakh..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={statusText}
            onChangeText={setStatusText}
            multiline
            textAlign="center"
          />
          <View style={styles.colorPicker}>
            {COLORS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, bgColor === c && styles.selectedColor]} onPress={() => setBgColor(c)} />
            ))}
          </View>
          <TouchableOpacity style={styles.postBtn} onPress={postStatus}>
            <Text style={styles.postBtnText}>Status Lagaau</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={statuses}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.statusCard, { backgroundColor: item.bg_color || '#6c63ff' }]} onPress={() => viewStatus(item._id)}>
            <Text style={styles.statusCardText}>{item.content}</Text>
            <Text style={styles.statusMeta}>{item.view_count} jana le heryo • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Kei status xaina!</Text>
            <Text style={styles.emptySubText}>Maathi "+ New" thichaera lagaau!</Text>
          </View>
        }
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#2a2a3e' },
  back: { color: '#6c63ff', fontSize: 22 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addBtn: { color: '#6c63ff', fontSize: 16, fontWeight: 'bold' },
  postBox: { backgroundColor: '#2a2a3e', margin: 12, borderRadius: 16, padding: 16 },
  statusInput: { borderRadius: 12, padding: 20, fontSize: 18, color: '#fff', minHeight: 120, textAlignVertical: 'center', marginBottom: 12 },
  colorPicker: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  selectedColor: { borderWidth: 3, borderColor: '#fff' },
  postBtn: { backgroundColor: '#6c63ff', borderRadius: 10, padding: 12, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  statusCard: { borderRadius: 16, padding: 20, marginBottom: 12, minHeight: 100, justifyContent: 'center' },
  statusCardText: { color: '#fff', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  statusMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptySubText: { color: '#888', fontSize: 14, marginTop: 8 },
});