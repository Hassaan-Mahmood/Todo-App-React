import { createContext, useContext, useEffect, useState } from "react";
import { toastAlert } from "../utils/alert";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("app-theme");
        if (saved === "light" || saved === "dark") return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem("app-theme", theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e) => {
            if (!localStorage.getItem("app-theme")) {
                setTheme(e.matches ? "dark" : "light");
            }
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const changeTheme = (nextTheme) => {
        if (nextTheme !== theme) {
            setTheme(nextTheme);
            toastAlert(
                "success",
                nextTheme === "dark" ? "Dark theme on" : "Light theme on",
                nextTheme === "dark",
            );
        }
    };

    return (
        <ThemeContext.Provider
            value={{ theme, isDark: theme === "dark", changeTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
