import { FileText, Shield, Trophy, Clock } from "lucide-react";

export default function Regolamento() {
  return (
    <div className="min-h-screen">
      <div className="bg-[#F5EFE4] py-20 px-4 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-3">Trasparenza</p>
        <h1 className="text-5xl font-bold text-[#1C1C1C] mb-4">Regolamento Concorsi</h1>
        <p className="font-sans text-sm text-[#777] max-w-md mx-auto">Tutte le regole dei giochi e dei premi di frifri.it</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Trophy, title: "Premi reali", desc: "Offerti dagli sponsor locali" },
            { icon: Clock, title: "1 tentativo/giorno", desc: "Reset ogni mezzanotte" },
            { icon: Shield, title: "Dati protetti", desc: "Solo per consegna premi" },
            { icon: FileText, title: "Codici univoci", desc: "Un codice per vincitore" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F5EFE4] flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-[#C4956A]" />
              </div>
              <p className="font-bold text-sm mb-1">{item.title}</p>
              <p className="font-sans text-xs text-[#999]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-sm max-w-none">
          {[
            {
              title: "1. Organizzatore",
              content: `I concorsi a premi sono organizzati da frifri.it, portale culturale dedicato alla poesia di Montelupo Fiorentino (FI), Toscana, Italia.`
            },
            {
              title: "2. Partecipazione",
              content: `La partecipazione ai giochi è gratuita e aperta a tutti i residenti in Italia maggiorenni. Per partecipare è necessario inserire un indirizzo email valido. La stessa email può essere utilizzata una sola volta al giorno per ciascun gioco.`
            },
            {
              title: "3. I Giochi",
              content: `frifri.it propone tre giochi settimanali:\n\n• Gioco delle Poesie: quiz di abbinamento versi. 3 domande, risponderne correttamente almeno 2 per vincere.\n\n• Fortuna Italiana: quiz sulla letteratura italiana. 3 domande, risponderne correttamente almeno 2 per accedere al premio.\n\n• Fortuna Montelupo: gioco di scelta casuale tra tre vasi ceramici. Un solo vaso contiene il premio.`
            },
            {
              title: "4. Premi",
              content: `I premi sono offerti dagli sponsor di frifri.it, attività commerciali e artigianali del territorio di Montelupo Fiorentino. Ogni sponsor stabilisce il proprio premio settimanale. I premi non sono convertibili in denaro e non sono cedibili a terzi. I premi sono ritirati direttamente presso l'attività sponsor tramite codice univoco.`
            },
            {
              title: "5. Codice Premio",
              content: `I vincitori ricevono un codice alfanumerico univoco (es: FRIFRI-XXXXXX). Il codice deve essere mostrato all'attività sponsor entro 7 giorni dal rilascio. Ogni codice è monouso: una volta validato non può essere riutilizzato.`
            },
            {
              title: "6. Limitazioni",
              content: `È consentito un solo tentativo al giorno per gioco per indirizzo email. Tentativi multipli con email diverse sono considerati una violazione del regolamento. frifri.it si riserva il diritto di annullare premi in caso di comportamenti scorretti.`
            },
            {
              title: "7. Privacy",
              content: `Gli indirizzi email raccolti sono utilizzati esclusivamente per l'invio dei codici premio e, previo consenso, per la newsletter settimanale. I dati non sono ceduti a terzi. Per la cancellazione, scrivere a info@frifri.it.`
            },
            {
              title: "8. Modifiche al Regolamento",
              content: `frifri.it si riserva il diritto di modificare il presente regolamento in qualsiasi momento. Le modifiche saranno pubblicate su questa pagina con la data di aggiornamento.`
            },
          ].map((section, i) => (
            <div key={i} className="mb-10">
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-3 border-b border-[#E8DFD0] pb-2">{section.title}</h2>
              <p className="font-sans text-sm text-[#555] leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="border border-[#E8DFD0] rounded-2xl p-6 mt-10 text-center">
          <p className="font-sans text-xs text-[#999]">Ultimo aggiornamento: Gennaio 2025</p>
          <p className="font-sans text-xs text-[#999] mt-1">Per informazioni: <a href="mailto:info@frifri.it" className="text-[#C4956A] hover:underline">info@frifri.it</a></p>
        </div>
      </div>
    </div>
  );
}