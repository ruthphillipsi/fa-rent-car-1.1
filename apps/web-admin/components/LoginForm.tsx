'use client';

import { useRef, useState, type FormEvent } from 'react';

import { ApiError, loginRequestSchema } from '@fa/shared';
import { Button, Input } from '@fa/ui';

import { login } from '../lib/browser-api';
import { useHydrated } from '../lib/use-hydrated';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const result = loginRequestSchema.safeParse({ email, password });
  if (!result.success) {
    for (const issue of result.error.issues) {
      if (issue.path[0] === 'email')
        errors.email = email.trim() ? 'Masukkan alamat email yang valid.' : 'Email wajib diisi.';
      if (issue.path[0] === 'password')
        errors.password = password ? 'Kata sandi terlalu panjang.' : 'Kata sandi wajib diisi.';
    }
  }

  return errors;
}

function getLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi.';
    }

    if (error.status === 401) {
      return 'Email atau kata sandi tidak valid.';
    }

    if (error.status === 403) {
      return 'Sesi keamanan formulir telah berakhir. Silakan coba lagi.';
    }
  }

  return 'Masuk belum dapat diproses. Periksa koneksi lalu coba lagi.';
}

export function LoginForm() {
  const hydrated = useHydrated();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<'email' | 'password', boolean>>({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  const errors = validate(email, password);

  function touch(field: 'email' | 'password') {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setTouched({ email: true, password: true });
    setFormError(undefined);

    if (errors.email || errors.password) {
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, password });
      window.location.assign('/');
    } catch (error) {
      setFormError(getLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {formError ? (
        <p
          className="rounded-lg bg-error-container px-3 py-2.5 text-body-md font-medium text-on-error-container"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <Input
        ref={emailRef}
        autoComplete="email"
        disabled={!hydrated || isSubmitting}
        error={touched.email ? errors.email : undefined}
        label="Email"
        name="email"
        onBlur={() => touch('email')}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="nama@perusahaan.com"
        required
        type="email"
        value={email}
      />
      <Input
        ref={passwordRef}
        autoComplete="current-password"
        disabled={!hydrated || isSubmitting}
        error={touched.password ? errors.password : undefined}
        label="Kata sandi"
        name="password"
        onBlur={() => touch('password')}
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      <Button
        className="w-full"
        disabled={!hydrated}
        loading={isSubmitting}
        size="lg"
        type="submit"
        variant="secondary"
      >
        Masuk
      </Button>
    </form>
  );
}
