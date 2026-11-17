import unittest

from pricing import order_total


def line(price_cents, quantity):
    return {"price_cents": price_cents, "quantity": quantity}


class OrderTotalContract(unittest.TestCase):
    def test_no_discount_is_subtotal_plus_tax(self):
        self.assertEqual(order_total([line(1000, 2)], 0), 2165)

    def test_discount_applies_before_tax(self):
        # 2000 subtotal, 10% off -> 1800 taxable, tax 148, total 1948.
        self.assertEqual(order_total([line(1000, 2)], 10), 1948)

    def test_discount_across_multiple_lines(self):
        # 1000 + 2500 = 3500, 20% off -> 2800 taxable, tax 231, total 3031.
        self.assertEqual(order_total([line(500, 2), line(2500, 1)], 20), 3031)

    def test_full_discount_leaves_no_tax(self):
        self.assertEqual(order_total([line(1000, 1)], 100), 0)


if __name__ == "__main__":
    unittest.main()
