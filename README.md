# ZKP Private Voting (Testnet)

A **zero-knowledge proof-based private voting system** built on Ethereum. Voters can prove they're eligible and cast their vote **without revealing their identity**, while results remain publicly verifiable on-chain.

## How It Works

1. **Registration** — An admin adds eligible addresses to an allowlist. Voters generate a cryptographic commitment (from a secret nullifier + secret value) and register it on-chain into a Merkle tree.
2. **Proof Generation** — Voters generate a ZK proof in-browser proving they have a valid commitment in the Merkle tree, without revealing which one is theirs.
3. **Anonymous Voting** — The proof is submitted from a different (burner) wallet to cast a Yes/No vote. A nullifier prevents double-voting while keeping the voter's identity private.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ZK Circuits | [Noir](https://noir-lang.org/) v1.0.0-beta.3 |
| Proof System | [Barretenberg](https://github.com/AztecProtocol/aztec-packages) (UltraHonk) v0.82.2 |
| Smart Contracts | Solidity 0.8.27 (Hardhat) |
| Merkle Tree | LeanIMT (Lean Incremental Merkle Tree) |
| Frontend | Next.js 15, React, Tailwind CSS, DaisyUI |
| Wallet | RainbowKit, wagmi, viem |
| Browser Proofs | @noir-lang/noir_js, @aztec/bb.js |

## Project Structure

```
packages/
├── circuits/          # Noir ZK circuit (commitment + Merkle proof verification)
│   └── src/main.nr
├── hardhat/           # Solidity contracts + tests + deployment
│   ├── contracts/
│   │   ├── Voting.sol       # Core voting contract (register, vote, allowlist)
│   │   └── Verifier.sol     # Auto-generated HonkVerifier from Noir circuit
│   ├── deploy/              # Hardhat deployment scripts
│   └── test/                # Contract tests
└── nextjs/            # Frontend application
    ├── app/
    │   ├── page.tsx         # Home page
    │   └── voting/          # Voting interface
    │       ├── _challengeComponents/   # Commitment, proof gen, vote submission
    │       └── _components/            # UI components (stats, modals, etc.)
    ├── contracts/           # Deployed contract ABIs
    ├── utils/proofStorage.ts  # localStorage helpers for proofs
    └── services/store/      # Zustand state management
```

## Prerequisites

### Required (to run the app)

- [Node.js](https://nodejs.org/) >= v20.18.3
- [Yarn](https://yarnpkg.com/) v2+
- [Git](https://git-scm.com/)

### Optional (only if modifying the ZK circuit)

These are **not needed** to run the app — the compiled circuit and verifier contract are already included in the repo.

- [Nargo](https://noir-lang.org/docs/getting_started/quick_start#installation) v1.0.0-beta.3
- [bb (Barretenberg)](https://barretenberg.aztec.network/docs/getting_started/) v0.82.2
- **Windows Users:** Nargo and bb require [WSL (Ubuntu)](https://learn.microsoft.com/en-us/windows/wsl/install). Install and run Noir commands inside WSL.

<details>
<summary><b>Installation steps for Nargo, bb, and WSL (click to expand)</b></summary>

#### 1. Install WSL (Windows only)

Open PowerShell as Administrator:

```powershell
wsl --install -d Ubuntu
```

Restart your PC, then open Ubuntu from the Start menu and set up a username/password.

#### 2. Install Nargo (inside WSL / Linux / macOS)

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
source ~/.bashrc
noirup -v 1.0.0-beta.3
nargo --version   # Should show 1.0.0-beta.3
```

#### 3. Install bb (Barretenberg)

```bash
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
source ~/.bashrc
bbup -v 0.82.2
bb --version   # Should show 0.82.2
```

#### 4. Recompile the circuit (after modifying `main.nr`)

```bash
# From WSL, navigate to the circuits folder
cd /mnt/d/path-to-project/packages/circuits

# Compile
nargo compile

# Generate verification key
bb write_vk -b target/zkp_ivoting_testnet.json -o target/vk

# Generate Solidity verifier
bb contract -k target/vk -o ../../packages/hardhat/contracts/Verifier.sol
```

</details>

## Getting Started

### 1. Install Dependencies

```bash
yarn install
```

### 2. Start Local Blockchain

```bash
yarn chain
```

### 3. Deploy Contracts

In a second terminal:

```bash
yarn deploy
```

### 4. Start Frontend

In a third terminal:

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Voting Flow

1. **Connect Wallet** — Connect with MetaMask (use Hardhat Account #0 as admin)
2. **Add Voters** — Admin adds wallet addresses to the allowlist
3. **Register** — Eligible voter generates a commitment and registers on-chain
4. **Choose Vote** — Select Yes or No
5. **Generate Proof** — ZK proof is generated in the browser (~30s)
6. **Cast Vote** — Proof is submitted from a burner wallet to vote anonymously

## Smart Contracts

### Voting.sol
- `addToAllowList(address)` — Admin adds eligible voters
- `register(uint256 commitment)` — Voter registers commitment to Merkle tree
- `vote(uint256 nullifierHash, uint256 root, bytes calldata proof, bool voteChoice)` — Submit ZK-verified anonymous vote

### Verifier.sol (HonkVerifier)
- Auto-generated Solidity verifier from the compiled Noir circuit
- Verifies UltraHonk proofs on-chain

## ZK Circuit (Noir)

**Public inputs:** `nullifier_hash`, `root`, `vote`, `depth`

**Private inputs:** `nullifier`, `secret`, `index`, `siblings[16]`

The circuit proves:
- The voter knows a valid `nullifier` + `secret` that hash to a commitment in the Merkle tree
- The commitment exists at the given `root`
- The `nullifier_hash` is correctly derived (for double-vote prevention)

## Running Tests

```bash
yarn test
```

## Repository

[https://github.com/PiyumalKK/zkp-i-voting-testnet](https://github.com/PiyumalKK/zkp-i-voting-testnet)

## License

See [LICENCE](./LICENCE) for details.
