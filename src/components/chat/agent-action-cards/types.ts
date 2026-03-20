import { AgentAction } from '@/lib/ollama/action-types';

export interface AgentActionCardProps {
  action: AgentAction;
  onConfirmIntent: () => void;
  onRejectIntent: () => void;
  onApprove: () => void;
  onReject: () => void;
  showShoppingListPrompt?: boolean;
  onAddToShoppingList?: (add: boolean) => void;
}