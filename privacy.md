# Privacy Policy — VDS Studio

**Ultimo aggiornamento:** 1 novembre 2026
**Versione applicazione:** 2.0.0
**Package Android:** `net.b0sh.vdsstudio`

## 1. In sintesi

**VDS Studio non raccoglie alcun dato personale.**

L'applicazione funziona interamente **in locale** sul dispositivo dell'utente:

- non raccoglie dati personali;
- non invia telemetria, statistiche d'uso, log o segnalazioni di errore;
- non identifica l'utente né il dispositivo;
- non utilizza servizi di analytics, pubblicità, profilazione o tracciamento di terze parti;
- non richiede registrazione, account, email o numero di telefono.

## 2. Dati raccolti

**Nessuno.**

VDS Studio non trasmette, non condivide e non vende dati a terzi. Non esistono server
proprietari o di terzi a cui l'applicazione invii informazioni.

## 3. Telemetria e statistiche

L'applicazione **non contiene** SDK o librerie di:

- analytics (es. Google Analytics, Firebase Analytics, Amplitude);
- crash reporting (es. Crashlytics, Sentry);
- pubblicità o attribution;
- profilazione comportamentale.

Non vengono registrati utilizzi, aperture, risposte o percorsi di navigazione al di
fuori della memoria locale del dispositivo.

## 4. Identificazione dell'utente e del dispositivo

L'applicazione **non identifica l'utente né il dispositivo**. In particolare non vengono
letti né utilizzati:

- nome, email, numero di telefono o altri dati anagrafici;
- identificativi del dispositivo (IMEI, Android ID, Advertising ID, IDFA);
- posizione geografica;
- contatti, calendario, foto, microfono o fotocamera;
- dati biometrici.

## 5. Dati salvati sul dispositivo

Per funzionare, l'applicazione conserva **esclusivamente sul dispositivo** alcuni dati
di esercitazione prodotti dall'utente:

| Dato | Contenuto | Dove è salvato |
|------|-----------|----------------|
| Arretrato di apprendimento | domande sbagliate da ripassare e relativi contatori | storage locale dell'app |
| Copertura dell'addestramento | domande già incontrate, con data del primo e dell'ultimo incontro | storage locale dell'app |

Questi dati:

- non lasciano il dispositivo, salvo esplicita azione dell'utente (esportazione);
- non sono associati ad alcuna identità;
- sono cancellati disinstallando l'applicazione o cancellandone i dati dalle
  impostazioni di sistema.

## 6. Esportazione e importazione dei dati

Dalla schermata **Informazioni** l'utente può:

- **esportare** copertura e arretrato in un unico file JSON, che viene generato localmente
  e condiviso tramite il pannello di condivisione del sistema operativo;
- **importare** un file JSON scelto dall'utente tramite il selettore documenti di sistema.

Il file viene creato e letto solo su richiesta esplicita dell'utente. La destinazione
(eventuale salvataggio su cloud, invio via email o messaggistica) è scelta liberamente
dall'utente ed è gestita dal sistema operativo e dalle app selezionate: VDS Studio non
ha alcun ruolo in questa fase e non riceve alcuna copia dei dati.

## 7. Connessioni di rete

L'applicazione **non effettua chiamate di rete** per raccogliere o trasmettere dati.

Il framework React Native/Expo dichiara nel manifest Android il permesso `INTERNET`,
necessario al funzionamento tecnico del runtime, ma l'app non lo utilizza per inviare
informazioni, né verso server propri né di terzi.

L'unico collegamento esterno è il **link al repository GitHub** presente nella schermata
Informazioni: se l'utente lo tocca, il link viene aperto nel browser del dispositivo e si
applicano le informative privacy del sito di destinazione.

## 8. Permessi richiesti

| Permesso | Finalità | Note |
|----------|----------|------|
| Accesso a file/documenti (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`) | esportare e importare il file di backup dei dati di addestramento | richiesto solo su Android 12 e precedenti; su Android 13+ si usa il selettore documenti di sistema, senza accesso libero allo storage |
| `VIBRATE` | feedback aptico dell'interfaccia | nessun dato associato |
| `INTERNET` | dichiarato dal runtime di React Native | non usato per raccogliere o inviare dati |
| `SYSTEM_ALERT_WINDOW` | overlay delle build di sviluppo | non attivo nell'uso normale dell'app |

L'applicazione non richiede accesso a posizione, fotocamera, microfono, contatti,
calendario, SMS o altri dati sensibili.

## 9. Backup di sistema

Se l'utente ha attivato il backup automatico di Android, i dati locali dell'app possono
essere inclusi dal sistema operativo nel backup del dispositivo (ad esempio su Google
Drive). Questo trattamento è effettuato da Android/Google secondo le rispettive
informative, non da VDS Studio, ed è disattivabile dalle impostazioni di sistema
dell'utente.

## 10. Minori

L'applicazione non raccoglie dati e quindi non raccoglie consapevolmente dati di minori.
Può essere utilizzata senza creare alcun profilo.

## 11. Cancellazione dei dati

L'utente può eliminare in qualsiasi momento tutti i dati locali:

- dalle impostazioni Android: **App → VDS Studio → Memoria → Cancella dati**;
- disinstallando l'applicazione.

Non essendo conservata alcuna copia remota, la cancellazione è immediata e definitiva.

## 12. Trasferimenti e condivisioni

Non esistono trasferimenti di dati a terzi, né all'interno né all'esterno dell'Unione
Europea, perché nessun dato viene raccolto o trasmesso.

## 13. Conformità al GDPR

Poiché VDS Studio non tratta dati personali, non è previsto alcun trattamento soggetto
agli obblighi del Regolamento (UE) 2016/679 (GDPR): non vengono esercitati diritti di
accesso, rettifica, cancellazione, portabilità o opposizione su dati inesistenti.
L'utente mantiene comunque il pieno controllo sui dati locali, che può cancellare in
qualsiasi momento (sezione 11).

## 14. Modifiche alla presente informativa

Eventuali modifiche saranno pubblicate in questo file all'interno del repository del
progetto, con aggiornamento della data in cima al documento. In caso di introduzione di
funzionalità che comportino raccolta dati, l'informativa sarà aggiornata prima del
rilascio e l'utente ne sarà informato.

## 15. Contatti

Per domande relative alla privacy o al trattamento dei dati:

- repository del progetto: <https://github.com/b0sh-net/vdsexamapp>
- segnalazioni e richieste: sezione **Issues** del repository

---

VDS Studio è un progetto **senza scopo di lucro**, distribuito con licenza
**GNU GPL v3** (vedi [LICENSE](LICENSE)). Non contiene pubblicità, acquisti in-app né
abbonamenti.
