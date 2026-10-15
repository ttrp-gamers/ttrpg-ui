import { useEffect, useState } from "react";
import "./Profile.css";
import { getProfile, updateProfile } from "../../services/Api";

const errorText = (err) => err.response?.data?.message || err.message;

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        username: "", avatarUrl: "", bio: "", currentPassword: "", newPassword: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        getProfile()
            .then((p) => {
                setProfile(p);
                setForm((f) => ({
                    ...f,
                    username: p.username,
                    avatarUrl: p.avatarUrl ?? "",
                    bio: p.bio ?? "",
                }));
            })
            .catch((err) => setError(errorText(err)));
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function handleSave(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        const body = { username: form.username, avatarUrl: form.avatarUrl, bio: form.bio };
        if (form.newPassword) {
            body.currentPassword = form.currentPassword;
            body.newPassword = form.newPassword;
        }

        try {
            const updated = await updateProfile(body);
            if (form.newPassword) {
                // the backend revokes all sessions after a password change
                localStorage.clear();
                window.location.href = "/";
                return;
            }
            setProfile(updated);
            setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
            setMessage("Profile saved");
        } catch (err) {
            setError(errorText(err));
        }
    }

    if (!profile) return <p className="profile-page">{error || "Loading..."}</p>;

    return (
        <div className="profile-page">
            <h1 className="profile-title">My profile</h1>

            <div className="profile-header">
                {profile.avatarUrl && (
                    <img className="profile-avatar" src={profile.avatarUrl} alt="avatar" />
                )}
                <p className="profile-email">{profile.email}</p>
            </div>

            <form className="profile-form" onSubmit={handleSave}>
                <input name="username" placeholder="Username" value={form.username}
                       onChange={handleChange} minLength={3} maxLength={30} />
                <input name="avatarUrl" placeholder="Avatar URL" value={form.avatarUrl}
                       onChange={handleChange} maxLength={500} />
                <textarea name="bio" placeholder="Bio" value={form.bio}
                          onChange={handleChange} maxLength={500} />

                <h2 className="profile-section-title">Change password (optional)</h2>
                <input name="currentPassword" type="password" placeholder="Current password"
                       value={form.currentPassword} onChange={handleChange} />
                <input name="newPassword" type="password" placeholder="New password (min 6)"
                       value={form.newPassword} onChange={handleChange} minLength={6} />

                {message && <p className="profile-message profile-message--success">{message}</p>}
                {error && <p className="profile-message profile-message--error">{error}</p>}
                <button className="profile-button" type="submit">Save</button>
            </form>
        </div>
    );
}

