import { useChallengeState } from "~~/services/store/challengeStore";

export const VoteSelector = () => {
  const voteChoice = useChallengeState(state => state.voteChoice);
  const setVoteChoice = useChallengeState(state => state.setVoteChoice);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Choose Your Vote</h2>
        <p className="text-xs text-base-content/40 mt-1">Select your position before generating a proof</p>
      </div>
      <div className="flex gap-4 justify-center">
        <button
          className={`btn btn-lg min-w-[120px] transition-all duration-200 ${
            voteChoice === true
              ? "bg-success/90 border-success text-success-content shadow-lg shadow-success/25 scale-105"
              : "btn-outline border-base-content/10 hover:border-success/50 hover:bg-success/10"
          }`}
          onClick={() => setVoteChoice(true)}
        >
          Yes
        </button>
        <button
          className={`btn btn-lg min-w-[120px] transition-all duration-200 ${
            voteChoice === false
              ? "bg-error/90 border-error text-error-content shadow-lg shadow-error/25 scale-105"
              : "btn-outline border-base-content/10 hover:border-error/50 hover:bg-error/10"
          }`}
          onClick={() => setVoteChoice(false)}
        >
          No
        </button>
      </div>
    </div>
  );
};
