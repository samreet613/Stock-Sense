import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import ProductList from './pages/Products/ProductList';
import CategoriesModal from './pages/Products/CategoriesModal';
import ReorderRules from './pages/Products/ReorderRules';
import Receipts from './pages/Operations/Receipts';
import Deliveries from './pages/Operations/Deliveries';
import Transfers from './pages/Operations/Transfers';
import Adjustments from './pages/Operations/Adjustments';
import MoveHistory from './pages/Ledger/MoveHistory';
import Warehouses from './pages/Settings/Warehouses';
import Profile from './pages/Profile/Profile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Loading StockSense...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="categories" element={<CategoriesModal />} />
        <Route path="reordering" element={<ReorderRules />} />
        <Route path="operations/receipts" element={<Receipts />} />
        <Route path="operations/deliveries" element={<Deliveries />} />
        <Route path="operations/transfers" element={<Transfers />} />
        <Route path="operations/adjustments" element={<Adjustments />} />
        <Route path="ledger" element={<MoveHistory />} />
        <Route path="settings/warehouses" element={<Warehouses />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
