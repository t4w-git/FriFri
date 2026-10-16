import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { apiPost } from "@/lib/api";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { checkAppState } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri");
      return;
    }

    setLoading(true);

    try {
      const data = await apiPost('/api/v1/auth/register', { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Wait for auth state to update before navigating
      await checkAppState();
      navigate('/admin');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FriFri Admin</h1>
          <p className="text-[#AAA]">Crea un nuovo account</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block font-sans text-sm font-semibold text-[#333] mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-[#E8DFD0] rounded-lg font-sans text-sm outline-none focus:border-[#C4956A] bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-[#333] mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-[#E8DFD0] rounded-lg font-sans text-sm outline-none focus:border-[#C4956A] bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="font-sans text-xs text-[#999] mt-1">Minimo 8 caratteri</p>
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-[#333] mb-2">Conferma Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-[#E8DFD0] rounded-lg font-sans text-sm outline-none focus:border-[#C4956A] bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C4956A] text-white py-2.5 rounded-lg font-sans font-semibold text-sm hover:bg-[#B8845A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Registrazione in corso..." : "Registrati"}
          </button>

          <div className="text-center">
            <p className="font-sans text-sm text-[#666]">
              Hai già un account?{" "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#C4956A] font-semibold hover:underline"
              >
                Accedi
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
