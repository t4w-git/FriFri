import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { apiGet } from "@/lib/api";
import { ArrowLeft, Play, Pause, Gamepad2, Volume2 } from "lucide-react";

export default function Poesia() {
  const [poem, setPoem] = useState(null);
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  const demoPoem = {
    id: "1",
    title: "Il Vasaio e la Terra",
    author: "Lorenzo Bini",
    text: `Le mani modellano l'argilla
come il tempo modella il cuore —
ogni giro di ruota è un secolo
che passa nelle dita sapienti.

L'argilla ricorda l'acqua,
l'acqua ricorda il cielo,
il cielo ricorda il vasaio
che non smette mai di girare.

Montelupo, terra di fuoco e forma,
dove ogni vaso è una preghiera
e ogni forno è una cattedrale
che celebra il mistero dell'eterno.

Le mani si fermano.
Il vaso rimane.
Il silenzio è completo.`,
    excerpt: "Le mani modellano l'argilla come il tempo modella il cuore...",
    thumbnail_url: null,
    published_date: "2025-01-10",
  };

  useEffect(() => {
    if (id && id !== "1") {
      apiGet(`/api/v1/public/poems/${id}`)
        .then((res) => setPoem(res))
        .catch(() => setPoem(demoPoem))
        .finally(() => setLoading(false));
    } else {
      setPoem(demoPoem);
      setLoading(false);
    }

    apiGet('/api/v1/public/sponsors', { active: 'true', tier: 'premium', limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(res => { if (res.data?.[0]) setSponsor(res.data[0]); })
      .catch(() => {});
  }, [id]);

  const toggleAudio = () => {
    if (!poem?.audio_url) return;
    if (!audio) {
      const a = new Audio(poem.audio_url);
      a.onended = () => setPlaying(false);
      setAudio(a);
      a.play();
      setPlaying(true);
    } else if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!poem) return <div className="text-center py-40 font-sans text-[#999]">Poesia non trovata.</div>;

  return (
    <div className="min-h-screen">
      {/* Hero image */}
      {poem.thumbnailUrl && (
        <div className="h-72 md:h-96 overflow-hidden relative">
          <img src={poem.thumbnailUrl.startsWith('http') ? poem.thumbnailUrl : `${poem.thumbnailUrl}`} alt={poem.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FDFCF8]" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to={createPageUrl("Poesie")} className="inline-flex items-center gap-2 font-sans text-sm text-[#999] hover:text-[#C4956A] transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Tutte le poesie
        </Link>

        {/* Meta */}
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-4">{poem.author || "Anonimo"}</p>
        <h1 className="text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-8">{poem.title}</h1>

        {/* Audio player */}
        {poem.audio_url && (
          <button
            onClick={toggleAudio}
            className="flex items-center gap-3 border border-[#E8DFD0] rounded-full px-6 py-3 mb-10 hover:border-[#C4956A] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[#C4956A] flex items-center justify-center">
              {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
            </div>
            <div className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-[#999]" />
              <span className="font-sans text-sm text-[#666]">{playing ? "In ascolto..." : "Ascolta la voce dell'autore"}</span>
            </div>
          </button>
        )}

        {/* Poem text */}
        <div className="border-l-2 border-[#C4956A] pl-8 mb-14">
          {poem.text?.split("\n\n").map((stanza, i) => (
            <p key={i} className="text-lg md:text-xl leading-loose text-[#333] italic mb-8 last:mb-0 whitespace-pre-line">
              {stanza}
            </p>
          ))}
        </div>

        {/* CTA game */}
        <div className="bg-[#F5EFE4] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 mb-12">
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">Gioca con questa poesia</h3>
            <p className="font-sans text-sm text-[#777]">Metti alla prova la tua memoria poetica e vinci un premio.</p>
          </div>
          <Link
            to={createPageUrl("GiocoPoesie")}
            className="flex items-center gap-2 bg-[#C4956A] text-white px-6 py-3 rounded-full font-sans font-semibold text-sm hover:bg-[#B8845A] transition-colors whitespace-nowrap"
          >
            <Gamepad2 className="w-4 h-4" />
            Gioca ora
          </Link>
        </div>

        {/* Sponsor banner */}
        {sponsor && (
          <div className="border border-[#E8DFD0] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#F5EFE4] flex items-center justify-center text-lg font-bold text-[#C4956A]">
              {sponsor.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-sans text-xs text-[#999] mb-0.5">Sponsor questa settimana</p>
              <p className="font-sans text-sm font-semibold text-[#333]">{sponsor.name}</p>
              <p className="font-sans text-xs text-[#777]">{sponsor.prize_description}</p>
            </div>
            {sponsor.link && (
              <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-[#C4956A] underline">
                Scopri
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}