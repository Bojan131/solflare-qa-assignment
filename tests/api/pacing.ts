import { setTimeout as sleep } from 'node:timers/promises';
import { beforeEach } from 'vitest';

// Keeps a run under Cloudflare's rate limit, even when runs follow each other. The gap goes between
// tests and not between requests, because some tests send their requests together on purpose.
const GAP_BETWEEN_TESTS_MS = 1000;

beforeEach(() => sleep(GAP_BETWEEN_TESTS_MS));
