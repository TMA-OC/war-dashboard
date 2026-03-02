#!/usr/bin/env python3
"""
Vibe Agency — GitHub API helper
Centralizes all GitHub REST + GraphQL calls with:
  - Rate-limit awareness (pre-flight check + auto-sleep)
  - Batched GraphQL mutations (N Kanban moves = 1 API call)
  - Retry with exponential backoff on 429 / secondary rate limit
  - Shared constants for project/field IDs

Usage:
  python3 gh.py kanban-move <itemId> <statusOptionId>
  python3 gh.py kanban-batch <json: [[itemId, statusOptionId], ...]>
  python3 gh.py comment <owner/repo> <issue_number> <body>
  python3 gh.py open-pr <owner/repo> <title> <head> <base> <body>
  python3 gh.py check-rate
"""

import sys, os, json, time, subprocess

# ── Credentials ──────────────────────────────────────────────
def get_token():
    # Try env first, then secrets file
    t = os.environ.get("GITHUB_PAT") or os.environ.get("GH_TOKEN")
    if not t:
        try:
            for line in open("/home/node/.secrets"):
                if line.startswith("GITHUB_PAT="):
                    t = line.strip().split("=",1)[1]
                    break
        except Exception:
            pass
    if not t:
        raise RuntimeError("GITHUB_PAT not found in env or /home/node/.secrets")
    return t

TOKEN = get_token()

# ── Kanban constants ─────────────────────────────────────────
PROJECT_ID   = "PVT_kwHOD8j53M4BQgki"
STATUS_FIELD = "PVTSSF_lAHOD8j53M4BQgkizg-m1c4"

STATUS = {
    "backlog":    "6abcfa76",
    "ready":      "9946d03f",
    "in-progress":"776115c3",
    "in-review":  "45193b86",
    "qa":         "32bd0cb6",
    "waiting":    "066cddc4",
    "blocked":    "e7468017",
    "done":       "9a1c8787",
}

# Issue number → project item ID
ITEM_IDS = {
    2:  "PVTI_lAHOD8j53M4BQgkizgma20I",
    3:  "PVTI_lAHOD8j53M4BQgkizgma20Q",
    4:  "PVTI_lAHOD8j53M4BQgkizgma20k",
    5:  "PVTI_lAHOD8j53M4BQgkizgma208",
    6:  "PVTI_lAHOD8j53M4BQgkizgma21U",
    7:  "PVTI_lAHOD8j53M4BQgkizgma21s",
    8:  "PVTI_lAHOD8j53M4BQgkizgma22I",
    9:  "PVTI_lAHOD8j53M4BQgkizgma22k",
    10: "PVTI_lAHOD8j53M4BQgkizgma23I",
    11: "PVTI_lAHOD8j53M4BQgkizgma23U",
    12: "PVTI_lAHOD8j53M4BQgkizgma23k",
    13: "PVTI_lAHOD8j53M4BQgkizgma23w",
    14: "PVTI_lAHOD8j53M4BQgkizgma244",
    15: "PVTI_lAHOD8j53M4BQgkizgma26s",
    16: "PVTI_lAHOD8j53M4BQgkizgma27o",
    17: "PVTI_lAHOD8j53M4BQgkizgma278",
    18: "PVTI_lAHOD8j53M4BQgkizgma28Q",
    19: "PVTI_lAHOD8j53M4BQgkizgma28s",
    20: "PVTI_lAHOD8j53M4BQgkizgma29I",
    21: "PVTI_lAHOD8j53M4BQgkizgma29s",
    22: "PVTI_lAHOD8j53M4BQgkizgma2-g",
    23: "PVTI_lAHOD8j53M4BQgkizgma2-8",
}

# ── Core HTTP ─────────────────────────────────────────────────
def _headers():
    return ["-H", f"Authorization: Bearer {TOKEN}",
            "-H", "Content-Type: application/json",
            "-H", "Accept: application/vnd.github+json"]

def _check_rate_limit():
    """Returns (remaining, reset_epoch). Blocks if < 5 remaining."""
    r = subprocess.run(
        ["curl","-s"] + _headers() + ["https://api.github.com/rate_limit"],
        capture_output=True, text=True
    )
    d = json.loads(r.stdout)
    core = d["resources"]["core"]
    remaining, reset = core["remaining"], core["reset"]
    if remaining < 5:
        wait = max(0, reset - time.time()) + 3
        print(f"⏳ Rate limit low ({remaining} left). Sleeping {wait:.0f}s ...", file=sys.stderr)
        time.sleep(wait)
    return remaining, reset

def _rest(method, path, body=None, retries=3):
    _check_rate_limit()
    url = f"https://api.github.com{path}"
    args = ["curl","-s","-X",method] + _headers() + [url]
    if body:
        args += ["-d", json.dumps(body)]
    for attempt in range(retries):
        r = subprocess.run(args, capture_output=True, text=True)
        d = json.loads(r.stdout)
        if isinstance(d, dict) and "secondary rate limit" in str(d.get("message","")):
            wait = 60 * (2 ** attempt)
            print(f"⏳ Secondary rate limit. Sleeping {wait}s ...", file=sys.stderr)
            time.sleep(wait)
            continue
        return d
    raise RuntimeError("Rate limit retries exhausted")

def _graphql(query, retries=3):
    _check_rate_limit()
    args = ["curl","-s"] + _headers() + [
        "https://api.github.com/graphql", "-d", json.dumps({"query": query})
    ]
    for attempt in range(retries):
        r = subprocess.run(args, capture_output=True, text=True)
        d = json.loads(r.stdout)
        if "rate limit" in str(d.get("errors","")).lower():
            # Read reset from rate limit endpoint
            rl = json.loads(subprocess.run(
                ["curl","-s"] + _headers() + ["https://api.github.com/rate_limit"],
                capture_output=True, text=True).stdout)
            wait = max(0, rl["resources"]["graphql"].get("reset", time.time()+61) - time.time()) + 3
            print(f"⏳ GraphQL rate limit. Sleeping {wait:.0f}s ...", file=sys.stderr)
            time.sleep(wait)
            continue
        return d
    raise RuntimeError("GraphQL rate limit retries exhausted")

# ── Kanban ────────────────────────────────────────────────────
def _move_mutation(alias, item_id, status_id):
    return f"""
  {alias}: updateProjectV2ItemFieldValue(input: {{
    projectId: "{PROJECT_ID}",
    itemId: "{item_id}",
    fieldId: "{STATUS_FIELD}",
    value: {{ singleSelectOptionId: "{status_id}" }}
  }}) {{ projectV2Item {{ id }} }}"""

def kanban_batch(moves):
    """
    moves: list of (item_id_or_issue_num, status_name_or_id)
    All moves in ONE GraphQL request.
    """
    mutations = []
    for i, (item, status) in enumerate(moves):
        item_id = ITEM_IDS.get(int(item), item) if str(item).isdigit() else item
        status_id = STATUS.get(status.lower(), status)
        mutations.append(_move_mutation(f"m{i}", item_id, status_id))
    query = "mutation {" + "\n".join(mutations) + "\n}"
    result = _graphql(query)
    errors = result.get("errors", [])
    if errors:
        print(f"❌ Errors: {errors}", file=sys.stderr)
        return False
    data = result.get("data", {})
    ok = sum(1 for v in data.values() if v)
    print(f"✅ Moved {ok}/{len(moves)} cards in 1 API call")
    return True

def kanban_move(item_id, status_id):
    return kanban_batch([(item_id, status_id)])

# ── Comments ──────────────────────────────────────────────────
def post_comment(repo, issue_num, body):
    r = _rest("POST", f"/repos/{repo}/issues/{issue_num}/comments", {"body": body})
    url = r.get("html_url", r.get("message", "?"))
    print(f"💬 Comment: {url}")
    return url

# ── Pull Requests ─────────────────────────────────────────────
def open_pr(repo, title, head, base, body):
    r = _rest("POST", f"/repos/{repo}/pulls", {
        "title": title, "head": head, "base": base, "body": body
    })
    url = r.get("html_url", r.get("message", "?"))
    print(f"🔀 PR: {url}")
    return url

# ── Rate check ────────────────────────────────────────────────
def check_rate():
    r = subprocess.run(
        ["curl","-s"] + _headers() + ["https://api.github.com/rate_limit"],
        capture_output=True, text=True
    )
    d = json.loads(r.stdout)
    for name, v in d["resources"].items():
        if v["limit"] > 0:
            reset = time.strftime("%H:%M UTC", time.gmtime(v["reset"]))
            print(f"  {name:25} {v['remaining']:5}/{v['limit']:5}  resets {reset}")

# ── CLI ───────────────────────────────────────────────────────
if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"

    if cmd == "check-rate":
        check_rate()

    elif cmd == "kanban-move":
        # gh.py kanban-move <item_id_or_issue_num> <status>
        kanban_move(sys.argv[2], sys.argv[3])

    elif cmd == "kanban-batch":
        # gh.py kanban-batch '[[issue_num_or_item_id, status], ...]'
        moves = json.loads(sys.argv[2])
        kanban_batch(moves)

    elif cmd == "kanban-milestone":
        # gh.py kanban-milestone <status> <issue_num1> <issue_num2> ...
        status = sys.argv[2]
        issues = sys.argv[3:]
        kanban_batch([(n, status) for n in issues])

    elif cmd == "comment":
        post_comment(sys.argv[2], sys.argv[3], sys.argv[4])

    elif cmd == "open-pr":
        open_pr(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])

    else:
        print(__doc__)
