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
            
            # Enhanced validation of team data structure with specific type checks
            required_fields = {
                'picks': list,
                'transfers': dict,
                'last_deadline_value': int,  # Must be integer (in tenths of millions)
                'last_deadline_bank': int,   # Must be integer (in tenths of millions)
                'stats': dict,
                'points_history': list,
                'chips': list
            }
            
            for field, expected_type in required_fields.items():
                self.assertIn(field, data, f"Missing required field: {field}")
                if isinstance(expected_type, tuple):
                    self.assertTrue(
                        any(isinstance(data[field], t) for t in expected_type),
                        f"Field {field} should be one of types {expected_type}"
                    )
                else:
                    self.assertIsInstance(data[field], expected_type,
                        f"Field {field} should be type {expected_type}")
                        
            # Validate the structure of required nested fields
            transfer_fields = {'limit', 'made', 'bank', 'value'}
            stats_fields = {'event_points', 'event_average', 'overall_rank', 'event_rank'}
            
            for field in transfer_fields:
                self.assertIn(field, data['transfers'], f"Missing transfer field: {field}")
                
            for field in stats_fields:
                self.assertIn(field, data['stats'], f"Missing stats field: {field}")
            
            # Enhanced transfers validation
            self.assertIn('transfers', data, "Missing transfers data")
            transfers = data['transfers']
            self.assertIn('limit', transfers, "Missing free transfers limit")
            self.assertIn('made', transfers, "Missing transfers made count")
            self.assertIn('bank', transfers, "Missing transfer bank value")
            self.assertIn('value', transfers, "Missing transfer team value")
            
            free_transfers = transfers['limit']
            transfers_made = transfers['made']
            
            # Validate transfer limits and logic with enhanced precision
            self.assertIsInstance(free_transfers, int, "Free transfers should be an integer")
            self.assertGreaterEqual(free_transfers, 0, "Free transfers cannot be negative")
            self.assertLessEqual(free_transfers, 2, "Free transfers shouldn't exceed 2 under normal circumstances")
            self.assertGreaterEqual(transfers_made, 0, "Transfers made cannot be negative")
            
            # Enhanced team value validation matching FPL API format (integers in tenths of millions)
            self.assertIsInstance(data['last_deadline_value'], int, "Team value should be an integer")
            self.assertIsInstance(data['last_deadline_bank'], int, "Bank value should be an integer")
            
            team_value = data['last_deadline_value'] / 10.0  # Convert to decimal for range validation
            bank_value = data['last_deadline_bank'] / 10.0
            total_value = team_value + bank_value
            
            # Initial team value is 100m, validate reasonable ranges
            self.assertTrue(80 <= team_value <= 120, 
                f"Team value £{team_value}m outside reasonable range (80-120)")
            self.assertTrue(0 <= bank_value <= 30,
                f"Bank value £{bank_value}m outside reasonable range (0-30)")
            self.assertTrue(95 <= total_value <= 120,
                f"Total team value £{total_value}m outside reasonable range (95-120)")
            
            free_transfers = transfers['limit']
            transfers_made = transfers['made']
            
            # Validate transfer limits and logic with enhanced precision
            self.assertIsInstance(free_transfers, int, "Free transfers should be an integer")
            self.assertGreaterEqual(free_transfers, 0, "Free transfers cannot be negative")
            self.assertLessEqual(free_transfers, 2, "Free transfers shouldn't exceed 2 under normal circumstances")
            self.assertGreaterEqual(transfers_made, 0, "Transfers made cannot be negative")
            
            # Enhanced team value validation matching FPL API format (integers in tenths of millions)
            self.assertIsInstance(data['last_deadline_value'], int, "Team value should be an integer")
            self.assertIsInstance(data['last_deadline_bank'], int, "Bank value should be an integer")
            
            team_value = data['last_deadline_value'] / 10.0  # Convert to decimal for range validation
            bank_value = data['last_deadline_bank'] / 10.0
            total_value = team_value + bank_value
            
            # Initial team value is 100m, validate reasonable ranges
            self.assertTrue(80 <= team_value <= 120, 
                f"Team value £{team_value}m outside reasonable range (80-120)")
            self.assertTrue(0 <= bank_value <= 30,
                f"Bank value £{bank_value}m outside reasonable range (0-30)")
            self.assertTrue(95 <= total_value <= 120,
                f"Total team value £{total_value}m outside reasonable range (95-120)")
            
            # Enhanced average points validation with strict type checking
            if 'stats' in data:
                stats = data['stats']
                self.assertIn('event_average', stats, "Missing event average points")
                self.assertIn('event_points', stats, "Missing current gameweek points")
                
                avg_points = stats['event_average']
                current_points = stats['event_points']
                
                # Enhanced validation for points data
                def validate_points_data(points, field_name):
                    self.assertIsInstance(points, (int, float), f"{field_name} should be numeric")
                    self.assertGreaterEqual(points, 0, f"{field_name} cannot be negative")
                    self.assertLessEqual(points, 150, f"{field_name} seems unreasonably high")
                    return True

                validate_points_data(avg_points, "Average points")
                validate_points_data(current_points, "Current points")
                
                # Verify the latest gameweek points matches the stats
                if data['points_history']:
                    latest_gw = data['points_history'][-1]
                    self.assertEqual(
                        latest_gw['average'],
                        data['stats']['event_average'],
                        "Gameweek average points mismatch between history and stats"
                    )
                
                # Validate point calculations
                if 'points_history' in data:
                    latest_gw = data['points_history'][-1] if data['points_history'] else None
                    if latest_gw:
                        self.assertEqual(latest_gw['average'], avg_points, 
                            "Event average should match points history")
                
                # Current GW points validation
                self.assertIsInstance(current_points, (int, float), "Current points should be numeric")
                self.assertGreaterEqual(current_points, 0, "Current points cannot be negative")
                self.assertLessEqual(current_points, 200, "Current points seem unreasonably high")
                
                # Enhanced gameweek rank validation
                self.assertIn('event_rank', stats, "Missing gameweek rank")
                self.assertIn('overall_rank', stats, "Missing overall rank")
                
                gw_rank = stats['event_rank']
                overall_rank = stats['overall_rank']
                
                # Rank validations with reasonable constraints
                self.assertIsInstance(gw_rank, int, "Gameweek rank should be an integer")
                self.assertIsInstance(overall_rank, int, "Overall rank should be an integer")
                self.assertGreater(gw_rank, 0, "Gameweek rank should be positive")
                self.assertGreater(overall_rank, 0, "Overall rank should be positive")
                self.assertLessEqual(gw_rank, 10000000, "Gameweek rank seems unreasonably high")
                self.assertLessEqual(overall_rank, 10000000, "Overall rank seems unreasonably high")
                
                # Validate rank changes are tracked
                if 'rank_sort' in stats:
                    previous_rank = stats['rank_sort']
                    self.assertIsInstance(previous_rank, int, "Previous rank should be an integer")
                    self.assertGreaterEqual(previous_rank, 0, "Previous rank cannot be negative")
            
            print("\nTeam Data Validation Results:")
            print(f"Squad Value: £{team_value:.1f}m")
            print(f"Bank Value: £{bank_value:.1f}m")
            print(f"Total Value: £{total_value:.1f}m")
            print(f"Free Transfers: {free_transfers}")
            print(f"Transfers Made: {transfers_made}")
            
            if 'stats' in data:
                print(f"Current GW Points: {data['stats'].get('event_points', 'N/A')}")
                print(f"Average Points: {data['stats'].get('event_average', 'N/A')}")
                print(f"Gameweek Rank: {data['stats'].get('event_rank', 'N/A')}")
                print(f"Overall Rank: {data['stats'].get('overall_rank', 'N/A')}")
                if 'rank_sort' in data['stats']:
                    print(f"Previous Rank: {data['stats']['rank_sort']}")
        
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
