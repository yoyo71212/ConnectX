"use client"; 

import React from 'react';
import ConnectXBoard from '@/components/ConnectXBoard'; 
import { PlayerProvider } from '@/context/PlayerContext';

export default function GamePage() {
  return(
  <PlayerProvider>
  <ConnectXBoard />
  </PlayerProvider>
  );
}