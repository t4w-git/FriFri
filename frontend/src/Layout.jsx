import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, Feather } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { label: "Poesie", page: "Poesie" },
    { label: "Giochi", page: "Giochi" },
    { label: "Sponsor", page: "Sponsors" },
    { label: "Regolamento", page: "Regolamento" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1C1C1C]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
        body { font-family: 'Playfair Display', serif; background: #FDFCF8; }
        .font-sans { font-family: 'Inter', sans-serif !important; }
        .font-mono { font-family: 'Courier New', monospace !important; }
      `}</style>

      <nav className="border-b border-[#E8DFD0] bg-[#FDFCF8]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <Feather className="w-5 h-5 text-[#C4956A]" />
            <span className="text-xl font-bold tracking-tight">
              frifri<span className="text-[#C4956A]">.it</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className={`text-sm font-sans font-medium transition-colors hover:text-[#C4956A] ${
                  currentPageName === link.page ? "text-[#C4956A]" : "text-[#555]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#E8DFD0] bg-[#FDFCF8] px-4 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className="text-sm font-sans font-medium text-[#555] hover:text-[#C4956A]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main>{children}</main>

      <footer className="border-t border-[#E8DFD0] bg-[#F5EFE4] mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Feather className="w-4 h-4 text-[#C4956A]" />
                <span className="font-bold text-lg">frifri.it</span>
              </div>
              <p className="text-sm font-sans text-[#777] leading-relaxed max-w-xs">
                Poesia, cultura e comunità nel cuore della Toscana.
                Montelupo Fiorentino vive attraverso i versi.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-[#999] mb-4">Esplora</h4>
              <div className="flex flex-col gap-2">
                {navLinks.map(link => (
                  <Link key={link.page} to={createPageUrl(link.page)} className="text-sm font-sans text-[#666] hover:text-[#C4956A] transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-[#999] mb-4">Informazioni</h4>
              <div className="flex flex-col gap-2">
                <Link to={createPageUrl("Regolamento")} className="text-sm font-sans text-[#666] hover:text-[#C4956A] transition-colors">Regolamento Concorsi</Link>
                <Link to={createPageUrl("Sponsors")} className="text-sm font-sans text-[#666] hover:text-[#C4956A] transition-colors">Diventa Sponsor</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#E0D6C8] pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-xs font-sans text-[#999]">© 2025 frifri.it — Montelupo Fiorentino. Tutti i diritti riservati.</p>
            <p className="text-xs font-sans text-[#BBB] italic">"Il verso è un uccello che non chiede gabbia"</p>
          </div>
        </div>
      </footer>
    </div>
  );
}