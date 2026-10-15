import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";
import "./Auth.css";

export default function Auth() {
    const navigate = useNavigate();
    const { register, login } = useAuth();

    const [regEmail, setRegEmail] = useState("");
    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regError, setRegError] = useState("");
    const [regLoading, setRegLoading] = useState(false);

    const [logEmail, setLogEmail] = useState("");
    const [logPassword, setLogPassword] = useState("");
    const [logError, setLogError] = useState("");
    const [logLoading, setLogLoading] = useState(false);

    const handleRegister = async () => {
        setRegError("");
        setRegLoading(true);

        try {
            await register({
                email: regEmail,
                username: regUsername,
                password: regPassword
            });

            setRegEmail("");
            setRegUsername("");
            setRegPassword("");
        } catch (err) {
            console.error("Registration failed:", err);
            setRegError(
                "Registration failed. Email or username might already be taken."
            );
        } finally {
            setRegLoading(false);
        }
    };

    const handleLogin = async () => {
        setLogError("");
        setLogLoading(true);

        try {
            await login({
                email: logEmail,
                password: logPassword
            });

            navigate("/overview");
        } catch (err) {
            console.error("Login failed:", err);
            setLogError("Login failed. Email or password might be wrong.");
        } finally {
            setLogLoading(false);
        }
    };

    return (
        <main className="auth-page">

            {/* Login card */}
            <section className="auth-card">
                <header className="auth-heading">
                    <div className="auth-icon" aria-hidden="true">
                        ⚔️
                    </div>

                    <h1 className="auth-title">Welcome Back, Adventurer</h1>

                    <p className="auth-subtitle">
                        Enter your credentials to continue your quest.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                >
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-email">
                            Email
                        </label>

                        <input
                            id="login-email"
                            className="auth-input"
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            value={logEmail}
                            onChange={(e) => setLogEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-password">
                            Password
                        </label>

                        <input
                            id="login-password"
                            className="auth-input"
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            value={logPassword}
                            onChange={(e) => setLogPassword(e.target.value)}
                            required
                        />
                    </div>

                    {logError && (
                        <p
                            className="auth-message auth-message--error"
                            role="alert"
                        >
                            {logError}
                        </p>
                    )}

                    <button
                        className="auth-button"
                        type="submit"
                        disabled={logLoading}
                    >
                        {logLoading ? "Entering..." : "Enter the Realm"}
                    </button>
                </form>

                <footer className="auth-footer">
                    <p>Already have an account? Your quest awaits.</p>
                </footer>
            </section>

            {/* Register card */}
            <section className="auth-card">
                <header className="auth-heading">
                    <div className="auth-icon" aria-hidden="true">
                        🛡️
                    </div>

                    <h2 className="auth-title">Join the Adventure</h2>

                    <p className="auth-subtitle">
                        Create your account and begin your journey.
                    </p>
                </header>

                <form
                    className="auth-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRegister();
                    }}
                >
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="register-username">
                            Username
                        </label>

                        <input
                            id="register-username"
                            className="auth-input"
                            type="text"
                            placeholder="Choose a username"
                            autoComplete="username"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="register-email">
                            Email
                        </label>

                        <input
                            id="register-email"
                            className="auth-input"
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="register-password">
                            Password
                        </label>

                        <input
                            id="register-password"
                            className="auth-input"
                            type="password"
                            placeholder="Create a password"
                            autoComplete="new-password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                        />
                    </div>

                    {regError && (
                        <p
                            className="auth-message auth-message--error"
                            role="alert"
                        >
                            {regError}
                        </p>
                    )}

                    <button
                        className="auth-button"
                        type="submit"
                        disabled={regLoading}
                    >
                        {regLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <footer className="auth-footer">
                    <p>Ready to roll the dice?</p>
                </footer>
            </section>

        </main>
    );
}
