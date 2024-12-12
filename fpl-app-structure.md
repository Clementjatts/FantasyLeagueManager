# FPL Personal Manager App Structure

## 1. Dashboard (Home Page)
**Primary APIs:**
- `/bootstrap-static/` - General game information
- `/entry/{manager_id}/` - Team overview
- `/event-status/` - Current gameweek status
- `/entry/{manager_id}/event/{event_id}/picks/` - Current team selection

**Key Features:**
- Overall rank and points display
- Current gameweek points and rank
- Team value and transfer information
- Next deadline countdown
- Current team quick view
- Available chips status
- Quick transfer suggestions
- Recent performance graph
- Immediate actions needed (transfers, captain selection, etc.)

## 2. Team Management Hub
**Primary APIs:**
- `/my-team/{manager_id}/` - Current team setup
- `/bootstrap-static/` - Player list
- `/element-summary/{element_id}/` - Detailed player stats
- `/fixtures/` - Upcoming matches
- `/entry/{manager_id}/event/{event_id}/picks/` - Team selection

**Key Features:**
- Full team visualization with pitch view
- Captain and vice-captain selection
- Automatic substitution preferences
- Player statistics and form indicators
- Upcoming fixtures for selected players
- Team value breakdown
- Formation analysis
- Player performance predictions

## 3. Transfer Planning Center
**Primary APIs:**
- `/entry/{manager_id}/transfers/` - Transfer history
- `/bootstrap-static/` - Player database
- `/element-summary/{element_id}/` - Player details
- `/entry/{manager_id}/transfers-latest/` - Recent transfers
- `/fixtures/` - Fixture analysis

**Key Features:**
- Available transfers display
- Transfer history
- Player price change tracker
- Advanced player comparison tools
- Watchlist management
- Transfer planner for future gameweeks
- Price rise/fall predictions
- Transfer suggestions based on fixtures
- Team value optimization tools

## 4. Fixtures & Strategy Planner
**Primary APIs:**
- `/fixtures/` - All fixtures
- `/fixtures/?event={event_id}` - Gameweek specific fixtures
- `/team/set-piece-notes/` - Set piece takers
- `/bootstrap-static/` - Team information

**Key Features:**
- Fixture difficulty rating (FDR) visualization
- Blank/Double gameweek planner
- Set-piece taker information
- Match statistics and team form
- Fixture difficulty color coding
- Season ticker with difficulty rating
- Fixture rotation planner
- Strategic planning tools for chips

## 5. Statistics & Analysis Center
**Primary APIs:**
- `/event/{event_id}/live/` - Live gameweek stats
- `/dream-team/{event_id}/` - Best performers
- `/element-summary/{element_id}/` - Player stats
- `/bootstrap-static/` - General statistics

**Key Features:**
- Detailed player performance statistics
- Form guides and trends
- Ownership statistics and trends
- Expected points predictions
- Top performers by position
- Advanced statistical analysis
- Historical performance data
- Price trend analysis
- Heat maps and data visualization

## 6. League & Competition Tracker
**Primary APIs:**
- `/leagues-classic/{league_id}/standings/` - Classic leagues
- `/leagues-h2h-matches/league/{league_id}/` - Head-to-head leagues
- `/league/{league_id}/cup-status/` - Cup status

**Key Features:**
- League standings overview
- Points differences and mini-league analysis
- Head-to-head results
- Cup progress tracker
- League rival analysis
- What-if scenario calculator
- League position predictions
- Head-to-head comparison tools

## 7. Advanced Research Hub
**Primary APIs:**
- `/bootstrap-static/` - Player database
- `/element-summary/{element_id}/` - Detailed player info
- `/stats/most-valuable-teams/` - Team value data
- `/team/set-piece-notes/` - Set piece information

**Key Features:**
- Advanced player search and filtering
- Detailed performance analytics
- Fixture difficulty analysis
- Price trend analysis
- Set-piece analysis
- Player comparison matrix
- Underlying statistics
- Team formation analysis
- Player ownership trends

## 8. Chip Strategy & Planning
**Primary APIs:**
- `/entry/{manager_id}/history/` - Chip usage history
- `/fixtures/` - Future fixture analysis
- `/bootstrap-static/` - General game information

**Key Features:**
- Available chips status
- Chip usage history
- Recommended chip strategies
- Double/blank gameweek planning
- Chip usage statistics
- Strategy simulation tools
- Best timing recommendations
- Historical chip success analysis

## Additional Features for Future Implementation:
1. AI-powered transfer suggestions
2. Automated team optimization
3. Custom player watchlists
4. Alternative formation analysis
5. Integration with external data sources
6. Push notifications for deadlines and price changes
7. Player rotation risk analyzer
8. Expected minutes predictor
9. Mobile app version
10. Team structure analyzer

## Real-time Updates Implementation:
- Poll `/event/{gameweek}/live/` every 60 seconds during active gameweeks
- Poll `/event-status/` for bonus points updates
- Implement WebSocket if available for live score updates
- Cache non-dynamic data to reduce API calls
- Implement background updates for price changes