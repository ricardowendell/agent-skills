import unittest

from catalogue import Sku, cheapest_by_slug, price_for


class CatalogueContract(unittest.TestCase):
    def test_lowest_price_wins_per_sku(self):
        a = Sku("widget", "eu")
        prices = [(a, 500), (a, 420)]
        self.assertEqual(cheapest_by_slug(prices), {"widget": 420})

    def test_distinct_skus_stay_separate(self):
        a = Sku("widget", "eu")
        prices = [(a, 500)]
        self.assertEqual(cheapest_by_slug(prices), {"widget": 500})

    def test_missing_slug_returns_none(self):
        a = Sku("widget", "eu")
        self.assertIsNone(price_for([(a, 500)], Sku("gadget", "eu")))


if __name__ == "__main__":
    unittest.main()
