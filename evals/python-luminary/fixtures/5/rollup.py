def iter_totals(rows):
    totals = {}
    for account, cents in list(rows):
        totals[account] = totals.get(account, 0) + cents
    yield from totals.items()
