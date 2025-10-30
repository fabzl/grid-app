{
  description = "Grip devshell for Holochain (hc + holochain)";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    holochain.url = "github:holochain/holochain";
  };
  outputs = { self, nixpkgs, holochain }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ holochain.packages.${system}.holochain holochain.packages.${system}.hc pkgs.rustc pkgs.cargo pkgs.openssl pkgs.pkg-config ];
        shellHook = ''
          echo "Grip dev shell ready: holochain=$(holochain --version), hc=$(hc --version)"
        '';
      };
    };
}


