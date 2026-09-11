import os
import json
import logging
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

logger = logging.getLogger("supabase_sync")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")


def _send_supabase_request(endpoint: str, method: str = "POST", data: dict = None):
    """
    Sends an HTTP request to Supabase REST API (PostgREST).
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase URL or Key not configured. Skipping sync.")
        return None

    url = f"{SUPABASE_URL}/rest/v1/{endpoint.lstrip('/')}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }

    body = json.dumps(data).encode("utf-8") if data else None

    req = Request(url, data=body, headers=headers, method=method)

    try:
        with urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            if res_body:
                return json.loads(res_body)
            return True
    except HTTPError as e:
        err_msg = e.read().decode("utf-8") if e.fp else str(e)
        logger.error(f"Supabase HTTP error on {method} {endpoint}: {e.code} - {err_msg}")
        print(f"[Supabase Sync Error] {method} {endpoint}: {e.code} - {err_msg}")
        return None
    except URLError as e:
        logger.error(f"Supabase Connection Error on {method} {endpoint}: {e.reason}")
        print(f"[Supabase Connection Error] {e.reason}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error syncing to Supabase: {str(e)}")
        print(f"[Supabase Unexpected Error] {str(e)}")
        return None


def sync_user_to_supabase(user_dict: dict):
    """
    Upserts user login / registration details into public.users table in Supabase.
    """
    if not user_dict:
        return None

    payload = {
        "id": str(user_dict.get("id")),
        "name": user_dict.get("name") or user_dict.get("email", "").split("@")[0] or "User",
        "email": user_dict.get("email"),
        "role": user_dict.get("role", "candidate"),
    }
    return _send_supabase_request("users", method="POST", data=payload)


def sync_grade_to_supabase(grade_dict: dict):
    """
    Upserts grade details given by admin into public.grades table in Supabase.
    """
    if not grade_dict:
        return None

    payload = {
        "id": str(grade_dict.get("id")),
        "submission_id": str(grade_dict.get("submission_id")),
        "ui": float(grade_dict.get("ui", 0)),
        "functionality": float(grade_dict.get("functionality", 0)),
        "github": float(grade_dict.get("github", 0)),
        "documentation": float(grade_dict.get("documentation", 0)),
        "innovation": float(grade_dict.get("innovation", 0)),
        "weekly_progress": float(grade_dict.get("weekly_progress", 0)),
        "total": float(grade_dict.get("total", 0)),
        "grade": str(grade_dict.get("grade", "N/A")),
        "published": bool(grade_dict.get("published", False)),
    }
    return _send_supabase_request("grades", method="POST", data=payload)


def sync_submission_to_supabase(sub_dict: dict):
    """
    Upserts completed project / submission details into public.submissions table in Supabase.
    """
    if not sub_dict:
        return None

    payload = {
        "id": str(sub_dict.get("id")),
        "user_id": str(sub_dict.get("user_id")),
        "week_id": str(sub_dict.get("week_id")),
        "github_url": sub_dict.get("github_url"),
        "deployed_url": sub_dict.get("deployed_url"),
        "linkedin_url": sub_dict.get("linkedin_url"),
        "reflection": sub_dict.get("reflection") or sub_dict.get("project_description"),
    }
    return _send_supabase_request("submissions", method="POST", data=payload)
