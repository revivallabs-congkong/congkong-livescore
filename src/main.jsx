import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./routes";
import { DataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext";

// We need to wrap with DataProvider outside RouterProvider
// However, AuthProvider needs navigation, so it must be inside Router
// The router structure handles this - see routes/index.jsx

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
