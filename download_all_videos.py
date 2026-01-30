"""
Batch download all vestibular exercise videos from Vimeo
Uses the embed URL format which works without authentication
"""

import json
import subprocess
import os
import sys
from pathlib import Path

# Configuration
BASE_DIR = Path("D:/ChiroClickCRM-Complete-EHR-CRM-System-Architecture")
OUTPUT_DIR = BASE_DIR / "exercise_videos"
SEED_FILE = BASE_DIR / "backend/src/data/vestibular-exercises-seed.json"
PROGRESS_FILE = BASE_DIR / "download_progress.json"

def load_progress():
    """Load download progress from file"""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"completed": [], "failed": []}

def save_progress(progress):
    """Save download progress to file"""
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)

def download_video(vimeo_id, name, category):
    """Download a single video using yt-dlp"""
    # Clean up category name for folder
    safe_category = category.replace("/", "-").replace("\\", "-").replace(" ", "_")
    category_dir = OUTPUT_DIR / safe_category
    category_dir.mkdir(parents=True, exist_ok=True)

    # Clean up name for filename
    safe_name = name.replace("/", "-").replace("\\", "-").replace(":", "-").replace("\"", "").replace("?", "")
    output_path = category_dir / f"{vimeo_id}_{safe_name}.%(ext)s"

    url = f"https://player.vimeo.com/video/{vimeo_id}"

    cmd = [
        sys.executable, "-m", "yt_dlp",
        "-o", str(output_path),
        "--merge-output-format", "mp4",
        url
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print(f"[OK] Downloaded: {name} ({vimeo_id})")
            return True
        else:
            print(f"[FAIL] Failed: {name} ({vimeo_id}) - {result.stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"[TIMEOUT] Timeout: {name} ({vimeo_id})")
        return False
    except Exception as e:
        print(f"[ERROR] Error: {name} ({vimeo_id}) - {str(e)}")
        return False

def main():
    print("=" * 60)
    print("Vestibular Exercise Video Downloader")
    print("=" * 60)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load seed data
    with open(SEED_FILE) as f:
        data = json.load(f)

    exercises = data["exercises"]
    total = len(exercises)

    # Filter only exercises with Vimeo IDs
    exercises_with_video = [e for e in exercises if e.get("vimeoId")]
    print(f"Found {len(exercises_with_video)} exercises with videos out of {total} total")

    # Load progress
    progress = load_progress()
    completed = set(progress["completed"])
    failed = set(progress["failed"])

    print(f"Already completed: {len(completed)}")
    print(f"Previously failed: {len(failed)}")

    # Download videos
    for i, exercise in enumerate(exercises_with_video, 1):
        vimeo_id = exercise["vimeoId"]
        name = exercise["name"]
        category = exercise["category"]

        # Skip already completed
        if vimeo_id in completed:
            continue

        print(f"\n[{i}/{len(exercises_with_video)}] Downloading: {name}")

        success = download_video(vimeo_id, name, category)

        if success:
            completed.add(vimeo_id)
            if vimeo_id in failed:
                failed.remove(vimeo_id)
        else:
            failed.add(vimeo_id)

        # Save progress after each download
        progress["completed"] = list(completed)
        progress["failed"] = list(failed)
        save_progress(progress)

    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)
    print(f"Total completed: {len(completed)}")
    print(f"Total failed: {len(failed)}")

    if failed:
        print("\nFailed videos:")
        for vid in failed:
            print(f"  - {vid}")

    print(f"\nVideos saved to: {OUTPUT_DIR}")
    print(f"Progress saved to: {PROGRESS_FILE}")

if __name__ == "__main__":
    main()
