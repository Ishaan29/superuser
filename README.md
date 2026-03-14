# Proto Super User

# TODO
[] the system sends the entire chat history in the memory.
   [] Chat should be sumnmarised and then sent back to the llm with the summary


## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

### Development

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   This will start both the Vite dev server and Electron app with hot reload.

### Building

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Create distributables:**
   ```bash
   npm run dist
   ```

## Available Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build for production
- `npm run dist` - Create platform distributables
- `npm run pack` - Pack without creating installer
- `npm run preview` - Preview production build

## What's Included

This is a minimal bootstrap that includes:

- **Hello World App** - Simple centered greeting with system information
- **TypeScript Setup** - Full TypeScript configuration for both main and renderer processes
- **Tailwind CSS** - Utility-first CSS framework with dark mode support
- **Secure Architecture** - Context isolation and IPC communication setup
- **Professional Structure** - Clean separation of main and renderer processes

## Customization

### Adding Components
Create new TypeScript React components in `src/renderer/`

### Styling
Use Tailwind CSS classes or add custom CSS in `src/renderer/styles/index.css`

### Main Process Logic
Add Electron features in `src/main/main.ts`

### IPC Communication
Extend the API in `src/preload/preload.ts` and use it in React components

## License

MIT License 