import { createSlice, createAsyncThunk, Dispatch } from '@reduxjs/toolkit';
import { addPlannedMeal, resetCalendar } from './calendarSlice';
import { setConversations, resetChats } from './chatsSlice';
import { setMeals, resetMeals } from './mealsSlice';
import { setIngredients, resetIngredients } from './ingredientsSlice';
import { generateDemoCalendarData } from '@lib/calendar';
import { mockChatConversations } from '@lib/chat';
import { mockMeals } from '@lib/meals';
import { mockIngredients } from '@lib/ingredients';

interface DemoState {
  isActive: boolean;
}

const initialState: DemoState = {
  isActive: false,
};

export const loadDemoData = createAsyncThunk<void, void, { dispatch: Dispatch }>(
  'demo/loadDemoData',
  async (_, { dispatch }) => {
    dispatch(setConversations(mockChatConversations));
    dispatch(setMeals(mockMeals));
    dispatch(setIngredients(
      mockIngredients.map((ing) => ({ ...ing, otherUnit: null, defaultProductId: null }))
    ));
    dispatch(resetCalendar());
    const calendarData = generateDemoCalendarData();
    calendarData.forEach((plannedMeal) => {
      dispatch(addPlannedMeal(plannedMeal));
    });
  }
);

export const clearDemoData = createAsyncThunk<void, void, { dispatch: Dispatch }>(
  'demo/clearDemoData',
  async (_, { dispatch }) => {
    dispatch(resetChats());
    dispatch(resetMeals());
    dispatch(resetIngredients());
    dispatch(resetCalendar());
  }
);

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    enableDemo: (state) => {
      state.isActive = true;
    },
    disableDemo: (state) => {
      state.isActive = false;
    },
  },
});

export const { enableDemo, disableDemo } = demoSlice.actions;

export default demoSlice.reducer;
