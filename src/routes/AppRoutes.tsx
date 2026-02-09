import { createBrowserRouter } from 'react-router-dom';

import Chat from '@screens/Chat';
import Ingredients from '@screens/Ingredients';
import Meals from '@screens/Meals';
import MealDetail from '@screens/MealDetail';
import CalendarScreen from '@screens/CalendarScreen';
import Account from '@screens/Account';
import Layout from '@ui/Layout';
import Loading from '@ui/Loading';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Chat />,
      },
      {
        path: 'ingredients',
        element: <Ingredients />,
      },
      {
        path: 'meals',
        element: <Meals />,
      },
      {
        path: 'meals/:id',
        element: <MealDetail />,
      },
      {
        path: 'calendar',
        element: <CalendarScreen />,
      },
      {
        path: 'account',
        element: <Account />,
      },
      // About page (lazy loaded)
      {
        path: 'about',
        HydrateFallback: Loading,
        lazy: async () => {
          const { default: About } = await import('@screens/About');
          return { Component: About };
        },
      },
    ],
  },
]);
