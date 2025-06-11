import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Layout } from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy loading dos componentes para melhor performance
const HomePage = lazy(() => import('../components/HomePage'));
const Login = lazy(() => import('../pages/Login'));
const ManageVerses = lazy(() => import('../pages/ManageVerses'));
const ManageUsers = lazy(() => import('../pages/ManageUsers'));
const CreateVerse = lazy(() => import('../pages/CreateVerse'));
const EditVerse = lazy(() => import('../pages/EditVerse'));
const VerseDetails = lazy(() => import('../pages/VerseDetails'));
const PrePurchase = lazy(() => import('../pages/PrePurchase'));
const MyOrders = lazy(() => import('../pages/MyOrders'));
const NotFound = lazy(() => import('../pages/NotFound'));
const MusicGrid = lazy(() => import('../components/MusicGrid'));

// Wrapper para Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <HomePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'manage-verses',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper>
              <ManageVerses />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'manage-users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper>
              <ManageUsers />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'create',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper>
              <CreateVerse />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'edit-verse/:id',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SuspenseWrapper>
              <EditVerse />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <Login />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'music',
        element: (
          <SuspenseWrapper>
            <MusicGrid />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'pre-purchase/:id',
        element: (
          <SuspenseWrapper>
            <PrePurchase />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'meus-pedidos',
        element: (
          <ProtectedRoute requireAuth={true}>
            <SuspenseWrapper>
              <MyOrders />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'verse/:id',
        element: (
          <SuspenseWrapper>
            <VerseDetails />
          </SuspenseWrapper>
        ),
      },
      {
        path: ':slug',
        element: (
          <SuspenseWrapper>
            <VerseDetails />
          </SuspenseWrapper>
        ),
      },
      {
        path: '*',
        element: (
          <SuspenseWrapper>
            <NotFound />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;