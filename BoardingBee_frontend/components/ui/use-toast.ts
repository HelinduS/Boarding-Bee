// Stub for toast notification
// Replace with your actual toast implementation
export function toast({ title, description, variant }: { title: string, description: string, variant?: string }) {
  alert(`${title}\n${description}`);
}
