"use client";

import { useState, type ReactNode } from "react";
import styles from "./page.module.css";

type AdminTab = {
  id: string;
  label: string;
  kicker: string;
  title: string;
  description: string;
  content: ReactNode;
};

export function AdminTabs({ tabs }: { tabs: AdminTab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  function selectTab(tabId: string) {
    setActiveTab(tabId);
    setMenuOpen(false);
  }

  return (
    <section className={styles.dashboardShell}>
      <button
        aria-controls="admin-section-nav"
        aria-expanded={menuOpen}
        className={styles.mobileNavToggle}
        onClick={() => setMenuOpen((current) => !current)}
        type="button"
      >
        <span>Admin sections</span>
        {active.label}
      </button>

      {menuOpen ? (
        <button
          aria-label="Close admin sections"
          className={styles.mobileNavScrim}
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      ) : null}

      <nav
        className={styles.tabSidebar}
        data-open={menuOpen}
        id="admin-section-nav"
        aria-label="Admin sections"
      >
        <div className={styles.mobileNavHeader}>
          <span>Sections</span>
          <button onClick={() => setMenuOpen(false)} type="button">
            Close
          </button>
        </div>
        <div className={styles.tabSidebarItems}>
          {tabs.map((tab) => (
            <button
              aria-current={tab.id === active.id ? "page" : undefined}
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              type="button"
            >
              <span>{tab.kicker}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className={styles.tabPanel}>
        <header className={styles.tabHeader}>
          <p className={styles.sectionLabel}>{active.kicker}</p>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
        </header>
        <div className={styles.tabContent}>{active.content}</div>
      </div>
    </section>
  );
}
