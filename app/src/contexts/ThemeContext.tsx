/**
 * ELI5: Remembers light vs dark look and flips the page's "dark" class.
 * What: ThemeProvider + useTheme (switching/localStorage only when `switchable`).
 * Owns: theme state.
 * Depends on: constants.ts.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { THEME_STORAGE_KEY } from "@/lib/constants";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (() => void) | undefined;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = switchable ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    return stored === "dark" || stored === "light" ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (switchable) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme((current) => (current === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
