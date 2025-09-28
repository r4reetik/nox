import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, Position } from '@/lib/types';
import { SearchBar } from '@/components/explorer/SearchBar';
import { PositionCard } from '@/components/explorer/PositionCard';
import CosmicBackground from '@/components/explorer/CosmicBackground';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import { useReadContracts } from 'wagmi';
import { contracts } from '@/lib/contracts';
import { Hex } from 'viem';
import { useOraclePrice } from '@/hooks/useOraclePrice';
import { useNavigate, useSearchParams } from 'react-router-dom';


const ExplorerPage: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [position, setPosition] = useState<Position | null>(null);
  const [positionId, setPositionId] = useState<string>('');
  const [showIntro, setShowIntro] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const positionIdFromUrl = searchParams.get('positionId');


  const fetchData = useCallback(async (id: string) => {
    if (!id || !id.startsWith('0x')) {
      setAppState('IDLE');
      return;
    }

    setAppState('LOADING');
    setPosition(null);

    try {
      const response = await apiService.getPositionById(id);
      console.log("respppp" ,response);
      if (response && response.position) {
        console.log("positionnn res", response.position);
        setPosition(response.position);
        setAppState(response.position.status === 'Open' ? 'FOUND_OPEN' : 'FOUND_HISTORICAL');
      } else {
        setAppState('NOT_FOUND');
      }
    } catch (error: any) {
      console.log("respppperr", error);
      if (error.response && error.response.status === 404) {
        setAppState('NOT_FOUND');
      } else {
        toast.error("Error fetching position data.");
      }
    }
  }, []);

  useEffect(() => {
    if (positionIdFromUrl) {
      fetchData(positionIdFromUrl);
    }
  }, [positionIdFromUrl, fetchData]);




  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 500); // Duration of intro animation
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (id: string) => {
    navigate(`/explorer?positionId=${id}`);
  };

  const handleReset = () => {
    navigate('/explorer');
    setAppState('IDLE');
    setPosition(null);
  }

  const isSearching = appState === 'LOADING';
  const isFound = appState === 'FOUND_OPEN' || appState === 'FOUND_HISTORICAL';

  const introVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030617]">
      <CosmicBackground  mousePosition={mousePosition} />
      <div className="absolute inset-0 z-10">
      <main className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 transition-all duration-700 ease-in-out"
      style={{ justifyContent: isFound ? 'flex-start' : 'center', paddingTop: isFound ? '5vh' : '0' }}
    >
      <motion.div
        className="flex flex-col items-center"
        layout
        transition={{ duration: 0.7, type: 'spring', stiffness: 50 }}
      >
        <motion.h1
          className="font-orbitron text-4xl md:text-5xl tracking-widest text-center"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={introVariants}
          onClick={handleReset}
          style={{ cursor: 'pointer' }}
        >
          <span className="text-[#00f6ff]">Nox</span>
          <span className="text-slate-200">Explorer</span>
        </motion.h1>
        <motion.h2
          className="text-slate-400 text-md md:text-lg tracking-wider mb-8"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={introVariants}
        >
          Position Explorer
        </motion.h2>
      </motion.div>

      <motion.div
        layout
        transition={{ duration: 0.7, type: 'spring', stiffness: 50 }}
        className="w-full max-w-2xl"
      >
        <AnimatePresence>
          {showIntro && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <SearchBar onSearch={handleSearch} isLoading={isSearching} key="search-initial" />
              </motion.div>
          )}
          {!showIntro && <SearchBar onSearch={handleSearch} isLoading={isSearching} key="search-main" />}
        </AnimatePresence>
      </motion.div>

      <div className="mt-8 w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-[#00f6ff] font-roboto-mono"
            >
              Analyzing Hyperspace Lanes...
            </motion.div>
          )}

          {appState === 'NOT_FOUND' && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center font-roboto-mono text-lg text-[#ff2d55] animate-glitch"
            >
              ERROR: POSITION ID NOT FOUND
            </motion.div>
          )}

          {isFound && position && (
            <motion.div
              key="position-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay: 0.2 } }}
              exit={{ opacity: 0, y: 50, transition: { duration: 0.3 } }}
            >
              <PositionCard position={position} onRefresh={() => fetchData(position.data.position_id)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
      </div>
    </div>

  );
};

export default ExplorerPage;

