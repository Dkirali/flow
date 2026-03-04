export function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('food') || lower.includes('drink') || lower.includes('coffee') || lower.includes('dining') || lower.includes('grocer')) return '🍔'
  if (lower.includes('transport') || lower.includes('uber') || lower.includes('lyft') || lower.includes('metro') || lower.includes('transit')) return '🚗'
  if (lower.includes('shopping') || lower.includes('retail')) return '🛍️'
  if (lower.includes('entertainment') || lower.includes('movie')) return '🎬'
  if (lower.includes('health') || lower.includes('gym')) return '💊'
  if (lower.includes('rent') || lower.includes('housing') || lower.includes('mortgage')) return '🏠'
  if (lower.includes('salary') || lower.includes('income')) return '💰'
  if (lower.includes('freelance')) return '💻'
  return '💳'
}
