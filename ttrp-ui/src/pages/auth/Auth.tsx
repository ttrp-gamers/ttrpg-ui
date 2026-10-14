import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";

export default function Auth() {
  let navigate = useNavigate();
  const {register, login} = useAuth();

  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");

  const [logEmail, setLogEmail] = useState("");
  const [logPassword, setLogPassword] = useState("");
  const [logError, setLogError] = useState("");

  const handleRegister = async () => {
    setRegError(""); 
    try{
      await register({
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword
      });
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setRegError("That email or username is already in use.");
      } else {
        setRegError("Registration failed. Please try again.");
      }
    }
  }
  const handleLogin = async () => {
    setLogError(""); 
    try{
      await login ({
        email: logEmail.trim(),
        password: logPassword
      });
      navigate("/overview");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setLogError("Invalid email or password. Use the email from registration.");
      } else {
        setLogError("Login failed. Please try again.");
      }
    }
  }
  return (
    <>
      <div className="container-fluid login_form text-center">
        <input className="form-control" placeholder="email (not username)"  value={logEmail} onChange={(e) => setLogEmail(e.target.value)}/>
        <input className="form-control" type="password" placeholder="password" value={logPassword} onChange={(e) => setLogPassword(e.target.value)}/>
        {logError && <div className="text-danger">{logError}</div>}
        <button
          className="btn btn-primary counter"
          type="button"
           onClick={handleLogin}
        >
          Login
        </button>
      </div>
      <div className="container-fluid login_form text-center">
        <input className="form-control" placeholder="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}/>
        <input className="form-control" placeholder="username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)}/>
        <input className="form-control" type="password" placeholder="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}/>
        {regError && <div className="text-danger">{regError}</div>}
        <button
          className="btn btn-primary counter"
          type="button"
          onClick={handleRegister}
        >
          Register
        </button>
      </div>
    </>
  );
}
