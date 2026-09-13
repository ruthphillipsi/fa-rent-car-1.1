import { Input } from '@fa/ui';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('shared input descriptions', () => {
  it.each([
    { name: 'neither hint nor error', props: {}, expected: undefined },
    { name: 'hint only', props: { hint: 'Gunakan email aktif.' }, expected: 'email-hint' },
    { name: 'error only', props: { error: 'Email tidak valid.' }, expected: 'email-error' },
    {
      name: 'error replacing the hint',
      props: { hint: 'Gunakan email aktif.', error: 'Email tidak valid.' },
      expected: 'email-error',
    },
    {
      name: 'external description with an error replacing the hint',
      props: {
        hint: 'Gunakan email aktif.',
        error: 'Email tidak valid.',
        'aria-describedby': 'custom-help',
      },
      expected: 'custom-help email-error',
    },
  ])('references only rendered elements with $name', ({ props, expected }) => {
    const markup = renderToStaticMarkup(
      createElement(
        'div',
        null,
        createElement('p', { id: 'custom-help' }, 'Informasi tambahan.'),
        createElement(Input, { ...props, id: 'email', label: 'Email' }),
      ),
    );
    const description = markup.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(description).toBe(expected);
    for (const id of description?.split(' ') ?? []) {
      expect(markup).toContain(`id="${id}"`);
    }
  });
});
