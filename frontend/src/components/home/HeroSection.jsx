import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, Gamepad2, ChevronDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero.jpg"
          alt="Toscana"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1C]/90 via-[#1C1C1C]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/70 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 bg-[#C4956A]" />
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-[#C4956A]">
                Montelupo Fiorentino · Toscana
              </p>
            </div>

            <h1 className="text-7xl md:text-9xl font-bold leading-none mb-2 text-white">
              fri<span className="text-[#C4956A]">fri</span>
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-white/30 mb-8 tracking-widest">.it</p>

            <p className="text-xl md:text-2xl font-normal italic text-white/80 mb-4 leading-relaxed border-l-2 border-[#C4956A] pl-5">
              "Dove le parole diventano aria<br/>e la bellezza abita ogni verso"
            </p>

            <p className="font-sans text-base text-white/50 mb-12 max-w-md leading-relaxed">
              Poesia contemporanea, giochi culturali e la comunità viva di Montelupo Fiorentino.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={createPageUrl("Poesie")}
                className="inline-flex items-center gap-2 bg-[#C4956A] text-white px-8 py-4 rounded-full text-sm font-sans font-semibold hover:bg-[#B8845A] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Leggi le poesie
              </Link>
              <Link
                to={createPageUrl("Giochi")}
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-full text-sm font-sans font-semibold hover:border-white hover:bg-white/10 transition-colors"
              >
                <Gamepad2 className="w-4 h-4" />
                Gioca e vinci
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-3 divide-x divide-white/10">
          {[
            { value: "150+", label: "Poesie pubblicate" },
            { value: "3", label: "Giochi culturali" },
            { value: "€500+", label: "Premi assegnati" },
          ].map((s) => (
            <div key={s.label} className="text-center px-4">
              <p className="text-xl font-bold text-[#C4956A]">{s.value}</p>
              <p className="font-sans text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}