import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DataPrefetcher } from "@/components/DataPrefetcher";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

const Index = lazy(() => import("./pages/Index"));
const Items = lazy(() => import("./pages/Items"));
const ItemDetail = lazy(() => import("./pages/ItemDetail"));
const TransferStock = lazy(() => import("./pages/TransferStock"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetail = lazy(() => import("./pages/SupplierDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const Locations = lazy(() => import("./pages/Locations"));
const LocationDetail = lazy(() => import("./pages/LocationDetail"));
const Sales = lazy(() => import("./pages/Sales"));
const SaleDetail = lazy(() => import("./pages/SaleDetail"));
const Receipts = lazy(() => import("./pages/Receipts"));
const ReceiptDetail = lazy(() => import("./pages/ReceiptDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function AppRoutes() {
  return (
    <>
      <DataPrefetcher />
      <Suspense fallback={<PageLoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Protected><Index /></Protected>} />
          <Route path="/items" element={<Protected><Items /></Protected>} />
          <Route path="/items/transfer" element={<Protected><TransferStock /></Protected>} />
          <Route path="/items/:id" element={<Protected><ItemDetail /></Protected>} />
          <Route path="/suppliers" element={<Protected><Suppliers /></Protected>} />
          <Route path="/suppliers/:id" element={<Protected><SupplierDetail /></Protected>} />
          <Route path="/categories" element={<Protected><Categories /></Protected>} />
          <Route path="/categories/:id" element={<Protected><CategoryDetail /></Protected>} />
          <Route path="/locations" element={<Protected><Locations /></Protected>} />
          <Route path="/locations/:id" element={<Protected><LocationDetail /></Protected>} />
          <Route path="/sales" element={<Protected><Sales /></Protected>} />
          <Route path="/sales/:id" element={<Protected><SaleDetail /></Protected>} />
          <Route path="/receipts" element={<Protected><Receipts /></Protected>} />
          <Route path="/receipts/:id" element={<Protected><ReceiptDetail /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
