/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole?: 'student' | 'admin' }) {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Loading...</div>;
  }
  
  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userData.role !== allowedRole) {
    // If user is admin but tries to access student routes, let them or redirect to their dash
    if (userData.role === 'admin') return <Navigate to="/admin" replace />;
    if (userData.role === 'student') return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

