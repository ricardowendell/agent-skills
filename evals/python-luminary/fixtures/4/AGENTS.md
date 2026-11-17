# Checkout pricing

Python 3.11+, standard library only. Change checkout.py only.
Expose quote(lines) for offline reports; it returns an integer total in cents.
Each line has integer price_cents and quantity. Negative prices and nonpositive
quantities raise ValueError. Empty orders raise ValueError.
Preserve checkout(lines, charge): validate first, call charge(total) exactly once,
and return the provider receipt unchanged. Invalid orders never charge.
Quote must not call a provider, mutate input, or depend on application state.
Do not change tests or this contract. No additional modules are needed.
Run: python3 -m unittest discover -s tests
