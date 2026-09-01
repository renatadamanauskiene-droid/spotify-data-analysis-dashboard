import { Link } from 'react-router-dom'
import { ScreenHeader } from '@/components/ScreenHeader'

export default function SatelliteScreen() {
  return (
    <div>
      <ScreenHeader title="Palydovų pokyčiai" subtitle="Viešai prieinama palydovinė OSINT analizė" />

      <div className="rounded-2xl border border-base-700 bg-base-850 p-5">
        <p className="text-sm font-medium text-base-200">Naujo patikimo palydovinio vaizdo nėra</p>
        <p className="mt-3 text-sm leading-relaxed text-base-400">
          Šiuo metu neegzistuoja nemokamas, realaus laiko palydovinių vaizdų API, kuris būtų tinkamas karinių objektų pokyčiams (technikos
          telkimui, naujiems įtvirtinimams, lauko stovykloms) stebėti. Laisvai prieinami šaltiniai, pvz. ESA Copernicus / Sentinel-2, turi apie
          10 m skiriamąją gebą ir ~5 dienų grįžimo periodą — to nepakanka tokiems pokyčiams pastebėti.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-base-400">
          Reali karinė palydovinė analizė paprastai atliekama profesionalių OSINT analitikų, naudojant komercinius aukštos raiškos vaizdus (pvz.
          Planet Labs, Maxar, ICEYE), ir skelbiama kaip parengti pranešimai su nuoroda į šaltinį. Ši programėlė tokių pranešimų neapsimeta
          generuojanti — jie turi būti agreguojami per <span className="text-base-300">Naujienų / OSINT srautą</span>, kai bus sukonfigūruoti
          konkretūs OSINT šaltiniai.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-base-400">
          Norint tikros integracijos, reikėtų komercinio tiekėjo (Sentinel Hub, Planet Labs ar pan.) API rakto — jis turi būti saugomas serverio
          pusėje (Supabase Edge Function), niekada naršyklėje, ir kviečiamas per atskirą <code className="text-base-300">ingest-satellite</code>{' '}
          adapterį.
        </p>
        <Link
          to="/srautas"
          className="mt-4 inline-block rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
        >
          Žiūrėti OSINT srautą →
        </Link>
      </div>
    </div>
  )
}
