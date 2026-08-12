import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontendRoot = resolve(import.meta.dirname, '..');

describe('web push deployment configuration', () => {
  it('passes the public Web Push build values into the Docker builder stage', () => {
    const dockerfile = readFileSync(resolve(frontendRoot, 'Dockerfile'), 'utf8');

    expect(dockerfile).toContain('ARG NEXT_PUBLIC_WEB_PUSH_ENABLED');
    expect(dockerfile).toContain(
      'ENV NEXT_PUBLIC_WEB_PUSH_ENABLED=$NEXT_PUBLIC_WEB_PUSH_ENABLED',
    );
    expect(dockerfile).toContain('ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    expect(dockerfile).toContain(
      'ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    );
  });

  it('passes the public Web Push build values from CD secrets', () => {
    const workflow = readFileSync(
      resolve(frontendRoot, '.github/workflows/cd.yml'),
      'utf8',
    );

    expect(workflow).toContain(
      'NEXT_PUBLIC_WEB_PUSH_ENABLED=${{ secrets.NEXT_PUBLIC_WEB_PUSH_ENABLED }}',
    );
    expect(workflow).toContain(
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY=${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}',
    );
  });
});
