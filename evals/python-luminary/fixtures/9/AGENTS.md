# Billing statements

Python 3.11+, standard library only.

`statements.py` builds a monthly statement for one customer. Finance now needs
the same line-item math for the offline quarterly export, which reads historical
rows and never touches the billing provider.

Expose the line-item computation so both callers share one implementation.
Keep `build_statement(customer_id, provider)` charging exactly once, after the
statement is complete. Preserve rounding and ordering exactly.

Do not change `tests/test_statements.py` or this contract. No additional
modules are needed.

Run: python3 -m unittest discover -s tests
