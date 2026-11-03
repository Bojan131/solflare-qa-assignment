import { setTimeout as sleep } from 'node:timers/promises';
import { afterAll, beforeEach, expect } from 'vitest';
import { slowAnswers } from '../../utils/api-client';

// Keeps a run under Cloudflare's rate limit, even when runs follow each other. A 1 second gap still
// got blocked on the third run in a row. The gap goes between tests and not between requests,
// because some tests send their requests together on purpose.
const GAP_BETWEEN_TESTS_MS = 2000;

beforeEach(() => sleep(GAP_BETWEEN_TESTS_MS));

// Fails the file and not the test that happened to send the request, because that test's values can
// still be right
afterAll(() => {
  expect(slowAnswers, 'answers slower than 10 seconds').toEqual([]);
});
