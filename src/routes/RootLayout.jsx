import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppContext } from "../context";
import { DICTIONARY } from "../data";
import { DataProvider } from "../context/DataContext";
import { AuthProvider } from "../context/AuthContext";
import Footer from "../components/Footer";

const LANG_STORAGE_KEY = "livescore_lang";
const VALID_LANGS = ["ko", "en"];

export default function RootLayout() {
  const [theme, setTheme] = useState("light");
  // Initialize language from localStorage or default to "ko"
  const [lang, setLangState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      // Validate stored value is a valid language
      if (stored && VALID_LANGS.includes(stored)) {
        return stored;
      }
    }
    return "ko";
  });

  // Persist language to localStorage when it changes
  // Handle both function and value arguments like React setState
  const setLang = (newLangOrFn) => {
    setLangState((prevLang) => {
      const newLang =
        typeof newLangOrFn === "function" ? newLangOrFn(prevLang) : newLangOrFn;
      if (typeof window !== "undefined" && VALID_LANGS.includes(newLang)) {
        localStorage.setItem(LANG_STORAGE_KEY, newLang);
      }
      return newLang;
    });
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <DataProvider>
      <AuthProvider>
        <AppContext.Provider
          value={{
            theme,
            toggleTheme,
            lang,
            setLang,
            t: DICTIONARY[lang],
          }}
        >
          <div
            className={`min-h-screen flex flex-col ${
              theme === "dark" ? "dark" : ""
            }`}
          >
            <div className="grow">
              <Outlet />
            </div>
            <Footer />
          </div>
        </AppContext.Provider>
      </AuthProvider>
    </DataProvider>
  );
}
