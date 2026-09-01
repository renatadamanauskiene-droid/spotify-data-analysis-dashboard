import { Route, Routes } from 'react-router-dom'
import { AppDataProvider } from '@/lib/AppDataContext'
import { AppShell } from '@/components/AppShell'
import Overview from '@/screens/Overview'
import MapScreen from '@/screens/MapScreen'
import AlertsScreen from '@/screens/AlertsScreen'
import FeedScreen from '@/screens/FeedScreen'
import MoreScreen from '@/screens/MoreScreen'
import SuwalkiScreen from '@/screens/SuwalkiScreen'
import SatelliteScreen from '@/screens/SatelliteScreen'
import AviationScreen from '@/screens/AviationScreen'
import RailwayScreen from '@/screens/RailwayScreen'
import MissilesScreen from '@/screens/MissilesScreen'
import GnssScreen from '@/screens/GnssScreen'
import NotamScreen from '@/screens/NotamScreen'
import SourcesScreen from '@/screens/SourcesScreen'

export default function App() {
  return (
    <AppDataProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/zemelapis" element={<MapScreen />} />
          <Route path="/signalai" element={<AlertsScreen />} />
          <Route path="/srautas" element={<FeedScreen />} />
          <Route path="/daugiau" element={<MoreScreen />} />
          <Route path="/suvalkai" element={<SuwalkiScreen />} />
          <Route path="/palydovai" element={<SatelliteScreen />} />
          <Route path="/aviacija" element={<AviationScreen />} />
          <Route path="/gelezinkeliai" element={<RailwayScreen />} />
          <Route path="/raketos" element={<MissilesScreen />} />
          <Route path="/gnss" element={<GnssScreen />} />
          <Route path="/notam" element={<NotamScreen />} />
          <Route path="/saltiniai" element={<SourcesScreen />} />
        </Routes>
      </AppShell>
    </AppDataProvider>
  )
}
