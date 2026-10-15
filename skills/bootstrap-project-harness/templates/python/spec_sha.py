#!/usr/bin/env python3
"""Print the SHA-256 of a file.

Used to stamp a spec into its implementation prompt (`spec_sha`) so docs-check
can detect a prompt that is older than the spec it came from.
"""

import hashlib
import sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit("usage: python spec_sha.py <file>")

print(hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest())
