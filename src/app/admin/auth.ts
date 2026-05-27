"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "kenyan_bill_admin";

export type LoginState = {
  error: string | null;
};

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? process.env.ADMIN_ACCESS_PASSWORD ?? "";
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    getAdminPassword()
  );
}

function createSessionValue() {
  return crypto
    .createHash("sha256")
    .update(`${getAdminPassword()}:${getSessionSecret()}`)
    .digest("hex");
}

function valuesMatch(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return (
    firstBuffer.length === secondBuffer.length &&
    crypto.timingSafeEqual(firstBuffer, secondBuffer)
  );
}

export async function hasAdminSession() {
  const password = getAdminPassword();

  if (!password) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName)?.value;

  return Boolean(session && valuesMatch(session, createSessionValue()));
}

export async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const configuredPassword = getAdminPassword();
  const submittedPassword = String(formData.get("password") ?? "");

  if (!configuredPassword) {
    return {
      error:
        "Admin login is not configured. Set ADMIN_PASSWORD or ADMIN_ACCESS_PASSWORD.",
    };
  }

  if (!valuesMatch(submittedPassword, configuredPassword)) {
    return { error: "Incorrect admin password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/admin",
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
  redirect("/admin/login");
}
