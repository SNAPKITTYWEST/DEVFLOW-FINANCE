# SnapKitty Collective | DevFlow Finance CRM Agents Guide

## Project Overview
This is a vanilla JavaScript CRM demo app for SnapKitty Collective / DevFlow Finance - a system for coordinating funds, workflows, and operations. The app manages contacts, deals, tasks, and activity using localStorage persistence.

## Architecture
- **No frameworks**: Pure JavaScript, HTML, CSS
- **State management**: Single `state` object persisted to localStorage as JSON
- **Rendering**: Direct DOM manipulation via `render()` functions
- **Key files**: `app/app.js` (logic), `app/index.html` (structure), `app/styles.css` (styling)

## Core Patterns

### State Structure
```javascript
state = {
  contacts: [{ id, name, company, email, status }],
  deals: [{ id, title, owner, value, stage }],
  tasks: [{ id, title, owner, dueDate, priority, completed }],
  activity: [{ id, text, time }]
}
```
Always update state immutably and call `persistState()` + `render()`.

### Form Handling
Use `FormData` for form submissions:
```javascript
function handleContactSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const contact = { id: crypto.randomUUID(), ...Object.fromEntries(formData) };
  state.contacts.unshift(contact);
  persistState();
  render();
}
```

### Rendering
Each section has a dedicated render function (`renderContacts`, `renderDeals`, etc.) that generates HTML strings and sets `innerHTML`. Use `escapeHtml()` for user input to prevent XSS.

### Styling Conventions
- CSS custom properties for colors (e.g., `--accent: #0d6b50`)
- Badge classes match data values: `.badge.lead`, `.badge.customer`, etc.
- Serif font (Georgia) with specific color palette
- Responsive grid layouts with media queries

### Activity Logging
Log all state changes with `pushActivity(text)` to maintain audit trail.

## Development Workflow
- Open `app/index.html` in browser to run
- No build tools required
- Edit files directly, refresh browser
- Demo data seeded via "Reset Demo Data" button

## Key Directories
- `app/`: Complete application (HTML, JS, CSS)
- Root: Project documentation and licensing</content>
<parameter name="filePath">C:\Users\jessi\Documents\GitHub\DEVFLOW-FINANCE\AGENTS.md
