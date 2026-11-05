import { useRef, useEffect, useState, useCallback } from 'react';
import { redrawCanvas, getCanvasCoordinates } from '../utils/canvasUtils.js';
import { generateOperationId } from '../utils/operationUtils.js';

export function useCanvas({
  elements,
  activeTool,
  brushColor,
  brushSize,
  onCommitElement,
  onCursorMove,
  isDarkMode = false
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewElement, setPreviewElement] = useState(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  const activeStrokeRef = useRef(null);
  const startPointRef = useRef(null);

  // Resize canvas smoothly and account for DevicePixelRatio
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = Math.floor(rect.width);
    const displayHeight = Math.floor(rect.height);

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      setCanvasDimensions({ width: displayWidth, height: displayHeight });
    }
  }, []);

  // Window resize observer
  useEffect(() => {
    updateCanvasSize();
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Redraw canvas whenever elements or preview change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    redrawCanvas(ctx, elements, canvasDimensions.width, canvasDimensions.height, previewElement, isDarkMode);
  }, [elements, previewElement, canvasDimensions, isDarkMode]);

  // Pointer Down Handler
  const handlePointerDown = useCallback(
    (e) => {
      // Prevent default to prevent mobile scrolling while drawing
      if (e.target === canvasRef.current) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      const coords = getCanvasCoordinates(e, canvas);

      if (activeTool === 'text') {
        // Text is handled via text input placement callback or prompt
        return;
      }

      setIsDrawing(true);
      startPointRef.current = coords;

      if (activeTool === 'pen' || activeTool === 'eraser') {
        const initialPoints = [coords];
        activeStrokeRef.current = initialPoints;

        setPreviewElement({
          id: 'preview',
          type: activeTool === 'eraser' ? 'eraser' : 'stroke',
          points: initialPoints,
          color: brushColor,
          size: brushSize
        });
      } else if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle') {
        setPreviewElement({
          id: 'preview',
          type: activeTool,
          startX: coords.x,
          startY: coords.y,
          endX: coords.x,
          endY: coords.y,
          color: brushColor,
          size: brushSize
        });
      }
    },
    [activeTool, brushColor, brushSize]
  );

  // Pointer Move Handler
  const handlePointerMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const coords = getCanvasCoordinates(e, canvas);

      // Notify collaborators of cursor move
      if (onCursorMove) {
        onCursorMove(coords);
      }

      if (!isDrawing) return;

      if (activeTool === 'pen' || activeTool === 'eraser') {
        if (!activeStrokeRef.current) return;
        activeStrokeRef.current.push(coords);

        setPreviewElement({
          id: 'preview',
          type: activeTool === 'eraser' ? 'eraser' : 'stroke',
          points: [...activeStrokeRef.current],
          color: brushColor,
          size: brushSize
        });
      } else if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle') {
        if (!startPointRef.current) return;

        setPreviewElement({
          id: 'preview',
          type: activeTool,
          startX: startPointRef.current.x,
          startY: startPointRef.current.y,
          endX: coords.x,
          endY: coords.y,
          color: brushColor,
          size: brushSize
        });
      }
    },
    [isDrawing, activeTool, brushColor, brushSize, onCursorMove]
  );

  // Pointer Up / Finish Handler
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    if (previewElement) {
      const committedElement = {
        ...previewElement,
        id: generateOperationId(),
        timestamp: Date.now()
      };

      if (onCommitElement) {
        onCommitElement(committedElement);
      }
    }

    setIsDrawing(false);
    setPreviewElement(null);
    activeStrokeRef.current = null;
    startPointRef.current = null;
  }, [isDrawing, previewElement, onCommitElement]);

  const handlePointerLeave = useCallback(() => {
    if (isDrawing) {
      handlePointerUp();
    }
  }, [isDrawing, handlePointerUp]);

  return {
    canvasRef,
    canvasDimensions,
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave
  };
}
