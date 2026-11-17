def checkout(lines, charge):
    if not lines:
        raise ValueError("empty order")
    total = 0
    for line in lines:
        if line["price_cents"] < 0 or line["quantity"] <= 0:
            raise ValueError("invalid line")
        total += line["price_cents"] * line["quantity"]
    return charge(total)
