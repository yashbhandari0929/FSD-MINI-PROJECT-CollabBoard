# VIVA VOCE EXAMINATION QUESTIONS & ANSWERS
## Real-Time Collaborative Whiteboard (MERN Stack + Socket.IO)

This document contains 24 frequently asked viva examination questions with concise, beginner-friendly explanations that a college student can comfortably explain during an oral project presentation.

---

### Q1: What is the MERN stack?
**Answer:**  
MERN is an acronym for four technologies used to build full-stack web applications:
- **M**ongoDB: A NoSQL document database.
- **E**xpress.js: A lightweight web server framework for Node.js.
- **R**eact.js: A declarative frontend library for building component-based user interfaces.
- **N**ode.js: A JavaScript runtime environment that executes JavaScript on the server.

---

### Q2: Why did you choose React for the frontend?
**Answer:**  
React allows us to break down complex user interfaces into small, reusable components (like the toolbar, navbar, color picker, and modal dialogs). It manages application state reactively using hooks (`useState`, `useEffect`, `useCallback`, `useRef`), automatically re-rendering only the components whose state has changed.

---

### Q3: What is the HTML5 Canvas API and why is it used instead of SVG or DOM elements for drawing?
**Answer:**  
The HTML5 Canvas API provides a pixel-based 2D drawing surface. We chose Canvas because it can render thousands of complex freehand strokes, quadratic curves, and shapes at 60 frames per second with minimal CPU and memory overhead, whereas rendering thousands of individual DOM or SVG elements would slow down the browser.

---

### Q4: What is Socket.IO and why is it preferred over raw WebSockets?
**Answer:**  
Socket.IO is a real-time, bi-directional event-based communication library. While raw WebSockets provide a low-level protocol, Socket.IO provides high-level abstractions like:
1. Automatic reconnection if network drops.
2. Room and namespace management.
3. Fallback to HTTP long-polling if WebSockets are blocked by firewalls.
4. Built-in packet serialization.

---

### Q5: How is Socket.IO different from traditional REST APIs?
**Answer:**  
- **REST APIs** use the stateless Request-Response model over HTTP. The client must ask for data, and the server cannot send data unsolicited.
- **Socket.IO** maintains an open, stateful, persistent TCP connection. Both client and server can emit events to each other instantly at any time without repeatedly opening and closing connections.

---

### Q6: How do you synchronize drawing operations between multiple users?
**Answer:**  
Rather than sending entire canvas screenshots, we serialize each drawing action as a compact JSON object (containing element ID, type, coordinates, color, and size). When a user draws:
1. The client renders a local preview.
2. On mouse release, the client commits the element and emits `draw:operation` via Socket.IO.
3. The server validates the element and broadcasts `draw:remote-operation` to other clients in that room.
4. Peer clients receive the element and draw it onto their canvas context.

---

### Q7: What is a Socket.IO "Room" and why is it essential for this project?
**Answer:**  
A Socket.IO room is a server-side channel that sockets can join or leave. When a user opens board `board-abc`, their socket joins room `board-abc`. When someone draws in `board-abc`, the server broadcasts the event only to sockets in `board-abc` using `socket.to(roomId).emit(...)`. This ensures drawings in one room never leak into another room.

---

### Q8: How does Undo and Redo work in real time?
**Answer:**  
We maintain two data structures:
1. `elements`: An array containing all active drawing elements in chronological order.
2. `redoStack`: An array containing elements that were undone.
- **Undo:** Pops the last element from `elements`, pushes it into `redoStack`, and broadcasts the updated elements array to the room.
- **Redo:** Pops the last element from `redoStack`, appends it back to `elements`, and syncs with the room.

---

### Q9: How is drawing data saved to the database without causing performance bottlenecks?
**Answer:**  
If we saved to MongoDB on every single mouse movement, the database would quickly get overwhelmed. We solved this using **debounced auto-persistence**:
When drawing events arrive, the server queues an auto-save timeout (2 seconds). If new events arrive within those 2 seconds, the timer resets. Once drawing pauses, the server writes the complete element array to MongoDB in a single batched operation.

---

### Q10: What happens if MongoDB is offline or unavailable?
**Answer:**  
The application implements an **automatic in-memory store fallback**. The server attempts to connect with a short 3-second timeout. If MongoDB is unreachable, it logs a clear notice and transparently stores rooms, users, and snapshots in Node.js memory maps. The `/api/health` endpoint and UI status pill accurately reflect `"In-Memory Fallback (Local)"`.

---

### Q11: How do Personal Version Snapshots work?
**Answer:**  
Live whiteboard state is continuously modified by all active collaborators. A **version snapshot** freezes the current state of the board at that exact second and saves it under the user's account. The user can access their "Saved Versions" drawer anytime to view or reload that specific version, or download it as an independent physical `.board` file.

---

### Q12: How are uploaded images handled on the whiteboard?
**Answer:**  
When a user uploads an image:
1. The browser reads the file as a Base64 data URL using the `FileReader` API.
2. The image dimensions are calculated and scaled down to a maximum bounding box (360px) while maintaining the original aspect ratio.
3. The image is added to the board elements as `{ type: 'image', src: dataUrl, x, y, width, height }`.
4. An in-memory image cache on the client caches the `HTMLImageElement` so redrawing the canvas at 60 FPS remains smooth.

---

### Q13: How does the Dark Background / Dark Mode canvas work?
**Answer:**  
When dark mode is toggled:
1. The body receives the `.dark-mode` class, switching CSS variables to obsidian shades (`#111217` background, `#2a2c3d` dots).
2. The canvas rendering utility `redrawCanvas` clears the canvas with `#111217` instead of `#ffffff`.
3. The eraser tool adapts to stroke with `#111217`.
4. If the selected brush color was dark, the app automatically switches it to crisp white (`#ffffff`) or neon indigo so it remains clearly visible.

---

### Q14: Why did repetitive "user joined the whiteboard" notifications happen, and how did you resolve it?
**Answer:**  
In React, if callback functions passed to a `useSocket` hook are not memoized, they are recreated on every render. Because mouse movements trigger canvas state updates and re-renders, the `useEffect` hook in `useSocket` was tearing down and re-establishing the socket connection repeatedly. We solved this by storing callback handlers in a `useRef` object (`callbacksRef`). The socket effect now depends strictly on `[roomId, userName]`, remaining connected throughout the session. Additionally, we added message deduplication to the toast system.

---

### Q15: How do remote live cursors work without overloading the network?
**Answer:**  
Mouse movements generate dozens of events per second. We apply a client-side **throttle** function (40ms interval). Only one cursor position packet is sent every 40ms. On the recipient clients, remote cursors are rendered as an absolute-positioned SVG layer on top of the canvas with `pointer-events: none` and CSS transitions, keeping cursor rendering separate from canvas pixel manipulation.

---

### Q16: How do you handle high-resolution (Retina / 4K) displays so drawings don't look blurry?
**Answer:**  
Browsers have a `window.devicePixelRatio` (often 2 or 3 on high-DPI screens). If a canvas is 1000px wide in CSS, it must be allocated $1000 \times \text{dpr}$ internal buffer pixels (`canvas.width = rect.width * dpr`). We then scale the 2D context using `ctx.scale(dpr, dpr)`. This produces razor-sharp vector lines regardless of screen pixel density.

---

### Q17: What security and validation measures did you implement?
**Answer:**  
1. **Room ID Validation:** Regex checks allow only 3–64 alphanumeric characters, hyphens, and underscores.
2. **HTML Sanitization:** Display names and text inputs have HTML tags stripped via regex to prevent Cross-Site Scripting (XSS).
3. **Payload Limits:** Maximum points per freehand stroke are capped, and JSON body parser enforces a strict limit to prevent Denial-of-Service (DoS).
4. **Password Security:** User passwords are encrypted using SHA-256 cryptographic hashing before storage.

---

### Q18: What is the purpose of `.env.example`?
**Answer:**  
A `.env.example` file serves as a template documenting all required environment variables (e.g. `PORT`, `CLIENT_URL`, `MONGODB_URI`) with safe placeholder values, without committing sensitive credentials or production database passwords to Git.

---

### Q19: What is the role of Mongoose in the backend?
**Answer:**  
Mongoose is an Object Data Modeling (ODM) library for MongoDB. It provides schema validation, type enforcement, middleware hooks, and an intuitive JavaScript API to query and update MongoDB documents (`findOne`, `findOneAndUpdate`, `create`).

---

### Q20: What happens when a user disconnects?
**Answer:**  
When a user closes their tab or loses internet connection:
1. Socket.IO triggers the server's `disconnect` event handler.
2. The server removes the user from the room's active user map.
3. The server broadcasts `room:user-left` to remaining peers so their collaborator avatars and remote cursors update instantly.
4. If the user was the last person in the room, the server executes an immediate final save to MongoDB.

---

### Q21: How do you test this application locally?
**Answer:**  
1. Run `npm test` in the server directory to execute our automated test suite testing validation routines and REST endpoints.
2. Run `npm run dev` in root to start both client and server.
3. Open two browser tabs side-by-side navigating to `http://localhost:5174/board/test-room`. Draw in Tab 1 and observe instantaneous replication in Tab 2.

---

### Q22: What are the main limitations of the current implementation?
**Answer:**  
1. **Single-Server WebSockets:** If the server is scaled across multiple machine instances, a Redis Pub/Sub adapter (e.g. `@socket.io/redis-adapter`) would be required to broadcast events between instances.
2. **Infinite Canvas:** The current canvas fills the viewport. An infinite zoomable/pannable canvas (pan/zoom matrix transform) can be added in the future.

---

### Q23: How would you scale this project for enterprise production?
**Answer:**  
1. Implement Redis Adapter for multi-node Socket.IO clustering.
2. Store uploaded images on AWS S3 or Cloudinary rather than Base64 in MongoDB.
3. Add JWT (JSON Web Token) authentication with HTTP-only refresh cookies.
4. Integrate WebRTC for peer-to-peer audio and video calls directly alongside the whiteboard.

---

### Q24: What was the most challenging technical problem you solved in this project?
**Answer:**  
Managing real-time state synchronization without race conditions:
Synchronizing active geometric shape previews while dragging without corrupting the committed element history was challenging. We solved this by separating the active drawing preview from the committed elements array, rendering the preview ephemerally and only broadcasting and committing the completed shape on `pointerup`. We also resolved React socket connection churn using the `callbacksRef` pattern.
