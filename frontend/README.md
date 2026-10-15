# Task Manager - Enhanced

A modern, accessible React task management application with robust persistence, filtering, search, and sorting capabilities.

## Features

✅ **Full CRUD Operations** - Create, read, update, and delete tasks  
✅ **Robust Persistence** - Versioned localStorage with schema validation and migrations  
✅ **Advanced Filtering** - Filter by status (All, To Do, In Progress, Done)  
✅ **Search** - Case-insensitive search across title and description  
✅ **Sorting** - Sort by newest/oldest or alphabetically by title  
✅ **Form Validation** - Client-side validation with helpful error messages  
✅ **Accessibility** - WCAG compliant with ARIA labels, keyboard navigation, and screen reader support  
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices  

## Architecture

The application follows a layered architecture:

- **UI Layer** - React components with accessibility features
- **Domain Layer** - Business logic, validation, and task selectors
- **Data Layer** - Storage adapter and repository with migrations
- **Utilities** - ID generation and helper functions

## Prerequisites

- **Node.js**: v22.x or higher (required for jest-dom dependency)
- **npm**: v10.x or higher

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server (default: http://localhost:5173)
npm run dev
```

The development server includes:
- Hot module replacement (HMR)
- Fast refresh for React components
- Instant error feedback

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Tests include:
- Component tests with React Testing Library
- Domain logic tests (validation, selectors)
- Data layer tests (repository, migrations)

## Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Production build outputs to `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React UI components
│   │   ├── TaskForm.jsx    # Task creation/editing form
│   │   ├── TaskList.jsx    # Task list display
│   │   ├── TaskControls.jsx # Filter/search/sort controls
│   │   └── LiveRegion.jsx  # Screen reader announcements
│   ├── domain/             # Business logic
│   │   ├── constants.js    # Task statuses, validation limits
│   │   ├── validation.js   # Task validation rules
│   │   └── selectors/
│   │       └── tasks.js    # Task filtering/sorting logic
│   ├── data/               # Data persistence layer
│   │   ├── storageAdapter.js    # localStorage abstraction
│   │   └── tasksRepository.js   # CRUD operations + migrations
│   ├── utils/
│   │   └── id.js           # UUID generation
│   ├── App.jsx             # Main application component
│   ├── App.css             # Styles
│   └── main.jsx            # Application entry point
├── package.json
├── vite.config.js
└── README.md
```

## Data Persistence

Tasks are stored in browser localStorage using a versioned envelope format:

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Optional description",
      "status": "To Do",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

### Migration Support

The application automatically migrates legacy data formats:
- Plain array format → versioned envelope
- Missing fields → normalized with defaults
- Corrupted data → graceful fallback to empty state

## Accessibility

This application follows WCAG 2.1 Level AA guidelines:

- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ ARIA labels and descriptions
- ✅ Focus management
- ✅ Screen reader announcements
- ✅ Error state indicators
- ✅ High contrast color scheme

## Browser Support

- Chrome/Edge: last 2 versions
- Firefox: last 2 versions
- Safari: last 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

## Storage Limits

localStorage has a typical limit of 5-10MB per domain. The application:
- Handles quota exceeded errors gracefully
- Displays user-friendly error messages
- Prevents data loss on storage failures

## Node Version Policy

This project requires Node.js v22+ due to the `@testing-library/jest-dom` dependency. 

**Local Development:** Ensure you have Node 22.x installed  
**CI/CD:** Pin to Node 22.x in your CI configuration

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add/update tests
4. Ensure all tests pass (`npm test`)
5. Ensure build succeeds (`npm run build`)
6. Submit a pull request

## Implemented Stories

- **KAN-96**: Robust persistence with schema validation + migrations
- **KAN-97**: List controls (filter/search/sort)
- **KAN-98**: Form validation and accessibility
- **KAN-99**: SDLC scaffolding (README + CI)

## License

MIT

## Support

For issues or questions, please open an issue in the project repository.
