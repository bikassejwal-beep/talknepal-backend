import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

const API = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

export default function ChatScreen({ route, navigation }) {
  const { contact, userId } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef(null);
  const flatRef = useRef(null);

  useEffect(() => {
    loadHistory();
    connectWS();
    return () => ws.current?.close();
  }, []);

  const connectWS = () => {
    ws.current = new WebSocket(`${WS_URL}/${userId}`);
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'chat_message' && msg.from === contact._id) {
        setMessages(prev => [...prev, { from_user: msg.from, message: msg.message, timestamp: msg.timestamp, _id: Date.now().toString() }]);
      }
      if (msg.type === 'typing' && msg.from === contact._id) {
        setIsTyping(msg.is_typing);
      }
    };
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/chat/history/${userId}/${contact._id}`);
      setMessages(res.data.messages);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = { from_user: userId, to_user: contact._id, message: text, timestamp: new Date().toISOString(), _id: Date.now().toString() };
    setMessages(prev => [...prev, msg]);
    ws.current?.send(JSON.stringify({ type: 'chat_message', to: contact._id, message: text, timestamp: msg.timestamp }));
    await axios.post(`${API}/chat/send`, { from_user: userId, to_user: contact._id, message: text });
    setText('');
  };

  const onTyping = (t) => {
    setText(t);
    ws.current?.send(JSON.stringify({ type: 'typing', to: contact._id, is_typing: t.length > 0 }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatar}><Text style={styles.avatarText}>{contact.name[0]}</Text></View>
        <View style={{flex:1}}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {isTyping && <Text style={styles.typing}>typing...</Text>}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionIcon}>📞</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionIcon}>📹</Text></TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item._id}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isMine = item.from_user === userId;
          return (
            <View style={[styles.msgWrap, isMine ? styles.myMsgWrap : styles.theirMsgWrap]}>
              <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                <Text style={styles.msgText}>{item.message}</Text>
                <Text style={styles.time}>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.msgList}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message leakh..."
          placeholderTextColor="#666"
          value={text}
          onChangeText={onTyping}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: 48, backgroundColor: '#2a2a3e', gap: 10 },
  backBtn: { padding: 4 },
  backIcon: { color: '#6c63ff', fontSize: 22 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  contactName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  typing: { color: '#6c63ff', fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  actionIcon: { fontSize: 20 },
  msgList: { padding: 12 },
  msgWrap: { marginVertical: 3 },
  myMsgWrap: { alignItems: 'flex-end' },
  theirMsgWrap: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  myBubble: { backgroundColor: '#6c63ff', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#2a2a3e', borderBottomLeftRadius: 4 },
  msgText: { color: '#fff', fontSize: 15 },
  time: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#2a2a3e', gap: 8 },
  input: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 18 },
});