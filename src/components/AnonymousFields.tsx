"use client";

import { useEffect, useState } from "react";

const sessionKey = "kenyan-bill-anonymous-session";
const nameKey = "kenyan-bill-anonymous-name";
const labels = ["True Patriot", "Mwananchi", "Public Voice", "County Watcher"];

function createId() {
  return crypto.randomUUID();
}

function createName() {
  const label = labels[Math.floor(Math.random() * labels.length)];
  const number = Math.floor(1 + Math.random() * 999)
    .toString()
    .padStart(3, "0");

  return `${label} ${number}`;
}

export function AnonymousFields() {
  const [identity, setIdentity] = useState({
    sessionId: "",
    name: "True Patriot 001",
  });

  useEffect(() => {
    let sessionId = window.localStorage.getItem(sessionKey);
    let name = window.localStorage.getItem(nameKey);

    if (!sessionId) {
      sessionId = createId();
      window.localStorage.setItem(sessionKey, sessionId);
    }

    if (!name) {
      name = createName();
      window.localStorage.setItem(nameKey, name);
    }

    setIdentity({ sessionId, name });
  }, []);

  return (
    <>
      <input name="anonymous_session_id" type="hidden" value={identity.sessionId} />
      <input name="anonymous_name" type="hidden" value={identity.name} />
    </>
  );
}
