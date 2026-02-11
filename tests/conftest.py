import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Ensure a sufficiently long SECRET_KEY for tests to avoid JWT warnings
os.environ.setdefault("SECRET_KEY", "x" * 64)
