import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from '../components/ProtectedRoute';
import VerseAccessGuard from '../components/VerseAccessGuard';

// Lazy loading dos componentes para melhor performance
const HomePage = lazy(() => import('../components/HomePage'));
const Login = lazy(() => import('../pages/Login'));
const ManageVerses = lazy(() => import('../pages/ManageVerses'));
const ManageUsers = lazy(() => import('../pages/ManageUsers'));
const CreateVerse = lazy(() => import('../pages/CreateVerse'));
const EditVerse = lazy(() => import('../pages/EditVerse'));
const VerseDetails = lazy(() => import('../pages/VerseDetails'));
const MusicGrid = lazy(() => import('../components/MusicGrid'));
const MyOrders = lazy(() => import('../pages/MyOrders'));
const PreVerse = lazy(() => import('../pages/PreVerse'));

const Contact = lazy(() => import('../pages/Contact'));
const SongsByTitle = lazy(() => import('../pages/SongsByTitle'));
// const Teste = lazy(() => import('../pages/Teste'));

const NotFound = lazy(() => import('../pages/NotFound'));

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
      // ROTAS ESPECÍFICAS PRIMEIRO (mais específicas)
      {
        path: 'meus-pedidos',
        element: (
          <ProtectedRoute>
            <SuspenseWrapper>
              <MyOrders />
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
        path: 'contato',
        element: (
          <SuspenseWrapper>
            <Contact />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'cancoes-por-titulo',
        element: (
          <SuspenseWrapper>
            <SongsByTitle />
          </SuspenseWrapper>
        ),
      },
      // {
      //   path: 'teste',
      //   element: (
      //     <SuspenseWrapper>
      //       <Teste />
      //     </SuspenseWrapper>
      //   ),
      // },

      {
        path: 'music',
        element: (
          <SuspenseWrapper>
            <MusicGrid />
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
      // ROTAS DE VERSOS
      {
        path: 'preview/:id',
        element: (
          <SuspenseWrapper>
            <PreVerse />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'verse/:id',
        element: (
          <VerseAccessGuard>
            <SuspenseWrapper>
              <VerseDetails />
            </SuspenseWrapper>
          </VerseAccessGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;