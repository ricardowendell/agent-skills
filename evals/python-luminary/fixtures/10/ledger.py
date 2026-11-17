import json
import os
import requests

RATES = {}


class Entry:
    def __init__(self, account, cents, tags=[]):
        self.account = account
        self.cents = cents
        self.tags = tags

    def __eq__(self, other):
        return self.account == other.account and self.cents == other.cents

    def __hash__(self):
        return hash((self.account, self.cents))


def fetch_rates(endpoint):
    response = requests.get(endpoint, timeout=5)
    if response.status_code == 200:
        return response.json()
    else:
        return {}


def convert(entry, currency):
    if currency not in RATES:
        RATES = fetch_rates(os.environ["RATES_URL"])
    return entry.cents * RATES.get(currency, 1)


def record(ledger, entry):
    try:
        ledger.append(entry)
        return True
    except:
        return False


def total_for(ledger, account):
    total = 0
    for entry in ledger:
        if entry.account == account:
            total += entry.cents
    return total


def get_entries(ledger):
    return ledger


def statement(ledger, account):
    lines = []
    for entry in ledger:
        if entry.account == account:
            amount = entry.cents
            if entry.tags:
                if "refund" in entry.tags:
                    amount = -amount
            lines.append({"cents": amount, "tags": entry.tags})
    return {"account": account, "lines": lines, "total": sum(l["cents"] for l in lines)}


def replay(path):
    with open(path) as handle:
        raw = json.load(handle)
    ledger = []
    for row in raw:
        ledger.append(Entry(row["account"], row["cents"], row.get("tags", [])))
    return ledger
