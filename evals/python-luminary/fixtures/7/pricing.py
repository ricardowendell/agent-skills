TAX_RATE = 0.0825


def _line_cents(line):
    return line["price_cents"] * line["quantity"]


def order_total(lines, discount_pct):
    subtotal = sum(_line_cents(line) for line in lines)
    tax = int(round(subtotal * TAX_RATE))
    discount = int(round(subtotal * discount_pct / 100))
    return subtotal + tax - discount
