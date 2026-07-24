# StuVaradhi - System Architecture & Application Flows

Welcome to the **StuVaradhi** architectural overview. This document provides a detailed walkthrough of the frontend and backend architectures, database modeling, and key application flows. 

---

## 1. High-Level System Architecture

StuVaradhi is built using a modern **Three-Tier Architecture** style utilizing a React Single-Page Application (SPA) on the frontend, an Express/Node.js API and WebSocket server on the backend, and MongoDB as the primary data store.

```mermaid
graph TD
    %% Styling
    classDef client fill:#38bdf8,stroke:#0284c7,stroke-width:2px,color:#fff;
    classDef server fill:#818cf8,stroke:#4f46e5,stroke-width:2px,color:#fff;
    classDef db fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff;
    classDef socket fill:#fb7185,stroke:#e11d48,stroke-width:2px,color:#fff;

    %% Elements
    Client["React 19 Frontend SPA (Vite + Tailwind)"]:::client
    WebServer["Node.js / Express API Server"]:::server
    SocketServer["Socket.io WebSocket Server"]:::socket
    Database[("MongoDB (Mongoose ODM)")]:::db

    %% Relationships
    Client -- "HTTPS REST API (Axios)" --> WebServer
    Client -- "WebSockets (RTC Peer Signals)" --> SocketServer
    WebServer -- "Mongoose Driver" --> Database
    SocketServer -- "Memory Registry / Queries" --> Database
```

---

## 2. Component Layers

### A. Frontend Architecture (Client-Side)
The client application is built with **Vite**, **React 19**, and **TailwindCSS**. It has a modular structure organized as follows:
- **`src/main.jsx` & `src/App.jsx`**: Application entry points and global routes utilizing `react-router-dom` (v7).
- **`src/context/`**: Global state management providers:
  - `AuthContext`: Tracks user session, role-based metadata, token expiration, and approval statuses.
  - `ThemeContext`: Toggles dark/light visual modes using Tailwind's dark utility class selectors.
- **`src/components/`**: Reusable visual components:
  - `<SEO>`: Lightweight head tag injector for dynamic search engine indexing.
  - `<ProtectedRoute>`: Restricts route navigation to specific roles (student, faculty, admin) and checks account approval status.
- **`src/pages/`**: View layouts split into `admin/`, `faculty/`, `student/`, `classroom/`, and public routes.
- **`src/services/`**: API query layer powered by `axios`.

### B. Backend Architecture (Server-Side)
The server-side application is a stateless **Node/Express** server utilizing **Socket.io** for WebRTC signalling:
- **`server.js`**: Core entry point that boots Express HTTP routes and establishes the WebSocket Server connection.
- **`config/`**: System properties including database connections and email transporter credentials.
- **`middleware/`**: Request interceptors:
  - `authMiddleware.js`: Validates JWT tokens and applies role-based auth permissions (`admin`, `faculty`, `student`).
- **`routes/`**: URI endpoints mapping routes to business controllers:
  - `authRoutes`, `adminRoutes`, `courseRoutes`, `classroomRoutes`, `meetingRoutes`, `certificateRoutes`.
- **`controllers/`**: Executes business rules, queries databases, and handles HTTP responses.
- **`utils/`**: Shared tools such as admin seed scripts, token generators, and QR builders.

---

## 3. Database Schema Model Relationships

The MongoDB database stores structured datasets managed by **Mongoose ODM**. The key entities and their relationships are highlighted in the ER model diagram below:

```mermaid
erDiagram
    USER ||--o{ COURSE : "creates (Admin)"
    USER ||--o{ CLASSROOM : "member_of"
    COURSE ||--o{ CLASSROOM : "has_one"
    CLASSROOM ||--o{ MEETING : "schedules"
    USER ||--o{ CERTIFICATE : "receives"
    CLASSROOM ||--o{ CERTIFICATE : "issues_for"

    USER {
        ObjectId id PK
        String name
        String email
        String password
        String phone
        String role "admin | faculty | student"
        String status "pending | approved | rejected"
        Date createdAt
    }

    COURSE {
        ObjectId id PK
        String title
        String slug
        String description
        String category
        Number price
        String level
        Array skills
        ObjectId createdBy FK
    }

    CLASSROOM {
        ObjectId id PK
        String name
        ObjectId course FK
        ObjectId faculty FK
        Array students FK
        Array announcements
        Array assignments
    }

    MEETING {
        ObjectId id PK
        String title
        ObjectId classroom FK
        String meetId "unique code"
        ObjectId host FK
        String status "scheduled | active | ended"
    }

    CERTIFICATE {
        ObjectId id PK
        String certificateId "unique serial"
        ObjectId student FK
        ObjectId classroom FK
        String studentName
        String courseTitle
        Date issueDate
    }
```

---

## 4. Key Application Flows

### A. Authentication & Account Approval Flow
StuVaradhi enforces a gated community model. While any user can register, **Admin Approval** is required for students and faculty to access protected sections of the platform.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Student/Faculty)
    participant Client as React App
    participant Server as Express API
    participant DB as MongoDB
    actor Admin as Admin

    User->>Client: Enters registration credentials
    Client->>Server: POST /api/auth/register
    Server->>DB: Saves user document (status: 'pending')
    Server-->>Client: Returns success (Requires Admin Approval)
    Client-->>User: Displays "Awaiting Approval" screen
    
    Admin->>Client: Accesses Admin Dashboard
    Client->>Server: GET /api/admin/pending-users
    Server->>DB: Fetches pending accounts
    Server-->>Client: Returns list
    Admin->>Client: Clicks Approve
    Client->>Server: PUT /api/admin/user/:id/approve
    Server->>DB: Updates status to 'approved'
    Server-->>Client: Returns updated user info
    
    User->>Client: Logs in with credentials
    Client->>Server: POST /api/auth/login
    Server->>DB: Validates credentials & status
    Server-->>Client: Sends JWT Token + status: 'approved'
    Client->>Client: Saves token & redirects to dashboard
    Client-->>User: Renders full private Dashboard
```

---

### B. Course Registration & Classroom Creation Flow
Once courses are created by administrators, approved students can enroll. When an enrollment is approved, a classroom is established linking students to mentors.

```mermaid
flowchart TD
    A[Admin creates & publishes a Course] --> B[Student explores catalog & clicks Enroll]
    B --> C{Student Approved?}
    C -- No --> D[Redirect to dashboard with error toast]
    C -- Yes --> E[Submit enrollment request]
    E --> F[Admin/Faculty approves Enrollment]
    F --> G[Generate active Classroom link]
    G --> H[Add Student to Classroom participants registry]
    H --> I[Student accesses Classroom dashboard, announcements, & assignments]
```

---

### C. Live Video Meetings Signalling Flow (Google Meet Replacement)
The live meeting module replaces commercial services by coordinating WebRTC peer-to-peer streams over a custom Socket.io signalling gateway.

```mermaid
sequenceDiagram
    autonumber
    actor Host as Faculty Host
    participant Signalling as Socket.io Server
    actor Peer as Student Peer

    Host->>Signalling: Connects & emits join-room (meetId, hostInfo)
    Signalling->>Signalling: Creates/registers room workspace
    Peer->>Signalling: Connects & emits join-room (meetId, studentInfo)
    Signalling->>Host: Emits user-connected (peerSocketId)
    
    Note over Host, Peer: WebRTC Handshake (SDP & ICE Negotiation)
    
    Host->>Signalling: Emits call-user (target: peerSocketId, offerSDP)
    Signalling->>Peer: Forwards call-user (from: hostSocketId, offerSDP)
    Peer->>Signalling: Emits answer-call (target: hostSocketId, answerSDP)
    Signalling->>Host: Forwards answer-call (answerSDP)
    
    Peer->>Signalling: Emits ice-candidate (target: hostSocketId, candidate)
    Signalling->>Host: Forwards ice-candidate
    Host->>Signalling: Emits ice-candidate (target: peerSocketId, candidate)
    Signalling->>Peer: Forwards ice-candidate
    
    Note over Host, Peer: Direct P2P Media Connection Established (Video/Audio streams begin)
```

---

### D. Certificate Generation & Verification Flow
Students who complete the required deliverables receive an official, cryptographically-verifiable certificate. A verification QR Code on the document links directly back to the public registry.

```mermaid
flowchart LR
    A[Faculty/Admin triggers 'Issue Certificate'] --> B[Server generates Unique Serial ID]
    B --> C[Save Certificate record in DB]
    C --> D[Generate PDF / PNG Template with QR Code]
    D --> E[Email Certificate to Student / Show on Profile]
    E --> F[Employer scans QR Code or visits verify page]
    F --> G[Client fetches verify API endpoint /api/certificates/verify/:id]
    G --> H{Found in DB registry?}
    H -- Yes --> I[Display green "Verified Authentic" badge & credential details]
    H -- No --> J[Display red "Unverified Credential ID" alert]
```

---

## 5. SEO Optimization Architecture

To ensure the public pages of the StuVaradhi platform index correctly in search engines, the following mechanisms are configured:

1. **Static Sitemap (`sitemap.xml`)**: Located in `frontend/public/` to outline indexable public entry points (Home, Courses, About, Contact).
2. **Robots directives (`robots.txt`)**: Commands search engines to crawl public marketing assets while disallowing indexation of private dashboards (`/dashboard`), admin portals (`/admin/`), and classroom workspaces (`/classroom/`).
3. **Dynamic Header Injection (`SEO.jsx`)**: Updates head metadata dynamically based on active router states using a custom React component:
   - Sets page `<title>` dynamically.
   - Adjusts `<meta name="description">` to match page content or database-backed course profiles.
   - Injects Open Graph (OG) and Twitter Card tags to ensure premium visualization during social sharing.
   - Injects **JSON-LD Schema Markup** structured schemas for courses (`Course`) to enable rich snippets directly inside search listings (e.g. price, duration, mentors, curriculum).
