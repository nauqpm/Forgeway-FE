"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

interface EscapeLayer {
  id: symbol;
  close: () => void;
}

interface EscapeStackContextValue {
  registerLayer: (close: () => void) => () => void;
}

const EscapeStackContext = createContext<EscapeStackContextValue | null>(null);

export function EscapeStackProvider({ children }: { children: ReactNode }) {
  const layersRef = useRef<EscapeLayer[]>([]);

  const registerLayer = useCallback((close: () => void) => {
    const layer: EscapeLayer = {
      id: Symbol("escape-layer"),
      close,
    };

    layersRef.current.push(layer);

    return () => {
      const layerIndex = layersRef.current.findIndex((item) => item.id === layer.id);
      if (layerIndex >= 0) layersRef.current.splice(layerIndex, 1);
    };
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;

      const topLayer = layersRef.current.at(-1);
      if (!topLayer) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      topLayer.close();
    };

    document.addEventListener("keydown", handleEscapeKey, true);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey, true);
      layersRef.current = [];
    };
  }, []);

  const contextValue = useMemo(() => ({ registerLayer }), [registerLayer]);

  return createElement(EscapeStackContext.Provider, { value: contextValue }, children);
}

export function useEscapeStack(onClose: () => void, enabled = true) {
  const context = useContext(EscapeStackContext);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;
    if (!context) {
      throw new Error("useEscapeStack must be used within EscapeStackProvider");
    }

    return context.registerLayer(() => onCloseRef.current());
  }, [context, enabled]);
}
