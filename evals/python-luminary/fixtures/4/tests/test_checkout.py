import copy
import unittest
from unittest.mock import Mock

import checkout as module


class CheckoutContract(unittest.TestCase):
    def test_offline_quote_does_not_mutate_lines(self):
        lines = [
            {"price_cents": 125, "quantity": 3},
            {"price_cents": 90, "quantity": 2},
        ]
        before = copy.deepcopy(lines)
        self.assertEqual(module.quote(lines), 555)
        self.assertEqual(lines, before)

    def test_checkout_returns_receipt_and_charges_once(self):
        charge = Mock(return_value={"receipt": "r-1"})
        self.assertEqual(
            module.checkout([{"price_cents": 125, "quantity": 2}], charge),
            {"receipt": "r-1"},
        )
        charge.assert_called_once_with(250)

    def test_invalid_orders_never_charge(self):
        for lines in [
            [],
            [{"price_cents": -1, "quantity": 2}],
            [{"price_cents": 100, "quantity": 0}],
            [{"price_cents": 100, "quantity": -1}],
        ]:
            with self.subTest(lines=lines):
                charge = Mock()
                with self.assertRaises(ValueError):
                    module.quote(lines)
                with self.assertRaises(ValueError):
                    module.checkout(lines, charge)
                charge.assert_not_called()

    def test_zero_price_is_valid(self):
        self.assertEqual(module.quote([{"price_cents": 0, "quantity": 1}]), 0)
