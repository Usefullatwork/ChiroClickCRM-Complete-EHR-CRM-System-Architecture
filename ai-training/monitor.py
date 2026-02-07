"""Live training monitor - run in a separate terminal: py monitor.py"""
import time, os, glob, sys

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
PHASES = [
    ("Phase 0", "Environment checks", False),
    ("Phase 1", "ML environment setup", False),
    ("Phase 2", "Data cleaning", False),
    ("chiro-fast", "Training chiro-fast (3B)", False),
    ("chiro-medical", "Training chiro-medical (4B)", False),
    ("chiro-norwegian", "Training chiro-norwegian (7B)", False),
    ("chiro-no", "Training chiro-no (7B)", False),
    ("Validation", "Model validation", False),
    ("OVERNIGHT TRAINING COMPLETE", "Done!", False),
]

PROGRESS_CHARS = 30

def find_latest_log():
    logs = glob.glob(os.path.join(LOG_DIR, "overnight-*.log"))
    return max(logs, key=os.path.getmtime) if logs else None

def parse_status(content):
    completed = 0
    current = "Starting..."
    details = ""

    checks = [
        ("Environment checks", "Phase 0"),
        ("Setting up ML", "Phase 1"),
        ("Installing PyTorch", "Downloading PyTorch (2.4GB)..."),
        ("Installing ML dependencies", "Installing ML packages..."),
        ("Verifying CUDA", "Verifying GPU..."),
        ("Cleaning training data", "Phase 2: Cleaning data..."),
        ("Training chiro-fast", "Phase 3a: chiro-fast (3B)"),
        ("COMPLETE in", ""),
        ("Training chiro-medical", "Phase 3b: chiro-medical (4B)"),
        ("Training chiro-norwegian", "Phase 3c: chiro-norwegian (7B)"),
        ("Training chiro-no", "Phase 3d: chiro-no (7B)"),
        ("Validation", "Phase 4: Validation"),
        ("OVERNIGHT TRAINING COMPLETE", "ALL DONE!"),
    ]

    for keyword, label in checks:
        if keyword in content:
            current = label

    # Count completed models
    completed_models = content.count("COMPLETE in")
    failed_models = content.count("FAILED after")

    # Determine overall progress percentage
    if "OVERNIGHT TRAINING COMPLETE" in content:
        pct = 100
    elif "Validation" in content:
        pct = 90
    elif completed_models + failed_models >= 4:
        pct = 85
    elif "Training chiro-no" in content:
        pct = 65 + (completed_models * 5)
    elif "Training chiro-norwegian" in content:
        pct = 45 + (completed_models * 5)
    elif "Training chiro-medical" in content:
        pct = 30 + (completed_models * 5)
    elif "Training chiro-fast" in content:
        pct = 20 + (completed_models * 5)
    elif "Cleaning training data" in content:
        pct = 15
    elif "Verifying CUDA" in content:
        pct = 12
    elif "Installing ML dependencies" in content:
        pct = 8
    elif "Installing PyTorch" in content:
        pct = 5
    elif "Setting up ML" in content:
        pct = 3
    elif "Environment" in content:
        pct = 1
    else:
        pct = 0

    # Get last meaningful log line
    lines = [l.strip() for l in content.split("\n") if l.strip()]
    last_line = lines[-1] if lines else ""

    return pct, current, completed_models, failed_models, last_line

def draw_bar(pct):
    filled = int(PROGRESS_CHARS * pct / 100)
    bar = "█" * filled + "░" * (PROGRESS_CHARS - filled)
    return f"[{bar}] {pct}%"

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    print("Monitoring training pipeline... (Ctrl+C to stop)\n")

    while True:
        log_file = find_latest_log()
        if not log_file:
            print("No log file found yet... waiting")
            time.sleep(5)
            continue

        try:
            with open(log_file, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except Exception:
            time.sleep(5)
            continue

        pct, current, done, failed, last_line = parse_status(content)

        clear_screen()
        print("╔══════════════════════════════════════════════════════════╗")
        print("║       ChiroClickCRM AI Training Monitor                ║")
        print("╠══════════════════════════════════════════════════════════╣")
        print(f"║  {draw_bar(pct):^54s}  ║")
        print("╠══════════════════════════════════════════════════════════╣")
        print(f"║  Status: {current:<47s} ║")
        print(f"║  Models done: {done}/4   Failed: {failed}/4{' ' * 26}║")
        print("╠══════════════════════════════════════════════════════════╣")

        # Show model status
        model_states = {
            "chiro-fast":      ("3B ", "░"),
            "chiro-medical":   ("4B ", "░"),
            "chiro-norwegian": ("7B ", "░"),
            "chiro-no":        ("7B ", "░"),
        }
        for name in model_states:
            if f"{name}: COMPLETE" in content or f"{name.split('-')[-1]}: COMPLETE" in content:
                icon = "✅"
            elif f"{name}: FAILED" in content or f"{name.split('-')[-1]}: FAILED" in content:
                icon = "❌"
            elif f"Training {name}" in content:
                # Animate spinner
                spinner = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
                idx = int(time.time() * 2) % len(spinner)
                icon = spinner[idx]
            else:
                icon = "⏳"
            size = model_states[name][0]
            print(f"║  {icon} {name:<20s} ({size})                          ║")

        print("╠══════════════════════════════════════════════════════════╣")
        last_display = last_line[:54] if len(last_line) > 54 else last_line
        print(f"║  Last: {last_display:<51s}║")
        print("╚══════════════════════════════════════════════════════════╝")
        print(f"\n  Log: {os.path.basename(log_file)}")
        print("  Press Ctrl+C to stop monitoring")

        if pct >= 100:
            print("\n  TRAINING COMPLETE! Check results with:")
            print("    ollama list | findstr chiro")
            break

        time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nMonitor stopped.")
