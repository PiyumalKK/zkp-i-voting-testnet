"use client";

import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import type { NextPage } from "next";
import Link from "next/link";
import {
  ShieldCheckIcon,
  FingerPrintIcon,
  LockClosedIcon,
  EyeSlashIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="flex flex-col grow">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-24 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="relative z-10 max-w-3xl text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-pulse">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              ZK Private Voting
            </h1>
            <p className="text-xl md:text-2xl text-base-content/60 font-light max-w-2xl mx-auto leading-relaxed">
              Anonymous, verifiable on-chain voting powered by zero-knowledge proofs.
              Vote without revealing your identity.
            </p>
          </div>

          {/* Connected Address */}
          {connectedAddress && (
            <div className="glass-card inline-flex items-center gap-3 px-5 py-3 mx-auto">
              <span className="text-sm text-base-content/50 font-medium">Connected</span>
              <div className="w-px h-4 bg-base-content/20" />
              <Address address={connectedAddress} />
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/voting"
              className="btn btn-primary btn-lg gap-2 px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              Start Voting
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-primary/80 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FingerPrintIcon,
                title: "Register Anonymously",
                description:
                  "Generate a cryptographic commitment from a secret nullifier. Your identity is never linked to your vote.",
                step: "01",
              },
              {
                icon: LockClosedIcon,
                title: "Generate ZK Proof",
                description:
                  "Create a zero-knowledge proof that verifies your eligibility without revealing which voter you are.",
                step: "02",
              },
              {
                icon: CheckBadgeIcon,
                title: "Cast Your Vote",
                description:
                  "Submit your proof on-chain through a burner wallet. The smart contract verifies it instantly.",
                step: "03",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-8 space-y-4 group hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-3xl font-black text-base-content/5 group-hover:text-primary/10 transition-colors">
                    {feature.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-base-content/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Banner */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center space-y-6 border-primary/20">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <EyeSlashIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Complete Voter Privacy</h2>
            <p className="text-base-content/50 max-w-xl mx-auto leading-relaxed">
              Using Noir circuits and the UltraHonk proving system, your vote is cryptographically
              separated from your identity. Results are publicly verifiable, but individual votes
              remain completely anonymous.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              {["Noir Circuits", "Merkle Trees", "Poseidon Hashing", "On-Chain Verification"].map(tag => (
                <span
                  key={tag}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
