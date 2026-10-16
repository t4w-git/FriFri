import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, BookOpen, Quote } from "lucide-react";
import { apiGet } from '@/lib/api';

export default function PoemsSection({ poems }) {
  const [featuredPoems, setFeaturedPoems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/v1/public/poems', { featured: 'true', limit: 3 })
      .then((res) => {
        const data = res.data || [];
        setFeaturedPoems(data.length > 0 ? data : poems);
      })
      .catch(() => setFeaturedPoems(poems))
      .finally(() => setLoading(false));
  }, [poems]);

  const demoPoems = featuredPoems.length > 0 ? featuredPoems : [
    { id: "1", title: "Il Vasaio e la Terra", author: "Lorenzo Bini", excerpt: "Le mani modellano l'argilla come il tempo modella il cuore — ogni giro di ruota è un secolo che passa...", thumbnailUrl: null },
    { id: "2", title: "Arno al Tramonto", author: "Maria Gentili", excerpt: "Il fiume porta via i pensieri pesanti, li affida all'Arno come foglie d'autunno che danzano verso il mare...", thumbnailUrl: null },
    { id: "3", title: "Ceramica e Stelle", author: "Paolo Rossi", excerpt: "Dipingo il cielo sulla terracotta, e la notte diventa un'urna che conserva i sogni dei dormienti...", thumbnailUrl: null },
  ];

  const [featured, ...rest] = demoPoems;

  return (
    <section className="py-24 px-4 bg-[#FDFCF8]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-3">Archivio poetico</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1C1C1C]">Le ultime poesie</h2>
          </div>
          <Link to={createPageUrl("Poesie")} className="hidden md:flex items-center gap-2 font-sans text-sm text-[#C4956A] hover:gap-3 transition-all font-medium">
            Vedi tutte <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid: 1 featured large + 2 smaller */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Featured poem */}
          {featured && (
            <Link
              to={createPageUrl("Poesia") + `?id=${featured.id}`}
              className="md:col-span-3 group relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-auto flex flex-col"
            >
              <div className="absolute inset-0">
                {featured.thumbnailUrl ? (
                  <img src={featured.thumbnailUrl.startsWith('http') ? featured.thumbnailUrl : `${featured.thumbnailUrl}`} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-[#2D1B69]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>
              <div className="relative mt-auto p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-4 h-4 text-[#C4956A]" />
                  <span className="font-sans text-xs text-white/60 uppercase tracking-widest">In evidenza</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-[#C4956A] transition-colors">{featured.title}</h3>
                <p className="font-sans text-sm text-white/60 italic line-clamp-2 mb-4">{featured.excerpt}</p>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-px bg-[#C4956A]" />
                  <span className="font-sans text-xs text-[#C4956A] font-semibold">{featured.author || "Anonimo"}</span>
                </div>
              </div>
            </Link>
          )}

          {/* Smaller poems */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {rest.map((poem, i) => (
              <Link
                key={poem.id || i}
                to={createPageUrl("Poesia") + `?id=${poem.id}`}
                className="group relative rounded-2xl overflow-hidden flex-1 min-h-[200px] flex flex-col"
              >
                <div className="absolute inset-0">
                  {poem.thumbnailUrl ? (
                    <img src={poem.thumbnailUrl.startsWith('http') ? poem.thumbnailUrl : `${poem.thumbnailUrl}`} alt={poem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-[#F0E9DE] flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-[#C4956A] opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                </div>
                <div className="relative mt-auto p-5">
                  <p className="font-sans text-xs text-[#C4956A] uppercase tracking-widest mb-1">{poem.author || "Anonimo"}</p>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#C4956A] transition-colors">{poem.title}</h3>
                  <p className="font-sans text-xs text-white/50 italic line-clamp-2 mt-1">{poem.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Decorative quote */}
        <div className="mt-16 border-t border-[#E8DFD0] pt-12 text-center">
          <p className="text-2xl md:text-3xl italic font-normal text-[#888] max-w-2xl mx-auto leading-relaxed">
            "La poesia è il modo più breve per dire le cose più lunghe"
          </p>
          <p className="font-sans text-xs text-[#BBB] mt-4 uppercase tracking-widest">— Montelupo Fiorentino</p>
        </div>
      </div>
    </section>
  );
}