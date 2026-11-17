# Price keys

Python 3.11+, standard library only. Change money.py only.
Money(cents, currency) is an immutable value record: equal values must compare
equal and retrieve the same dictionary entry. Ordinary assignment to either
field must fail. Preserve its constructor, public fields and readable repr.
Do not change the tests or this contract.
Run: python3 -m unittest discover -s tests
