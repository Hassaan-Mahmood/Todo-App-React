import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import {
    errorAlert,
    infoAlert,
    successAlert,
    warningAlert,
} from "../utils/alert";

function Login() {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const emailRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({ email: false, password: false });

    const validEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();
        const badEmail = !validEmail(email);
        const badPassword = password.length === 0;

        setErrors({ email: badEmail, password: badPassword });

        if (badEmail || badPassword) {
            errorAlert(
                "Oops! Check your details",
                badEmail
                    ? "Please enter a valid email address."
                    : "Please enter your password.",
                isDark,
            );
            return;
        }

        setSubmitting(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        setSubmitting(false);

        if (error) {
            errorAlert("Login failed", error.message, isDark);
            return;
        }

        const fullName = data.user?.user_metadata?.full_name || "back";

        successAlert(
            `Welcome ${fullName}!`,
            "Login successful. Loading your todos…",
            1500,
            isDark,
        ).then(() => {
            navigate("/todos");
        });
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!validEmail(email)) {
            warningAlert(
                "Enter your email first",
                "Type a valid email above, then tap Forgot password again.",
                isDark,
            );
            emailRef.current?.focus();
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim(),
        );
        if (error) {
            errorAlert("Could not send reset email", error.message, isDark);
            return;
        }

        infoAlert(
            "Reset link sent!",
            `We sent a password reset link to ${email.trim()}.`,
            isDark,
        );
    };

    return (
        <form className="card" onSubmit={handleSubmit} noValidate>
            <h1>Welcome back</h1>
            <p className="sub">Log in to your account to see your todos.</p>

            <div className="field">
                <label htmlFor="login-email">Email</label>
                <input
                    ref={emailRef}
                    type="email"
                    id="login-email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "invalid" : ""}
                />
                <p className={`error ${errors.email ? "show" : ""}`}>
                    Please enter a valid email address.
                </p>
            </div>

            <div className="field">
                <label htmlFor="login-password">Password</label>
                <PasswordInput
                    id="login-password"
                    name="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isInvalid={errors.password}
                />
                <p className={`error ${errors.password ? "show" : ""}`}>
                    Please enter your password.
                </p>
            </div>

            <div className="row-between">
                <label className="check">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                </label>
                <a href="#forgot" onClick={handleForgotPassword}>
                    Forgot password?
                </a>
            </div>

            <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Logging in..." : "Log In"}
            </button>

            <p className="alt-link">
                Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
        </form>
    );
}

export default Login;
