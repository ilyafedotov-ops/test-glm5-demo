import { useEffect, useCallback, useState, createContext, useContext } from "react";

// Types
export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  action: () => void | Promise<void>;
  description?: string;
  category?: string;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  /** Enable/disable all shortcuts */
  enabled?: boolean;
  /** Ignore shortcuts when typing in inputs */
  ignoreInputElements?: boolean;
  /** Debug mode */
  debug?: boolean;
}

// Context
interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;
  isShortcutEnabled: (id: string) => boolean;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcutsContext(): KeyboardShortcutsContextValue {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider");
  }
  return context;
}

// Provider
export function KeyboardShortcutsProvider({
  children,
  initialShortcuts = [],
  enabled = true,
  ignoreInputElements = true,
  debug = false,
}: {
  children: React.ReactNode;
  initialShortcuts?: KeyboardShortcut[];
  enabled?: boolean;
  ignoreInputElements?: boolean;
  debug?: boolean;
}) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(initialShortcuts);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      if (prev.some((s) => s.id === shortcut.id)) {
        return prev.map((s) => (s.id === shortcut.id ? { ...s, ...shortcut } : s));
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const enableShortcut = useCallback((id: string) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: true } : s))
    );
  }, []);

  const disableShortcut = useCallback((id: string) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: false } : s))
    );
  }, []);

  const isShortcutEnabled = useCallback(
    (id: string) => {
      const shortcut = shortcuts.find((s) => s.id === id);
      return shortcut?.enabled !== false;
    },
    [shortcuts]
  );

  // Main keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we should ignore this event
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (ignoreInputElements && isInputElement) {
        return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        if (shortcut.enabled === false) return false;

        const { key, modifiers = {} } = shortcut;
        const keyMatches = e.key.toLowerCase() === key.toLowerCase();
        const ctrlMatches = modifiers.ctrl ? e.ctrlKey : !e.ctrlKey;
        const metaMatches = modifiers.meta ? e.metaKey : !e.metaKey;
        const shiftMatches = modifiers.shift ? e.shiftKey : !e.shiftKey;
        const altMatches = modifiers.alt ? e.altKey : !e.altKey;

        return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches;
      });

      if (matchingShortcut) {
        if (debug) {
          console.log("[KeyboardShortcuts] Triggered:", matchingShortcut.id, matchingShortcut);
        }

        if (matchingShortcut.preventDefault !== false) {
          e.preventDefault();
        }
        if (matchingShortcut.stopPropagation) {
          e.stopPropagation();
        }

        matchingShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled, ignoreInputElements, debug]);

  const value: KeyboardShortcutsContextValue = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    enableShortcut,
    disableShortcut,
    isShortcutEnabled,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

// Hook to register a single shortcut
export function useKeyboardShortcut(
  id: string,
  key: string,
  action: () => void | Promise<void>,
  options?: {
    modifiers?: KeyboardShortcut["modifiers"];
    description?: string;
    category?: string;
    enabled?: boolean;
    preventDefault?: boolean;
  }
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();

  useEffect(() => {
    const shortcut: KeyboardShortcut = {
      id,
      key,
      action,
      ...options,
    };

    registerShortcut(shortcut);
    return () => unregisterShortcut(id);
  }, [id, key, action, options, registerShortcut, unregisterShortcut]);
}

// Hook to use multiple shortcuts
export function useKeyboardShortcuts(shortcuts: Omit<KeyboardShortcut, "action">[], actions: (() => void | Promise<void>)[]) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();

  useEffect(() => {
    shortcuts.forEach((shortcut, index) => {
      registerShortcut({
        ...shortcut,
        action: actions[index],
      });
    });

    return () => {
      shortcuts.forEach((shortcut) => {
        unregisterShortcut(shortcut.id);
      });
    };
  }, [shortcuts, actions, registerShortcut, unregisterShortcut]);
}

// Utility to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.ctrl) parts.push("Ctrl");
  if (shortcut.modifiers?.meta) parts.push("⌘");
  if (shortcut.modifiers?.shift) parts.push("Shift");
  if (shortcut.modifiers?.alt) parts.push("Alt");

  parts.push(shortcut.key.toUpperCase());

  return parts.join(" + ");
}

// Common shortcuts factory
export function createCommonShortcuts(
  handlers: Partial<{
    onSearch: () => void;
    onNew: () => void;
    onSave: () => void;
    onDelete: () => void;
    onEscape: () => void;
    onNavigateBack: () => void;
    onRefresh: () => void;
    onToggleSidebar: () => void;
  }>
): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onSearch) {
    shortcuts.push({
      id: "search",
      key: "k",
      modifiers: { meta: true },
      action: handlers.onSearch,
      description: "Open search",
      category: "Navigation",
    });
  }

  if (handlers.onNew) {
    shortcuts.push({
      id: "new",
      key: "n",
      modifiers: { meta: true },
      action: handlers.onNew,
      description: "Create new item",
      category: "Actions",
    });
  }

  if (handlers.onSave) {
    shortcuts.push({
      id: "save",
      key: "s",
      modifiers: { meta: true },
      action: handlers.onSave,
      description: "Save",
      category: "Actions",
    });
  }

  if (handlers.onDelete) {
    shortcuts.push({
      id: "delete",
      key: "Backspace",
      modifiers: { meta: true },
      action: handlers.onDelete,
      description: "Delete",
      category: "Actions",
    });
  }

  if (handlers.onEscape) {
    shortcuts.push({
      id: "escape",
      key: "Escape",
      action: handlers.onEscape,
      description: "Close/Cancel",
      category: "Navigation",
    });
  }

  if (handlers.onNavigateBack) {
    shortcuts.push({
      id: "navigate-back",
      key: "[",
      modifiers: { meta: true },
      action: handlers.onNavigateBack,
      description: "Go back",
      category: "Navigation",
    });
  }

  if (handlers.onRefresh) {
    shortcuts.push({
      id: "refresh",
      key: "r",
      modifiers: { meta: true },
      action: handlers.onRefresh,
      description: "Refresh",
      category: "Actions",
    });
  }

  if (handlers.onToggleSidebar) {
    shortcuts.push({
      id: "toggle-sidebar",
      key: "b",
      modifiers: { meta: true },
      action: handlers.onToggleSidebar,
      description: "Toggle sidebar",
      category: "View",
    });
  }

  return shortcuts;
}

export default useKeyboardShortcut;
