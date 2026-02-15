import { Address } from "~~/components/scaffold-eth";
import {
  useDeployedContractInfo,
  useScaffoldReadContract,
} from "~~/hooks/scaffold-eth";

export const VotingStats = () => {
  const { data: deployedContractData } = useDeployedContractInfo({
    contractName: "Voting",
  });

  const { data: votingData } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getVotingData",
  });

  const question = votingData?.[0];
  const owner = votingData?.[1];
  const yesVotes = votingData?.[2];
  const noVotes = votingData?.[3];

  const q = (question as string | undefined) || undefined;
  const yes = (yesVotes as bigint | undefined) ?? 0n;
  const no = (noVotes as bigint | undefined) ?? 0n;
  const totalVotes = yes + no;
  const yesPercentage = totalVotes > 0n ? Number((yes * 100n) / totalVotes) : 0;
  const noPercentage = totalVotes > 0n ? Number((no * 100n) / totalVotes) : 0;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {q || "Loading..."}
        </h2>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-base-content/50">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Contract:</span>
            <Address address={deployedContractData?.address} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Owner:</span>
            <Address address={owner as `0x${string}`} />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-base-content/5 text-xs font-medium text-base-content/60">
          Total Votes: {totalVotes.toString()}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 transition-all hover:border-success/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-success/70">
            Yes
          </div>
          <div className="text-2xl font-black text-success mt-1">
            {yes.toString()}
          </div>
          <div className="text-xs font-medium text-success/60 mt-0.5">
            {yesPercentage.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl border border-error/20 bg-error/5 p-4 transition-all hover:border-error/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-error/70">
            No
          </div>
          <div className="text-2xl font-black text-error mt-1">
            {no.toString()}
          </div>
          <div className="text-xs font-medium text-error/60 mt-0.5">
            {noPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
      {totalVotes > 0n && (
        <div className="w-full bg-base-content/5 rounded-full h-2.5 overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-success to-success/80 h-2.5 rounded-l-full transition-all duration-500"
            style={{ width: `${yesPercentage}%` }}
          />
          <div
            className="bg-gradient-to-r from-error/80 to-error h-2.5 rounded-r-full transition-all duration-500"
            style={{ width: `${noPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
