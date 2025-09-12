import { ThemeProvider as CustomThemeProvider } from '@/hooks/use-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <CustomThemeProvider>{children}</CustomThemeProvider>;
}
