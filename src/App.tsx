import { DreamerUIProvider } from '@moondreamsdev/dreamer-ui/providers';
import { ErrorBoundary } from '@moondreamsdev/dreamer-ui/components';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@routes/AppRoutes';
import { AuthProvider } from '@contexts/AuthContext';
import { store } from '@store/index';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <DreamerUIProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </DreamerUIProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
