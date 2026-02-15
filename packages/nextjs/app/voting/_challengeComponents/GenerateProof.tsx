"use client";

import { useState } from "react";
//// Checkpoint 8 //////
import { UltraHonkBackend } from "@aztec/bb.js";
// @ts-ignore
import { Noir } from "@noir-lang/noir_js";
import { LeanIMT } from "@zk-kit/lean-imt";
import { toHex } from "viem";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { useAccount } from "wagmi";
import {
  useDeployedContractInfo,
  useScaffoldReadContract,
} from "~~/hooks/scaffold-eth";
import { useChallengeState } from "~~/services/store/challengeStore";
import {
  hasStoredProof,
  loadCommitmentFromLocalStorage,
  saveProofToLocalStorage,
} from "~~/utils/proofStorage";
import { notification } from "~~/utils/scaffold-eth";

const generateProof = async (
  _root: bigint,
  _vote: boolean,
  _depth: number,
  _nullifier: string,
  _secret: string,
  _index: number,
  _leaves: any[],
  _circuitData: any,
) => {
  //// Checkpoint 8 //////
  try {
    // Compute the nullifierHash
    const nullifierBigInt = BigInt(_nullifier);
    const secretBigInt = BigInt(_secret);
    const nullifierHash = poseidon1([nullifierBigInt]);

    // Rebuild the Merkle tree
    const calculatedTree = new LeanIMT((a: bigint, b: bigint) =>
      poseidon2([a, b]),
    );

    // Extract leaf values from events, reverse to insert oldest-first
    const leaves = _leaves.map((event: any) => event.args.value).reverse();

    // Insert all leaves into the tree
    calculatedTree.insertMany(leaves);

    // Create Merkle tree inclusion proof
    const merkleProof = calculatedTree.generateProof(_index);
    const siblings = merkleProof.siblings.map((s: any) => s.toString());

    // Pad siblings to fixed length of 16
    while (siblings.length < 16) {
      siblings.push("0");
    }

    // Prepare circuit inputs
    const input = {
      nullifier_hash: nullifierHash.toString(),
      nullifier: nullifierBigInt.toString(),
      secret: secretBigInt.toString(),
      root: _root.toString(),
      vote: _vote,
      depth: _depth.toString(),
      index: _index.toString(),
      siblings: siblings,
    };

    // Create the witness
    const noir = new Noir(_circuitData);
    const { witness } = await noir.execute(input);
    console.log("Witness generated, byte length:", witness.length);

    // Generate the ZK proof
    const honk = new UltraHonkBackend(_circuitData.bytecode, { threads: 1 });
    const proof = await honk.generateProof(witness, { keccak: true });
    console.log("Proof generated:", proof);

    // Format the result for Solidity
    const proofHex = toHex(proof.proof);

    return {
      proof: proofHex,
      publicInputs: proof.publicInputs,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

interface CreateCommitmentProps {
  leafEvents?: any[];
}

export const GenerateProof = ({ leafEvents = [] }: CreateCommitmentProps) => {
  const [, setCircuitData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { commitmentData, setProofData, voteChoice } = useChallengeState();
  const { address: userAddress, isConnected } = useAccount();
  const { data: deployedContractData } = useDeployedContractInfo({
    contractName: "Voting",
  });

  const [nullifierInput, setNullifierInput] = useState<string>("");
  const [secretInput, setSecretInput] = useState<string>("");
  const [indexInput, setIndexInput] = useState<string>("");

  const { data: votingData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingData",
  });

  const root = votingData?.[6];
  const treeDepth = votingData?.[5];

  const { data: voterData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVoterData",
    args: [userAddress as `0x${string}`],
  });

  const isVoter = voterData?.[0];
  const hasRegistered = voterData?.[1];

  const canVote = Boolean(
    isConnected && isVoter === true && hasRegistered === true,
  );

  const hasExistingProof = hasStoredProof(
    deployedContractData?.address,
    userAddress,
  );

  const getCircuitDataAndGenerateProof = async () => {
    setIsLoading(true);
    try {
      // Ensure commitment inputs are loaded from localStorage when available
      const storedCommitment =
        deployedContractData?.address && userAddress
          ? loadCommitmentFromLocalStorage(
              deployedContractData.address,
              userAddress,
            )
          : null;

      // Resolve effective values immediately (don't rely on async setState)
      const effectiveNullifier = (
        nullifierInput?.trim() ||
        commitmentData?.nullifier ||
        storedCommitment?.nullifier ||
        ""
      ).trim();
      const effectiveSecret = (
        secretInput?.trim() ||
        commitmentData?.secret ||
        storedCommitment?.secret ||
        ""
      ).trim();
      const effectiveIndex =
        indexInput?.trim() !== ""
          ? Number(indexInput)
          : (commitmentData?.index ?? storedCommitment?.index);

      // Update UI inputs for display (async — not used below)
      if (
        storedCommitment &&
        (!nullifierInput || !secretInput || indexInput?.trim() === "")
      ) {
        setNullifierInput(storedCommitment.nullifier);
        setSecretInput(storedCommitment.secret);
        setIndexInput(storedCommitment.index?.toString() ?? "");
      }

      let fetchedCircuitData: any;
      try {
        const apiRes = await fetch("/api/circuit");
        if (!apiRes.ok) throw new Error("API fetch failed");
        fetchedCircuitData = await apiRes.json();
      } catch {
        const staticRes = await fetch("/circuits.json");
        if (!staticRes.ok) {
          throw new Error("Failed to fetch circuit data");
        }
        fetchedCircuitData = await staticRes.json();
      }
      setCircuitData(fetchedCircuitData);

      if (voteChoice === null) {
        throw new Error("Please select your vote (Yes/No) first");
      }

      if (!leafEvents || leafEvents.length === 0) {
        throw new Error(
          "There are no commitments in the tree yet. Please insert a commitment first.",
        );
      }

      if (
        !effectiveNullifier ||
        !effectiveSecret ||
        effectiveIndex === undefined
      ) {
        throw new Error(
          "Missing commitment inputs. Paste your saved data or ensure you have generated & inserted a commitment.",
        );
      }

      const generatedProof = await generateProof(
        root as bigint,
        voteChoice,
        treeDepth as unknown as number,
        effectiveNullifier,
        effectiveSecret,
        effectiveIndex as number,
        leafEvents as any,
        fetchedCircuitData,
      );
      setProofData({
        proof: generatedProof.proof,
        publicInputs: generatedProof.publicInputs,
      });

      saveProofToLocalStorage(
        {
          proof: generatedProof.proof,
          publicInputs: generatedProof.publicInputs,
        },
        deployedContractData?.address,
        voteChoice,
        userAddress,
      );
    } catch (error) {
      console.error("Error in getCircuitDataAndGenerateProof:", error);
      notification.error(
        (error as Error).message || "Failed to generate proof",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">Generate ZK Proof</h2>
        <p className="text-xs text-base-content/40 mt-1">
          Prove membership in the Merkle tree and bind your voting decision to
          the proof
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            className={`btn btn-lg w-full transition-all duration-200 ${canVote && !hasExistingProof && voteChoice !== null ? "btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/40" : "btn-disabled opacity-40"}`}
            onClick={
              canVote && !hasExistingProof && voteChoice !== null
                ? getCircuitDataAndGenerateProof
                : undefined
            }
            disabled={
              isLoading || !canVote || hasExistingProof || voteChoice === null
            }
          >
            {isLoading
              ? "Generating proof..."
              : hasExistingProof
                ? "Proof already exists"
                : !canVote
                  ? "Must register first"
                  : voteChoice === null
                    ? "Select choice first"
                    : "Generate proof"}
          </button>
        </div>
      </div>
    </div>
  );
};
