# Mycelix Marketplace Frontend

Decentralized peer-to-peer marketplace built with SvelteKit and Holochain.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values (especially Pinata JWT for IPFS)

# Start development server
npm run dev

# Open http://localhost:5173
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/       # Reusable UI components
│   │   ├── holochain/        # Holochain client wrappers
│   │   ├── stores/           # Svelte stores (cart, auth, etc.)
│   │   └── utils/            # Utility functions
│   ├── routes/               # SvelteKit routes (pages)
│   │   ├── Browse.svelte
│   │   ├── Cart.svelte
│   │   ├── Checkout.svelte
│   │   ├── CreateListing.svelte
│   │   ├── Dashboard.svelte
│   │   ├── FileDispute.svelte
│   │   ├── MRCArbitration.svelte
│   │   ├── SubmitReview.svelte
│   │   ├── Transactions.svelte
│   │   └── listing/
│   │       └── [listing_hash]/
│   │           └── +page.svelte
│   ├── types/                # TypeScript type definitions
│   ├── app.css               # Global styles
│   ├── app.html              # HTML template
│   └── +layout.svelte        # Root layout
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md                 # This file
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server (port 5173)
- `npm run check` - Run TypeScript type checking
- `npm run check:watch` - Type checking in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Production
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `npm run test` - Run unit tests (Vitest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI
- `npm run test:e2e` - Run end-to-end tests (Playwright)
- `npm run test:e2e:ui` - Open Playwright UI

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file (copy from `.env.example`):

```env
# Holochain WebSocket URL
VITE_HOLOCHAIN_URL=ws://localhost:8888

# Pinata IPFS credentials (get from https://pinata.cloud)
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Holochain Connection

The app connects to Holochain conductor on startup. Make sure:
1. Holochain conductor is running
2. `VITE_HOLOCHAIN_URL` matches your conductor WebSocket port
3. Mycelix hApp is installed in conductor

### IPFS Configuration

For real IPFS uploads:
1. Sign up at [Pinata.cloud](https://pinata.cloud)
2. Create API key with upload permissions
3. Copy JWT token to `VITE_PINATA_JWT`
4. Set gateway URL to `VITE_PINATA_GATEWAY`

## 📦 Key Dependencies

### Production
- `@holochain/client` - Holochain WebSocket client
- `pinata-web3` - IPFS uploads via Pinata

### Development
- `@sveltejs/kit` - SvelteKit framework
- `svelte` - UI framework
- `typescript` - Type safety
- `vite` - Build tool
- `vitest` - Unit testing
- `@playwright/test` - E2E testing

## 🎨 Architecture

### State Management
- **Svelte Stores**: Global state (cart, auth, notifications)
- **Reactive Statements**: Local component state
- **Derived Stores**: Computed values (totals, counts)

### Data Flow
1. UI Component triggers action
2. Holochain client wrapper called
3. WebSocket request to conductor
4. Response updates stores
5. UI re-renders reactively

### Type Safety
- Full TypeScript coverage
- Strict mode enabled
- Type definitions in `/src/types`
- Auto-completion in IDE

## 🔍 Code Quality

### TypeScript
```bash
npm run check              # Type check all files
npm run check:watch        # Watch mode
```

### Linting
```bash
npm run lint               # Check code style
npm run lint -- --fix      # Auto-fix issues
```

### Formatting
```bash
npm run format             # Format all files
```

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm run test               # Run once
npm run test:watch         # Watch mode
npm run test:ui            # Visual UI
```

Test files: `**/*.test.ts` or `**/*.spec.ts`

### E2E Tests (Playwright)
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive UI
```

Test files: `tests/e2e/**/*.spec.ts`

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Environment variables
# Set in Vercel dashboard:
# - VITE_HOLOCHAIN_URL
# - VITE_PINATA_JWT
# - VITE_PINATA_GATEWAY
```

### Manual Build
```bash
# Build for production
npm run build

# Output in build/ directory
# Serve with any static host
```

## 🐛 Troubleshooting

### "Cannot connect to Holochain"
- Check Holochain conductor is running
- Verify `VITE_HOLOCHAIN_URL` is correct
- Check WebSocket port (default: 8888)

### "Module not found"
- Run `npm install`
- Check imports use correct paths
- Verify TypeScript paths in tsconfig.json

### "IPFS upload failed"
- Check Pinata JWT token is valid
- Verify API key has upload permissions
- Check file size limits

### TypeScript Errors
- Run `npm run check` to see errors
- Ensure all dependencies installed
- Check `.svelte-kit/` directory exists

## 📚 Documentation

### Project Documentation
- `/PHASE_4_INTEGRATION_PROGRESS.md` - Backend integration status
- `/PHASE_5_ROADMAP.md` - Development roadmap
- `/MANUAL_TESTING_CHECKLIST.md` - Testing guide
- `/QUICK_START_PHASE_5.md` - Quick start guide

### External Resources
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Holochain Client](https://github.com/holochain/holochain-client-js)
- [Pinata Docs](https://docs.pinata.cloud)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npm test && npm run test:e2e`
4. Check types: `npm run check`
5. Format code: `npm run format`
6. Submit pull request

## 📄 License

See LICENSE file in repository root.

---

**Status**: Phase 4 Complete (10/10 pages integrated)
**Next**: Phase 5 (Testing & Production Readiness)

🌊 We flow with purpose and completion!
