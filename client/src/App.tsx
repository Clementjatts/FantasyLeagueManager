import { Switch, Route } from "wouter";
import { Navbar } from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import TeamPage from "./pages/TeamPage";
import TransfersPage from "./pages/TransfersPage";
import StatisticsPage from "./pages/StatisticsPage";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/team" component={TeamPage} />
          <Route path="/transfers" component={TransfersPage} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;
