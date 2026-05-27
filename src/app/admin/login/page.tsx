import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../auth";
import { AdminLoginForm } from "../AdminLoginForm";
import styles from "../login.module.css";

export const metadata: Metadata = {
  title: "Admin Login | Kenyan Bill",
  description: "Secure Kenyan Bill admin dashboard login.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        {/* Centered Brand Header */}
        <header className={styles.header}>
          <div className={styles.logoWrapper}>
            <Image
              src="/kb-logo.png"
              alt="Kenyan Bill Logo"
              width={72} 
              height={72}
              priority
              className={styles.logo}
            />
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your admin account</p>
        </header>

        {/* Credentials Form */}
        <div className={styles.formSection}>
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}