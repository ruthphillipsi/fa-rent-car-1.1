import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FleetList } from '../components/FleetList';
import { LoginForm } from '../components/LoginForm';
import { LogoutButton } from '../components/LogoutButton';

describe('server-rendered interactive controls', () => {
  it('does not accept fleet queries before the change handler is hydrated', () => {
    const markup = renderToStaticMarkup(createElement(FleetList, { vehicles: [] }));

    expect(markup).toMatch(/<input(?=[^>]*type="search")(?=[^>]* disabled="")[^>]*>/);
  });

  it('does not accept or submit credentials before the auth handlers are hydrated', () => {
    const markup = renderToStaticMarkup(createElement(LoginForm));

    expect(markup).toMatch(/<input(?=[^>]*name="email")(?=[^>]* disabled="")[^>]*>/);
    expect(markup).toMatch(/<input(?=[^>]*name="password")(?=[^>]* disabled="")[^>]*>/);
    expect(markup).toMatch(/<button(?=[^>]*type="submit")(?=[^>]* disabled="")[^>]*>/);
  });

  it('does not offer logout before its handler is hydrated', () => {
    const markup = renderToStaticMarkup(createElement(LogoutButton));

    expect(markup).toMatch(/<button(?=[^>]* disabled="")[^>]*>/);
  });
});
