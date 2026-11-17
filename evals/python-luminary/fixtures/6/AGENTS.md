# Small metrics library

Supported target: Python 3.10+. The project uses Poetry, Black and mypy.
Change metrics.py only. Preserve average(values) for nonempty numeric lists;
an empty list must return None. No dependency installation is needed for this fix.
Do not edit project configuration, tests or this contract.
Run: python3 -m unittest discover -s tests
