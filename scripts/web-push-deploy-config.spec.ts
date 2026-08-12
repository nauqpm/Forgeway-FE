import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontendRoot = resolve(import.meta.dirname, '..');
const sharedRoot = resolve(frontendRoot, '..');

function blockBetween(text: string, start: string, end: string): string {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return text.slice(startIndex, endIndex);
}

describe('web push deployment configuration', () => {
  it('passes the public Web Push build values into the Docker builder stage', () => {
    const dockerfile = readFileSync(resolve(frontendRoot, 'Dockerfile'), 'utf8');
    const builderStage = blockBetween(dockerfile, 'AS builder', 'AS runner');

    expect(builderStage).toContain('ARG NEXT_PUBLIC_WEB_PUSH_ENABLED');
    expect(builderStage).toContain(
      'ENV NEXT_PUBLIC_WEB_PUSH_ENABLED=$NEXT_PUBLIC_WEB_PUSH_ENABLED',
    );
    expect(builderStage).toContain('ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    expect(builderStage).toContain(
      'ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    );
  });

  it('passes the public Web Push build values from CD secrets', () => {
    const workflow = readFileSync(
      resolve(frontendRoot, '.github/workflows/cd.yml'),
      'utf8',
    );
    const buildArgs = blockBetween(workflow, 'build-args: |', 'cache-from:');

    expect(buildArgs).toContain(
      'NEXT_PUBLIC_WEB_PUSH_ENABLED=${{ secrets.NEXT_PUBLIC_WEB_PUSH_ENABLED }}',
    );
    expect(buildArgs).toContain(
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY=${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}',
    );
  });

  it('maps Web Push runtime values from the deployment environment', () => {
    const compose = readFileSync(
      resolve(sharedRoot, 'docs/deployment/docker-compose.yml'),
      'utf8',
    );
    const backend = blockBetween(compose, '  backend:', '  frontend:');
    const frontend = blockBetween(compose, '  frontend:', '  admin:');

    expect(backend).toContain('WEB_PUSH_ENABLED: ${WEB_PUSH_ENABLED:-false}');
    expect(backend).toContain(
      'WEB_PUSH_ALLOWED_ENDPOINT_HOSTS: ${WEB_PUSH_ALLOWED_ENDPOINT_HOSTS:-}',
    );
    expect(backend).toContain('VAPID_SUBJECT: ${VAPID_SUBJECT:-}');
    expect(backend).toContain('VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY:-}');
    expect(backend).toContain('VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY:-}');
    expect(frontend).toContain(
      'WEB_PUSH_VAPID_PUBLIC_KEY: ${WEB_PUSH_VAPID_PUBLIC_KEY:-}',
    );
    expect(frontend).toContain('BACKEND_API_URL: ${BACKEND_API_URL:-}');
  });
});
