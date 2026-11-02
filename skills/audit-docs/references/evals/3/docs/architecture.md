# Architecture

## Request lifecycle

HTTP requests enter through the edge proxy, are authenticated by the session
service, and are handed to the API server. The API reads and writes Postgres
directly. There is no cache: every read goes to the database.

## Background work

A scheduled worker polls the outbox table every minute and delivers queued email.
Failures are retried three times with a fixed delay.

## Deployments

The API and the worker deploy from the same image. A deploy runs migrations
first, then replaces instances one at a time behind the proxy.
