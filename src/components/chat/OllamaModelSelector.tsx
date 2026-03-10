import { Select } from '@moondreamsdev/dreamer-ui/components';

interface OllamaModelSelectorProps {
  models: string[];
  selectedModel: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectModel: (model: string) => void;
}

export function OllamaModelSelector({
  models,
  selectedModel,
  isLoading,
  error,
  onSelectModel,
}: OllamaModelSelectorProps) {
  if (isLoading) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Connecting to Ollama…
      </span>
    );
  }

  if (error) {
    return (
      <span className="text-xs text-destructive" title={error}>
        ⚠️ Ollama offline
      </span>
    );
  }

  if (models.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        No models found
      </span>
    );
  }

  const modelOptions = models.map((model) => ({ value: model, text: model }));

  return (
    <Select
      options={modelOptions}
      value={selectedModel ?? ''}
      onChange={onSelectModel}
      placeholder="Select a model"
      className="text-xs w-48"
    />
  );
}
