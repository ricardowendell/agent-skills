# Errors and resources

Read for exception boundaries, transactions, retries, or resource cleanup.

## Give failure a useful owner

Validate known preconditions explicitly. Catch only exceptions the boundary can
recover from or translate. Add domain context with exception chaining and avoid
logging the same failure at every layer. Do not expose credentials or full
sensitive payloads in error text.

Choose EAFP or explicit checks for the actual operation. A blanket rule favoring
exceptions does not replace an existing convenience API such as `dict.get`.
Avoid checking a file and assuming it remains unchanged before opening it.

## Make ownership visible

Let the scope that acquires a resource own its cleanup. Use an existing context
manager, `contextlib.contextmanager` for a small lifecycle, or `ExitStack` for a
dynamic set of acquisitions. Ensure partial acquisition failure releases earlier
resources. Do not close a caller-supplied stream unless the API transfers ownership.

```python
from contextlib import contextmanager
from collections.abc import Iterator
from pathlib import Path
from tempfile import TemporaryDirectory

@contextmanager
def working_directory() -> Iterator[Path]:
    with TemporaryDirectory() as directory:
        yield Path(directory)
```

Keep cleanup in a context manager or `finally`. If cleanup can fail, decide how
to preserve the original failure and observable state rather than masking it.

## Treat retry as a domain decision

Retry only a classified transient failure, with bounded attempts, backoff, and
timeouts. Establish idempotency before retrying a write. A timeout may mean the
remote effect happened and its acknowledgement was lost; retrying blindly can
duplicate it. Retry at the layer that knows the full operation's contract.

State transaction ownership and rollback behavior. Avoid holding a database
transaction open across unrelated slow network calls without a concrete reason.
Use an existing idempotency/outbox mechanism when requirements warrant it;
do not introduce distributed transaction infrastructure by default.

## Verify

Check success, acquisition failure, body failure, cleanup, and consequential retry
paths. Assert externally visible outcomes and resource release. Use a fake at the
external boundary rather than mocking every internal function.
