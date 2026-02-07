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
      className="btn-primary text-white text-sm inline-flex items-center gap-2"
    >
      {connecting ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Connecting...
        </>
      ) : publicKey ? (
        <>
          <span className="w-2 h-2 rounded-full bg-bullish" />
          {shortAddress}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
