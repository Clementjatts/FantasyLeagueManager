# Fantasy Premier League (FPL) Historical Data Sources Guide

## Overview

This guide provides the most reliable sources for accessing Fantasy Premier League historical data, including official archives, APIs, and community-maintained repositories.

## Primary Recommendation: FPL-Elo-Insights

**GitHub Repository:** [olbauday/FPL-Elo-Insights](https://github.com/olbauday/FPL-Elo-Insights)

### Key Features
- **Active maintenance** with twice-daily updates (5:00 AM and 5:00 PM UTC)
- **Enhanced coverage** including pre-season friendlies, domestic cups, and all European competitions linked to FPL player IDs
- **Advanced defensive metrics** (Clearances, Blocks, Interceptions, Tackles) aligned with new FPL scoring rules
- **Multiple data formats** organized by gameweek, tournament, and season-level aggregations
- **Direct API access** via raw GitHub URLs for programmatic use

### Access Methods
```python
import pandas as pd

# Current season gameweek data
url = "https://raw.githubusercontent.com/olbauday/FPL-Elo-Insights/main/data/2025-26/gws/merged_gw.csv"
df = pd.read_csv(url)

# Season summary data
season_url = "https://raw.githubusercontent.com/olbauday/FPL-Elo-Insights/main/data/2025-26/season_summary.csv"
season_df = pd.read_csv(season_url)
```

## Secondary Option: Vaastav's Repository (Historical Data)

**GitHub Repository:** [vaastav/Fantasy-Premier-League](https://github.com/vaastav/Fantasy-Premier-League)

### Key Features
- **Extensive historical coverage** from 2016-2024
- **Well-documented data structure** with cleaned CSV files
- **Community trust** - 1,600+ stars and widely cited in FPL research
- **Direct Python access** using pandas with raw GitHub URLs

### Important Note
Weekly updates stopped after the 2024-25 season, with only three major updates planned per season going forward.

### Access Methods
```python
import pandas as pd

# Historical season data (example: 2023-24)
base_url = "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data/2023-24/"

# Player data by gameweek
players_url = f"{base_url}players_raw.csv"
players_df = pd.read_csv(players_url)

# Individual player history
player_history_url = f"{base_url}player_idlist.csv"
player_list = pd.read_csv(player_history_url)
```

## Data Structure Comparison

| Source | Update Frequency | Historical Coverage | Additional Data |
|--------|------------------|-------------------|-----------------|
| FPL-Elo-Insights | Twice daily | 2025/26 + recent seasons | Cup competitions, Elo ratings |
| Vaastav Repository | 3x per season | 2016-2024 complete | Individual player histories |
| Kaggle datasets | Varies | Limited seasons | Often incomplete |
| Official FPL API | Live data only | Current season | Real-time updates |

## Alternative Sources

### Official FPL Sources
- **FPL Website Archives:** Limited historical data via [fantasy.premierleague.com/history](https://fantasy.premierleague.com/history)
- **FPL API:** Live data for current season only
  ```
  https://fantasy.premierleague.com/api/bootstrap-static/
  ```

### Community Datasets
- **Kaggle:** Various FPL datasets with varying completeness
- **Reddit r/fplAnalytics:** Community-shared datasets and tools
- **FPL Analytics Sites:** FPL Review, LiveFPL, FPL Optimized

### Fan-Run Tools
- **FPL Form:** Export and analysis tools
- **Fantasy Football Fix:** Premium analytics platform
- **FPL League History:** Streamlit app for league analysis

## Recommended Workflow

### For Most Users
1. **Current Season Data:** Use FPL-Elo-Insights for real-time updates and enhanced metrics
2. **Historical Analysis:** Use Vaastav's repository for seasons 2016-2024
3. **Combine Sources:** Merge datasets for comprehensive multi-season analysis

### For Developers
```python
# Example: Combining multiple seasons
import pandas as pd

# Historical data (2016-2024)
vaastav_base = "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data/"
seasons = ['2023-24', '2022-23', '2021-22']

historical_data = []
for season in seasons:
    url = f"{vaastav_base}{season}/cleaned_players.csv"
    df = pd.read_csv(url)
    df['season'] = season
    historical_data.append(df)

# Current season data
current_url = "https://raw.githubusercontent.com/olbauday/FPL-Elo-Insights/main/data/2025-26/gws/merged_gw.csv"
current_data = pd.read_csv(current_url)

# Combine datasets
all_seasons = pd.concat(historical_data, ignore_index=True)
```

## Data Quality and Reliability

### Strengths of Recommended Sources
- **Data Validation:** Both repositories include data cleaning and validation processes
- **Community Oversight:** Open-source nature allows for community verification
- **Consistent Structure:** Standardized CSV formats across seasons
- **Documentation:** Well-documented field definitions and data collection methods

### Best Practices
1. **Verify Data Freshness:** Check last update timestamps
2. **Cross-Reference:** Compare critical data points across sources
3. **Handle Missing Data:** Account for player transfers and incomplete gameweeks
4. **Backup Sources:** Maintain access to multiple data sources

## Technical Implementation

### Python Environment Setup
```bash
pip install pandas requests numpy matplotlib seaborn
```

### Basic Data Loading Template
```python
import pandas as pd
import requests
from datetime import datetime

def load_fpl_data(source='fpl-elo', season='2025-26', data_type='gameweek'):
    # Load FPL data from reliable sources
    # Args: source ('fpl-elo' or 'vaastav'), season ('YYYY-YY'), data_type ('gameweek', 'season', 'players')

    if source == 'fpl-elo':
        base_url = "https://raw.githubusercontent.com/olbauday/FPL-Elo-Insights/main/data/"
        if data_type == 'gameweek':
            url = f"{base_url}{season}/gws/merged_gw.csv"
        elif data_type == 'season':
            url = f"{base_url}{season}/season_summary.csv"

    elif source == 'vaastav':
        base_url = "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data/"
        if data_type == 'players':
            url = f"{base_url}{season}/cleaned_players.csv"
        elif data_type == 'gameweek':
            url = f"{base_url}{season}/gws/merged_gw.csv"

    try:
        df = pd.read_csv(url)
        print(f"Successfully loaded {len(df)} records from {source}")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

# Example usage
current_gw_data = load_fpl_data('fpl-elo', '2025-26', 'gameweek')
historical_data = load_fpl_data('vaastav', '2023-24', 'players')
```

## Conclusion

For reliable FPL historical data access:

1. **Primary Source:** FPL-Elo-Insights for current season and advanced analytics
2. **Historical Archive:** Vaastav's repository for comprehensive 2016-2024 data
3. **Integration Approach:** Combine both sources for complete analysis coverage

Both repositories maintain high data quality standards and enjoy strong community support, making them the most dependable sources for FPL data analysis and research.

## Links and Resources

### Primary Repositories
- [FPL-Elo-Insights](https://github.com/olbauday/FPL-Elo-Insights) - Current season, enhanced metrics
- [Vaastav FPL Repository](https://github.com/vaastav/Fantasy-Premier-League) - Historical data 2016-2024

### Official Sources
- [Fantasy Premier League](https://fantasy.premierleague.com/) - Official game website
- [FPL API Documentation](https://fantasy.premierleague.com/api/bootstrap-static/) - Live API endpoint

### Community Resources
- [r/FantasyPL](https://reddit.com/r/FantasyPL) - Main FPL community
- [r/fplAnalytics](https://reddit.com/r/fplAnalytics) - Data analysis community
- [FPL Review](https://fplreview.com/) - Analytics and tools

---

*This guide is maintained by the FPL data community. For updates and corrections, please refer to the original sources.*