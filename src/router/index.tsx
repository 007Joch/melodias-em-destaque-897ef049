import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy loading dos componentes para melhor performance
const HomePage = lazy(() => import('../components/HomePage'));
const ManageVerses = lazy(() => import('../pages/ManageVerses'));
const CreateVerse = lazy(() => import('../pages/CreateVerse'));
const EditVerse = lazy(() => import('../pages/EditVerse'));
const VerseDetails = lazy(() => import('../pages/VerseDetails'));
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
    element: <Layout><Outlet /></Layout>,
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
        path: 'manage',
        element: (
          <SuspenseWrapper>
            <ManageVerses />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'create',
        element: (
          <SuspenseWrapper>
            <CreateVerse />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'edit-verse/:id',
        element: (
          <SuspenseWrapper>
            <EditVerse />
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
        path: ':slug',
        element: (
          <SuspenseWrapper>
            <VerseDetails />
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