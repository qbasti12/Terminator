import React, { createContext, useContext, useRef } from "react";
import { Terminal } from "@xterm/xterm";

interface TerminalRegistryContextType {
  register: (paneId: string, terminal: Terminal) => void;
  unregister: (paneId: string) => void;
  getTerminal: (paneId: string) => Terminal | undefined;
  getAllTerminals: () => Terminal[];
}

const TerminalRegistryContext = createContext<TerminalRegistryContextType | null>(null);

export const TerminalRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registry = useRef(new Map<string, Terminal>());

  const register = (paneId: string, terminal: Terminal) => {
    registry.current.set(paneId, terminal);
  };

  const unregister = (paneId: string) => {
    registry.current.delete(paneId);
  };

  const getTerminal = (paneId: string) => {
    return registry.current.get(paneId);
  };

  const getAllTerminals = () => {
    return Array.from(registry.current.values());
  };

  return (
    <TerminalRegistryContext.Provider value={{ register, unregister, getTerminal, getAllTerminals }}>
      {children}
    </TerminalRegistryContext.Provider>
  );
};

export const useTerminalRegistry = () => {
  const context = useContext(TerminalRegistryContext);
  if (!context) {
    throw new Error("useTerminalRegistry must be used within a TerminalRegistryProvider");
  }
  return context;
};
