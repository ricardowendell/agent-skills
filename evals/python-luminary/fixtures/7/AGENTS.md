# Order pricing

Python 3.11+, standard library only.

`order_total(lines, discount_pct)` returns an integer total in cents. The test
authority is `tests/test_pricing.py`; it encodes the required behavior and must
not change.

The reported bug: a discounted order comes out high. The business rule is that
the discount applies to the whole order before tax.

Run: python3 -m unittest discover -s tests
