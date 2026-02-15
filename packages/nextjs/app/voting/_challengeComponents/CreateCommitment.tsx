"use client";

import { useState } from "react";
////// Checkpoint 7 //////
import { Fr } from "@aztec/bb.js";
import { toHex } from "viem";
import { poseidon2 } from "poseidon-lite";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useChallengeState } from "~~/services/store/challengeStore";
import { saveCommitmentToLocalStorage } from "~~/utils/proofStorage";

const generateCommitment = async (): Promise<CommitmentData> => {
  ////// Checkpoint 7 //////
  // Generate random nullifier and secret
  const nullifier = BigInt(Fr.random().toString());
  const secret = BigInt(Fr.random().toString());

  // Hash with Poseidon to create the commitment
  const commitment = poseidon2([nullifier, secret]);

  // Format for Solidity as bytes32 hex string
  const commitmentHex = toHex(commitment, { size: 32 });
  const nullifierHex = nullifier.toString();
  const secretHex = secret.toString();

  return {
    commitment: commitmentHex,
    nullifier: nullifierHex,
    secret: secretHex,
  };
};

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  index?: number;
}

interface CreateCommitmentProps {
  leafEvents?: any[];
}

export const CreateCommitment = ({ leafEvents = [] }: CreateCommitmentProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [, setIsInserted] = useState(false);
  const { setCommitmentData, commitmentData } = useChallengeState();

  const { address: userAddress, isConnected } = useAccount();

  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "Voting" });

  const { data: voterData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVoterData",
    args: [userAddress as `0x${string}`],
  });

  const isVoter = voterData?.[0];
  const hasRegistered = voterData?.[1];

  const canRegister = Boolean(isConnected && isVoter !== false && hasRegistered !== true);

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "Voting",
  });

  const handleGenerateCommitment = async () => {
    setIsGenerating(true);
    try {
      const data = await generateCommitment();
      setCommitmentData(data);
      return data;
    } catch (error) {
      console.error("Error generating commitment:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertCommitment = async (dataOverride?: CommitmentData) => {
    const localData = dataOverride || commitmentData;
    if (!localData) return;

    setIsInserting(true);
    try {
      // Capture index BEFORE the tx (current leaf count = our new leaf's index)
      const newIndex = leafEvents ? leafEvents.length : 0;

      await writeContractAsync({
        functionName: "register",
        args: [BigInt(localData.commitment)],
      });

      // Transaction succeeded — save commitment with index immediately
      const updatedData = { ...localData, index: newIndex };
      setCommitmentData(updatedData);
      setIsInserted(true);
      saveCommitmentToLocalStorage(updatedData, deployedContractData?.address, userAddress);
      console.log("Commitment saved:", { nullifier: updatedData.nullifier, index: newIndex });
    } catch (error) {
      console.error("Error inserting commitment:", error);
    } finally {
      setIsInserting(false);
    }
  };

  const handleRegister = async () => {
    const data = await handleGenerateCommitment();
    await handleInsertCommitment(data);
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Register for This Vote</h2>
        <p className="text-xs text-base-content/40 mt-1">Generate your anonymous identifier and insert it into the Merkle tree</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          className={`btn btn-lg w-full transition-all duration-200 ${
            hasRegistered === true
              ? "bg-success/15 border-success/30 text-success cursor-not-allowed"
              : isGenerating || isInserting
                ? "btn-primary"
                : !canRegister
                  ? "btn-disabled opacity-40"
                  : "btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/40"
          }`}
          onClick={hasRegistered === true ? undefined : handleRegister}
          disabled={isGenerating || isInserting || !canRegister}
        >
          {isGenerating ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Generating commitment...
            </>
          ) : isInserting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Inserting into Merkle tree...
            </>
          ) : !isConnected ? (
            "Connect wallet to register"
          ) : isVoter === false ? (
            "Not eligible - not on voters list"
          ) : hasRegistered === true ? (
            "✓ Already registered for this vote"
          ) : (
            "Register to vote"
          )}
        </button>
      </div>
    </div>
  );
};
