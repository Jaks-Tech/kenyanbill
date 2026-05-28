"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteSelectedNewsArticles,
  deleteSelectedForumThreads,
  deleteSelectedForumComments,
  deleteSelectedPublicPolls,
  deleteSelectedDeadlines,
} from "./actions";
import styles from "./page.module.css";

type ContentType = "news" | "threads" | "comments" | "polls" | "deadlines";

type ContentItem = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  extra?: string;
};

type SelectiveDeletePanelProps = {
  newsArticles: ContentItem[];
  forumThreads: ContentItem[];
  forumComments: ContentItem[];
  publicPolls: ContentItem[];
  deadlines: ContentItem[];
};

export function SelectiveDeletePanel({
  newsArticles,
  forumThreads,
  forumComments,
  publicPolls,
  deadlines,
}: SelectiveDeletePanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ContentType>("news");
  const [selectedIds, setSelectedIds] = useState<Record<ContentType, Set<string>>>({
    news: new Set(),
    threads: new Set(),
    comments: new Set(),
    polls: new Set(),
    deadlines: new Set(),
  });

  // Overlay state
  const [overlay, setOverlay] = useState<{
    show: boolean;
    type: "confirm" | "status";
    status?: "loading" | "success" | "error";
    message: string;
    title: string;
  }>({
    show: false,
    type: "confirm",
    message: "",
    title: "",
  });

  const tabs: Array<{
    id: ContentType;
    label: string;
    items: ContentItem[];
    count: number;
    actionName: string;
    fieldName: string;
  }> = [
    {
      id: "news",
      label: "News Articles",
      items: newsArticles,
      count: newsArticles.length,
      actionName: "deleteSelectedNewsArticles",
      fieldName: "article_ids",
    },
    {
      id: "threads",
      label: "Forum Threads",
      items: forumThreads,
      count: forumThreads.length,
      actionName: "deleteSelectedForumThreads",
      fieldName: "thread_ids",
    },
    {
      id: "comments",
      label: "Forum Comments",
      items: forumComments,
      count: forumComments.length,
      actionName: "deleteSelectedForumComments",
      fieldName: "comment_ids",
    },
    {
      id: "polls",
      label: "Public Polls",
      items: publicPolls,
      count: publicPolls.length,
      actionName: "deleteSelectedPublicPolls",
      fieldName: "poll_ids",
    },
    {
      id: "deadlines",
      label: "Deadlines",
      items: deadlines,
      count: deadlines.length,
      actionName: "deleteSelectedDeadlines",
      fieldName: "deadline_ids",
    },
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;
  const currentSelected = selectedIds[activeTab];
  const currentItems = currentTab.items;
  const allSelected = currentSelected.size === currentItems.length && currentItems.length > 0;

  const toggleItem = (id: string) => {
    const newSet = new Set(currentSelected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds({
      ...selectedIds,
      [activeTab]: newSet,
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds({
        ...selectedIds,
        [activeTab]: new Set(),
      });
    } else {
      const allIds = new Set(currentItems.map(item => item.id));
      setSelectedIds({
        ...selectedIds,
        [activeTab]: allIds,
      });
    }
  };

  const confirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = Array.from(currentSelected);
    if (selected.length === 0) return;

    setOverlay({
      show: true,
      type: "confirm",
      title: "Confirm Deletion",
      message: `Are you sure you want to delete ${selected.length} ${currentTab.label.toLowerCase()}? This action is permanent and cannot be undone.`,
    });
  };

  const executeDelete = async () => {
    const selected = Array.from(currentSelected);
    
    setOverlay({
      show: true,
      type: "status",
      status: "loading",
      title: "Deleting...",
      message: `Removing ${selected.length} items from the database.`,
    });

    const formData = new FormData();
    selected.forEach(id => {
      formData.append(currentTab.fieldName, id);
    });

    try {
      let result;
      if (activeTab === "news") {
        result = await deleteSelectedNewsArticles(formData);
      } else if (activeTab === "threads") {
        result = await deleteSelectedForumThreads(formData);
      } else if (activeTab === "comments") {
        result = await deleteSelectedForumComments(formData);
      } else if (activeTab === "polls") {
        result = await deleteSelectedPublicPolls(formData);
      } else if (activeTab === "deadlines") {
        result = await deleteSelectedDeadlines(formData);
      }

      if (result?.success) {
        setSelectedIds({
          ...selectedIds,
          [activeTab]: new Set(),
        });
        setOverlay({
          show: true,
          type: "status",
          status: "success",
          title: "Items Deleted",
          message: result.message,
        });
        router.refresh();
      } else {
        setOverlay({
          show: true,
          type: "status",
          status: "error",
          title: "Deletion Failed",
          message: result?.message || "An unexpected error occurred.",
        });
      }
    } catch (err) {
      setOverlay({
        show: true,
        type: "status",
        status: "error",
        title: "Error",
        message: "A network error occurred while trying to delete items.",
      });
    }
  };

  const closeOverlay = () => {
    setOverlay(prev => ({ ...prev, show: false }));
  };

  return (
    <div className={styles.selectiveDeleteContainer}>
      {overlay.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{overlay.title}</h3>
            <p>{overlay.message}</p>
            
            <div className={styles.modalActions}>
              {overlay.type === "confirm" ? (
                <>
                  <button 
                    onClick={closeOverlay} 
                    className={styles.modalCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeDelete} 
                    className={styles.modalConfirm}
                  >
                    Yes, delete
                  </button>
                </>
              ) : (
                <>
                  {overlay.status !== "loading" && (
                    <button 
                      onClick={closeOverlay} 
                      className={styles.modalConfirm}
                    >
                      Close
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.warningBox}>
        <p className={styles.sectionLabel}>⚠️ Selective deletion</p>
        <h3>Choose items to delete</h3>
        <p>
          Select the items you want to remove from the database. This action cannot be undone.
        </p>
      </div>

      <div className={styles.deleteTabsContainer}>
        <div className={styles.deleteTabsList}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.deleteTabButton} ${activeTab === tab.id ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className={styles.tabBadge}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.deleteTabContent}>
          {currentItems.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No {currentTab.label.toLowerCase()} found.</h3>
              <p>There are no items to delete in this category.</p>
            </div>
          ) : (
            <form onSubmit={confirmDelete} className={styles.deleteForm}>
              <div className={styles.selectAllRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className={styles.checkbox}
                  />
                  <span>
                    Select all {currentItems.length} {currentTab.label.toLowerCase()}
                  </span>
                </label>
                {currentSelected.size > 0 && (
                  <span className={styles.selectedCount}>
                    {currentSelected.size} selected
                  </span>
                )}
              </div>

              <div className={styles.itemsList}>
                {currentItems.map(item => (
                  <label key={item.id} className={styles.itemCheckbox}>
                    <input
                      type="checkbox"
                      checked={currentSelected.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className={styles.checkbox}
                    />
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{item.title}</div>
                      {item.description && (
                        <div className={styles.itemDescription}>{item.description}</div>
                      )}
                      {item.date && (
                        <div className={styles.itemMeta}>
                          {item.date}
                          {item.extra && ` • ${item.extra}`}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {currentSelected.size > 0 && (
                <div className={styles.deleteFormFooter}>
                  <button type="submit" className={styles.deleteButtonDanger}>
                    Delete {currentSelected.size} item{currentSelected.size !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

