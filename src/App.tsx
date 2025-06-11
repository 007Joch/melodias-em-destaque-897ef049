
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy loading dos componentes
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const ManageVerses = lazy(() => import("./pages/ManageVerses"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const CreateVerse = lazy(() => import("./pages/CreateVerse"));
const EditVerse = lazy(() => import("./pages/EditVerse"));
const VerseDetails = lazy(() => import("./pages/VerseDetails"));
const CheckoutAddress = lazy(() => import("./pages/CheckoutAddress"));
const CheckoutPayment = lazy(() => import("./pages/CheckoutPayment"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      retry: 1,
      networkMode: 'always',
      enabled: true,
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'always',
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/manage-verses" element={<ManageVerses />} />
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="/create-verse" element={<CreateVerse />} />
                <Route path="/edit-verse/:id" element={<EditVerse />} />
                <Route path="/verse/:id" element={<VerseDetails />} />
                <Route path="/checkout/address" element={<CheckoutAddress />} />
                <Route path="/checkout/payment" element={<CheckoutPayment />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/:slug" element={<VerseDetails />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
