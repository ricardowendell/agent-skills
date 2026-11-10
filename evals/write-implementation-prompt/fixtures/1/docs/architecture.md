# Architecture Rules

## Layering

UI → domain → data. Nothing points back up.

## DRY

Shared logic lives once, in the lowest layer that owns it.

## Size Limits

| Metric          | Limit         |
| --------------- | ------------- |
| Function length | warn 60 lines |
