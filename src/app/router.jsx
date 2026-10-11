import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Loading } from '../components/Feedback.jsx'
import { Login } from '../features/auth/Login.jsx'
import { Register } from '../features/auth/Register.jsx'
import { Dashboard } from '../features/dashboard/Dashboard.jsx'
import { Discover } from '../features/anime/Discover.jsx'
import { AnimeDetail } from '../features/anime/AnimeDetail.jsx'
import { Library } from '../features/library/Library.jsx'
import { Guide } from '../features/guide/Guide.jsx'
import { Quests } from '../features/quests/Quests.jsx'
import { Achievements } from '../features/achievements/Achievements.jsx'
import { Guilds } from '../features/guilds/Guilds.jsx'
import { GuildDetail } from '../features/guilds/GuildDetail.jsx'
import { Activity, Profile } from '../features/profile/Profile.jsx'
import { AiInsight } from '../features/ai/AiInsight.jsx'

function Protected({ children }) {
  const { isAuthenticated, initialized, loading } = useAuth()
  if (!initialized || loading) return <div style={{ padding: 40 }}><Loading message="Checking session…" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { isAuthenticated, initialized, loading } = useAuth()
  if (!initialized || loading) return <div style={{ padding: 40 }}><Loading message="Checking session…" /></div>
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicOnly><Login /></PublicOnly>,
  },
  {
    path: '/register',
    element: <PublicOnly><Register /></PublicOnly>,
  },
  {
    path: '/',
    element: <Protected><Layout /></Protected>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'discover', element: <Discover /> },
      { path: 'anime/:id', element: <AnimeDetail /> },
      { path: 'library', element: <Library /> },
      { path: 'guide', element: <Guide /> },
      { path: 'quests', element: <Quests /> },
      { path: 'achievements', element: <Achievements /> },
      { path: 'guilds', element: <Guilds /> },
      { path: 'guilds/:id', element: <GuildDetail /> },
      { path: 'profile', element: <Profile /> },
      { path: 'activity', element: <Activity /> },
      { path: 'ai', element: <AiInsight /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
