TAX_RATE = 0.0825


def build_statement(customer_id, provider):
    rows = provider.fetch_rows(customer_id)
    lines = []
    subtotal = 0
    for row in rows:
        amount = row["price_cents"] * row["quantity"]
        subtotal += amount
        lines.append({"label": row["label"], "cents": amount})
    tax = int(round(subtotal * TAX_RATE))
    statement = {
        "customer": customer_id,
        "lines": lines,
        "subtotal": subtotal,
        "tax": tax,
        "total": subtotal + tax,
    }
    provider.charge(customer_id, statement["total"])
    return statement
