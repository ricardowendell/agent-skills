# Architecture

- Importers are pure functions in `src/import/`; they return rows and never write.
- Every importer is covered by a fixture-based test.
