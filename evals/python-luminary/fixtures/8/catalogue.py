from dataclasses import dataclass, field


@dataclass(eq=False)
class Sku:
    """A catalogue entry. Identity, not value: two lookups for the same code
    share one instance, so records compare and hash by instance."""

    code: str
    region: str
    promotions: list = field(default_factory=list)


def cheapest_by_slug(prices):
    """Return the lowest price per product, keyed by the SKU that quotes it."""
    best = {}
    for sku, cents in prices:
        current = best.get(sku)
        if current is None or cents < current:
            best[sku] = cents
    return {sku.code: cents for sku, cents in best.items()}


def price_for(prices, sku):
    return cheapest_by_slug(prices).get(sku.code)
