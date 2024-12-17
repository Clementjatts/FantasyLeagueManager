import unittest
import requests
import json
import os
import time
from datetime import datetime

class TestFPLAPI(unittest.TestCase):
    BASE_URL = "http://0.0.0.0:5000/api/fpl"
    TEAM_ID = 1043043  # Using the team ID from the logs
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds

    def setUp(self):
        """Set up test fixtures"""
        self.session = requests.Session()

    def _make_request(self, url, method='get', **kwargs):
        """Make a request with retry logic"""
        for attempt in range(self.MAX_RETRIES):
            try:
                response = getattr(self.session, method)(url, **kwargs)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                print(f"\nAttempt {attempt + 1} failed: {str(e)}")
                if attempt < self.MAX_RETRIES - 1:
                    print(f"Retrying in {self.RETRY_DELAY} seconds...")
                    time.sleep(self.RETRY_DELAY)
                else:
                    raise

    def test_my_team_structure(self):
        """Test /my-team endpoint data structure and validate dashboard specific data"""
        try:
            response = self._make_request(f"{self.BASE_URL}/my-team/{self.TEAM_ID}/")
            data = response.json()
            
            # Detailed validation of team data structure
            required_fields = {
                'picks': list,
                'transfers': dict,
                'last_deadline_value': int,
                'last_deadline_bank': int,
                'stats': dict,
                'points_history': list  # For average points validation
            }
            
            for field, expected_type in required_fields.items():
                self.assertIn(field, data, f"Missing required field: {field}")
                self.assertIsInstance(data[field], expected_type, 
                    f"Field {field} should be type {expected_type}")
            
            # Validate transfers data (free transfers)
            self.assertIn('limit', data['transfers'], "Missing 'limit' in transfers data")
            self.assertIsInstance(data['transfers']['limit'], int)
            self.assertGreaterEqual(data['transfers']['limit'], 0, 
                "Free transfers should be non-negative")
            self.assertLessEqual(data['transfers']['limit'], 2, 
                "Free transfers should not exceed 2 under normal circumstances")
            
            # Validate team value and bank with detailed validation
            self.assertIn('last_deadline_value', data, "Missing team value")
            self.assertIn('last_deadline_bank', data, "Missing bank value")
            self.assertGreater(data['last_deadline_value'], 0, "Team value should be greater than 0")
            
            team_value = data['last_deadline_value'] / 10
            bank_value = data['last_deadline_bank'] / 10
            total_value = team_value + bank_value
            
            # Squad value validation with specific range checks
            self.assertTrue(80 <= team_value <= 120, 
                f"Team value £{team_value}m outside reasonable range (80-120)")
            self.assertTrue(0 <= bank_value <= 30,
                f"Bank value £{bank_value}m outside reasonable range (0-30)")
            
            # Validate free transfers
            self.assertIn('transfers', data, "Missing transfers data")
            self.assertIn('limit', data['transfers'], "Missing free transfers limit")
            free_transfers = data['transfers']['limit']
            self.assertIsInstance(free_transfers, int, "Free transfers should be an integer")
            self.assertGreaterEqual(free_transfers, 0, "Free transfers cannot be negative")
            self.assertLessEqual(free_transfers, 2, "Free transfers shouldn't exceed 2 under normal circumstances")
            
            # Validate average points
            if 'stats' in data:
                stats = data['stats']
                self.assertIn('event_average', stats, "Missing event average points")
                avg_points = stats['event_average']
                self.assertIsInstance(avg_points, (int, float), "Average points should be numeric")
                self.assertGreaterEqual(avg_points, 0, "Average points cannot be negative")
                self.assertLessEqual(avg_points, 150, "Average points seem unreasonably high")
                
                # Gameweek rank validation
                self.assertIn('event_rank', stats, "Missing gameweek rank")
                gw_rank = stats['event_rank']
                self.assertIsInstance(gw_rank, int, "Gameweek rank should be an integer")
                self.assertGreater(gw_rank, 0, "Gameweek rank should be positive")
                self.assertLessEqual(gw_rank, 10000000, "Gameweek rank seems unreasonably high")
            
            # Gameweek rank validation
            if 'stats' in data:
                self.assertIn('event_rank', data['stats'], "Missing gameweek rank")
                rank = data['stats'].get('event_rank')
                if rank is not None:
                    self.assertIsInstance(rank, int, "Gameweek rank should be an integer")
                    self.assertGreater(rank, 0, "Gameweek rank should be positive")
                
                # Validate average points
                self.assertIn('event_average', data['stats'], "Missing average points")
                avg_points = data['stats'].get('event_average')
                if avg_points is not None:
                    self.assertIsInstance(avg_points, (int, float), 
                        "Average points should be numeric")
                    self.assertGreaterEqual(avg_points, 0, 
                        "Average points should be non-negative")
            
            print("\nTeam Data Validation Results:")
            print(f"Squad Value: £{team_value:.1f}m")
            print(f"Bank Value: £{bank_value:.1f}m")
            print(f"Total Value: £{total_value:.1f}m")
            print(f"Free Transfers: {data['transfers']['limit']}")
            
            if 'stats' in data:
                print(f"Current GW Points: {data['stats'].get('event_points', 'N/A')}")
                print(f"Average Points: {data['stats'].get('event_average', 'N/A')}")
                print(f"Gameweek Rank: {data['stats'].get('event_rank', 'N/A')}")
                print(f"Overall Rank: {data['stats'].get('overall_rank', 'N/A')}")
        
        except Exception as e:
            self.fail(f"Test failed with error: {str(e)}")

    def test_bootstrap_static_structure(self):
        """Test /bootstrap-static endpoint data structure"""
        try:
            response = self._make_request(f"{self.BASE_URL}/bootstrap-static")
            data = response.json()
            
            # Detailed validation of bootstrap data
            required_fields = ['events', 'teams', 'elements']
            for field in required_fields:
                self.assertIn(field, data, f"Missing required field: {field}")
                self.assertIsInstance(data[field], list, f"{field} should be a list")
            
            # Validate current gameweek data
            current_gw = next((e for e in data['events'] if e.get('is_current')), None)
            self.assertIsNotNone(current_gw, "No current gameweek found")
            
            gw_required_fields = ['average_entry_score', 'highest_score', 'is_current']
            for field in gw_required_fields:
                self.assertIn(field, current_gw, f"Missing field in current gameweek: {field}")
            
            print("\nGameweek Data Validation:")
            print(f"Current GW: {current_gw['id']}")
            print(f"Average Score: {current_gw['average_entry_score']}")
            print(f"Highest Score: {current_gw['highest_score']}")
            
        except Exception as e:
            self.fail(f"Test failed with error: {str(e)}")

    def test_players_endpoint(self):
        """Test /players endpoint data structure"""
        try:
            response = self._make_request(f"{self.BASE_URL}/players")
            players = response.json()
            
            self.assertIsInstance(players, list, "Players endpoint should return a list")
            self.assertGreater(len(players), 0, "Players list should not be empty")
            
            # Validate player data structure
            required_fields = {
                'id': int,
                'web_name': str,
                'now_cost': int,
                'total_points': int,
                'minutes': int,
                'form': (str, float),  # Accept either string or float
                'points_per_game': (str, float),
                'selected_by_percent': (str, float),
                'transfers_in_event': int,
                'transfers_out_event': int
            }
            
            player = players[0]
            for field, expected_types in required_fields.items():
                self.assertIn(field, player, f"Missing required field: {field}")
                if not isinstance(expected_types, tuple):
                    expected_types = (expected_types,)
                self.assertTrue(
                    any(isinstance(player[field], t) for t in expected_types),
                    f"Field {field} should be one of types {expected_types}"
                )
            
            print("\nPlayer Data Validation:")
            print(f"Total Players: {len(players)}")
            print(f"Sample Player: {player['web_name']}")
            print(f"Cost: £{player['now_cost']/10}m")
            print(f"Form: {player['form']}")
            print(f"Points Per Game: {player['points_per_game']}")
            
        except Exception as e:
            self.fail(f"Test failed with error: {str(e)}")

if __name__ == '__main__':
    unittest.main(verbosity=2)
