# declared-eslint

The manifest declares ESLint and has a `lint` script, but the flat config file
is missing. The bootstrap must fill that config, not replace ESLint with Oxlint.
