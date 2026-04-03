import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import Locations from "./pages/Locations";
import Sales from "./pages/Sales";
import SaleDetail from "./pages/SaleDetail";
import Receipts from "./pages/Receipts";
import ReceiptDetail from "./pages/ReceiptDetail";
import Settings from "./pages/Settings";
import Log from "./pages/Log";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Protected><Index /></Protected>} />
      <Route path="/items" element={<Protected><Items /></Protected>} />
      <Route path="/items/:id" element={<Protected><ItemDetail /></Protected>} />
      <Route path="/suppliers" element={<Protected><Suppliers /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/locations" element={<Protected><Locations /></Protected>} />
      <Route path="/sales" element={<Protected><Sales /></Protected>} />
      <Route path="/sales/:id" element={<Protected><SaleDetail /></Protected>} />
      <Route path="/receipts" element={<Protected><Receipts /></Protected>} />
      <Route path="/receipts/:id" element={<Protected><ReceiptDetail /></Protected>} />
      <Route path="/log" element={<Protected><Log /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
