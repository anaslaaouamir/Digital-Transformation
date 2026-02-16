import { useState } from "react";
import { loginApi } from "@/api/auth.api";
import { useAuth } from "@/auth/auth.context"; // Use the file we just created above
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { saveAuth } = useAuth(); 
  const navigate = useNavigate();

  // UPDATE: Add 'e' parameter to prevent page reload
const handleLogin = async (e: any) => {
  // 1. STOP THE PAGE FROM RELOADING
  e.preventDefault(); 
  
  console.log("=== DEBUG STEP 1: Starting Login Process ===");
  console.log("Target URL:", "http://localhost:8080/api/auth/login");
  console.log("Payload:", { email, motDePasse: password });

  try {
      // 2. ATTEMPT THE CALL
      console.log("=== DEBUG STEP 2: Calling API... ===");
      const res = await loginApi({
          email: email,
          motDePasse: password
      });

      // 3. IF WE GET HERE, BACKEND RESPONDED
      console.log("=== DEBUG STEP 3: API Responded! ===", res);

      if (res.data && res.data.token) {
          console.log("=== DEBUG STEP 4: Token found! Saving... ===");
          saveAuth(res.data.token);
          console.log("=== DEBUG STEP 5: Navigating to Home ===");
          navigate("/");
      } else {
          console.error("=== ERROR: Backend responded but NO TOKEN in data ===", res.data);
          alert("Backend connected, but no token received!");
      }

  } catch (error: any) {
      // 4. IF WE GET HERE, THE REQUEST FAILED (Network or Password)
      console.error("=== CRITICAL FAILURE ===");
      
      if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx (e.g. 401, 403, 500)
          console.error("Server Error Status:", error.response.status);
          console.error("Server Error Data:", error.response.data);
          alert(`Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
          // The request was made but no response was received
          console.error("No Response Received! Is the Backend running?");
          console.error("Request details:", error.request);
          alert("Network Error! The frontend cannot reach http://localhost:8080. Check if Spring Boot is running.");
      } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error setting up request:", error.message);
          alert("Request Setup Error: " + error.message);
      }
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
         <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
         
         <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700">Email</label>
             <input 
                className="mt-1 block w-full border border-gray-300 p-2 rounded"
                onChange={(e) => setEmail(e.target.value)} 
                value={email}
                placeholder="admin@example.com" 
             />
         </div>

         <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700">Password</label>
             <input 
                className="mt-1 block w-full border border-gray-300 p-2 rounded"
                onChange={(e) => setPassword(e.target.value)} 
                value={password}
                type="password" 
                placeholder="******"
             />
         </div>

         <button 
    className="..."
    onClick={(e) => handleLogin(e)} // <--- CRITICAL CHANGE
>
    Sign In
</button>
      </div>
    </div>
  );
}