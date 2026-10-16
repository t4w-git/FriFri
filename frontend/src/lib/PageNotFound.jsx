import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Feather } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center px-4 text-center">
      <div>
        <Feather className="w-16 h-16 text-[#E8DFD0] mx-auto mb-6" />
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-3">Pagina non trovata</p>
        <h1 className="text-6xl font-bold text-[#1C1C1C] mb-4">404</h1>
        <p className="font-sans text-[#777] mb-8 italic">"Come il verso che si perde nel vento,<br />questa pagina è andata via."</p>
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 bg-[#C4956A] text-white px-8 py-3.5 rounded-full font-sans font-semibold text-sm hover:bg-[#B8845A] transition-colors">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}