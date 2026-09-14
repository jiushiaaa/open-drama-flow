// The canvas island follows the workbench's light theme, without a second persisted store.
export function useThemeStore<T>(select: (state: { theme: 'light' }) => T): T {
  return select({ theme: 'light' });
}
