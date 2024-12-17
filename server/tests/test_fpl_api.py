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
            
            # 1. Core Data Structure Validation
            required_fields = {
                'picks': list,
                'transfers': dict,
                'stats': dict,
                'points_history': list,
                'chips': list,
                'last_deadline_value': int,  # Must be integer (in tenths of millions)
                'last_deadline_bank': int,   # Must be integer (in tenths of millions)
            }
            
            # Validate all required fields exist and have correct types
            for field, expected_type in required_fields.items():
                self.assertIn(field, data, f"Missing required field: {field}")
                self.assertIsInstance(
                    data[field], 
                    expected_type,
                    f"Field {field} should be type {expected_type}, got {type(data[field])}"
                )
                        
            # 2. Transfers Data Validation
            transfers = data['transfers']
            transfer_fields = {
                'limit': {'type': int, 'min': 0, 'max': 2},
                'made': {'type': int, 'min': 0},
                'bank': {'type': int, 'min': 0},
                'value': {'type': int, 'min': 950, 'max': 1200}  # 95.0m to 120.0m
            }
            
            for field, validations in transfer_fields.items():
                self.assertIn(field, transfers, f"Missing transfer field: {field}")
                value = transfers[field]
                self.assertIsInstance(
                    value,
                    validations['type'],
                    f"Transfer field {field} should be {validations['type']}, got {type(value)}"
                )
                self.assertGreaterEqual(value, validations['min'], 
                    f"{field} cannot be less than {validations['min']}")
                if 'max' in validations:
                    self.assertLessEqual(value, validations['max'],
                        f"{field} cannot be more than {validations['max']}")
            
            # 3. Team Value Validation
            value_fields = {
                'last_deadline_value': {'desc': "Team value", 'min': 950, 'max': 1200},
                'last_deadline_bank': {'desc': "Bank value", 'min': 0, 'max': 300}
            }
            
            for field, validation in value_fields.items():
                value = data[field]
                self.assertIsInstance(value, int, 
                    f"{validation['desc']} should be an integer")
                self.assertGreaterEqual(value, validation['min'],
                    f"{validation['desc']} cannot be less than £{validation['min']/10:.1f}m")
                self.assertLessEqual(value, validation['max'],
                    f"{validation['desc']} cannot be more than £{validation['max']/10:.1f}m")
            
            # 4. Statistics Validation
            stats = data['stats']
            stats_validation = {
                'event_points': {'type': int, 'min': 0, 'max': 200},
                'event_average': {'type': int, 'min': 0, 'max': 150},
                'event_rank': {'type': int, 'min': 1, 'max': 10000000},
                'overall_rank': {'type': int, 'min': 1, 'max': 10000000},
                'points_on_bench': {'type': int, 'min': 0, 'max': 100},
                'total_points': {'type': int, 'min': 0},
                'value': {'type': int, 'min': 950, 'max': 1200},
                'bank': {'type': int, 'min': 0, 'max': 300}
            }
            
            for field, validation in stats_validation.items():
                self.assertIn(field, stats, f"Missing stats field: {field}")
                value = stats[field]
                self.assertIsInstance(value, validation['type'],
                    f"Stats field {field} should be {validation['type']}")
                self.assertGreaterEqual(value, validation['min'],
                    f"{field} cannot be less than {validation['min']}")
                if 'max' in validation:
                    self.assertLessEqual(value, validation['max'],
                        f"{field} cannot be more than {validation['max']}")
            
            # 5. Points History Validation
            if data['points_history']:
                latest_gw = data['points_history'][-1]
                self.assertEqual(
                    latest_gw['average'],
                    stats['event_average'],
                    "Gameweek average points mismatch between history and stats"
                )
            
            print("\nTeam Data Validation Results:")
            print(f"Squad Value: £{data['last_deadline_value']/10:.1f}m")
            print(f"Bank Value: £{data['last_deadline_bank']/10:.1f}m")
            print(f"Free Transfers: {transfers['limit']}")
            print(f"Transfers Made: {transfers['made']}")
            print(f"Current GW Points: {stats['event_points']}")
            print(f"Average Points: {stats['event_average']}")
            print(f"Gameweek Rank: {stats['event_rank']}")
            print(f"Overall Rank: {stats['overall_rank']}")
            
        except Exception as e:
            self.fail(f"Test failed with error: {str(e)}")

    def test_bootstrap_static_structure(self):
        """Test /bootstrap-static endpoint data structure"""
        try:
            response = self._make_request(f"{self.BASE_URL}/bootstrap-static")
            data = response.json()
            
            required_fields = ['events', 'teams', 'elements']
            for field in required_fields:
                self.assertIn(field, data, f"Missing required field: {field}")
                self.assertIsInstance(data[field], list, f"{field} should be a list")
            
            # Find current gameweek
            current_gw = next(
                (e for e in data['events'] if e.get('is_current')), 
                None
            )
            
            self.assertIsNotNone(current_gw, "No current gameweek found")
            
            # Validate current gameweek data
            gw_required_fields = {
                'id': {'type': int, 'min': 1, 'max': 38},
                'average_entry_score': {'type': int, 'min': 0, 'max': 150},
                'highest_score': {'type': int, 'min': 0, 'max': 200},
                'is_current': {'type': bool}
            }
            
            for field, validation in gw_required_fields.items():
                self.assertIn(field, current_gw, f"Missing field in current gameweek: {field}")
                value = current_gw[field]
                self.assertIsInstance(
                    value,
                    validation['type'],
                    f"Gameweek field {field} should be {validation['type']}"
                )
                if 'min' in validation:
                    self.assertGreaterEqual(
                        value, 
                        validation['min'],
                        f"{field} cannot be less than {validation['min']}"
                    )
                if 'max' in validation:
                    self.assertLessEqual(
                        value,
                        validation['max'],
                        f"{field} cannot be more than {validation['max']}"
                    )
            
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