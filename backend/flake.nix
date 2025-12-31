{
  description = "Mycelix Marketplace - P2P Marketplace on Holochain";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    # Holochain official flake
    holochain-flake.url = "github:holochain/holochain";
    holochain-flake.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, holochain-flake }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Get Holochain binaries from the official flake
        holochainPkgs = holochain-flake.packages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Rust toolchain with rustup for target management
            rustup       # Rust toolchain installer

            # Rust tools
            rust-analyzer
            rustfmt
            clippy

            # WASM build dependencies
            lld          # LLVM linker for WASM (CRITICAL!)
            binaryen     # wasm-opt for optimizing WASM
            wasm-pack    # WASM build tool

            # Holochain tools from official flake
            holochainPkgs.holochain  # Holochain conductor
            holochainPkgs.lair-keystore  # Keystore
            holochainPkgs.hc  # Holochain CLI (hc bundle, hc dna, hc app)

            # Development tools
            nodejs_20    # For frontend development
            pkg-config
            openssl

            # Optional but useful
            jq           # JSON processing
            just         # Command runner (optional)
          ];

          shellHook = ''
            echo "🚀 Mycelix Marketplace Development Environment"
            echo ""

            # Ensure Rust toolchain is installed
            if ! rustup show &>/dev/null; then
              echo "📦 Installing Rust stable toolchain..."
              rustup default stable
            fi

            # Ensure wasm32 target is installed
            if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
              echo "📦 Installing wasm32-unknown-unknown target..."
              rustup target add wasm32-unknown-unknown
            fi

            echo "Holochain Version: $(holochain --version 2>/dev/null || echo 'N/A')"
            echo "Rust Version: $(rustc --version)"
            echo ""
            echo "Available commands:"
            echo "  cargo build --release --target wasm32-unknown-unknown  # Build WASM zomes"
            echo "  hc dna pack .                                          # Package DNA"
            echo "  hc app pack .                                          # Package hApp"
            echo "  holochain -c conductor-config.yaml                     # Run conductor"
            echo ""
            echo "Quick build script:"
            echo "  ./build-happ.sh  (automatically installs wasm32 target)"
            echo ""
          '';

          # Set WASM target as default for easier builds
          CARGO_BUILD_TARGET = "wasm32-unknown-unknown";

          # Ensure we have the WASM target installed
          RUSTUP_TOOLCHAIN = "stable";
        };
      }
    );
}
