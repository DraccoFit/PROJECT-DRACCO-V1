#!/usr/bin/env python3
"""
Backend API Testing Suite for Fitness App
Tests all major endpoints to ensure proper functionality
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://344dff83-6144-403b-a4cb-54c43d2fb8c9.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class FitnessAppTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message="", details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = self.make_request("GET", "/health", auth_required=False)
        
        if response is None:
            self.log_result("Health Check", False, "Request failed", "Could not connect to server")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "Server is healthy")
                    return True
                else:
                    self.log_result("Health Check", False, "Unexpected response format", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("Health Check", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Health Check", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        user_data = {
            "email": test_email,
            "password": "SecurePass123!",
            "full_name": "Maria Rodriguez"
        }
        
        response = self.make_request("POST", "/register", user_data, auth_required=False)
        
        if response is None:
            self.log_result("User Registration", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "access_token" in data and data.get("token_type") == "bearer":
                    self.auth_token = data["access_token"]
                    self.log_result("User Registration", True, "User registered successfully")
                    return True
                else:
                    self.log_result("User Registration", False, "Missing token in response", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("User Registration", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("User Registration", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user for login test
        test_email = f"logintest_{uuid.uuid4().hex[:8]}@example.com"
        register_data = {
            "email": test_email,
            "password": "LoginTest123!",
            "full_name": "Carlos Mendez"
        }
        
        # Register user
        reg_response = self.make_request("POST", "/register", register_data, auth_required=False)
        if not reg_response or reg_response.status_code != 200:
            self.log_result("User Login", False, "Failed to create test user for login")
            return False
        
        # Now test login
        login_data = {
            "email": test_email,
            "password": "LoginTest123!"
        }
        
        response = self.make_request("POST", "/login", login_data, auth_required=False)
        
        if response is None:
            self.log_result("User Login", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "access_token" in data and data.get("token_type") == "bearer":
                    self.log_result("User Login", True, "Login successful")
                    return True
                else:
                    self.log_result("User Login", False, "Missing token in response", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("User Login", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("User Login", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_get_profile(self):
        """Test getting user profile"""
        if not self.auth_token:
            self.log_result("Get Profile", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/profile")
        
        if response is None:
            self.log_result("Get Profile", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "email" in data and "full_name" in data:
                    self.user_id = data.get("id")
                    self.log_result("Get Profile", True, "Profile retrieved successfully")
                    return True
                else:
                    self.log_result("Get Profile", False, "Missing profile fields", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Profile", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Profile", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_user_evaluation(self):
        """Test user evaluation update"""
        if not self.auth_token:
            self.log_result("User Evaluation", False, "No auth token available")
            return False
        
        evaluation_data = {
            "age": 28,
            "gender": "female",
            "weight": 65.0,
            "height": 165.0,
            "activity_level": "moderately_active",
            "goal": "lose_weight",
            "experience_level": "intermediate",
            "health_conditions": [],
            "food_preferences": ["vegetarian"],
            "food_allergies": ["nuts"],
            "available_days": ["monday", "wednesday", "friday"],
            "preferred_workout_time": "morning",
            "equipment_available": ["dumbbells", "yoga_mat"]
        }
        
        response = self.make_request("PUT", "/evaluation", evaluation_data)
        
        if response is None:
            self.log_result("User Evaluation", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data and "tmb" in data and "daily_calories" in data:
                    self.log_result("User Evaluation", True, f"Evaluation updated - TMB: {data['tmb']}, Calories: {data['daily_calories']}")
                    return True
                else:
                    self.log_result("User Evaluation", False, "Missing calculation results", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("User Evaluation", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("User Evaluation", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_exercises(self):
        """Test exercise endpoints"""
        if not self.auth_token:
            self.log_result("Exercise Endpoints", False, "No auth token available")
            return False
        
        # First initialize default data
        init_response = self.make_request("POST", "/initialize-data")
        
        # Test getting exercises
        response = self.make_request("GET", "/exercises", auth_required=False)
        
        if response is None:
            self.log_result("Exercise Endpoints", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Exercise Endpoints", True, f"Retrieved {len(data)} exercises")
                    return True
                else:
                    self.log_result("Exercise Endpoints", False, "Expected list response", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("Exercise Endpoints", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Exercise Endpoints", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_water_intake(self):
        """Test water intake tracking"""
        if not self.auth_token:
            self.log_result("Water Intake", False, "No auth token available")
            return False
        
        # Add water intake
        intake_data = {
            "amount_ml": 250.0,
            "goal_ml": 2000.0
        }
        
        response = self.make_request("POST", "/water-intake", intake_data)
        
        if response is None:
            self.log_result("Water Intake", False, "Request failed")
            return False
        
        if response.status_code == 200:
            # Test getting today's water intake
            today_response = self.make_request("GET", "/water-intake/today")
            
            if today_response and today_response.status_code == 200:
                try:
                    data = today_response.json()
                    if "total_intake" in data and "goal" in data:
                        self.log_result("Water Intake", True, f"Water intake tracked - Total: {data['total_intake']}ml")
                        return True
                    else:
                        self.log_result("Water Intake", False, "Missing intake data", str(data))
                        return False
                except json.JSONDecodeError:
                    self.log_result("Water Intake", False, "Invalid JSON response", today_response.text)
                    return False
            else:
                self.log_result("Water Intake", False, "Failed to get today's intake")
                return False
        else:
            self.log_result("Water Intake", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_notifications(self):
        """Test notification endpoints"""
        if not self.auth_token:
            self.log_result("Notifications", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/notifications")
        
        if response is None:
            self.log_result("Notifications", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Notifications", True, f"Retrieved {len(data)} notifications")
                    return True
                else:
                    self.log_result("Notifications", False, "Expected list response", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("Notifications", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Notifications", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_nutrition_plans(self):
        """Test nutrition plan endpoints - NEEDS RETESTING"""
        if not self.auth_token:
            self.log_result("Nutrition Plans", False, "No auth token available")
            return False
        
        # Test getting nutrition plans
        response = self.make_request("GET", "/nutrition-plans")
        
        if response is None:
            self.log_result("Nutrition Plans", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    # Test generating a nutrition plan
                    gen_response = self.make_request("POST", "/nutrition-plans/generate")
                    
                    if gen_response and gen_response.status_code == 200:
                        gen_data = gen_response.json()
                        if "message" in gen_data and "plan_id" in gen_data:
                            self.log_result("Nutrition Plans", True, "Nutrition plan generation working")
                            return True
                        else:
                            self.log_result("Nutrition Plans", False, "Plan generation missing data", str(gen_data))
                            return False
                    else:
                        error_msg = gen_response.text if gen_response else "Request failed"
                        self.log_result("Nutrition Plans", False, f"Plan generation failed: HTTP {gen_response.status_code if gen_response else 'None'}", error_msg)
                        return False
                else:
                    self.log_result("Nutrition Plans", False, "Expected list response", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("Nutrition Plans", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Nutrition Plans", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_workout_plans(self):
        """Test workout plan endpoints - NEEDS RETESTING"""
        if not self.auth_token:
            self.log_result("Workout Plans", False, "No auth token available")
            return False
        
        # Test getting workout plans
        response = self.make_request("GET", "/workout-plans")
        
        if response is None:
            self.log_result("Workout Plans", False, "Request failed")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    # Test generating a workout plan
                    gen_response = self.make_request("POST", "/workout-plans/generate")
                    
                    if gen_response and gen_response.status_code == 200:
                        gen_data = gen_response.json()
                        if "message" in gen_data and "plan_id" in gen_data:
                            self.log_result("Workout Plans", True, "Workout plan generation working")
                            return True
                        else:
                            self.log_result("Workout Plans", False, "Plan generation missing data", str(gen_data))
                            return False
                    else:
                        error_msg = gen_response.text if gen_response else "Request failed"
                        self.log_result("Workout Plans", False, f"Plan generation failed: HTTP {gen_response.status_code if gen_response else 'None'}", error_msg)
                        return False
                else:
                    self.log_result("Workout Plans", False, "Expected list response", str(data))
                    return False
            except json.JSONDecodeError:
                self.log_result("Workout Plans", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Workout Plans", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Fitness App Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Get Profile", self.test_get_profile),
            ("User Evaluation", self.test_user_evaluation),
            ("Exercise Endpoints", self.test_exercises),
            ("Water Intake", self.test_water_intake),
            ("Notifications", self.test_notifications),
            ("Nutrition Plans", self.test_nutrition_plans),
            ("Workout Plans", self.test_workout_plans),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if success:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_result(test_name, False, "Test exception", str(e))
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return passed, failed, self.test_results

def main():
    tester = FitnessAppTester()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()