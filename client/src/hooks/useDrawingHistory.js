import { useState, useCallback } from 'react';

export function useDrawingHistory(initialElements = []) {
  const [elements, setElements] = useState(initialElements);
  const [redoStack, setRedoStack] = useState([]);

  // Add a newly committed local element
  const addElement = useCallback((newElement) => {
    setElements((prev) => [...prev, newElement]);
    setRedoStack([]); // New action clears redo stack
  }, []);

  // Receive an element drawn by a collaborator
  const addRemoteElement = useCallback((remoteElement) => {
    setElements((prev) => {
      // Prevent duplicate elements
      if (prev.some((e) => e.id === remoteElement.id)) {
        return prev;
      }
      return [...prev, remoteElement];
    });
  }, []);

  // Local Undo
  const undo = useCallback(() => {
    setElements((prev) => {
      if (prev.length === 0) return prev;
      const nextElements = [...prev];
      const popped = nextElements.pop();
      setRedoStack((rPrev) => [...rPrev, popped]);
      return nextElements;
    });
  }, []);

  // Local Redo
  const redo = useCallback(() => {
    setRedoStack((rPrev) => {
      if (rPrev.length === 0) return rPrev;
      const nextRedo = [...rPrev];
      const restored = nextRedo.pop();
      setElements((prev) => [...prev, restored]);
      return nextRedo;
    });
  }, []);

  // Clear All
  const clearAll = useCallback(() => {
    setElements((prev) => {
      setRedoStack([...prev]);
      return [];
    });
  }, []);

  // Replace all elements (e.g. from server room:state or draw:sync-elements)
  const setAllElements = useCallback((newElements) => {
    setElements(Array.isArray(newElements) ? newElements : []);
    setRedoStack([]);
  }, []);

  return {
    elements,
    canUndo: elements.length > 0,
    canRedo: redoStack.length > 0,
    addElement,
    addRemoteElement,
    undo,
    redo,
    clearAll,
    setAllElements
  };
}
