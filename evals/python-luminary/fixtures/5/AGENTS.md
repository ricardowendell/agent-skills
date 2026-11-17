# Ordered account export

Python 3.11+, standard library only. Change rollup.py only.
iter_totals(rows) receives a one-pass iterator of (account, cents) pairs already
ordered by account. Yield one (account, total_cents) tuple per account, in order.
The iterator can be larger than RAM. Yield each completed account before reading
the next account's full contents; one record of lookahead is allowed.
Keep only current-group state. Empty input yields nothing.
Do not change tests or this contract.
Run: python3 -m unittest discover -s tests
