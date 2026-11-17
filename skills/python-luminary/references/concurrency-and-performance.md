# Concurrency and performance

Read when workload requirements justify concurrency or optimization.

## Select the execution model

Keep synchronous code when it meets latency and throughput needs. Use async when
the surrounding stack and clients support concurrent I/O. Move blocking I/O off an
event loop when needed, but do not assume cancelling its awaiting task stops a
thread's running side effect. Choose processes or another measured approach for
CPU work according to the runtime, libraries, serialization and deployment costs;
do not presume a particular GIL configuration.

## Own task lifetime and effects

On Python 3.11+, consider `asyncio.TaskGroup` for related tasks with one lexical
owner. Expect exception groups and sibling cancellation on failure. Let cancellation
propagate after cleanup; structured concurrency depends on it.

Limit active operations and queued work separately. A semaphore around a million
created tasks still leaves a million tasks in memory. Use a bounded queue with a
fixed worker set, or bounded batches, for large input. Define whether ordering,
partial success, timeouts, and retries are observable parts of the contract.

Use one client/session within its supported lifecycle. Establish shutdown and
backpressure behavior before adding background work. An async function that does
blocking work still blocks its event loop.

## Measure before changing mechanisms

Record the workload, input size, runtime, environment, and baseline. Determine
whether the bottleneck is CPU, allocation, I/O, or an external service.
Use the existing profiler or benchmark tooling; `cProfile`, `tracemalloc`, and
`timeit` can answer different questions without new dependencies.

Improve the algorithm or remove unnecessary work before adding concurrency.
For caching, define the key, memory bound, invalidation, and ownership. Avoid
caching a single-use coroutine object with `lru_cache`.

## Verify

Test bounded in-flight work, failure propagation, cancellation, cleanup, and
required ordering. Prefer synchronization primitives to timing sleeps. Compare
equivalent results and workloads before claiming a speedup; report missing
measurements as unknown.
