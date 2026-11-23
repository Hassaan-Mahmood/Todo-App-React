import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { errorAlert, successAlert } from "../utils/alert";

export default function Signup() {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({
        name: false,
        email: false,
        password: false,
        confirm: false,
    });

    const validEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();
        const badName = name.trim().length === 0;
        const badEmail = !validEmail(email);
        const badPw = password.length < 6;
        const badConfirm = confirm !== password || confirm.length === 0;

        setErrors({
            name: badName,
            email: badEmail,
            password: badPw,
            confirm: badConfirm,
        });

        if (badName || badEmail || badPw || badConfirm) {
            const msg = badName
                ? "Please enter your full name."
                : badEmail
                  ? "Please enter a valid email address."
                  : badPw
                    ? "Password must be at least 6 characters."
                    : "Passwords do not match. Please check the confirm password field.";

            errorAlert("Please fix a few things", msg, isDark);
            return;
        }

        setSubmitting(true);
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { full_name: name.trim() },
            },
        });

        if (error) {
            setSubmitting(false);
            errorAlert("Signup failed", error.message, isDark);
            return;
        }

        // Sign out so the user logs in manually on the login page as requested
        await supabase.auth.signOut();
        setSubmitting(false);

        successAlert(
            "Account created!",
            "Please log in with your new credentials.",
            1800,
            isDark,
        ).then(() => {
            navigate("/login");
        });
    };

    return (
        <form className="card" onSubmit={handleSubmit} noValidate>
            <h1>Create account</h1>
            <p className="sub">Sign up to start keeping your own todo list.</p>

            <div className="field">
                <label htmlFor="signup-name">Full name</label>
                <input
                    type="text"
                    id="signup-name"
                    name="name"
                    placeholder="Your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? "invalid" : ""}
                />
                <p className={`error ${errors.name ? "show" : ""}`}>
                    Please enter your name.
                </p>
            </div>

            <div className="field">
                <label htmlFor="signup-email">Email</label>
                <input
                    type="email"
                    id="signup-email"
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
                <label htmlFor="signup-password">Password</label>
                <PasswordInput
                    id="signup-password"
                    name="password"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isInvalid={errors.password}
                />
                <p className="hint">Use at least 6 characters.</p>
                <p className={`error ${errors.password ? "show" : ""}`}>
                    Password must be at least 6 characters.
                </p>
            </div>

            <div className="field">
                <label htmlFor="signup-confirm">Confirm password</label>
                <PasswordInput
                    id="signup-confirm"
                    name="confirm"
                    placeholder="Type the password again"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    isInvalid={errors.confirm}
                />
                <p className={`error ${errors.confirm ? "show" : ""}`}>
                    Passwords do not match.
                </p>
            </div>

            <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Creating account..." : "Sign Up"}
            </button>

            <p className="alt-link">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </form>
    );
}
