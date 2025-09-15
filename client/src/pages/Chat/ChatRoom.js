import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const statusColors = {
  open: { bg: '#d4edda', color: '#155724', label: 'Open' },
  'under review': { bg: '#fff3cd', color: '#856404', label: 'Ticket Under Review' },
  closed: { bg: '#f8d7da', color: '#721c24', label: 'Closed' },
  'in-progress': { bg: '#ffeeba', color: '#856404', label: 'In Progress' },
  resolved: { bg: '#d1ecf1', color: '#0c5460', label: 'Resolved' }
};

const socket = io("http://localhost:8080"); // Adjust if needed

const ChatRoom = ({ ticketId, onStatusChange }) => {
  const params = useParams();
  const teacherId = params.teacherId;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [ticket, setTicket] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [seenMap, setSeenMap] = useState({});
  const [deliveredMap, setDeliveredMap] = useState({});
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const chatBoxRef = useRef(null);

  const roomId = ticketId;

  useEffect(() => {
    let fetchUrl = '';
    if (ticketId) {
      api.get(`/tickets/${ticketId}`)
        .then(res => setTicket(res.data));
      fetchUrl = `/chats/by-ticket/${ticketId}`;
    } else if (teacherId) {
      fetchUrl = `/chats/${teacherId}`;
      api.get(`/tickets?assignedTo=${teacherId}`)
        .then(res => {
          if (res.data.tickets && res.data.tickets.length > 0) {
            setTicket(res.data.tickets[0]);
          }
        });
    }
    if (fetchUrl) {
      api.get(fetchUrl)
        .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.error(err));
    }
    // Join socket room
    if (ticketId) {
      socket.emit('joinRoom', ticketId);
    }
    // Listen for socket events
    socket.on('typing', ({ user: typingUser }) => {
      if (typingUser && typingUser._id !== user._id) setTypingUser(typingUser.name || 'Someone');
    });
    socket.on('stopTyping', ({ user: typingUser }) => {
      if (typingUser && typingUser._id !== user._id) setTypingUser(null);
    });
    socket.on('newMessage', (msg) => {
      setMessages(prev => {
        // Prevent duplicates by checking last id and content
        const last = prev[prev.length - 1];
        if (last && (last._id && msg._id) && String(last._id) === String(msg._id)) {
          return prev;
        }
        return [...prev, msg];
      });
      setTypingUser(null);
      // Mark as delivered for the sender
      if (msg._id && msg.sender && msg.sender._id !== user._id) {
        socket.emit('delivered', { roomId: ticketId, messageId: msg._id, user });
      }
    });
    socket.on('delivered', ({ messageId, user: deliveredUser }) => {
      setDeliveredMap(prev => ({ ...prev, [messageId]: deliveredUser }));
    });
    socket.on('messageSeen', ({ messageId, user: seenUser }) => {
      setSeenMap(prev => ({ ...prev, [messageId]: seenUser }));
    });
    socket.on('ticketStatusChanged', ({ ticketId: changedId, newStatus }) => {
      if (String(changedId) === String(ticketId)) {
        setTicket(prev => ({ ...(prev || {}), status: newStatus }));
        if (typeof onStatusChange === 'function') onStatusChange(newStatus);
      }
    });
    return () => {
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('newMessage');
      socket.off('messageSeen');
      socket.off('delivered');
      socket.off('ticketStatusChanged');
    };
    // eslint-disable-next-line
  }, [roomId]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = (e) => {
    setText(e.target.value);
    if (e.target.value) {
      socket.emit('typing', { roomId: ticketId, user });
    } else {
      socket.emit('stopTyping', { roomId: ticketId, user });
    }
  };

  const sendMessage = () => {
    setError("");
    if (!text.trim() && !file) return; // keep this to prevent empty sends, but allow file-only
    let postUrl = '';
    if (ticketId) {
      postUrl = `/chats/by-ticket/${ticketId}`;
    } else if (teacherId) {
      postUrl = `/chats/${teacherId}`;
    }
    if (!postUrl) return;
    const formData = new FormData();
    formData.append('message', text || '');
    if (file) formData.append('attachments', file);
    api.post(postUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && res.data && last._id && res.data._id && String(last._id) === String(res.data._id)) {
            return prev;
          }
          return [...prev, res.data];
        });
        setText("");
        setFile(null);
        setError("");
        socket.emit('newMessage', { ...res.data, roomId: ticketId });
        // If teacher sent a message, optimistically switch status to open immediately
        if (user?.role === 'teacher') {
          setTicket(prev => ({ ...(prev || {}), status: 'open' }));
          if (typeof onStatusChange === 'function') onStatusChange('open');
        }
        socket.emit('stopTyping', { roomId: ticketId, user });
        // no full-page reloads
      })
      .catch((err) => {
        let msg = "Failed to send message.";
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      });
  };

  // Mark messages as seen
  useEffect(() => {
    if (messages.length > 0) {
      const unseen = messages.filter(m => m.sender && m.sender._id !== user._id && m.chat && m.chat !== 'undefined' && !(m.seenBy || []).includes(user._id));
      unseen.forEach(msg => {
        api.patch(`/chats/${msg.chat}/message/${msg._id}/seen`)
          .then(() => {
            socket.emit('messageSeen', { roomId: ticketId, messageId: msg._id, user });
          });
      });
    }
    // eslint-disable-next-line
  }, [messages]);

  const chatTitle = user?.role === 'teacher' ? 'Chat with Student' : 'Chat with Teacher';
  const statusObj = ticket ? (statusColors[ticket.status] || { bg: '#e2e3e5', color: '#383d41', label: ticket.status }) : null;
  const isStudent = user?.role === 'student';
  const isResolved = ticket && ticket.status === 'resolved';
  const isUnderReview = ticket && ticket.status === 'under review';
  const isClosed = ticket && ticket.status === 'closed';
  // Only allow student to chat if ticket is open
  const canStudentChat = !(isStudent && ticket && ticket.status !== 'open');

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(30,136,229,0.07)', padding: 32 }}>
      <h2 style={{ marginBottom: 8 }}>{chatTitle}</h2>
      {ticket && (
        <div style={{ marginBottom: 18 }}>
          <span style={{ color: '#888', marginRight: 16 }}><b>Category:</b> {ticket.category}</span>
          <span style={{ color: '#888' }}><b>Problem Definition:</b> {ticket.description}</span>
        </div>
      )}
      <div
        ref={chatBoxRef}
        style={{
          height: "min(60vh, 480px)",
          overflowY: "scroll",
          border: "1px solid #e0e0e0",
          background: '#f9f9f9',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16
        }}
      >
        {error && (
          <div style={{ color: 'red', textAlign: 'center', marginBottom: 8 }}>{error}</div>
        )}
        {messages.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 80 }}>No messages yet.</div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = user?._id === (msg.sender?._id || msg.sender);
            const seen = (msg.seenBy || []).includes(user._id) || seenMap[msg._id];
            const delivered = deliveredMap[msg._id];
            const senderName = msg.sender?.name || 'Unknown';
            const senderAvatar = msg.sender?.avatar || '';
            const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
            const curr = dayjs(msg.createdAt);
            const prev = idx > 0 ? dayjs(messages[idx-1].createdAt) : null;
            const isNewDay = !prev || !curr.isSame(prev, 'day');
            const dayLabel = curr.isToday() ? 'Today' : curr.isYesterday() ? 'Yesterday' : curr.format('DD/MM/YYYY');
            return (
              <div key={msg._id || idx} style={{
                marginBottom: 16,
                display: 'flex',
                flexDirection: isMine ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
              }}>
                {/* Day separator (scrolls with chat) */}
                {isNewDay && (
                  <div style={{ width: '100%', position: 'relative', display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#eef2ff',
                      color: '#475569',
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      border: '1px solid #e2e8f0'
                    }}>{dayLabel}</span>
                  </div>
                )}
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#eee', margin: isMine ? '0 0 0 10px' : '0 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#555', overflow: 'hidden'
                }}>
                  {senderAvatar ? (
                    <img src={senderAvatar.startsWith('http') ? senderAvatar : `/uploads/avatars/${senderAvatar}`} alt={senderName} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div>
                  {/* Name */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: isMine ? '#1976d2' : '#333', marginBottom: 6, textAlign: isMine ? 'right' : 'left' }}>{senderName}</div>
                  <div style={{
                    background: isMine ? '#90caf9' : '#e0e0e0',
                    color: isMine ? '#fff' : '#222',
                    padding: '10px 16px',
                    borderRadius: 18,
                    maxWidth: '75%',
                    minWidth: 180,
                    width: 'fit-content',
                    wordBreak: 'normal',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: 1.4,
                    fontSize: 15,
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(30,136,229,0.08)',
                    borderTopRightRadius: isMine ? 6 : 18,
                    borderTopLeftRadius: isMine ? 18 : 6,
                    marginLeft: isMine ? 0 : 0,
                    marginRight: isMine ? 0 : 0,
                    textAlign: 'left',
                  }}>
                    {msg.message || msg.text}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        {msg.attachments.map((att, i) => (
                          att.path && att.filename && att.originalName && (
                            att.filename.match(/\.(jpg|jpeg|png|gif)$/i)
                              ? <img key={i} src={`http://localhost:8080/${att.path}`} alt={att.originalName} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} />
                              : <a key={i} href={`http://localhost:8080/${att.path}`} target="_blank" rel="noopener noreferrer" style={{ color: isMine ? '#fff' : '#1e88e5', textDecoration: 'underline', display: 'block', marginTop: 6 }}>{att.originalName}</a>
                          )
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, fontSize: 12, opacity: 0.85, justifyContent: 'flex-end', gap: 6, whiteSpace: 'nowrap' }}>
                      <span style={{ lineHeight: 1 }}>{dayjs(msg.createdAt).format('HH:mm')}</span>
                      {isMine && (
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {seen ? (
                            <span style={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>✓✓</span>
                          ) : delivered ? (
                            <span style={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>✓✓</span>
                          ) : (
                            <span style={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <div style={{ color: '#888', fontStyle: 'italic', margin: '8px 0 0 8px' }}>{typingUser} is typing...</div>
        )}
        {!canStudentChat && isResolved && (
          <div style={{ color: '#388e3c', background: '#e8f5e9', borderRadius: 8, padding: 16, marginTop: 16, textAlign: 'center', fontWeight: 500, fontSize: 16 }}>
            🎉 This ticket has been marked as <b>Resolved</b>!<br />
            Thank you for reaching out. If you need further help, you can open a new ticket or contact your teacher again.
          </div>
        )}
        {!canStudentChat && isUnderReview && (
          <div style={{ color: '#b71c1c', background: '#fff3cd', borderRadius: 8, padding: 16, marginTop: 16, textAlign: 'center', fontWeight: 500, fontSize: 16 }}>
            ⏳ This ticket is <b>Under Review</b> by your teacher.<br />
            You cannot send messages while the ticket is under review. Please wait for your teacher to respond or reopen the chat.
          </div>
        )}
        {!canStudentChat && isClosed && (
          <div style={{ color: '#b71c1c', background: '#f8d7da', borderRadius: 8, padding: 16, marginTop: 16, textAlign: 'center', fontWeight: 500, fontSize: 16 }}>
            🚫 This ticket has been <b>Closed</b>.<br />
            You cannot send messages on closed tickets. If you need more help, please open a new ticket.
          </div>
        )}
        {!canStudentChat && !isResolved && !isUnderReview && !isClosed && (
          <div style={{ color: '#b71c1c', background: '#fff3cd', borderRadius: 8, padding: 12, marginTop: 16, textAlign: 'center', fontWeight: 500 }}>
            You can't send messages while this ticket is in progress. Please wait for your teacher to reopen the chat.
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={e => setFile(e.target.files[0])}
          style={{ flex: 1, minWidth: 120 }}
          disabled={!canStudentChat}
        />
      <input
        type="text"
        value={text}
          onChange={handleInput}
        placeholder="Type your message"
          style={{ flex: 2, padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', minWidth: 120 }}
          disabled={!canStudentChat}
      />
        <button onClick={sendMessage} style={{ background: '#1e88e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 16, cursor: canStudentChat ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }} disabled={!canStudentChat}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
