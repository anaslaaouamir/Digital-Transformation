import { useState } from "react";
import { loginApi } from "@/api/auth.api";
import { useAuth } from "@/auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await loginApi({
      email,
      motDePasse: password
    });

    login(res.data.token);
    navigate("/");
  };

  return (
    <div>
      <input onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <input onChange={(e) => setPassword(e.target.value)} type="password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
