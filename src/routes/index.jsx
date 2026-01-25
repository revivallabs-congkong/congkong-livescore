import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout";
import LoginScreen from "../screens/LoginScreen";
import JudgeInterface from "../screens/JudgeInterface";
import AdminDashboard from "../screens/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LoginScreen />,
      },
      {
        path: "judge",
        element: (
          <ProtectedRoute allowedRole="judge">
            <JudgeInterface />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
