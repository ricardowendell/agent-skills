import unittest

from money import Money


class MoneyContract(unittest.TestCase):
    def test_equal_keys_retrieve_the_same_price(self):
        for cents, currency in [(0, "BRL"), (725, "USD"), (-10, "EUR")]:
            with self.subTest(cents=cents, currency=currency):
                first = Money(cents, currency)
                second = Money(cents, currency)
                self.assertEqual(first, second)
                self.assertEqual(hash(first), hash(second))
                self.assertEqual({first: "price"}[second], "price")

    def test_both_fields_reject_assignment(self):
        key = Money(1200, "BRL")
        prices = {key: "original"}
        for field, value in [("cents", 2400), ("currency", "USD")]:
            with self.subTest(field=field):
                with self.assertRaises((AttributeError, TypeError)):
                    setattr(key, field, value)
                self.assertEqual(prices[key], "original")

    def test_values_keep_their_domain_identity(self):
        self.assertNotEqual(Money(100, "BRL"), Money(100, "USD"))
        self.assertNotEqual(Money(100, "BRL"), Money(101, "BRL"))
        self.assertNotEqual(Money(100, "BRL"), (100, "BRL"))
        self.assertIn("BRL", repr(Money(100, "BRL")))
