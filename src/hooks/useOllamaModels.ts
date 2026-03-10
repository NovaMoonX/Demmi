import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setSelectedModel } from '@store/slices/chatsSlice';
import { listLocalModels } from '@lib/ollama';

export function useOllamaModels() {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state) => state.chats.selectedModel);
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchModels() {
      setIsLoading(true);
      setError(null);
      try {
        const models = await listLocalModels();
        if (!cancelled) {
          setAvailableModels(models);
          if (models.length > 0 && !selectedModelRef.current) {
            dispatch(setSelectedModel(models[0]));
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Could not connect to Ollama. Make sure it is running on localhost:11434.';
          setError(message);
          setAvailableModels([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchModels();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const selectModel = (model: string) => {
    dispatch(setSelectedModel(model));
  };

  return { availableModels, selectedModel, isLoading, error, selectModel };
}
