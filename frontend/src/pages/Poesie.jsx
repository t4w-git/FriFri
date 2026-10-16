import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { apiGet } from "@/lib/api";
import SectionWithAds from "@/components/ads/SectionWithAds";
import { BookOpen, Search } from "lucide-react";

export default function Poesie() {
  const [poems, setPoems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/v1/public/poems', { active: 'true', limit: 50, sortBy: 'publishedDate', sortOrder: 'desc' })
      .then((res) => setPoems(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = poems.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.author?.toLowerCase().includes(search.toLowerCase())
  );

  const demoPoems = [
    { id: "1", title: "Il Vasaio e la Terra", author: "Lorenzo Bini", excerpt: "Le mani modellano l'argilla come il tempo modella il cuore — ogni giro di ruota è un secolo che passa nelle dita sapienti.", thumbnail_url: null, published_date: "2025-01-10" },
    { id: "2", title: "Arno al Tramonto", author: "Maria Gentili", excerpt: "Il fiume porta via i pensieri pesanti, li affida all'Arno come foglie d'autunno che danzano verso il mare dimenticando le sorgenti.", thumbnail_url: null, published_date: "2025-01-03" },
    { id: "3", title: "Ceramica e Stelle", author: "Paolo Rossi", excerpt: "Dipingo il cielo sulla terracotta, e la notte diventa un'urna che conserva i sogni dei dormienti sotto stelle di argilla.", thumbnail_url: null, published_date: "2024-12-27" },
    { id: "4", title: "Vento di Toscana", author: "Anna Ferrari", excerpt: "Sale dai colli il vento che sa di cipresso e di pane, porta con sé le voci degli avi che hanno arato questi campi.", thumbnail_url: null, published_date: "2024-12-20" },
    { id: "5", title: "La Bottega del Silenzio", author: "Lorenzo Bini", excerpt: "Nell'ora quieta del pomeriggio, le mani si fermano e l'argilla ascolta. Il silenzio è anche questo: sapere quando smettere.", thumbnail_url: null, published_date: "2024-12-13" },
    { id: "6", title: "Olive e Memoria", author: "Maria Gentili", excerpt: "Raccogliere olive è un rito antico quanto la lingua. Le nonne lo sapevano, le figlie lo dimenticano, i figli lo scoprono da soli.", thumbnail_url: null, published_date: "2024-12-06" },
  ];

  const displayPoems = filtered.length > 0 || search ? filtered : (poems.length > 0 ? poems : demoPoems);

  return (
    <div>
      {/* Header */}
      <div className="bg-[#F5EFE4] py-20 px-4 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-4">Archivio</p>
        <h1 className="text-5xl md:text-6xl font-bold text-[#1C1C1C] mb-6">Le poesie</h1>
        <p className="font-sans text-base text-[#777] max-w-md mx-auto mb-10">
          Voci contemporanee da Montelupo Fiorentino e dalla Toscana.
        </p>
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <input
            type="text"
            placeholder="Cerca per titolo o autore..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 rounded-full border border-[#E8DFD0] bg-white font-sans text-sm outline-none focus:border-[#C4956A] transition-colors"
          />
        </div>
      </div>

      {/* Grid with Ads */}
      <SectionWithAds>
        <div className="max-w-6xl mx-auto px-4 py-16">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#F0E9DE] rounded-2xl aspect-[4/3] mb-4" />
                <div className="h-3 bg-[#F0E9DE] rounded w-1/4 mb-2" />
                <div className="h-5 bg-[#F0E9DE] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#F0E9DE] rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {displayPoems.map((poem, i) => (
              <Link key={poem.id || i} to={createPageUrl("Poesia") + `?id=${poem.id}`} className="group">
                <div className="overflow-hidden rounded-2xl mb-5 aspect-[4/3] bg-[#F0E9DE]">
                  {poem.thumbnailUrl ? (
                    <img src={poem.thumbnailUrl.startsWith('http') ? poem.thumbnailUrl : `${poem.thumbnailUrl}`} alt={poem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-[#C4956A] opacity-30" />
                    </div>
                  )}
                </div>
                <p className="font-sans text-xs text-[#C4956A] uppercase tracking-widest mb-2">{poem.author || "Anonimo"}</p>
                <h3 className="text-xl font-bold mb-3 group-hover:text-[#C4956A] transition-colors">{poem.title}</h3>
                <p className="font-sans text-sm text-[#777] leading-relaxed italic line-clamp-3">{poem.excerpt || poem.text?.slice(0, 120)}</p>
              </Link>
            ))}
          </div>
        )}

        {!loading && displayPoems.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-[#E8DFD0] mx-auto mb-4" />
            <p className="font-sans text-[#999]">Nessuna poesia trovata.</p>
          </div>
        )}
        </div>
      </SectionWithAds>
    </div>
  );
}