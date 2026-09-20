import { useNavigate } from "react-router-dom";

export default function Auth() {
  let navigate = useNavigate();
  return (
    <>
      <div className="container-fluid login_form text-center">
        <input className="form-control" placeholder="username" />
        <button
          className="btn btn-primary counter"
          type="button"
          onClick={() => navigate("/overview")}
        >
          Login
        </button>
      </div>
      <div className="container-fluid login_form text-center">
        <input className="form-control" placeholder="username" />
        <button
          className="btn btn-primary counter"
          type="button"
          onClick={() => navigate("/overview")}
        >
          Register
        </button>
      </div>
    </>
  );
}
