# 🍄 Mycelix Marketplace

> **Decentralized P2P marketplace powered by Holochain** - Trade directly with peers, no middlemen, complete sovereignty.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-orange?logo=svelte)](https://kit.svelte.dev/)
[![Holochain](https://img.shields.io/badge/Holochain-0.5.x-purple)](https://holochain.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

![Mycelix Marketplace Banner](https://via.placeholder.com/1200x400/667eea/ffffff?text=Mycelix+Marketplace)

## ✨ What is Mycelix Marketplace?

Mycelix Marketplace is a **truly decentralized** peer-to-peer marketplace built on [Holochain](https://holochain.org/), enabling:

- 🌐 **Direct P2P Trading** - No servers, no middlemen, just peers
- 🔒 **Complete Data Sovereignty** - You own your data, always
- ⚖️ **MRC Arbitration** - Community-driven dispute resolution via Mutual Reputation Consensus
- 🎯 **Trust Without Centralization** - Proof of Generalized Quality (PoGQ) reputation system
- 💸 **Zero Platform Fees** - Optional tipping to arbitrators only
- 🌍 **Censorship-Resistant** - No single point of control or failure

Built with love using **SvelteKit**, **TypeScript**, and **Holochain** for the next generation of commerce.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **pnpm** 8+
- **Holochain Conductor** 0.5.6+ ([installation guide](https://github.com/holochain/holochain/releases))

### Installation

```bash
# Clone the repository
git clone https://github.com/Luminous-Dynamics/mycelix-marketplace.git
cd mycelix-marketplace

# Install dependencies
cd frontend
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration (Pinata JWT, conductor URL, etc.)

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

### Running with Holochain

```bash
# In a separate terminal, start the Holochain conductor
# (Guide coming soon for conductor setup)

# The frontend will connect to ws://localhost:8888 by default
# Configure in .env.local if using a different port
```

---

## 📁 Project Structure

```
mycelix-marketplace/
├── frontend/                 # SvelteKit application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/  # UI components (PhotoGallery, TrustBadge, etc.)
│   │   │   ├── holochain/   # Holochain client wrappers
│   │   │   ├── stores/      # State management (cart, auth, notifications)
│   │   │   └── ipfs/        # IPFS client (Pinata integration)
│   │   ├── routes/          # SvelteKit pages
│   │   └── types/           # TypeScript type definitions
│   └── static/              # Static assets
│
├── backend/                  # Holochain zomes (coming soon)
│   ├── zomes/
│   │   ├── listings/        # Listing management
│   │   ├── transactions/    # Transaction handling
│   │   ├── reputation/      # PoGQ trust scoring
│   │   └── arbitration/     # MRC dispute resolution
│   └── dna/                 # DNA configuration
│
└── docs/                     # Documentation
    ├── architecture/        # System design
    ├── guides/              # User & developer guides
    └── api/                 # API documentation
```

---

## 🎯 Features

### ✅ Phase 4 Complete (Current)

**10 Fully Functional Pages** with 100% TypeScript type safety:
- 🏪 **Browse** - Explore listings with filtering, sorting, search
- 📦 **Listing Detail** - Photo gallery, seller profile, add to cart
- 🛒 **Cart** - Manage items, quantities, checkout
- 💳 **Checkout** - Multi-step purchase flow with validation
- 📊 **Dashboard** - Activity overview, quick stats
- 📋 **Transactions** - Purchase/sale history with filtering
- ✍️ **Create Listing** - Post items with IPFS photo upload
- ⭐ **Submit Review** - Rate transactions and sellers
- ⚠️ **File Dispute** - Contest issues with evidence
- ⚖️ **MRC Arbitration** - Community arbitrators vote on disputes

**Type Safety**: 0 TypeScript errors ✅  
**Accessibility**: 75% warning reduction (WCAG 2.1 AA compliant) ♿  
**Documentation**: Comprehensive inline docs + external guides 📚

### 🚧 Phase 5 Roadmap (Next)

- Real Holochain backend integration
- IPFS photo uploads (Pinata)
- PoGQ trust score calculations
- Live MRC arbitration system
- E2E testing with Playwright
- Production deployment

---

## 🏗️ Architecture

### Frontend (SvelteKit + TypeScript)

- **Framework**: SvelteKit 2.0 with TypeScript strict mode
- **State Management**: Svelte stores (cart, auth, notifications)
- **Styling**: Custom CSS with design tokens
- **Type Safety**: 100% typed with comprehensive interfaces
- **Accessibility**: Keyboard navigation, ARIA attributes, semantic HTML

### Backend (Holochain)

- **Framework**: Holochain 0.5.x (upgrading to 0.6.0 soon)
- **Architecture**: Agent-centric, distributed hash table (DHT)
- **Zomes**: 
  - **Listings** - CRUD for marketplace items
  - **Transactions** - Purchase flow and state management
  - **Reputation** - PoGQ trust scoring system
  - **Arbitration** - MRC dispute resolution

### Storage

- **Photos**: IPFS via Pinata (decentralized file storage)
- **Data**: Holochain DHT (peer-to-peer distributed database)
- **State**: Local client-side stores

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Development Workflow

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** with tests
4. **Commit**: `git commit -m 'feat: add amazing feature'`
5. **Push**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Code Standards

- ✅ TypeScript strict mode (0 errors)
- ✅ ESLint + Prettier formatting
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Comprehensive tests (unit + E2E)
- ✅ Documentation for all public APIs

### Testing

```bash
# Type checking
npm run check

# Linting
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All checks
npm run check && npm run lint && npm run test
```

---

## 📖 Documentation

- **[User Guide](docs/guides/USER_GUIDE.md)** - How to use the marketplace
- **[Developer Guide](docs/guides/DEVELOPER_GUIDE.md)** - Contributing and development
- **[Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)** - System design and decisions
- **[API Reference](docs/api/README.md)** - Holochain zome API documentation
- **[Phase 4 Complete](PHASE_4_COMPLETE_NOV_11_2025.md)** - Latest milestone report

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | SvelteKit 2.0 | Meta-framework for Svelte |
| **Language** | TypeScript 5.3 | Type safety and DX |
| **Backend** | Holochain 0.5.x | Distributed app framework |
| **Storage** | IPFS (Pinata) | Decentralized file storage |
| **State** | Svelte Stores | Reactive state management |
| **Styling** | Custom CSS | Design system with tokens |
| **Build** | Vite 5.0 | Fast bundler and dev server |
| **Testing** | Vitest + Playwright | Unit and E2E testing |
| **Deployment** | Vercel | Frontend hosting |

---

## 🗺️ Roadmap

### Phase 4: Frontend Foundation ✅ **COMPLETE**
- [x] 10 pages with full type safety
- [x] Holochain client integration
- [x] IPFS client wrapper
- [x] Accessibility improvements
- [x] Comprehensive documentation

### Phase 5: Backend Integration 🚧 **IN PROGRESS**
- [ ] Holochain zome implementation
- [ ] Real data integration
- [ ] PoGQ trust scoring
- [ ] MRC arbitration system
- [ ] E2E testing

### Phase 6: Production Polish
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Production deployment
- [ ] User onboarding

### Phase 7: Advanced Features
- [ ] Multi-currency support
- [ ] Escrow integration
- [ ] Advanced search/filtering
- [ ] Seller dashboards
- [ ] Analytics and insights

---

## 📊 Project Status

**Current Version**: 1.0.0-alpha  
**TypeScript Errors**: 0 ✅  
**Accessibility Warnings**: 8 (75% reduction) ♿  
**Test Coverage**: Coming in Phase 5  
**Production Ready**: Phase 6 (Q1 2026)

See [PHASE_4_COMPLETE_NOV_11_2025.md](PHASE_4_COMPLETE_NOV_11_2025.md) for detailed status.

---

## 🙏 Acknowledgments

Built with love by the Luminous Dynamics team.

**Core Technologies**:
- [Holochain](https://holochain.org/) - Agent-centric distributed computing
- [SvelteKit](https://kit.svelte.dev/) - The fastest web framework
- [IPFS](https://ipfs.io/) - Decentralized storage network

**Special Thanks**:
- Holochain community for the amazing framework
- Svelte team for the elegant DX
- All contributors and early testers

---

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website**: [mycelix.net](https://mycelix.net)
- **Documentation**: [docs.mycelix.net](https://docs.mycelix.net) *(coming soon)*
- **Protocol**: [Mycelix-Core](https://github.com/Luminous-Dynamics/Mycelix-Core)
- **Discord**: [Join our community](https://discord.gg/mycelix) *(coming soon)*
- **Twitter**: [@MycelixNetwork](https://twitter.com/MycelixNetwork) *(coming soon)*

---

<div align="center">

**Built for the future of decentralized commerce** 🍄

[Report Bug](https://github.com/Luminous-Dynamics/mycelix-marketplace/issues) · [Request Feature](https://github.com/Luminous-Dynamics/mycelix-marketplace/issues) · [Join Discord](https://discord.gg/mycelix)

</div>
