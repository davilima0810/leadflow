"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getCurrentSession, logout, type CurrentSession } from "../lib/auth-api";
import { UnauthorizedError } from "../lib/private-api";

type AdminLayoutProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: "/flows", label: "Flows" },
  { href: "/leads", label: "Leads" }
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession();

        if (!active) {
          return;
        }

        setSession(currentSession);
      } catch (error) {
        if (active && error instanceof UnauthorizedError) {
          router.push("/login");
        }
      } finally {
        if (active) {
          setIsCheckingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (isCheckingSession) {
    return (
      <main className="private-shell centered">
        <section className="private-panel">
          <p>Carregando painel...</p>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegação principal">
        <div>
          <p className="admin-brand">LeadFlow</p>
          {session ? <p className="admin-company">{session.company.name}</p> : null}
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-user">
          {session ? (
            <div>
              <strong>{session.user.name}</strong>
              <span>{session.user.email}</span>
            </div>
          ) : null}
          <button className="private-secondary-button" type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <header className="admin-mobile-header">
        <div>
          <p className="admin-brand">LeadFlow</p>
          {session ? <span>{session.company.name}</span> : null}
        </div>
        <nav className="admin-mobile-nav" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="private-secondary-button" type="button" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <main className="admin-content">{children}</main>
    </div>
  );
}
