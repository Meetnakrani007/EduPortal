import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import SubmitTicket from './pages/Tickets/SubmitTicket';
import MyTickets from './pages/Tickets/MyTickets';
import TicketDetail from './pages/Tickets/TicketDetail';
import SelectTeacher from './pages/Chat/SelectTeacher';
import ChatRoom from './pages/Chat/ChatRoom';
import HelpfulPosts from './pages/Posts/HelpfulPosts';
import PostDetail from './pages/Posts/PostDetail';
import Settings from './pages/Settings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import CreateHelpfulPost from './pages/Posts/CreateHelpfulPost';
import './App.css';
import { ToastProvider } from './components/Toast/ToastProvider';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/submit-ticket" element={
                    <ProtectedRoute>
                      <SubmitTicket />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-tickets" element={
                    <ProtectedRoute>
                      <MyTickets />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/tickets/:id" element={
                    <ProtectedRoute>
                      <TicketDetail />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/select-teacher" element={
                    <ProtectedRoute roles={['student']}>
                      <SelectTeacher />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/chat/:teacherId" element={
                    <ProtectedRoute>
                      <ChatRoom />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/helpful-posts" element={<HelpfulPosts />} />
                  <Route path="/helpful-posts/:id" element={<PostDetail />} />
                  <Route path="/helpful-posts/create" element={
                    <ProtectedRoute roles={['teacher']}>
                      <CreateHelpfulPost />
                    </ProtectedRoute>
                  } />
                  
                  {null}
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;