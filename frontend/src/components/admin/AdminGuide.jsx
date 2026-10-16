import { BookOpen, BarChart2, Gamepad2, Calendar, Star, Crown, Gift, Mail, AlertCircle } from "lucide-react";

export default function AdminGuide() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-3">Guida Completa Dashboard Admin</h1>
        <p className="text-[#666] text-lg">Spiegazioni dettagliate e pratiche per ogni funzione della piattaforma. Leggi prima di operare sui dati in produzione.</p>
      </div>

      {/* Dashboard Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#C4956A]" /> Dashboard (Statistiche)
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">La dashboard mostra un'istantanea di tutti i KPI (Key Performance Indicators) del sistema. I dati si aggiornano caricando la pagina.</p>
          
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Partite totali</p>
              <p className="text-sm text-[#666]">Numero cumulativo di tutte le partite giocate in tutti i giochi. Utile per tracciare il volume di utilizzo della piattaforma nel tempo.</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Premi assegnati</p>
              <p className="text-sm text-[#666]">Numero di vittorie totali. Se il tasso è troppo alto ({'>'}20%), dovresti abbassare "Probabilità di vittoria" in Configurazione Giochi per aumentare la difficoltà.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Premi riscattati</p>
              <p className="text-sm text-[#666]">Quanti codici premio sono stati effettivamente riscattati. Il rapporto con "Premi assegnati" ti dice quanto sono attrattivi i tuoi premi.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Iscritti newsletter</p>
              <p className="text-sm text-[#666]">Numero di iscritti attivi (che non si sono ancora disiscritti). Usa questo per sapere quante persone riceveranno la prossima newsletter.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Sponsor attivi</p>
              <p className="text-sm text-[#666]">Numero di sponsor abilitati (non disattivati). Se è 0, nessuno riceverà premi quando gioca.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Poesie Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#C4956A]" /> Poesie
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">Le poesie sono il contenuto principale dei giochi. Ogni poesia è suddivisa in 3 quartini che si combineranno automaticamente nel testo finale.</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-semibold text-[#1C1C1C] mb-2">Come creare una nuova poesia:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-[#666]">
                <li>Clicca il bottone "Nuova poesia" in alto a destra</li>
                <li>Compila <strong>Autore</strong> (obbligatorio)</li>
                <li>Scrivi il <strong>Primo quartino</strong> (4 versi, obbligatorio)</li>
                <li>Scrivi il <strong>Secondo quartino</strong> (4 versi, obbligatorio)</li>
                <li>Scrivi il <strong>Terzo quartino</strong> (4 versi, obbligatorio)</li>
                <li>Vedi l'anteprima auto-generata che combina i tre quartini con spazi</li>
                <li>Clicca "Salva" per memorizzare</li>
              </ol>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Anteprima poesia completa</p>
              <p className="text-sm text-[#666]">Mostra come apparirà la poesia finita ai giocatori.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Modifica di una poesia esistente</p>
              <p className="text-sm text-[#666]">Clicca il pulsante di modifica, cambia i quartini e salva.</p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Elimina una poesia</p>
              <p className="text-sm text-[#666]">Clicca il pulsante di eliminazione. Non potrai recuperarla.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Giochi Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-[#C4956A]" /> Configurazione Giochi
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">Configura come funzionano i giochi per i giocatori. Ogni gioco ha impostazioni indipendenti.</p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Gioco da configurare</p>
              <p className="text-sm text-[#666] mt-1">Seleziona quale gioco configuri (fortuna_italiana, fortuna_montelupo, gioco_poesie). Le impostazioni di ogni gioco sono indipendenti.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Ogni quante partite si vince</p>
              <p className="text-sm text-[#666] mt-1">Inserisci un numero intero (es: 3). Significa che 1 giocatore su 3 vince, quindi il 33%. Se metti 5, il 20% vince. La percentuale si calcola: 100 ÷ numero = percentuale di vittoria.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Tentativi al giorno</p>
              <p className="text-sm text-[#666] mt-1">Quante partite può giocare uno stesso giocatore in 24 ore. Se metti 1, ha 1 tentativo. Se metti 3, ha 3 tentativi e poi deve aspettare 24 ore.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Cooldown tra le partite (minuti)</p>
              <p className="text-sm text-[#666] mt-1">Minuti da aspettare tra una partita e l'altra. 1440 minuti = 24 ore (1 tentativo al giorno). 60 minuti = 1 tentativo ogni ora.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Domande per partita</p>
              <p className="text-sm text-[#666] mt-1">Quante domande dovrà rispondere il giocatore in una partita.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Domande per vincere</p>
              <p className="text-sm text-[#666] mt-1">Quante domande deve rispondere CORRETTAMENTE. Se domande totali=5 e questo=4, deve rispondere 4 su 5 correttamente per vincere.</p>
            </div>

            <div className="border-l-4 border-gray-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Secondi timeout per domanda</p>
              <p className="text-sm text-[#666] mt-1">Tempo massimo per rispondere a ogni domanda. Se metti 30, il giocatore ha 30 secondi per domanda. Se scade, è conteggiata come sbagliata.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Eventi Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#C4956A]" /> Eventi
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">Gli eventi sono annunci importanti che appaiono come banner/card sulla homepage.</p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Titolo evento</p>
              <p className="text-sm text-[#666]">Il titolo principale (es: "Poesia di Natale", "Torneo Speciale").</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Descrizione</p>
              <p className="text-sm text-[#666]">Testo che spiega l'evento. Appare sotto il titolo.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Colore sfondo & Colore testo</p>
              <p className="text-sm text-[#666]">Personalizza l'aspetto con colori hexadecimali (#RGB). Assicurati che il contrasto sia sufficiente.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Ordine visualizzazione</p>
              <p className="text-sm text-[#666]">Numero che determina in che ordine appaiono gli eventi (1=primo, 2=secondo, ecc).</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="text-sm text-blue-800"><strong>💡 Come usare:</strong> Crea un evento prima di ogni promozione speciale per annunciare nuove poesie o tornei.</p>
          </div>
        </div>
      </section>

      {/* Sponsor Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <Star className="w-6 h-6 text-[#C4956A]" /> Sponsor
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">Gli sponsor sono aziende che offrono premi ai vincitori. Ogni sponsor ha il suo premio, logo e livello.</p>
          
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Nome attività</p>
              <p className="text-sm text-[#666]">Nome ufficiale (es: "Pizzeria Roma", "Libreria Dante"). Obbligatorio.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Logo</p>
              <p className="text-sm text-[#666]">URL o upload immagine (PNG/JPG, min 200x200px). Apparirà accanto ai premi vinti.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Descrizione premio</p>
              <p className="text-sm text-[#666]">Cosa il vincitore riceve (es: "Voucher da 50€"). Appare nel codice premio.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Livello (Base/Premium/Gold)</p>
              <p className="text-sm text-[#666]">Determina visibilità. Gold = massima, Base = minima.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Gioco associato</p>
              <p className="text-sm text-[#666]">Per quale gioco offre premi (o "Tutti i giochi"). I premi appariranno SOLO se il giocatore vince quel gioco.</p>
            </div>

            <div className="border-l-4 border-gray-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Attivo/Disattivo</p>
              <p className="text-sm text-[#666]">Toggle per disabilitare temporaneamente. I dati rimangono salvati.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor Tiers Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <Crown className="w-6 h-6 text-[#C4956A]" /> Livelli Sponsor (Tiers)
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">Configura le caratteristiche di ogni livello (Base, Premium, Gold).</p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Nome livello</p>
              <p className="text-sm text-[#666]">Il nome del tier (es: "Base", "Premium"). Obbligatorio.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Prezzo (mensile)</p>
              <p className="text-sm text-[#666]">Costo mensile (informativo, non processato). Utile per tracciare costi sponsor.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Colore & Badge</p>
              <p className="text-sm text-[#666]">Colore hex (#RGB) e etichetta (es: "👑 Premium") per distinguere visivamente i tier.</p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Features</p>
              <p className="text-sm text-[#666]">Lista di funzionalità (es: "Logo grande", "Home prominente"). Aggiungi/rimuovi come necessario.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Codici Premio Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <Gift className="w-6 h-6 text-[#C4956A]" /> Codici Premio
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">I codici si generano AUTOMATICAMENTE quando un giocatore vince. Non crearli manualmente qui - serve solo per tracciare i riscatti.</p>
          
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800"><strong>⚠️ Importante:</strong> I codici si creano automaticamente. Non fare nulla qui per crearli. Appaiono pochi secondi dopo una vittoria.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Statistiche</p>
              <p className="text-sm text-[#666]">Totale codici | Da riscattare | Già riscattati.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Ricerca & Filtri</p>
              <p className="text-sm text-[#666]">Digita il codice o l'email per trovare premi specifici. Filtra per stato (da riscattare / riscattati).</p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Segna come riscattato</p>
              <p className="text-sm text-[#666]">Azione avanzata per admin. Normalmente il flusso è automatico.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="text-sm text-blue-800"><strong>📌 Flusso di riscatto:</strong> Giocatore vince → Riceve codice premio via email → Clicca il bottone di autenticazione nella mail → Sponsor clicca il suo bottone di verifica → Codice risulta riscattato nel sistema.</p>
          </div>
        </div>
      </section>

      {/* Newsletter Tab */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <Mail className="w-6 h-6 text-[#C4956A]" /> Newsletter
        </h2>
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6">
          <p className="text-[#666] mb-4">Gestisci iscritti e invia comunicazioni settimanali. NON è automatica - decidi tu quando inviare.</p>
          
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Statistiche iscritti</p>
              <p className="text-sm text-[#666]">Totale | Attivi | Disiscritti. Utile per sapere a quante persone invierai la prossima email.</p>
            </div>

            <div className="border-l-4 border-[#C4956A] pl-4">
              <p className="font-semibold text-[#1C1C1C]">Invia poesia settimanale</p>
              <p className="text-sm text-[#666]">Titolo (oggetto email) + Corpo (testo poesia). Il bottone mostra quanti riceveranno questa email. Gli iscritti possono cliccare il bottone di discrizione direttamente dalla poesia per disiscriversi dalla newsletter.</p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <p className="font-semibold text-[#1C1C1C]">Rimuovi iscritto</p>
              <p className="text-sm text-[#666]">Puoi anche rimuovere manualmente un iscritto tramite il bottone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-600" /> Problemi tecnici e bug
        </h2>
        <div className="bg-white border border-blue-200 rounded-2xl p-6">
          <p className="text-sm text-[#666]">Se riscontri problemi, malfunzionamenti o comportamenti inaspettati della dashboard, contatta il team tecnico di Think4Web per segnalare il bug e ricevere supporto.</p>
        </div>
      </section>

      {/* Footer Tips */}
      <div className="bg-gradient-to-r from-[#C4956A] to-[#B8845A] text-white rounded-2xl p-8 text-center">
        <p className="text-lg font-semibold mb-2">🎯 Ricordati</p>
        <p>La dashboard è uno strumento potente.</p>
      </div>
    </div>
  );
}
