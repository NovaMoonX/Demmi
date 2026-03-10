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

/**
 * Fetch all chat conversations belonging to the current user from Firestore.
 */
export const fetchChats = createAsyncThunk<ChatConversation[], string>(
  'chats/fetchChats',
  async (userId) => {
    try {
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
);

/**
 * Create a new chat conversation in Firestore for the current user.
 */
export const createChat = createAsyncThunk<
  ChatConversation,
  Omit<ChatConversation, 'id' | 'userId'>,
  { state: RootState }
>(
  'chats/createChat',
  async (params, { getState }) => {
    try {
      const userId = getState().user.user?.uid;
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
);

/**
 * Update metadata (e.g. title, isPinned, lastUpdated) for a chat conversation.
 * Messages and userId are not updatable via this thunk.
 */
export const updateChat = createAsyncThunk<
  Pick<ChatConversation, 'id'> &
    Partial<Omit<ChatConversation, 'id' | 'userId' | 'messages'>>,
  Pick<ChatConversation, 'id'> &
    Partial<Omit<ChatConversation, 'id' | 'userId' | 'messages'>>,
  { state: RootState }
>(
  'chats/updateChat',
  async (chat, { getState }) => {
    try {
      const userId = getState().user.user?.uid;
      if (!userId) throw new Error('You must be signed in to update a chat.');

      const chatDocRef = doc(db, 'chats', chat.id);

      await runTransaction(db, async (tx: Transaction) => {
        const chatSnap = await tx.get(chatDocRef);
        if (!chatSnap.exists()) throw new Error('Chat not found.');

        const existing = chatSnap.data() as ChatConversation;
        if (existing.userId !== userId)
          throw new Error('You can only update your own chats.');

        const { id: _id, ...updates } = chat;
        tx.update(chatDocRef, updates);
      });

      return chat;
    } catch (err) {
      console.error('Error updating chat:', err);
      throw err;
    }
  },
);

/**
 * Delete a chat conversation from Firestore. Only the owner may delete.
 */
export const deleteChat = createAsyncThunk<
  string,
  string,
  { state: RootState }
>(
  'chats/deleteChat',
  async (chatId, { getState }) => {
    try {
      const userId = getState().user.user?.uid;
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
);

/**
 * Append a message to a chat conversation in Firestore using arrayUnion.
 */
export const addChatMessage = createAsyncThunk<
  { chatId: string; message: ChatMessage; lastUpdated: number },
  { chatId: string; message: ChatMessage }
>(
  'chats/addChatMessage',
  async ({ chatId, message }) => {
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
);

/**
 * Fetch the messages array for a specific chat conversation from Firestore.
 */
export const fetchChatMessages = createAsyncThunk<
  { chatId: string; messages: ChatMessage[] },
  string
>(
  'chats/fetchChatMessages',
  async (chatId) => {
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
);
