import unittest

from statements import TAX_RATE, build_statement


class FakeProvider:
    def __init__(self, rows):
        self._rows = rows
        self.charges = []

    def fetch_rows(self, customer_id):
        return list(self._rows)

    def charge(self, customer_id, cents):
        self.charges.append((customer_id, cents))


def row(label, price_cents, quantity):
    return {"label": label, "price_cents": price_cents, "quantity": quantity}


class StatementContract(unittest.TestCase):
    def test_statement_totals_and_tax(self):
        provider = FakeProvider([row("hosting", 1000, 2), row("support", 500, 1)])
        statement = build_statement("c1", provider)
        self.assertEqual(statement["subtotal"], 2500)
        self.assertEqual(statement["tax"], int(round(2500 * TAX_RATE)))
        self.assertEqual(statement["total"], 2500 + int(round(2500 * TAX_RATE)))

    def test_line_order_follows_provider_rows(self):
        provider = FakeProvider([row("b", 100, 1), row("a", 200, 1)])
        statement = build_statement("c1", provider)
        self.assertEqual([line["label"] for line in statement["lines"]], ["b", "a"])

    def test_charges_exactly_once_with_the_statement_total(self):
        provider = FakeProvider([row("hosting", 1000, 2)])
        statement = build_statement("c1", provider)
        self.assertEqual(provider.charges, [("c1", statement["total"])])


if __name__ == "__main__":
    unittest.main()
