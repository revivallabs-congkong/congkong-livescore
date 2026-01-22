import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppContext } from "../context";
import { DICTIONARY } from "../data";
import { DataProvider } from "../context/DataContext";
import { AuthProvider } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function RootLayout() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("ko");

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
