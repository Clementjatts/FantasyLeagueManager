import { Switch, Route } from "wouter";
import { Navbar } from "./components/Navbar";
import { SeasonProvider } from "./contexts/SeasonContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardPage from "./pages/DashboardPage";
import TeamPage from "./pages/TeamPage";
import PlayersPage from "./pages/PlayersPage";
import StatisticsPage from "./pages/StatisticsPage";
import DreamTeamPage from "./pages/DreamTeamPage";
import TopManagersTeamPage from "./pages/TopManagersTeamPage";
import ChipsStrategyPage from "./pages/ChipsStrategyPage";
import SettingsPage from "./pages/SettingsPage";

function AppRoutes() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/team" component={TeamPage} />
          <Route path="/players" component={PlayersPage} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route path="/dream-team" component={DreamTeamPage} />
          <Route path="/chips" component={ChipsStrategyPage} />
          <Route path="/top-managers-team" component={TopManagersTeamPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, loading, signInWithGoogle } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-glass-border shadow-glass">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              FPLManager
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to personalize your dashboard and sync your FPL team
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={signInWithGoogle}
                className="w-full h-11 inline-flex items-center justify-center gap-2"
                variant="default"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C33.8 31.9 29.4 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.1-5.1C33.1 6 28.8 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.7 15 18.4 12 24 12c3 0 5.7 1.1 7.8 3l5.1-5.1C33.1 6 28.8 4 24 4 16.4 4 9.8 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.8-5.2l-6.4-5.4C29.4 35 27 36 24 36c-5.4 0-9.9-3.1-12.2-7.6l-6 4.6C9.2 39.6 16 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42v-.1H24v7.2h11.3c-1.3 3.1-3.8 5.4-6.9 6.4l6.4 5.4c-.5.4 8.2-4.8 8.2-15.4 0-1.2-.1-2.3-.4-3.5z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <SeasonProvider>
        <AuthGate />
      </SeasonProvider>
    </AuthProvider>
  );
}

export default App;
