"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken } from "../lib/auth-token";
import { login } from "../lib/login";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login(email, password);
      setAuthToken(session.accessToken);
      router.push("/leads");
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="private-panel auth-form" onSubmit={handleSubmit}>
      <div>
        <p className="private-eyebrow">LeadFlow</p>
        <h1>Entrar</h1>
      </div>

      <label>
        Email
        <input
          autoComplete="email"
          className="private-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Senha
        <input
          autoComplete="current-password"
          className="private-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? (
        <p className="public-flow-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="private-primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
