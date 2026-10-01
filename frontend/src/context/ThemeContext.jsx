import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app_theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "amoled") {
      root.classList.add("dark");
      root.classList.add("amoled");
    } else if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("amoled");
    } else {
      root.classList.remove("dark");
      root.classList.remove("amoled");
    }
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "amoled";
      return "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
