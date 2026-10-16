import { useState } from "react";
import { apiPost } from "@/lib/api";
import { Mail, Check } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await apiPost('/api/v1/newsletter/subscribe', { email });
      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      setStatus("error");
    }
  };

  return (
    <section className="py-24 px-4 bg-[#1C1C1C]">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-[#C4956A]/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-5 h-5 text-[#C4956A]" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ricevi una poesia ogni settimana
        </h2>
        <p className="font-sans text-[#AAA] mb-10 leading-relaxed">
          Un verso nel tuo inbox ogni lunedì mattina.<br />
          Gratuito. Bello. Toscano.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-3 text-[#C4956A]">
            <Check className="w-5 h-5" />
            <p className="font-sans text-base">Perfetto! Ti abbiamo iscritto con successo.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="La tua email..."
              className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 font-sans text-sm outline-none focus:border-[#C4956A] transition-colors"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-7 py-3.5 rounded-full bg-[#C4956A] text-white font-sans font-semibold text-sm hover:bg-[#B8845A] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "Iscriviti"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}