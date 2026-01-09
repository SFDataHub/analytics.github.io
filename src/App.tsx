import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/store'
import AppShell from './app/AppShell'
import Dashboard from './routes/Dashboard'
import ExportPage from './routes/Export'
import ImportPage from './routes/Import'
import PlayerDetail from './routes/PlayerDetail'
import Ranking from './routes/Ranking'

export function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="player/:playerKey" element={<PlayerDetail />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DataProvider>
    </HashRouter>
  )
}
