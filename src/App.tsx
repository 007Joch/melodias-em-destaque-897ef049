
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy loading dos componentes
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ManageVerses = lazy(() => import("./pages/ManageVerses"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const CreateVerse = lazy(() => import("./pages/CreateVerse"));
const EditVerse = lazy(() => import("./pages/EditVerse"));
const VerseDetails = lazy(() => import("./pages/VerseDetails"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const PreVerse = lazy(() => import("./pages/PreVerse"));
const VerseAccessGuard = lazy(() => import("./components/VerseAccessGuard"));
const CheckoutAddress = lazy(() => import("./pages/CheckoutAddress"));
const CheckoutPayment = lazy(() => import("./pages/CheckoutPayment"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Contact = lazy(() => import('./pages/Contact'));
const Obrigado = lazy(() => import('./pages/Obrigado'));
const FAQ = lazy(() => import('./pages/FAQ'));
const SongsByTitle = lazy(() => import('./pages/SongsByTitle'));
const SongsByMusical = lazy(() => import('./pages/SongsByMusical'));
const SongsByVocalClassification = lazy(() => import('./pages/SongsByVocalClassification'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import('./pages/Settings'));
const UserHistory = lazy(() => import("./pages/UserHistory"));

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
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/meus-pedidos" element={<MyOrders />} />
                <Route path="/manage-verses" element={<ManageVerses />} />
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="/create-verse" element={<CreateVerse />} />
                <Route path="/edit-verse/:id" element={<EditVerse />} />
                <Route path="/preview/:id" element={<PreVerse />} />
                <Route path="/verse/:id" element={<VerseAccessGuard><VerseDetails /></VerseAccessGuard>} />
                 <Route path="/checkout/address" element={<CheckoutAddress />} />
                <Route path="/checkout/payment" element={<CheckoutPayment />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                 <Route path="/contato" element={<Contact />} />
                 <Route path="/obrigado" element={<Obrigado />} />
                 <Route path="/perguntas-frequentes" element={<FAQ />} />
                 <Route path="/cancoes-por-titulo" element={<SongsByTitle />} />
                 <Route path="/cancoes-por-musical" element={<SongsByMusical />} />
                 <Route path="/cancoes-por-classificacao-vocal" element={<SongsByVocalClassification />} />
                 <Route path="/termos-de-uso" element={<TermsOfUse />} />
                 <Route path="/busca" element={<SearchResults />} />
                <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                <Route path="/historico/:userId" element={<UserHistory />} />
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
