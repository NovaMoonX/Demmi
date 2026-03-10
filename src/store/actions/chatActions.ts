import { ChatConversation, ChatMessage } from '@lib/chat';
import { db } from '@lib/firebase/firebase.config';
import { generatedId } from '@utils/generatedId';
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  setDoc,
  Transaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { RootState } from '..';

function isDemoActive(getState: () => unknown): boolean {
  const state = getState() as RootState;
  return state.demo.isActive;
}

/**
 * Fetch all chat conversations belonging to the current user from Firestore.
 * No-ops silently when demo mode is active.
 */
export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { getState }) => {
    const state = getState() as RootState;
    try {
      const userId = state.user.user?.uid;
      if (!userId) throw new Error('You must be signed in to fetch chats.');

      const q = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(q);
      const chats: ChatConversation[] = snapshot.docs.map(
        (d: QueryDocumentSnapshot) => d.data() as ChatConversation,
      );
      return chats;
    } catch (err) {
      console.error('Error fetching chats:', err);
      throw err;
    }
  },
  { condition: (_, { getState }) => !isDemoActive(getState) },
);

/**
 * Create a new chat conversation in Firestore for the current user.
 * No-ops silently when demo mode is active.
 */
export const createChat = createAsyncThunk(
  'chats/createChat',
  async (params: Omit<ChatConversation, 'id' | 'userId'>, { getState }) => {
    const state = getState() as RootState
    try {
      const userId = state.user.user?.uid;
      if (!userId) throw new Error('You must be signed in to create a chat.');

      const chatId = generatedId('chat');
      const chatDocRef = doc(db, 'chats', chatId);

      const newChat: ChatConversation = {
        ...params,
        id: chatId,
        userId,
      };

      await setDoc(chatDocRef, newChat);
      return newChat;
    } catch (err) {
      console.error('Error creating chat:', err);
      throw err;
    }
  },
  { condition: (_, { getState }) => !isDemoActive(getState) },
);

/**
 * Update metadata (e.g. title, isPinned, lastUpdated) for a chat conversation.
 * Messages and userId are not written to Firestore via this thunk.
 * No-ops silently when demo mode is active.
 */
export const updateChat = createAsyncThunk(
  'chats/updateChat',
  async (chat: ChatConversation, { getState }) => {
    const state = getState() as RootState;
    try {
      const userId = state.user.user?.uid;
      if (!userId) throw new Error('You must be signed in to update a chat.');

      const chatDocRef = doc(db, 'chats', chat.id);

      await runTransaction(db, async (tx: Transaction) => {
        const chatSnap = await tx.get(chatDocRef);
        if (!chatSnap.exists()) throw new Error('Chat not found.');

        const existing = chatSnap.data() as ChatConversation;
        if (existing.userId !== userId)
          throw new Error('You can only update your own chats.');

        const { id: _id, userId: _userId, messages: _messages, ...updatableFields } = chat;
        tx.update(chatDocRef, updatableFields);
      });

      return chat;
    } catch (err) {
      console.error('Error updating chat:', err);
      throw err;
    }
  },
  { condition: (_, { getState }) => !isDemoActive(getState) },
);

/**
 * Delete a chat conversation from Firestore. Only the owner may delete.
 * No-ops silently when demo mode is active.
 */
export const deleteChat = createAsyncThunk(
  'chats/deleteChat',
  async (chatId: string, { getState }) => {
    const state = getState() as RootState;
    try {
      const userId = state.user.user?.uid;
      if (!userId) throw new Error('You must be signed in to delete a chat.');

      const chatDocRef = doc(db, 'chats', chatId);

      await runTransaction(db, async (tx: Transaction) => {
        const chatSnap = await tx.get(chatDocRef);
        if (!chatSnap.exists()) throw new Error('Chat not found.');

        const chat = chatSnap.data() as ChatConversation;
        if (chat.userId !== userId)
          throw new Error('You can only delete your own chats.');

        tx.delete(chatDocRef);
      });

      return chatId;
    } catch (err) {
      console.error('Error deleting chat:', err);
      throw err;
    }
  },
  { condition: (_, { getState }) => !isDemoActive(getState) },
);

/**
 * Append a message to a chat conversation in Firestore using arrayUnion.
 * No-ops silently when demo mode is active.
 */
export const addChatMessage = createAsyncThunk(
  'chats/addChatMessage',
  async ({ chatId, message }: { chatId: string; message: ChatMessage }) => {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const lastUpdated = Date.now();

      await updateDoc(chatDocRef, {
        messages: arrayUnion(message),
        lastUpdated,
      });

      return { chatId, message, lastUpdated };
    } catch (err) {
      console.error('Error adding chat message:', err);
      throw err;
    }
  },
  { condition: (_, { getState }) => !isDemoActive(getState) },
);

/**
 * Fetch the messages array for a specific chat conversation from Firestore.
 * No-ops silently when demo mode is active.
 */
export const fetchChatMessages = createAsyncThunk(
  'chats/fetchChatMessages',
  async (chatId: string) => {
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);

      if (!chatSnap.exists()) throw new Error('Chat not found.');

      const chat = chatSnap.data() as ChatConversation;
      return { chatId, messages: chat.messages };
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      throw err;
    }
  },
  { condition: (_, { getState }) => !isDemoActive(getState) },
);
