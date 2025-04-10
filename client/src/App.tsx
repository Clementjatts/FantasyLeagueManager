import { Switch, Route } from "wouter";
import { Navbar } from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import TeamPage from "./pages/TeamPage";
import PlayersPage from "./pages/PlayersPage";
import StatisticsPage from "./pages/StatisticsPage";
import DreamTeamPage from "./pages/DreamTeamPage";
import TopManagersTeamPage from "./pages/TopManagersTeamPage";
import ChipsStrategyPage from "./pages/ChipsStrategyPage";

function App() {
  return (
    <div className="min-h-screen bg-background">
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
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;
