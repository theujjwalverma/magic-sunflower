"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface NewThreadContextType {
  isNewThreadDrawerOpen: boolean;
  openNewThreadDrawer: () => void;
  closeNewThreadDrawer: () => void;
}

const NewThreadContext = createContext<NewThreadContextType | undefined>(
  undefined
);

export function NewThreadProvider({ children }: { children: ReactNode }) {
  const [isNewThreadDrawerOpen, setIsNewThreadDrawerOpen] = useState(false);

  const openNewThreadDrawer = () => {
    console.log(
      "Context: Opening new thread drawer, current state:",
      isNewThreadDrawerOpen
    );
    setIsNewThreadDrawerOpen(true);
  };

  const closeNewThreadDrawer = () => {
    console.log(
      "Context: Closing new thread drawer, current state:",
      isNewThreadDrawerOpen
    );
    setIsNewThreadDrawerOpen(false);
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = {
    isNewThreadDrawerOpen,
    openNewThreadDrawer,
    closeNewThreadDrawer,
  };

  return (
    <NewThreadContext.Provider value={contextValue}>
      {children}
    </NewThreadContext.Provider>
  );
}

export function useNewThread() {
  const context = useContext(NewThreadContext);
  if (context === undefined) {
    throw new Error("useNewThread must be used within a NewThreadProvider");
  }
  return context;
}
