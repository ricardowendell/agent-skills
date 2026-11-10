# Architecture

- Local store: Postgres, single instance.
- Background jobs: SQS queue consumed by a worker process.
- Hosting: one container per service.
