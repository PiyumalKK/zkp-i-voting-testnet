"use client";

import { useEffect, useState } from "react";
import { createPublicClient, createWalletClient, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useChallengeState } from "~~/services/store/challengeStore";
import {
  hasStoredProof,
  loadBurnerWalletFromLocalStorage,
  loadProofFromLocalStorage,
  saveBurnerWalletToLocalStorage,
} from "~~/utils/proofStorage";

////// Checkpoint 9 //////
import {  parseEther, createTestClient } from "viem";
import { generatePrivateKey } from "viem/accounts";

type LocalProofData = {
  proof: `0x${string}`;
  publicInputs: any[];
};

const sendVoteWithBurner = async ({
  viemContract,
  publicClient,
  walletAddress,
  proofData,
}: {
  viemContract: any;
  publicClient: ReturnType<typeof createPublicClient>;
  walletAddress: `0x${string}`;
  proofData: LocalProofData;
}): Promise<string> => {
  ////// Checkpoint 9 //////

  // Fund the burner wallet from the first Hardhat signer
  const testClient = createTestClient({
    chain: hardhat,
    transport: http("http://localhost:8545"),
    mode: "hardhat",
  });

  // Impersonate account 0 to fund burner
  await testClient.setBalance({
    address: walletAddress,
    value: parseEther("1"),
  });

  // Get proof and public inputs from proofData
  const proof = proofData.proof as `0x${string}`;
  const publicInputs = proofData.publicInputs as `0x${string}`[];

  // Call the vote function: proof, nullifierHash, root, vote, depth
  const txHash = await viemContract.write.vote([
    proof,
    publicInputs[0], // nullifierHash
    publicInputs[1], // root
    publicInputs[2], // vote
    publicInputs[3], // depth
  ]);

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
};

export const VoteWithBurnerHardhat = ({ contractAddress }: { contractAddress?: `0x${string}` }) => {
  const [burnerWallet, setBurnerWallet] = useState<{ address: `0x${string}`; privateKey: `0x${string}` } | null>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [hasProofStored, setHasProofStored] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const { proofData, setProofData } = useChallengeState();
  const { address: userAddress } = useAccount();

  const generateBurnerWallet = () => {
    ////// Checkpoint 9 //////
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const wallet = { address: account.address as `0x${string}`, privateKey: privateKey as `0x${string}` };

    setBurnerWallet(wallet);

    const effectiveContractAddress = contractAddress || contractInfo?.address;
    if (effectiveContractAddress && userAddress) {
      saveBurnerWalletToLocalStorage(wallet.privateKey, wallet.address, effectiveContractAddress, userAddress);
    }

    return wallet;
  };

  const { data: contractInfo } = useDeployedContractInfo({ contractName: "Voting" });

  const { data: voteCastEvents } = useScaffoldEventHistory({
    contractName: "Voting",
    eventName: "VoteCast",
    watch: true,
    enabled: !!burnerWallet?.address,
  });

  useEffect(() => {
    if (burnerWallet?.address && voteCastEvents) {
      const hasVotedAlready = voteCastEvents.some(
        event => event.args?.voter?.toLowerCase() === burnerWallet.address.toLowerCase(),
      );
      setHasVoted(hasVotedAlready);
    } else {
      setHasVoted(false);
    }
  }, [burnerWallet?.address, voteCastEvents]);

  useEffect(() => {
    const checkAndLoadStoredProof = () => {
      const effectiveContractAddress = contractAddress || contractInfo?.address;
      if (effectiveContractAddress && userAddress) {
        const proofExists = hasStoredProof(effectiveContractAddress, userAddress);
        setHasProofStored(proofExists);

        if (proofExists && !proofData) {
          try {
            const storedProof = loadProofFromLocalStorage(effectiveContractAddress, userAddress);
            if (storedProof) {
              setProofData(storedProof);
            }
          } catch (error) {
            console.error("Error auto-loading proof:", error);
          }
        }
      } else {
        setHasProofStored(false);
      }
    };

    checkAndLoadStoredProof();
  }, [contractAddress, contractInfo?.address, userAddress, proofData, setProofData]);

  useEffect(() => {
    const effectiveContractAddress = contractAddress || contractInfo?.address;
    if (effectiveContractAddress && userAddress) {
      try {
        const storedBurnerWallet = loadBurnerWalletFromLocalStorage(effectiveContractAddress, userAddress);
        if (storedBurnerWallet) {
          const account = privateKeyToAccount(storedBurnerWallet.privateKey as `0x${string}`);
          setBurnerWallet({
            privateKey: storedBurnerWallet.privateKey as `0x${string}`,
            address: account.address as `0x${string}`,
          });
        } else {
          setBurnerWallet(null);
        }
      } catch (error) {
        console.error("Error auto-loading burner wallet:", error);
        setBurnerWallet(null);
      }
    } else {
      setBurnerWallet(null);
    }
  }, [contractAddress, contractInfo?.address, userAddress]);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Submit Vote</h2>
        <p className="text-xs text-base-content/40 mt-1">Use a local burner wallet to submit the on-chain vote with the proof</p>
      </div>

      {burnerWallet && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-sm">Burner Wallet:</span>
          <Address address={burnerWallet.address} />
        </div>
      )}

      <div className="flex justify-center">
        <button
          className="btn btn-primary btn-lg w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200"
          disabled={!hasProofStored || !proofData || txStatus === "pending" || hasVoted}
          onClick={async () => {
            try {
              if (!proofData) {
                console.error("Please generate proof first");
                return;
              }

              setTxStatus("pending");

              const wallet = burnerWallet ?? generateBurnerWallet();
              const publicClient = createPublicClient({ chain: hardhat, transport: http("http://localhost:8545") });
              const address = (contractAddress || contractInfo?.address) as string | undefined;
              if (!address) throw new Error("Contract not found");
              const abi = (contractInfo?.abi as any) || [];
              const voterClient = createWalletClient({
                account: privateKeyToAccount(wallet.privateKey),
                chain: hardhat,
                transport: http("http://localhost:8545"),
              });
              const viemContract = getContract({ address: address as `0x${string}`, abi, client: voterClient });

              await sendVoteWithBurner({
                viemContract,
                publicClient,
                walletAddress: wallet.address,
                proofData: proofData as LocalProofData,
              });

              setTxStatus("success");
            } catch (e) {
              console.error("Error voting:", e);
              setTxStatus("error");
            }
          }}
        >
          {txStatus === "pending" ? "Voting..." : hasVoted ? "Already voted" : "Vote with burner wallet"}
        </button>
      </div>
    </div>
  );
};

const uint8ArrayToHexString = (buffer: Uint8Array): `0x${string}` => {
  const hex: string[] = [];
  buffer.forEach(function (i) {
    let h = i.toString(16);
    if (h.length % 2) {
      h = "0" + h;
    }
    hex.push(h);
  });
  return `0x${hex.join("")}`;
};
