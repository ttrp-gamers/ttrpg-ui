import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        email: regEmail,
        username: regUsername,
        password: regPassword
      });
    }catch(err: any){
      console.error("Registration failed:", err);
      setRegError("Registration failed. Email or username might already be taken.");
    }
  }
  const handleLogin = async () => {
    setLogError(""); 
    try{
      await login ({
        email: logEmail,
        password: logPassword
      });
      navigate("/overview");
    }catch(err: any){
      console.error("Login failed:", err);
      setRegError("Login failed. Email or password might be wrong.");
    }
  }
  return (
    <>
      <div className="container-fluid login_form text-center">
        <input className="form-control" placeholder="email"  value={logEmail} onChange={(e) => setLogEmail(e.target.value)}/>
        <input className="form-control" placeholder="password" value={logPassword} onChange={(e) => setLogPassword(e.target.value)}/>
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
        <input className="form-control" placeholder="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}/>
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
