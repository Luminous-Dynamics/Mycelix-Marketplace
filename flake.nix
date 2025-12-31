{
  description = "Mycelix Marketplace - reproducible dev shell and builds";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        nodejs = pkgs.nodejs_20;
      in {
        packages = {
          frontend = pkgs.buildNpmPackage {
            pname = "mycelix-marketplace-frontend";
            version = "1.0.0";
            src = ./frontend;
            npmDepsHash = "sha256-7FNbB1/niXZDSAyB6Q+K117tK6obQbYH9csNY4oAtcw=";
            npmBuildScript = "build";
            # expose the static build output
            installPhase = ''
              runHook preInstall
              mkdir -p $out
              if [ -d build ]; then
                cp -r build/. "$out/"
              fi
              if [ -d .svelte-kit ]; then
                cp -r .svelte-kit "$out/.svelte-kit"
              fi
              runHook postInstall
            '';
          };
          default = self.packages.${system}.frontend;
        };

        devShells.default = pkgs.mkShell {
          name = "mycelix-marketplace";
          packages = [
            nodejs
            pkgs.nodePackages.pnpm
            pkgs.nodePackages.typescript
            pkgs.nodePackages."svelte-language-server"
          ];
          shellHook = ''
            export NPM_CONFIG_PREFIX="$HOME/.npm-global"
            export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"
            echo "🔧 Entered Mycelix dev shell (frontend/). Run 'cd frontend && npm install' on first use."
          '';
        };

        formatter = pkgs.nixpkgs-fmt;
      });
}
