import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Users from "./pages/Users";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Roles from "./pages/Roles";
import ProtectedRoute from "./components/ProtectedRoute";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import PaymentMethods from "./pages/PaymentMethods";
import Transactions from "./pages/Transactions";
import TransactionHistory from "./pages/TransactionHistory";

export default function App() {
  return (
    <Routes>
      {/* Halaman login */}
      <Route path="/" element={<Login />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/sales" element={<Transactions />} />
          <Route path="/history" element={<TransactionHistory />} />

          {/* Tambahkan route lain yang butuh login */}
        </Route>
      </Route>
    </Routes>
  );
}
