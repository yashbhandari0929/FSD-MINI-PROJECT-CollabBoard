import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        footer_text = "CollabBoard — Full Stack Development (FSD) Mini Project Report & Viva Guide"
        self.drawString(36, 24, footer_text)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 36, 24, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 36, letter[0] - 36, 36)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#1e1b4b")
    c_accent = colors.HexColor("#4f46e5")
    c_body = colors.HexColor("#334155")
    c_bg_light = colors.HexColor("#f8fafc")
    c_border = colors.HexColor("#e2e8f0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.white,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#c7d2fe"),
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'SecH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SecH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_accent,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_body,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    pre_style = ParagraphStyle(
        'CodePre',
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )

    viva_q_style = ParagraphStyle(
        'VivaQ',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=c_primary,
        spaceAfter=3
    )

    viva_a_style = ParagraphStyle(
        'VivaA',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_body
    )

    story = []

    # Header Card Banner
    banner_content = [
        [
            Paragraph("CollabBoard — Technical Summary & Viva Guide", title_style)
        ],
        [
            Paragraph("Full Stack Development (MERN Stack) Project • Architecture, Workflows & Viva Voce Q&A", subtitle_style)
        ],
        [
            Table(
                [
                    [
                        Paragraph("<b>ARCHITECTURE</b><br/>MERN Single Page App", ParagraphStyle('M1', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor("#e0e7ff"))),
                        Paragraph("<b>DATABASE</b><br/>MongoDB Atlas Cluster", ParagraphStyle('M2', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor("#e0e7ff"))),
                        Paragraph("<b>REAL-TIME</b><br/>Dual Socket.IO & Sync", ParagraphStyle('M3', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor("#e0e7ff"))),
                        Paragraph("<b>DEPLOYMENT</b><br/>Vercel Production Edge", ParagraphStyle('M4', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor("#e0e7ff")))
                    ]
                ],
                colWidths=[130, 130, 130, 130],
                style=TableStyle([
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ])
            )
        ]
    ]

    header_table = Table(banner_content, colWidths=[540])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_primary),
        ('PADDING', (0, 0), (-1, -1), 14),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # Section 1
    story.append(Paragraph("1. Executive Summary & Architecture Overview", h1_style))
    story.append(Paragraph(
        "<b>CollabBoard</b> is an enterprise-grade full-stack collaborative whiteboard web application designed for real-time visual collaboration. It enables concurrent multi-user visual ideation, mathematical vector drawing, shape composition, text annotations, image uploads, snapshot persistence, and live presence tracking.",
        body_style
    ))
    story.append(Paragraph(
        "The system follows a <b>three-tier decoupled architecture</b> consisting of a responsive React Single Page Application (SPA), an Express.js Node.js serverless and WebSocket backend, and a cloud-native MongoDB Atlas database cluster.",
        body_style
    ))

    arch_text = """+-------------------------------------------------------------------------+
|                  CLIENT TIER (React 18 + Vite SPA)                      |
|   * HTML5 Canvas 2D Engine    * useCanvas & useDrawingHistory Hooks     |
|   * Dual-Mode Socket/Sync     * Theme & Local State Management          |
+--------------------^-----------------------------^----------------------+
                     |                             |
            HTTP / RESTful APIs            WebSocket (WSS) /
        (Sync, Auth, Boards, Health)        Socket.IO Events
                     |                             |
+--------------------v-----------------------------v----------------------+
|                 SERVER TIER (Node.js & Express.js)                      |
|   * boardController (Sync, CRUD)       * socketHandlers (Rooms, Events) |
|   * authController (SHA-256 Auth)      * Vercel Serverless Function API |
+--------------------------------┬----------------------------------------+
                                 | Mongoose ODM (TLS / SRV DNS Fallback)
+--------------------------------v----------------------------------------+
|                     DATABASE TIER (MongoDB Atlas)                       |
|   * 'whiteboards' (Rooms & Vectors)    * 'users' (Profiles & Boards)    |
+-------------------------------------------------------------------------+"""
    
    arch_table = Table([[Preformatted(arch_text, pre_style)]], colWidths=[540])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [4, 4, 4, 4])
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # Section 2
    story.append(Paragraph("2. Technology Stack & Technical Justifications", h1_style))
    tech_data = [
        [Paragraph("<b>Technology</b>", viva_q_style), Paragraph("<b>Layer / Role</b>", viva_q_style), Paragraph("<b>Technical Rationale & Justification</b>", viva_q_style)],
        [
            Paragraph("<b>React 18</b>", body_style),
            Paragraph("Client Framework", body_style),
            Paragraph("Declarative UI, virtual DOM diffing, and unidirectional data flow for rapid reactive rendering outside the canvas drawing loop.", body_style)
        ],
        [
            Paragraph("<b>HTML5 2D Canvas</b>", body_style),
            Paragraph("Graphics Engine", body_style),
            Paragraph("Hardware-accelerated immediate-mode vector graphics rendering without heavy 3rd-party library overhead.", body_style)
        ],
        [
            Paragraph("<b>Node.js & Express</b>", body_style),
            Paragraph("Backend Runtime", body_style),
            Paragraph("Asynchronous non-blocking event-driven I/O ideal for handling concurrent HTTP sync requests and socket events.", body_style)
        ],
        [
            Paragraph("<b>MongoDB Atlas</b>", body_style),
            Paragraph("Cloud Database", body_style),
            Paragraph("Distributed NoSQL document store with dynamic JSON schema flexibility for nested mathematical vector primitives.", body_style)
        ],
        [
            Paragraph("<b>Mongoose 8</b>", body_style),
            Paragraph("ODM Layer", body_style),
            Paragraph("Schema validation, strict type casting, and atomic update operators (<code>$push</code>, <code>$inc</code>) eliminating race conditions.", body_style)
        ],
        [
            Paragraph("<b>Node Crypto (SHA-256)</b>", body_style),
            Paragraph("Authentication Security", body_style),
            Paragraph("One-way cryptographic password hashing compliant with industry data protection standards (OWASP Top 10).", body_style)
        ],
        [
            Paragraph("<b>Vercel Edge Platform</b>", body_style),
            Paragraph("Production Deployment", body_style),
            Paragraph("Serverless Node.js execution paired with automated asset minification and global Edge CDN caching.", body_style)
        ]
    ]
    tech_table = Table(tech_data, colWidths=[110, 110, 320])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")])
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 10))

    # Page Break for clean reading
    story.append(PageBreak())

    # Section 3
    story.append(Paragraph("3. In-Depth Subsystem Technical Mechanics", h1_style))
    
    story.append(Paragraph("A. Live Annotating & Vector Rendering Engine", h2_style))
    story.append(Paragraph("• <b>Immediate-Mode Vector State:</b> Rather than storing flat pixel rasters, the canvas maintains an ordered array of mathematical vector objects (strokes, lines, rectangles, circles, text, images). Whenever an element is added, undone, or received from peers, <code>redrawCanvas()</code> re-renders the complete collection deterministically.", bullet_style))
    story.append(Paragraph("• <b>Coordinate Normalization:</b> Raw pointer coordinates (clientX/clientY) are translated to canvas space using the bounding box and scaling ratio: <code>X = (clientX - rect.left) * (canvas.width / rect.width)</code>.", bullet_style))
    story.append(Paragraph("• <b>Throttling Optimization:</b> Mouse and touch movements emit up to 120 events/sec. A custom <code>throttle(fn, 40ms)</code> limits broadcast frequency to 25 updates/sec, eliminating packet saturation while preserving fluid visual feedback.", bullet_style))
    story.append(Paragraph("• <b>Author Attribution Tags:</b> Every committed element carries <code>userName</code>, <code>userId</code>, and timestamp. The canvas engine renders a subtle author tag pill above each element displaying the author's name in their assigned color.", bullet_style))

    story.append(Paragraph("B. Real-Time Multi-User Collaboration & Presence", h2_style))
    story.append(Paragraph("• <b>Dual-Engine Synchronization Architecture:</b> (1) Stateful WebSocket mode for dedicated Node.js servers, and (2) High-speed Serverless HTTP Polling Synchronization (1.2-second heartbeat loop) with atomic operation pushes for serverless hosts like Vercel.", bullet_style))
    story.append(Paragraph("• <b>Active Collaborator Stack:</b> Room presence pings maintain active user sessions in an in-memory map. Users inactive for over 10 seconds are automatically purged. The top navbar dynamically renders collaborator avatar initials and live count (<code>[Y] [U] 2 users</code>).", bullet_style))
    story.append(Paragraph("• <b>Atomic Document Mutations:</b> Drawing operations append elements atomically via MongoDB's <code>$push: { elements: element }</code> operator with <code>$inc: { version: 1 }</code>, preventing concurrent overwriting.", bullet_style))

    story.append(Paragraph("C. Database Architecture & MongoDB Atlas Connectivity", h2_style))
    story.append(Paragraph("• <b>Cluster & DNS Configuration:</b> Connected to MongoDB Atlas over TLS. Injected DNS fallback (<code>8.8.8.8</code>, <code>1.1.1.1</code>) ensures reliable SRV resolution on Windows environments.", bullet_style))
    story.append(Paragraph("• <b>Resilient In-Memory Fallback:</b> In case of database disconnects, an in-memory Map store temporarily caches rooms and user profiles, maintaining 100% operational uptime without unhandled exceptions.", bullet_style))
    story.append(Spacer(1, 10))

    # Section 4
    story.append(Paragraph("4. Core RESTful Endpoints", h1_style))
    endpoint_data = [
        [Paragraph("<b>Method & Route</b>", viva_q_style), Paragraph("<b>Payload / Params</b>", viva_q_style), Paragraph("<b>Function & Description</b>", viva_q_style)],
        [Paragraph("<code>GET /api/health</code>", body_style), Paragraph("None", body_style), Paragraph("Returns system uptime, memory usage, and live MongoDB Atlas connection status.", body_style)],
        [Paragraph("<code>POST /api/auth/register</code>", body_style), Paragraph("<code>{ name, email, password }</code>", body_style), Paragraph("Validates credentials, hashes password with SHA-256, and stores user in Atlas.", body_style)],
        [Paragraph("<code>POST /api/auth/login</code>", body_style), Paragraph("<code>{ email, password }</code>", body_style), Paragraph("Hashes candidate password, compares against stored Atlas hash, and logs user in.", body_style)],
        [Paragraph("<code>POST /api/boards/:id/sync</code>", body_style), Paragraph("<code>{ userId, userName, color }</code>", body_style), Paragraph("Heartbeat presence ping; returns active collaborators and latest board elements.", body_style)],
        [Paragraph("<code>POST /api/boards/:id/operation</code>", body_style), Paragraph("<code>{ element }</code>", body_style), Paragraph("Atomically pushes a new drawing stroke, shape, text, or image to the board.", body_style)],
        [Paragraph("<code>POST /api/boards/:id/undo</code>", body_style), Paragraph("None", body_style), Paragraph("Atomically pops the latest element from the collaborative canvas history stack.", body_style)],
        [Paragraph("<code>POST /api/boards/:id/clear</code>", body_style), Paragraph("None", body_style), Paragraph("Resets board elements array to empty for all concurrent participants.", body_style)]
    ]
    endpoint_table = Table(endpoint_data, colWidths=[120, 130, 290])
    endpoint_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")])
    ]))
    story.append(endpoint_table)
    story.append(Spacer(1, 10))

    # Page Break for Viva Section
    story.append(PageBreak())

    # Section 5
    story.append(Paragraph("5. Comprehensive Viva Voce Questions & Model Answers", h1_style))
    story.append(Paragraph("Common technical questions asked during Full Stack Development mini project evaluations:", body_style))
    story.append(Spacer(1, 4))

    viva_qa = [
        (
            "Q1: Why did you choose MongoDB over a relational database like MySQL or PostgreSQL?",
            "Whiteboard elements are dynamic, polymorphic vectors (e.g., a freehand stroke stores an array of hundreds of points [{x, y}], geometric shapes store dimension coordinates, and text objects store font size and string content). In SQL, this requires complex polymorphic foreign keys or serialized JSON blobs. MongoDB natively stores JSON-like documents, allows atomic operations ($push, $slice), and indexes by roomId for sub-millisecond retrieval."
        ),
        (
            "Q2: Why are user passwords hashed, and can we decrypt them?",
            "Storing raw passwords in plain text violates basic application security guidelines (OWASP Top 10). We implement one-way cryptographic hashing using SHA-256 via the Node.js crypto module. Hashing is a one-way mathematical function and cannot be decrypted. During authentication, the server hashes the user's typed password and verifies whether the computed hash matches the hash stored in MongoDB Atlas."
        ),
        (
            "Q3: How does the application maintain real-time sync when hosted on serverless platforms like Vercel?",
            "Serverless platforms like Vercel execute ephemeral, short-lived function containers that do not maintain persistent TCP WebSocket connections. We solved this by creating a Dual-Engine Architecture: (1) When running on a persistent server, it utilizes bidirectional Socket.IO WebSockets. (2) When deployed to Vercel, it activates an HTTP Polling Synchronization Engine (1.2-second heartbeat loop) paired with instant RESTful operation pushes, achieving real-time multi-user drawing without persistent sockets."
        ),
        (
            "Q4: What is the difference between immediate mode canvas rendering and retained mode?",
            "The HTML5 2D Canvas is an immediate-mode rendering engine: it renders pixels to the buffer and immediately forgets about the shapes. Retained mode engines (like DOM or SVG) keep an object tree in memory. CollabBoard manages its own retained vector state in React (elements array) and projects it onto the immediate-mode canvas via redrawCanvas() whenever state mutates. This yields optimal performance for complex drawing operations."
        ),
        (
            "Q5: How do you prevent network congestion and performance drops during rapid drawing?",
            "Mouse movements fire at high frequencies (up to 120Hz). We use a throttling mechanism (throttle(fn, 40ms)) on pointer broadcast operations. This ensures that live cursor updates and draw packets are transmitted at a steady rate of 25 frames per second, preventing buffer saturation while maintaining smooth visual motion."
        ),
        (
            "Q6: How does the Undo/Redo stack function across multiple distributed users?",
            "The client maintains a dual-stack model (elements and redoStack). When an undo occurs, the last element is popped from elements and pushed into redoStack. For collaborative sync, the client sends an atomic undo request to /api/boards/:id/undo, which pops the element in the MongoDB document and broadcasts the updated elements array to all peers."
        ),
        (
            "Q7: What is CORS and how did you configure it in your backend?",
            "Cross-Origin Resource Sharing (CORS) is a browser security mechanism that blocks web pages from making AJAX requests to a different domain or port. In app.js, we configured the Express cors middleware with dynamic origin validation and allowed headers/methods to support local development, LAN devices, tunnels, and Vercel cloud domains."
        )
    ]

    for q, a in viva_qa:
        q_p = Paragraph(f"<b>{q}</b>", viva_q_style)
        a_p = Paragraph(f"<b>Answer:</b> {a}", viva_a_style)
        box = Table([[q_p], [a_p]], colWidths=[530])
        box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('LINELEFT', (0,0), (0,-1), 3.5, c_accent),
            ('PADDING', (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,0), 2),
            ('TOPPADDING', (0,1), (-1,1), 2),
            ('ROUNDEDCORNERS', [0, 4, 4, 0])
        ]))
        story.append(box)
        story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == '__main__':
    out_path = os.path.join(os.path.dirname(__file__), "CollabBoard_Project_Summary_and_Viva_Guide.pdf")
    build_pdf(out_path)
