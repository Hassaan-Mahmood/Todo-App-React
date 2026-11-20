# Todo App — React

A todo app built with React + Vite while learning React.

## Features

- Add tasks with a title, notes, priority (Low / Medium / High) and due date
- Mark tasks complete, edit them, and delete them (with confirmation)
- Filter by All / Active / Done, and search by title or notes
- Clear all completed tasks
- Running counts, overdue and due-today highlighting
- Tasks are saved in `localStorage`, so the list survives a refresh

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints, usually http://localhost:5173.

## Build it

```bash
npm run build
npm run preview
```

## Progress log
- Update 1 (2026-11-20): Practised useState — adding a task updates the list instantly.
- Update 2 (2026-11-20): Practised useEffect — saving todos to localStorage on every change.
- Update 3 (2026-11-20): Added priority pills: Low, Medium and High.
- Update 4 (2026-11-20): Added due dates with overdue and due-today highlighting.
- Update 5 (2026-11-20): Added filters: All, Active and Done.
