"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "./auth";
import styles from "./login.module.css";

const initialState: LoginState = {
  error: null,
};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <label>
        Admin password
        <input
          autoComplete="current-password"
          name="password"
          placeholder="Enter password"
          required
          type="password"
        />
      </label>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button disabled={isPending} type="submit">
        {isPending ? "Checking..." : "Open dashboard"}
      </button>
    </form>
  );
}
