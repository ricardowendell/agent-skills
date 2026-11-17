from dataclasses import dataclass


@dataclass(unsafe_hash=True)
class Money:
    cents: int
    currency: str
