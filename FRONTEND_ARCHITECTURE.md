
# EdgeSync Frontend Architecture

**Author:** CTO  
**Status:** Active
**Last Updated:** July 29, 2025

## 1. Philosophy & Goals

This document outlines the architecture for the `das` frontend application. Our primary goals are:

-   **Maintainability:** A clear and consistent structure that is easy for new developers to understand and for existing developers to build upon.
-   **Scalability:** An architecture that can grow in features and complexity without becoming brittle.
-   **Performance:** A snappy and responsive user experience, especially when handling real-time data streams.
-   **Component Reusability:** A design system that encourages the reuse of UI and logic components to ensure consistency and development speed.

## 2. Core Technologies & Libraries

Our frontend is a modern React Single-Page Application (SPA) built with Create React App. The key libraries shaping our architecture are:

-   **React (`react`):** The foundation of our component-based UI.
-   **React Router (`react-router-dom`):** For all client-side routing and navigation, enabling a seamless multi-page experience within the SPA.
-   **TanStack Query (`@tanstack/react-query`):** The backbone of our data-fetching and server-state management. It handles caching, background refetching, and optimistic updates, drastically simplifying asynchronous operations.
-   **Zustand (`zustand`):** For all global client-state management. It provides a simple, unopinionated, and powerful way to manage state that needs to be shared across different component trees.
-   **Axios (`axios`):** Our primary HTTP client for making requests to the backend REST API.
-   **React Flow (`@xyflow/react`):** The core engine for the interactive, node-based Flow Editor.
-   **Chart.js / Recharts:** Used for data visualization in dashboards, rendering time-series charts, gauges, and other statistical widgets.
-   **React Grid Layout (`react-grid-layout`):** For the draggable and resizable dashboard grid, allowing users to customize their layouts.

## 3. Application & Folder Structure

Our `src` directory is organized by feature and function to promote separation of concerns.

```
/src
├── /components/      # Reusable UI components
│   ├── /common/      # Generic components (Button, Input, Modal)
│   ├── /dashboard/   # Components specific to dashboards (Widget, Grid)
│   ├── /flow/        # Components for the Flow Editor (Nodes, Edges, Panels)
│   └── ...
├── /contexts/        # React Context providers (e.g., AuthContext)
├── /hooks/           # Custom React hooks for reusable logic
├── /pages/           # Top-level route components (e.g., Dashboard, Login)
├── /services/        # API interaction layer (Axios instances, API calls)
├── /store/           # Zustand store definitions
├── /styles/          # Global and component-specific CSS
└── /utils/           # Utility functions (e.g., encryption, formatting)
```

## 4. State Management: A Dual Approach

We deliberately separate state into two categories: **Server State** and **Client State**.

### 4.1. Server State (Managed by TanStack Query)

**What it is:** Data that lives on the server and we interact with via the API. This includes organizations, projects, devices, sensor data history, etc.

**How we manage it:** TanStack Query is our source of truth for server state. We define query keys to uniquely identify data and use hooks like `useQuery` and `useMutation`.

-   **`useQuery`:** For fetching data. TanStack Query automatically handles caching, loading/error states, and refetching.
-   **`useMutation`:** For creating, updating, or deleting data. We use this for actions like creating an organization or adding a device.

**Best Practice:** *Always* prefer TanStack Query for data that comes from the backend. Do not store server data in Zustand. This keeps our client state clean and leverages the powerful caching and synchronization features of TanStack Query.

### 4.2. Client State (Managed by Zustand)

**What it is:** State that is local to the browser and relevant to the user's current session. This includes UI state, user selections, and other ephemeral data.

**How we manage it:** We use Zustand to create simple, modular stores. Our primary store is `dashboardStore.js`.

-   **`dashboardStore.js`:** This store likely manages state related to the dashboard creation and editing experience, such as:
    -   The current layout of widgets being edited.
    -   The state of unsaved changes to a dashboard.
    -   Selections or filters applied by the user on the dashboard page.

**Zustand Philosophy:**

1.  **Keep Stores Small and Focused:** Create separate stores for different, unrelated domains of client state (e.g., a `flowEditorStore` could be created if the Flow Editor's state becomes complex).
2.  **Actions Live in the Store:** Logic for updating the state should be co-located with the store definition (e.g., `actions: { addWidget: (...) }`).
3.  **Access State with Hooks:** Components should access the store via the generated hook (e.g., `const widgets = useDashboardStore(state => state.widgets);`).

## 5. Real-Time Data with WebSockets

Live data for dashboards is handled via WebSockets, managed within the `useDeviceWidgetData.js` hook.

-   **Connection:** The hook establishes a WebSocket connection for a specific widget.
-   **Data Flow:** It receives real-time data, which is then pushed into the component's local state using `useState`. This is a deliberate choice to keep the high-frequency updates contained within the specific widget that needs them, preventing unnecessary re-renders of the entire application.
-   **Decoupling:** This hook cleanly encapsulates the real-time logic, separating it from the component responsible for rendering the visualization.

## 6. Component Architecture & Data Flow

Our architecture follows a standard top-down data flow.

1.  **Pages:** Top-level components that correspond to a route. They are responsible for fetching the primary data for that page using our TanStack Query hooks.
2.  **Layout Components:** Found in `components/layout`, these provide the overall structure (e.g., sidebar, header).
3.  **Feature Components:** These are the building blocks of our pages (e.g., `OrganizationCard`, `ProjectTable`). They receive data and callbacks as props from their parent page component.
4.  **Common Components:** The most basic, reusable elements (e.g., `Button`, `Modal`). They are completely generic and know nothing about the application's business logic.

This hierarchical structure ensures a predictable and unidirectional data flow, making the application easier to reason about and debug.

## 7. Scalability & Maintainability Best Practices

To ensure the long-term health of the codebase, all developers should adhere to the following principles:

-   **Embrace Hooks:** Encapsulate any reusable logic (especially logic involving state or lifecycle) into a custom hook (`use...`). This is our primary pattern for code reuse.
-   **Colocate:** Keep related files together. A new feature component should have its own folder containing the component itself, its specific hooks, and its styles.
-   **Prop Drilling vs. Context/Zustand:**
    -   Pass props for data that is directly used by a component and its immediate children.
    -   Use `AuthContext` for authentication state, as it's truly global.
    -   Use a Zustand store when state needs to be shared between components that are far apart in the component tree, but the state is not server state.
-   **Keep Components Small:** A component should have a single responsibility. If a component becomes too large or complex, break it down into smaller, more manageable components.
