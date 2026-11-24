import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ThemeSwitch from "./components/ThemeSwitch";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Todo from "./pages/Todo";

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <main className="wrap">
                    <ThemeSwitch />
                    <Routes>
                        <Route
                            path="/"
                            element={<Navigate to="/login" replace />}
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/todos" element={<Todo />} />
                        <Route
                            path="*"
                            element={<Navigate to="/login" replace />}
                        />
                    </Routes>
                </main>
            </BrowserRouter>
        </ThemeProvider>
    );
}
