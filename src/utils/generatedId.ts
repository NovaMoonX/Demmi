export function generatedId(prefix = 'id'): string {
  const result = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return result;
}
