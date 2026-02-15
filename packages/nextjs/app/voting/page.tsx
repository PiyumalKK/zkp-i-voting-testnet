"use client";

import { VoteWithBurnerHardhat } from "./_challengeComponents/VoteWithBurnerHardhat";
import { ShowVotersButton } from "./_components/ShowVotersButton";
import { NextPage } from "next";
import { hardhat, sepolia } from "viem/chains";
import { CreateCommitment } from "~~/app/voting/_challengeComponents/CreateCommitment";
import { GenerateProof } from "~~/app/voting/_challengeComponents/GenerateProof";
import { VoteWithBurnerSepolia } from "~~/app/voting/_challengeComponents/VoteWithBurnerSepolia";
import { AddVotersModal } from "~~/app/voting/_components/AddVotersModal";
import { ClearStorageButton } from "~~/app/voting/_components/ClearStorageButton";
import { LogStorageButton } from "~~/app/voting/_components/LogStorageButton";
import { VoteSelector } from "~~/app/voting/_components/VoteChoice";
import { VotingStats } from "~~/app/voting/_components/VotingStats";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const VotingPage: NextPage = () => {
  const network = useTargetNetwork();

  const { data: leafEvents } = useScaffoldEventHistory({
    contractName: "Voting",
    eventName: "NewLeaf",
    watch: true,
    enabled: true,
  });

  return (
    <div className="flex items-center justify-center flex-col grow pt-6 w-full">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="px-4 sm:px-5 w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center w-full">
          {/* Page header */}
          <div className="w-full text-center mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Voting Booth
            </h1>
            <p className="text-sm text-base-content/50 mt-1">
              Follow the steps below to cast your anonymous vote
            </p>
          </div>

          <div className="w-full space-y-5">
            {/* Admin controls */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <ShowVotersButton />
              <AddVotersModal />
            </div>

            {/* Step 1: Stats */}
            <div className="relative">
              <div className="absolute -left-8 top-4 hidden lg:flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                  1
                </div>
                <div className="w-px h-full bg-primary/10" />
              </div>
              <VotingStats />
            </div>

            {/* Step 2: Register */}
            <div className="relative">
              <div className="absolute -left-8 top-4 hidden lg:flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                  2
                </div>
                <div className="w-px h-full bg-primary/10" />
              </div>
              <CreateCommitment leafEvents={leafEvents || []} />
            </div>

            {/* Step 3: Choose */}
            <div className="relative">
              <div className="absolute -left-8 top-4 hidden lg:flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                  3
                </div>
                <div className="w-px h-full bg-primary/10" />
              </div>
              <VoteSelector />
            </div>

            {/* Step 4: Prove */}
            <div className="relative">
              <div className="absolute -left-8 top-4 hidden lg:flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                  4
                </div>
                <div className="w-px h-full bg-primary/10" />
              </div>
              <GenerateProof leafEvents={leafEvents || []} />
            </div>

            {/* Step 5: Vote */}
            <div className="relative">
              <div className="absolute -left-8 top-4 hidden lg:flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
                  5
                </div>
              </div>
              {network.targetNetwork.id === hardhat.id && <VoteWithBurnerHardhat />}
              {network.targetNetwork.id === sepolia.id && <VoteWithBurnerSepolia />}
            </div>

            {/* Storage Management */}
            <div className="mt-6 pt-6 border-t border-base-content/5">
              <div className="flex justify-center gap-4">
                <LogStorageButton />
                <ClearStorageButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;
