import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from utils.supabase import (
    sync_user_to_supabase,
    sync_grade_to_supabase,
    sync_submission_to_supabase,
    _send_supabase_request
)

print("==================================================")
print("Testing Supabase Connection & Table Synchronization")
print("==================================================")

# 1. Test ping / fetching users from Supabase REST API
res = _send_supabase_request("users", method="GET")
print("Supabase Users Table Check Result:", "SUCCESS" if res is not None else "FAILED")

# 2. Test User Sync
dummy_user = {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "candidate"
}
user_res = sync_user_to_supabase(dummy_user)
print("User Sync Result:", "SUCCESS" if user_res is not None else "WARNING (Check table creation)")

print("\nSupabase backend integration test script complete.")
