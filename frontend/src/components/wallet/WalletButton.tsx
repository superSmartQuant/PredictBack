"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo } from "react";

export function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const shortAddress = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  const handleClick = useCallback(() => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  }, [publicKey, disconnect, setVisible]);

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
        transition-all duration-200 ease-out cursor-pointer
        ${publicKey
          ? 'bg-bg-tertiary border border-border hover:border-pink-500/50 hover:bg-bg-elevated text-text-primary'
          : 'bg-pink-500 hover:bg-pink-400 hover:shadow-[0_0_20px_rgba(255,71,133,0.4)] text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {connecting ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      ) : publicKey ? (
        <>
          <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
          <span className="font-mono text-sm">{shortAddress}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="16" cy="12" r="2" />
            <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}
