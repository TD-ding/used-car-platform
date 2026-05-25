import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import PostVehicle from './pages/PostVehicle';
import MyVehicles from './pages/MyVehicles';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import DataAnalysis from './pages/DataAnalysis';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVehicles from './pages/admin/Vehicles';
import AdminConfig from './pages/admin/Config';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function SuperRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!['admin', 'super'].includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vehicles" element={<VehicleList />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/post" element={<PrivateRoute><PostVehicle /></PrivateRoute>} />
          <Route path="/my-vehicles" element={<PrivateRoute><MyVehicles /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/messages/:userId" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/analysis" element={<SuperRoute><DataAnalysis /></SuperRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/vehicles" element={<AdminRoute><AdminVehicles /></AdminRoute>} />
          <Route path="/admin/config" element={<AdminRoute><AdminConfig /></AdminRoute>} />
        </Routes>
      </main>
    </Router>
  );
}
