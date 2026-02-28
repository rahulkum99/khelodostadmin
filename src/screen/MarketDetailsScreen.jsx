import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventDetailWebSocket } from '../redux/hooks/useEventDetailWebSocket';
import { useGetMarketAnalysisQuery } from '../redux/api/authApi';
import { toast } from 'react-toastify';
import './GametableDetail.css';
import OddsCell from './OddsCell';
import Navbar from '../component/Navbar';

function GametableDetail({ event: eventProp }) {
  const location = useLocation();
  const event = eventProp || location.state?.event;
  const [activeFancyTab, setActiveFancyTab] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('fancy'); // 'fancy' | 'sportbook'
  const [activeSportbookTab, setActiveSportbookTab] = useState('all'); // all | match | odds/even | batsman | bowler | extra
  const [fancyInfoMarketId, setFancyInfoMarketId] = useState(null); // market.mid when (i) clicked to show min/max on mobile
  const fancyInfoRef = useRef(null);
  const [bookModal, setBookModal] = useState(null); // { market, section } when Book modal is open
  const [bookListModal, setBookListModal] = useState(null); // { type: 'master' | 'user' } when Market List modal is open

  // Close fancy min/max popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fancyInfoRef.current && !fancyInfoRef.current.contains(e.target)) {
        setFancyInfoMarketId(null);
      }
    };
    if (fancyInfoMarketId != null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [fancyInfoMarketId]);

  // Local quick stakes (no Redux / API dependency)
  const quickStakes = [100, 500, 1000, 5000];
  // No authentication / wallet / bets API in this admin view
  const isAuthenticated = false;
  const isPlacingBet = false;
  const todayBets = [];

  // Bet slip state
  const [selectedBet, setSelectedBet] = useState(null);
  const [betOdds, setBetOdds] = useState(0);
  const [betStake, setBetStake] = useState(0);

  // Extract and validate eventId, fall back to provided cricket event id when missing
  let eventId = event?.eventId;
  if ((eventId === undefined || eventId === null || eventId === '') && event) {
    eventId = event?.gameId || event?.gmid || event?.id;
  }

  const eventIdString = (() => {
    if (eventId !== undefined && eventId !== null && eventId !== '') {
      return String(eventId).trim();
    }
    // Fallback: use default cricket event id from .env / request
    return '505118586';
  })();

  const sport = event?.sport || 'cricket';

  // Market analysis (aggregated profit/loss per market/selection) for this event
  const { data: marketAnalysis = [] } = useGetMarketAnalysisQuery(eventIdString, {
    skip: !eventIdString,
  });

  // WebSocket data for event detail only
  const {
    data: eventData = [],
    isConnected: wsConnected,
    connectionStatus,
  } = useEventDetailWebSocket(eventIdString, sport);

  const isCricket = (sport || '').toLowerCase() === 'cricket';

  // Separate markets by gtype (fallback to mname for backward compatibility). Fancy bets only for cricket.
  const { matchOdds, bookmakers, fancyBets } = useMemo(() => {
    const matchOdds = [];
    const bookmakers = [];
    const fancyBets = [];

    eventData.forEach((market) => {
      const gtype = (market.gtype || '').toLowerCase();
      const mname = (market.mname || '').toLowerCase();
      const normalizedMname = mname.replace(/\s+/g, ' ').trim();

      // Remove "Bookmaker 2"/"Bookmaker2" market from UI (but not "Bookmaker 20", etc.)
      if (/^bookmaker\s*2(\D|$)/.test(normalizedMname)) return;
      // Exclude cricketcasino markets from display
      if (gtype === 'cricketcasino') return;
      // Do not show odd/even markets in Fancy Bet; they are handled in Sportsbook
      if (gtype === 'oddeven') return;
      if (gtype === 'match') {
        matchOdds.push(market);
      } else if (gtype === 'match1') {
        bookmakers.push(market);
      } else if (gtype && gtype !== 'fancy1') {
        // Exclude fancy1 from generic fancy table; it is rendered
        // separately in the Toss (card-style) section.
        fancyBets.push(market);
      } else {
        if (mname.includes('match odds') || mname.includes('match_odds')) {
          matchOdds.push(market);
        } else if (mname.includes('bookmaker')) {
          bookmakers.push(market);
        } else {
          // For markets without a clear gtype, avoid adding toss-style
          // fancy1 markets into the generic fancy table, since they are
          // already represented in the Toss (card-style) section above.
          const sections = market.section || [];
          const hasTossKeywordInSection = sections.some((section) => {
            const sectionName = (section.nat || '').toLowerCase();
            return sectionName.includes('toss') || sectionName.includes('win the toss');
          });

          const isFancy1ByName = mname === 'fancy1';

          if (!isFancy1ByName && !hasTossKeywordInSection) {
            fancyBets.push(market);
          }
        }
      }
    });

    return { matchOdds, bookmakers, fancyBets: isCricket ? fancyBets : [] };
  }, [eventData, isCricket]);

  // Build a simple Market List for the right-side modal (Match Odds / Bookmaker / Fancy)
  const marketList = useMemo(() => {
    const seen = new Set();
    const add = (label) => {
      const key = (label || '').trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
    };

    matchOdds.forEach((m) => add(m.mname || 'Match Odds'));
    bookmakers.forEach((m) => add(m.mname || 'Bookmaker'));
    fancyBets.forEach((m) => add(m.mname || 'Fancy'));

    return Array.from(seen);
  }, [matchOdds, bookmakers, fancyBets]);

  // Map of server-side PL metrics by marketType + selectionId
  const selectionPLMap = useMemo(() => {
    const map = new Map();
    (marketAnalysis || []).forEach((row) => {
      const key = `${row.marketType}|${String(row.selectionId)}`;
      map.set(key, {
        profitLoss: row.profitLoss ?? 0,
        totalPossibleProfit: row.totalPossibleProfit ?? 0,
        totalPossibleLoss: row.totalPossibleLoss ?? 0,
        totalExposure: row.totalExposure ?? 0,
        unsettledExposure: row.unsettledExposure ?? 0,
      });
    });
    return map;
  }, [marketAnalysis]);

  const getServerPL = (marketType, selectionId) => {
    if (!marketType || selectionId == null) {
      return {
        profitLoss: 0,
        totalPossibleProfit: 0,
        totalPossibleLoss: 0,
        totalExposure: 0,
        unsettledExposure: 0,
      };
    }
    const key = `${marketType}|${String(selectionId)}`;
    const value = selectionPLMap.get(key);
    if (!value) {
      return {
        profitLoss: 0,
        totalPossibleProfit: 0,
        totalPossibleLoss: 0,
        totalExposure: 0,
        unsettledExposure: 0,
      };
    }
    return value;
  };

  // Scenario net P/L if a given selection wins within a market
  const getScenarioNetPL = (marketId, marketType, winnerSelectionId) => {
    if (!marketAnalysis || !marketId || winnerSelectionId == null || !marketType) {
      return 0;
    }
    let net = 0;
    marketAnalysis.forEach((row) => {
      if (
        String(row.marketId) !== String(marketId) ||
        String(row.marketType) !== String(marketType)
      ) {
        return;
      }

      const isWinner = String(row.selectionId) === String(winnerSelectionId);
      const tp = row.totalPossibleProfit ?? 0;
      const tl = row.totalPossibleLoss ?? 0;

      if (isWinner) {
        net += tp;
      } else {
        net -= tl;
      }
    });
    return net;
  };

  // Filter fancy bets by active fancy tab (based on gtype)
  const filteredFancyBets = useMemo(() => {
    if (activeFancyTab === 'all') return fancyBets;
    return fancyBets.filter((market) => {
      const gtype = (market.gtype || '').toLowerCase();
      const mname = (market.mname || '').toLowerCase();
      switch (activeFancyTab) {
        case 'fancy':
          return gtype === 'fancy';
        case 'line':
          return gtype === 'fancy2';
        case 'ball':
          return gtype === 'fancy' && mname.includes('ball by ball');
        case 'meter':
          return gtype === 'meter';
        case 'khado':
          return gtype === 'khado';
        default:
          return true;
      }
    });
  }, [fancyBets, activeFancyTab]);

  // Sportbook = oddeven only; exclude match_odds, bookmaker, and tied match. Show only for cricket.
  const sportbookMarkets = useMemo(() => {
    if (!isCricket) return [];
    return eventData.filter((market) => {
      const gtype = (market.gtype || '').toLowerCase();
      const mname = (market.mname || '').toLowerCase();
      if (gtype === 'match') return false; // match_odds
      if (gtype === 'match1') return false; // bookmaker
      if (mname.includes('tied match')) return false;
      return gtype === 'oddeven';
    });
  }, [eventData, isCricket]);

  const filteredSportbookMarkets = useMemo(() => {
    if (activeSportbookTab === 'all') return sportbookMarkets;
    return sportbookMarkets.filter((market) => {
      const gtype = (market.gtype || '').toLowerCase();
      const mname = (market.mname || '').toLowerCase();
      switch (activeSportbookTab) {
        case 'match':
          return gtype === 'match';
        case 'odds/even':
          return gtype === 'oddeven' || mname.includes('tied') || mname.includes('odds') || mname.includes('even');
        case 'batsman':
          return mname.includes('batsman');
        case 'bowler':
          return mname.includes('bowler');
        case 'extra':
          return mname.includes('extra');
        default:
          return true;
      }
    });
  }, [sportbookMarkets, activeSportbookTab]);

  // Calculate total matched amount
  const totalMatched = useMemo(() => {
    let total = 0;
    eventData.forEach((market) => {
      if (Array.isArray(market.section)) {
        market.section.forEach((section) => {
          if (Array.isArray(section.odds)) {
            section.odds.forEach((odd) => {
              total += odd.size || 0;
            });
          }
        });
      }
    });
    return total;
  }, [eventData]);

  const formatMatchedAmount = (amount) => {
    if (amount >= 1000000) {
      return `€ ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `€ ${(amount / 1000).toFixed(1)}K`;
    }
    return `€ ${amount.toFixed(0)}`;
  };

  const formatSize = (size) => {
    if (size >= 1000000) {
      return `${(size / 1000000).toFixed(1)}M`;
    }
    if (size >= 1000) {
      return `${(size / 1000).toFixed(1)}K`;
    }
    return size?.toString() || '0';
  };

  // Handle odds cell click
  const handleOddsClick = (odd, section, type, market) => {
    if (odd.odds <= 0) return;

    setSelectedBet({
      marketId: market.mid,
      marketName: market.mname,
      sectionId: section.sid,
      teamName: section.nat,
      type, // 'back' or 'lay'
      // Store raw price meta from odds feed
      priceType: odd.otype || type,
      priceOname: odd.oname || '',
      originalOdds: odd.odds,
      size: odd.size,
      // Some markets (eg fancy1) keep min/max on section
      min: market.min || section.min || 100,
      max: market.max || section.max || 25000,
    });
    setBetOdds(odd.odds);
    setBetStake(0);
  };

  // Handle cancel bet
  const handleCancelBet = () => {
    setSelectedBet(null);
    setBetOdds(0);
    setBetStake(0);
  };

  // Handle place bet (MATCH_ODDS) using RTK Query
  const handlePlaceBet = async () => {
    if (!selectedBet) return;

    if (!isAuthenticated) {
      toast.error('You must be logged in to place a bet.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (betStake < selectedBet.min) {
      toast.warn(`Minimum stake is ${selectedBet.min}`, {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }

    const selectedMarketForValidation = eventData.find((m) => m.mid === selectedBet.marketId);
    const gtypeForValidation = (selectedMarketForValidation?.gtype || '').toLowerCase();
    const minAllowedOdds = gtypeForValidation === 'match1' ? 0 : 1;
    if (!betOdds || betOdds <= minAllowedOdds) {
      toast.warn(
        gtypeForValidation === 'match1'
          ? 'Rate must be greater than 0.00'
          : 'Odds must be greater than 1.00',
        {
          position: 'top-right',
          autoClose: 2000,
        },
      );
      return;
    }

    if (!eventIdString) {
      toast.error('Event ID not found. Please reload the event.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // Handle Demo Mode Betting
    if (isDemo) {
      const currentBalance = demoWallet?.balance || 10000;

      // Check if demo user has sufficient balance
      if (betStake > currentBalance) {
        toast.error(
          `Demo Mode: Insufficient balance. You have ₹${currentBalance.toLocaleString('en-IN')}`,
          {
            position: 'top-right',
            autoClose: 3000,
          },
        );
        return;
      }

      // Simulate bet placement for demo mode
      const newBalance = currentBalance - betStake;

      // Build a demo bet object in similar shape to API bets
      const demoBet = {
        _id: `demo_bet_${Date.now()}`,
        eventId: eventIdString,
        eventName: event?.matchName || event?.eventName || 'Demo Event',
        sport: sport || 'cricket',
        marketType: 'match_odds',
        marketId: String(selectedBet.marketId),
        selectionId: String(selectedBet.sectionId),
        selectionName: selectedBet.teamName,
        betType: selectedBet.type, // 'back' or 'lay'
        odds: betOdds,
        rate: betOdds,
        stake: betStake,
        exposure: null,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      // Persist demo bets in localStorage so RightSidebar can display them
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const existingRaw = window.localStorage.getItem('demoBets');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          existing.push(demoBet);
          window.localStorage.setItem('demoBets', JSON.stringify(existing));
        }
      } catch (e) {
        console.error('Failed to persist demo bet', e);
      }

      // Update demo wallet balance in Redux
      dispatch(
        setUserProfile({
          wallet: {
            ...demoWallet,
            balance: newBalance,
          },
        }),
      );

      toast.success(
        `Demo Bet Placed! Stake: ₹${betStake} | New Balance: ₹${newBalance.toLocaleString('en-IN')}`,
        {
          position: 'top-right',
          autoClose: 3000,
        },
      );

      handleCancelBet();
      return;
    }

    // Find the market for selected bet to derive marketType from gtype
    const selectedMarket = eventData.find((m) => m.mid === selectedBet.marketId);
    const gtype = (selectedMarket?.gtype || '').toLowerCase();
    const mname = (selectedMarket?.mname || '').toLowerCase();

    // Determine if this bet is for a Toss market (card-style "Which Team Will Win The Toss")
    const isTossMarket = eventData.some((market) => {
      if (market.mid !== selectedBet.marketId) return false;

      const sections = market.section || [];
      const mnameLocal = (market.mname || '').toLowerCase();

      // Same identification logic as card-style toss market rendering
      if (mnameLocal === 'fancy1') {
        const tossSections = sections.filter((section) => {
          const sectionName = (section.nat || '').toLowerCase();
          return sectionName.includes('toss') || sectionName.includes('win the toss');
        });
        return tossSections.length === 2;
      }

      if (sections.length !== 2) return false;

      if (mnameLocal.includes('toss') || mnameLocal.includes('which')) {
        return true;
      }

      const hasTossInSection = sections.some((section) => {
        const sectionName = (section.nat || '').toLowerCase();
        return sectionName.includes('toss') || sectionName.includes('win the toss');
      });

      return hasTossInSection;
    });

    // Map gtype + mname to API marketType (exact constants)
    // MATCH_ODDS, TIED_MATCH, BOOKMAKERS_FANCY, TOS_MARKET, FANCY, OVER_BY_OVER, ODDEVEN,
    // CRICKET_CASINO, LINE_MARKET, METER_MARKET, KADO_MARKET
    const resolvedMarketType = (() => {
      if (isTossMarket) return 'tos_market';
      if (gtype === 'match1') return 'bookmakers_fancy';
      if (gtype === 'match') {
        if (mname.includes('tied') || mname.includes('tied_match')) return 'tied_match';
        return 'match_odds';
      }
      if (gtype === 'fancy2') return 'line_market';
      if (gtype === 'fancy') {
        if (mname.includes('over by over')) return 'over_by_over';
        return 'fancy';
      }
      if (gtype === 'oddeven') return 'oddeven';
      if (gtype === 'cricketcasino') return 'cricket_casino';
      if (gtype === 'meter') return 'meter_market';
      if (gtype === 'khado') return 'kado_market';
      if (gtype) return gtype.replace(/-/g, '_');
      return 'fancy';
    })();

    // Determine if this bet is for a Bookmaker market (uses yes/no betType)
    const isBookmakerMarket = gtype === 'match1';

    // Build request body based on market type
    // - MATCH_ODDS: uses odds + betType 'back' / 'lay'
    // - BOOKMAKERS: uses rate + betType 'yes' / 'no' (bookmakers_fancy)
    const betData = isBookmakerMarket
      ? {
        sport: sport || 'cricket',
        eventId: eventIdString,
        eventName: event?.matchName || 'Event Name not found',
        marketId: selectedBet.marketId,
        marketName: selectedBet.marketName || '',
        marketType: 'bookmakers_fancy',
        selectionId: String(selectedBet.sectionId),
        selectionName: selectedBet.teamName,
        betType: selectedBet.type === 'back' ? 'yes' : 'no',
        priceType: selectedBet.priceType,
        priceOname: selectedBet.priceOname,
        stake: betStake,
        odds: betOdds,
      }
      : {
        sport: sport || 'cricket',
        eventId: eventIdString,
        eventName: event?.matchName || 'Event Name not found',
        marketId: selectedBet.marketId,
        marketName: selectedBet.marketName || '',
        marketType: resolvedMarketType,
        selectionId: String(selectedBet.sectionId),
        selectionName: selectedBet.teamName,
        betType: selectedBet.type, // 'back' or 'lay'
        priceType: selectedBet.priceType,
        priceOname: selectedBet.priceOname,
        stake: betStake,
        odds: betOdds,
      };

    try {
      const response = await placeBet(betData).unwrap();

      console.log('Bet placed response:', response);

      toast.success(response?.message || 'Bet placed successfully', {
        position: 'top-right',
        autoClose: 2000,
      });

      handleCancelBet();
    } catch (error) {
      console.error('Failed to place bet', error);
      const message =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        'Failed to place bet. Please try again.';

      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Handle odds change
  const handleOddsChange = (delta) => {
    setBetOdds((prev) => {
      const newOdds = Math.round((prev + delta) * 100) / 100;
      const selectedMarket = selectedBet ? eventData.find((m) => m.mid === selectedBet.marketId) : null;
      const gtype = (selectedMarket?.gtype || '').toLowerCase();
      // Bookmaker uses "rate" (percentage) which can be < 1
      const minOdds = gtype === 'match1' ? 0.01 : 1.01;
      return Math.max(minOdds, newOdds);
    });
  };

  // Handle stake change
  const handleStakeChange = (delta) => {
    setBetStake((prev) => Math.max(0, prev + delta));
  };

  // Handle quick stake
  const handleQuickStake = (stake) => {
    setBetStake(stake);
  };

  // Calculate profit/loss and liability for Back bets
  const calculateBackProfit = (stake, odds) => {
    if (!stake || !odds || stake <= 0 || odds <= 1) return 0;
    // Profit = Stake × (Odds - 1)
    // Example: Stake 100 at odds 2.0 = 100 × (2.0 - 1) = 100 profit
    return Math.round(stake * (odds - 1) * 100) / 100;
  };

  // Calculate profit/loss and liability for Lay bets
  const calculateLayProfit = (stake, odds) => {
    if (!stake || !odds || stake <= 0 || odds <= 1) return 0;
    // Profit if lay wins = Stake (you keep the stake)
    return stake;
  };

  const calculateLayLiability = (stake, odds) => {
    if (!stake || !odds || stake <= 0 || odds <= 1) return 0;
    // Liability = Stake × (Odds - 1)
    // Example: Lay 100 at odds 2.0 = 100 × (2.0 - 1) = 100 liability
    return Math.round(stake * (odds - 1) * 100) / 100;
  };

  // Bookmaker uses "rate" (percentage), not decimal odds
  // Profit/Liability = Stake × (Rate / 100)
  const calculateBookmakerProfit = (stake, rate) => {
    if (!stake || !rate || stake <= 0 || rate <= 0) return 0;
    return Math.round(stake * (rate / 100) * 100) / 100;
  };

  const calculateBookmakerLiability = (stake, rate) => {
    if (!stake || !rate || stake <= 0 || rate <= 0) return 0;
    return Math.round(stake * (rate / 100) * 100) / 100;
  };

  // Calculate total profit/loss for a selection from today's bets
  // This calculates what happens IF this selection wins
  // For match odds, pass marketId (mid) so P/L is scoped to that market only
  const getSelectionTotalProfitLoss = (selectionId, marketId) => {
    if (!todayBets || todayBets.length === 0 || !eventIdString) {
      return { totalProfit: 0, totalLoss: 0, netProfitLoss: 0 };
    }

    let netProfitLoss = 0;

    // Get all bets for this event (and this market when marketId provided, e.g. match odds)
    const eventBets = todayBets.filter((bet) => {
      if (bet.eventId !== eventIdString) return false;
      if (marketId != null && marketId !== '') {
        return bet.marketId === String(marketId);
      }
      return true;
    });

    eventBets.forEach((bet) => {
      const isThisSelection = bet.selectionId === String(selectionId);

      if (bet.betType === 'back') {
        if (isThisSelection) {
          // Back bet on THIS selection: profit if this selection wins
          const profit = Math.round(bet.stake * (bet.odds - 1) * 100) / 100;
          netProfitLoss += profit;
        } else {
          // Back bet on OTHER selection: loss (stake) if this selection wins
          netProfitLoss -= bet.stake;
        }
      } else if (bet.betType === 'lay') {
        if (isThisSelection) {
          // Lay bet on THIS selection: loss (liability) if this selection wins
          const liability = Math.round(bet.stake * (bet.odds - 1) * 100) / 100;
          netProfitLoss -= liability;
        } else {
          // Lay bet on OTHER selection: profit (stake) if this selection wins
          netProfitLoss += bet.stake;
        }
      }
    });

    netProfitLoss = Math.round(netProfitLoss * 100) / 100;
    return {
      totalProfit: netProfitLoss > 0 ? netProfitLoss : 0,
      totalLoss: netProfitLoss < 0 ? Math.abs(netProfitLoss) : 0,
      netProfitLoss,
    };
  };

  // Calculate book data (Run/Amount breakdown) for fancy bet
  // Returns array of { run, amount } where amount is profit/loss at that run value
  const calculateBookData = (market, section) => {
    if (!eventIdString || !market || !section) {
      return [];
    }

    // Get all bets for this market (including bets from other sections in the same market)
    const marketBets = (todayBets || []).filter(
      (bet) => bet.eventId === eventIdString && bet.marketId === String(market.mid),
    );

    if (marketBets.length === 0) {
      // If no bets, return empty or show zero amounts
      return [];
    }

    // Get bets for this specific section to determine the center odds
    const sectionBets = marketBets.filter((bet) => bet.selectionId === String(section.sid));

    // Determine run range based on bet odds: show 10 runs above and 10 runs below the bet odds
    // If multiple bets exist, use the first bet's odds as center, or average if needed
    let centerOdd = 0;

    if (sectionBets.length > 0) {
      // Use the first bet's odds as center point (or average if multiple bets)
      const oddsSum = sectionBets.reduce((sum, bet) => sum + (bet.odds || 0), 0);
      centerOdd = Math.round(oddsSum / sectionBets.length);
    } else {
      // Fallback: use current market odds
      const backOdd = section?.odds?.find((o) => o.otype === 'back')?.odds || 0;
      const layOdd = section?.odds?.find((o) => o.otype === 'lay')?.odds || 0;
      centerOdd =
        backOdd > 0 && layOdd > 0
          ? Math.round((backOdd + layOdd) / 2)
          : backOdd || layOdd || 0;
    }

    // Show runs from (centerOdd - 10) to (centerOdd + 10)
    const startRun = Math.max(0, centerOdd - 10);
    const endRun = centerOdd + 10;

    const bookData = [];

    // Calculate profit/loss for each run value (show runs in descending order, e.g. 65 → 45)
    for (let run = endRun; run >= startRun; run -= 1) {
      let netAmount = 0;

      marketBets.forEach((bet) => {
        const isThisSection = bet.selectionId === String(section.sid);

        // For fancy bets:
        // - Back bet on "Yes" (over): wins if actual run >= threshold (bet.odds represents threshold)
        // - Lay bet on "No" (under): wins if actual run < threshold

        if (bet.betType === 'back' || bet.betType === 'yes') {
          // Back/Yes bet: betting that run will be >= threshold
          const threshold = bet.odds || 100;

          if (isThisSection) {
            if (run >= threshold) {
              // Fancy rule (as per requirement): win = +stake
              // Bookmaker stays rate-based if present
              const profit =
                bet.marketType === 'bookmakers_fancy'
                  ? Math.round(bet.stake * ((bet.rate || 0) / 100) * 100) / 100
                  : bet.stake;
              netAmount += profit;
            } else {
              // Fancy rule: loss = -stake
              netAmount -= bet.stake;
            }
          }
        } else if (bet.betType === 'lay' || bet.betType === 'no') {
          // Lay/No bet: betting that run will be < threshold
          const threshold = bet.odds || 100;

          if (isThisSection) {
            if (run < threshold) {
              // Fancy rule: win = +stake
              netAmount += bet.stake;
            } else {
              // Fancy rule: loss = -stake (bookmaker stays rate-based if present)
              const loss =
                bet.marketType === 'bookmakers_fancy'
                  ? Math.round(bet.stake * ((bet.rate || 0) / 100) * 100) / 100
                  : bet.stake;
              netAmount -= loss;
            }
          }
        }
      });

      bookData.push({
        run,
        amount: Math.round(netAmount * 100) / 100,
      });
    }

    return bookData;
  };

  // Calculate current net profit/loss for a fancy selection at the current line
  // Uses same rules as calculateBookData but evaluates only at the current threshold line.
  const getFancySelectionNetPL = (market, section) => {
    if (!eventIdString || !market || !section || !todayBets || todayBets.length === 0) {
      return 0;
    }

    const marketBets = (todayBets || []).filter(
      (bet) => bet.eventId === eventIdString && bet.marketId === String(market.mid),
    );

    if (marketBets.length === 0) return 0;

    // Use current market line (threshold) as the evaluation run
    const backOdd = section?.odds?.find((o) => o.otype === 'back')?.odds || 0;
    const layOdd = section?.odds?.find((o) => o.otype === 'lay')?.odds || 0;
    const run =
      backOdd > 0 && layOdd > 0
        ? Math.round((backOdd + layOdd) / 2)
        : backOdd || layOdd || 0;

    if (!run) return 0;

    let netAmount = 0;

    marketBets.forEach((bet) => {
      const isThisSection = bet.selectionId === String(section.sid);

      if (bet.betType === 'back' || bet.betType === 'yes') {
        // Back/Yes bet: betting that run will be >= threshold
        const threshold = bet.odds || 100;

        if (isThisSection) {
          if (run >= threshold) {
            const profit =
              bet.marketType === 'bookmakers_fancy'
                ? Math.round(bet.stake * ((bet.rate || 0) / 100) * 100) / 100
                : bet.stake;
            netAmount += profit;
          } else {
            netAmount -= bet.stake;
          }
        }
      } else if (bet.betType === 'lay' || bet.betType === 'no') {
        // Lay/No bet: betting that run will be < threshold
        const threshold = bet.odds || 100;

        if (isThisSection) {
          if (run < threshold) {
            netAmount += bet.stake;
          } else {
            const loss =
              bet.marketType === 'bookmakers_fancy'
                ? Math.round(bet.stake * ((bet.rate || 0) / 100) * 100) / 100
                : bet.stake;
            netAmount -= loss;
          }
        }
      }
    });

    return Math.round(netAmount * 100) / 100;
  };

  // Calculate total profit/loss for a selection from today's bets (Bookmaker markets)
  // Uses marketId to filter bets and rate for calculations
  // betType: 'yes' = back equivalent, 'no' = lay equivalent
  const getBookmakerSelectionProfitLoss = (marketId, selectionId) => {
    if (!todayBets || todayBets.length === 0 || !eventIdString || !marketId) {
      return { totalProfit: 0, totalLoss: 0, netProfitLoss: 0 };
    }

    let netProfitLoss = 0;

    // Get all bookmaker bets for this specific market
    const marketBets = todayBets.filter(
      (bet) =>
        bet.eventId === eventIdString &&
        bet.marketId === String(marketId) &&
        bet.marketType === 'bookmakers_fancy',
    );

    marketBets.forEach((bet) => {
      const isThisSelection = bet.selectionId === String(selectionId);
      const rate = bet.rate || 0;

      if (bet.betType === 'yes') {
        // YES bet = back equivalent
        if (isThisSelection) {
          // YES bet on THIS selection: profit if this selection wins
          // Profit = stake × (rate / 100)
          const profit = Math.round(bet.stake * (rate / 100) * 100) / 100;
          netProfitLoss += profit;
        } else {
          // YES bet on OTHER selection: loss (stake) if this selection wins
          netProfitLoss -= bet.stake;
        }
      } else if (bet.betType === 'no') {
        // NO bet = lay equivalent
        if (isThisSelection) {
          // NO bet on THIS selection: loss (liability) if this selection wins
          // Liability = stake × (rate / 100)
          const liability = Math.round(bet.stake * (rate / 100) * 100) / 100;
          netProfitLoss -= liability;
        } else {
          // NO bet on OTHER selection: profit (stake) if this selection wins
          netProfitLoss += bet.stake;
        }
      }
    });

    netProfitLoss = Math.round(netProfitLoss * 100) / 100;
    return {
      totalProfit: netProfitLoss > 0 ? netProfitLoss : 0,
      totalLoss: netProfitLoss < 0 ? Math.abs(netProfitLoss) : 0,
      netProfitLoss,
    };
  };

  // Get profit/loss display based on bet type
  const getProfitLossDisplay = () => {
    const selectedMarket = selectedBet ? eventData.find((m) => m.mid === selectedBet.marketId) : null;
    const gtype = (selectedMarket?.gtype || '').toLowerCase();
    const isBookmakerMarket = gtype === 'match1';

    const minAllowedOdds = isBookmakerMarket ? 0 : 1;
    if (!selectedBet || !betStake || betStake <= 0 || !betOdds || betOdds <= minAllowedOdds) {
      return { profit: 0, liability: 0, totalReturn: 0 };
    }

    if (selectedBet.type === 'back') {
      const profit = isBookmakerMarket
        ? calculateBookmakerProfit(betStake, betOdds)
        : calculateBackProfit(betStake, betOdds);
      const totalReturn = betStake + profit; // Stake + Profit
      return { profit, liability: 0, totalReturn };
    }

    // Lay bet
    const profit = isBookmakerMarket
      ? betStake
      : calculateLayProfit(betStake, betOdds);
    const liability = isBookmakerMarket
      ? calculateBookmakerLiability(betStake, betOdds)
      : calculateLayLiability(betStake, betOdds);
    const totalReturn = profit; // You keep the stake if you win
    return { profit, liability, totalReturn };
  };

  if (!eventIdString) {
    return (
      <div className="gd-container">
        <div className="gd-error">Event ID not found. Please go back and select an event.</div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="gd-container">
        <div className="gd-error">Error loading event data. Please try again later.</div>
      </div>
    );
  }

  if (connectionStatus !== 'connected' && eventData.length === 0) {
    return (
      <div className="gd-container">
        <div className="gd-loading">Loading event data...</div>
      </div>
    );
  }

  // Parse team names from event
  const teams =
    event?.matchName?.split(' v ') ||
    event?.matchName?.split(' vs ') ||
    ['Team 1', 'Team 2'];

  // Render bet slip inline
  const renderBetSlip = () => {
    if (!selectedBet) return null;

    const { profit, liability, totalReturn } = getProfitLossDisplay();
    const selectedMarket = eventData.find((m) => m.mid === selectedBet.marketId);
    const isBookmakerMarket = (selectedMarket?.gtype || '').toLowerCase() === 'match1';
    const minOdds = isBookmakerMarket ? 0.01 : 1.01;

    return (
      <div className={`bet-slip ${selectedBet.type}`}>
        <div className="bet-slip-form">
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCancelBet}
          >
            Cancel
          </button>

          <div className="input-group odds-input">
            <button
              type="button"
              className="input-btn minus"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleOddsChange(-0.01)}
            >
              −
            </button>
            <input
              type="number"
              value={betOdds}
              onChange={(e) => setBetOdds(parseFloat(e.target.value) || minOdds)}
              step="0.01"
              min={minOdds}
            />
            <button
              type="button"
              className="input-btn plus"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleOddsChange(0.01)}
            >
              +
            </button>
          </div>

          <div className="input-group stake-input">
            <button
              type="button"
              className="input-btn minus"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleStakeChange(-10)}
            >
              −
            </button>
            <input
              type="number"
              value={betStake}
              onChange={(e) => setBetStake(parseInt(e.target.value, 10) || 0)}
              min="0"
            />
            <button
              type="button"
              className="input-btn plus"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleStakeChange(10)}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className={`place-bet-btn ${selectedBet.type}`}
            onClick={handlePlaceBet}
            disabled={
              betStake < selectedBet.min ||
              betOdds
              <= (selectedBet.marketName?.toLowerCase().includes('bookmaker') ? 0 : 1) ||
              isPlacingBet
            }
          >
            Place Bet
          </button>
        </div>

        <div className="quick-stakes">
          {quickStakes.map((stake) => (
            <button
              type="button"
              key={stake}
              className="quick-stake-btn"
              onClick={() => handleQuickStake(stake)}
            >
              {stake >= 1000 ? `${stake / 1000}K` : stake}
            </button>
          ))}
        </div>

        {/* Mobile-only actions row (duplicated buttons) shown below quick stakes */}
        <div className="bet-slip-actions-mobile">
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCancelBet}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`place-bet-btn ${selectedBet.type}`}
            onClick={handlePlaceBet}
            disabled={betStake < selectedBet.min || betOdds <= 1 || isPlacingBet}
          >
            Place Bet
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="gd-container">

        <div className="gd-layout">
          <div className="gd-main">
            {/* Match Odds Section */}
            {matchOdds.map((market) => {
              const mnameLower = (market.mname || '').toLowerCase();
              const marketTypeKey =
                mnameLower.includes('tied') || mnameLower.includes('tied_match')
                  ? 'tied_match'
                  : 'match_odds';

              return (
              <div key={market.mid} className="gd-market-section">
                <div className="gd-market-header match-odds">
                  <div className="header-left">
                    <span className="market-title">{market.mname || 'Match Odds'}</span>
                    <span className="info-icon">i</span>
                    <span className="cash-out-badge">
                      <span className="cash-out-dot" />
                      Cash Out
                    </span>
                  </div>
                  <div className="header-right">
                    <span className="matched-text">
                      Matched
                      {' '}
                      {formatMatchedAmount(totalMatched)}
                    </span>
                  </div>
                </div>
                <div className="gd-market-table">
                  <table>
                    <thead>
                      {/* Desktop header */}
                      <tr className="gd-header-desktop">
                        <th colSpan="3" className="th-team" />
                        <th colSpan="1" className="th-back">
                          Back
                        </th>
                        <th colSpan="1" className="th-lay">
                          Lay
                        </th>
                        <th colSpan="2" className="th-minmax">
                          <span className="minmax-label">Min/Max</span>
                          <span className="minmax-value">
                            {market.min || 100}
                            -
                            {market.max || 25000}
                          </span>
                        </th>
                      </tr>
                      {/* Mobile header with colSpan 1 for team */}
                      <tr className="gd-header-mobile">
                        <th colSpan="1" className="th-team">
                          <span className="th-team-label">Team</span>
                          <span className="th-minmax-mobile">
                            Min/Max:
                            {' '}
                            {market.min || 100}
                            -
                            {market.max || 25000}
                          </span>
                        </th>
                        <th className="th-back">Back</th>
                        <th className="th-lay">Lay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {market.section?.map((section) => {
                        const backOdds = (section.odds || [])
                          .filter((o) => o.otype === 'back')
                          .sort((a, b) => a.odds - b.odds)
                          .slice(0, 3);
                        const layOdds = (section.odds || [])
                          .filter((o) => o.otype === 'lay')
                          .sort((a, b) => a.odds - b.odds)
                          .slice(0, 3);

                        while (backOdds.length < 3) backOdds.push({ odds: 0, size: 0 });
                        while (layOdds.length < 3) layOdds.push({ odds: 0, size: 0 });

                        const isSuspended =
                          section.gstatus === 'SUSPENDED' || section.gstatus === 'Suspended';
                        const isSelected =
                          selectedBet?.sectionId === section.sid &&
                          selectedBet?.marketId === market.mid;

                        // Calculate potential profit/loss for match_odds (non-authenticated users)
                        // Check if any bet is selected in this market
                        const hasSelectedBet = selectedBet && selectedBet.marketId === market.mid;
                        const selectedBetType = hasSelectedBet ? selectedBet.type : null; // 'back' or 'lay'

                        // Use selected stake if bet is placed in this market, otherwise use default stake (0)
                        const currentStake = hasSelectedBet && betStake > 0 ? betStake : 0;

                        // Get best available odds for this team
                        const bestBackOdd =
                          backOdds.length > 0 && backOdds[backOdds.length - 1]?.odds > 0
                            ? backOdds[backOdds.length - 1].odds
                            : 0;
                        const bestLayOdd =
                          layOdds.length > 0 && layOdds[0]?.odds > 0 ? layOdds[0].odds : 0;

                        // Use selected odds if this section is selected, otherwise use best available odds
                        const currentBackOdd =
                          isSelected && betOdds > 0 && selectedBetType === 'back'
                            ? betOdds
                            : bestBackOdd;
                        const currentLayOdd =
                          isSelected && betOdds > 0 && selectedBetType === 'lay'
                            ? betOdds
                            : bestLayOdd;

                        // For match_odds: Calculate profit/loss based on bet type
                        // Only show profit/loss when a bet is actually selected
                        let potentialProfit = 0;
                        let potentialLoss = 0;

                        if (hasSelectedBet && currentStake > 0) {
                          if (isSelected) {
                            // THIS team is selected
                            if (selectedBetType === 'back') {
                              // BACK bet on THIS team: show profit
                              // Formula: z = s * (x - 1) where s = stake, x = odds, z = profit
                              const y = currentBackOdd - 1;
                              potentialProfit = Math.round(currentStake * y * 100) / 100;
                            } else if (selectedBetType === 'lay') {
                              // LAY bet on THIS team: show loss (liability)
                              // Liability = Stake × (Odds - 1)
                              potentialLoss = calculateLayLiability(currentStake, currentLayOdd);
                            }
                          } else if (selectedBetType === 'back') {
                            // OTHER team is selected
                            // BACK bet on OTHER team: show loss (stake amount)
                            potentialLoss = currentStake;
                          } else if (selectedBetType === 'lay') {
                            // LAY bet on OTHER team: show profit (stake amount)
                            // If you lay Team A and Team B wins, you keep the stake
                            potentialProfit = currentStake;
                          }
                        }

                        // Scenario net P/L if THIS selection wins (winner profit - other side losses)
                        const scenarioNetPL = getScenarioNetPL(
                          market.mid,
                          marketTypeKey,
                          section.sid,
                        );

                        // For tied_match, also show profit (this side) and loss (other side) explicitly.
                        const thisPL = getServerPL(marketTypeKey, section.sid);
                        const emptyPL = {
                          profitLoss: 0,
                          totalPossibleProfit: 0,
                          totalPossibleLoss: 0,
                          totalExposure: 0,
                          unsettledExposure: 0,
                        };
                        const otherSelectionId = (market.section || []).find(
                          (s) => String(s?.sid) !== String(section.sid),
                        )?.sid;
                        const otherPL =
                          otherSelectionId != null
                            ? getServerPL(marketTypeKey, otherSelectionId)
                            : emptyPL;

                        const thisProfit = Number(thisPL?.totalPossibleProfit || 0);
                        const otherLossFromApi = Number(otherPL?.totalPossibleLoss || 0);
                        const otherLoss =
                          otherLossFromApi !== 0
                            ? otherLossFromApi
                            : Math.abs(Number(otherPL?.profitLoss || 0)) ||
                              Number(otherPL?.unsettledExposure || 0) ||
                              Number(otherPL?.totalExposure || 0) ||
                              0;

                        // Display net value:
                        // - Prefer computed scenario net (works when API has both sides)
                        // - Fallback to API profitLoss if scenario net is 0 but API has a non-zero PL
                        const displayPL =
                          marketTypeKey === 'tied_match'
                            ? Number(thisPL?.profitLoss || 0)
                            : scenarioNetPL !== 0
                            ? scenarioNetPL
                            : Number(thisPL?.profitLoss || 0);

                        return (
                          <React.Fragment key={section.sid}>
                            <tr
                              className={`${isSuspended ? 'suspended' : ''} ${isSelected ? 'selected' : ''
                                }`}
                            >
                              <td className="td-team">
                                <span className="team-name">
                                  {section.nat}

                                  {/* Show net profit/loss if this selection wins */}
                                  <span
                                    className={`profit-loss-label ${
                                      displayPL > 0 ? 'profit-text' : 'loss-text'
                                    }`}
                                  >
                                    {displayPL > 0
                                      ? ` +${displayPL.toLocaleString()}`
                                      : ` ${Number(displayPL || 0).toFixed(2)}`}
                                  </span>

                                  {/* Tied Match: show profit (this side) and loss (other side) */}
                                  {marketTypeKey === 'tied_match' && (
                                    <>
                                      <span className="profit-loss-label profit-text">
                                        {' '}
                                        (+{thisProfit.toLocaleString()})
                                      </span>
                                      <span className="profit-loss-label loss-text">
                                        {' '}
                                        (-{Number(otherLoss || 0).toLocaleString()})
                                      </span>
                                    </>
                                  )}

                                  {/* Show potential profit/loss for current bet selection */}
                                  <>
                                    {potentialProfit > 0 && (
                                      <span className="profit-loss-label profit-text">
                                        {' '}
                                        (
                                        {potentialProfit.toLocaleString()}
                                        )
                                      </span>
                                    )}
                                    {potentialLoss > 0 && (
                                      <span className="profit-loss-label loss-text">
                                        {' '}
                                        (
                                        {potentialLoss.toLocaleString()}
                                        )
                                      </span>
                                    )}
                                  </>
                                </span>
                              </td>
                              {backOdds.map((odd, idx) => (
                                <td
                                  key={`back-${idx}`}
                                  className={`td-odds back ${idx === 2 ? 'best' : ''} ${odd.odds > 0 ? 'clickable' : ''
                                    }`}
                                  onClick={() =>
                                    odd.odds > 0 &&
                                    !isSuspended &&
                                    handleOddsClick(odd, section, 'back', market)
                                  }
                                >
                                  {odd.odds > 0 ? (
                                    <>
                                      <OddsCell value={odd.odds} type="back" />
                                      <span className="size">{formatSize(odd.size)}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="odds">0</span>
                                      <span className="size">0</span>
                                    </>
                                  )}
                                </td>
                              ))}
                              {layOdds.map((odd, idx) => (
                                <td
                                  key={`lay-${idx}`}
                                  className={`td-odds lay ${idx === 0 ? 'best' : ''} ${odd.odds > 0 ? 'clickable' : ''
                                    }`}
                                  onClick={() =>
                                    odd.odds > 0 &&
                                    !isSuspended &&
                                    handleOddsClick(odd, section, 'lay', market)
                                  }
                                >
                                  {isSuspended ? (
                                    <span className="suspended-label">Suspended</span>
                                  ) : odd.odds > 0 ? (
                                    <>
                                      <OddsCell value={odd.odds} type="lay" />
                                      <span className="size">{formatSize(odd.size)}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="odds">0</span>
                                      <span className="size">0</span>
                                    </>
                                  )}
                                </td>
                              ))}
                            </tr>
                            {/* Show bet slip below selected row */}
                            {isSelected && (
                              <tr className="bet-slip-row">
                                <td colSpan="8">{renderBetSlip()}</td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
        </div>
      )})}

            {/* Bookmakers Section */}
            {bookmakers.map((market) => {
              const marketTypeKey = 'bookmakers_fancy';

              return (
              <div key={market.mid} className="gd-market-section">
                <div className="gd-market-header bookmaker">
                  <div className="header-left">
                    <span className="market-title">{market.mname || 'Bookmakers'}</span>
                    <span className="info-icon">i</span>
                    <span className="cash-out-badge">
                      <span className="cash-out-dot" />
                      Cash Out
                    </span>
                  </div>
                  <div className="header-right">
                    <span className="matched-text">
                      Matched
                      {' '}
                      {formatMatchedAmount(totalMatched)}
                    </span>
                  </div>
                </div>
                <div className="gd-market-table">
                  <table>
                    <thead>
                      {/* Desktop header */}
                      <tr className="gd-header-desktop">
                        <th colSpan="3" className="th-team" />
                        <th colSpan="1" className="th-back">
                          Back
                        </th>
                        <th colSpan="1" className="th-lay">
                          Lay
                        </th>
                        <th colSpan="2" className="th-minmax">
                          <span className="minmax-label">Min/Max</span>
                          <span className="minmax-value">
                            {market.min || 10}
                            -
                            {market.max || 500000}
                          </span>
                        </th>
                      </tr>
                      {/* Mobile header with colSpan 1 for team */}
                      <tr className="gd-header-mobile">
                        <th colSpan="1" className="th-team">
                          <span className="th-team-label">Team</span>
                          <span className="th-minmax-mobile">
                            Min/Max:
                            {' '}
                            {market.min || 10}
                            -
                            {market.max || 500000}
                          </span>
                        </th>
                        <th className="th-back">Back</th>
                        <th className="th-lay">Lay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {market.section?.map((section) => {
                        const backOdds = (section.odds || [])
                          .filter((o) => o.otype === 'back')
                          .sort((a, b) => a.odds - b.odds)
                          .slice(0, 3);
                        const layOdds = (section.odds || [])
                          .filter((o) => o.otype === 'lay')
                          .sort((a, b) => a.odds - b.odds)
                          .slice(0, 3);

                        while (backOdds.length < 3) backOdds.push({ odds: 0, size: 0 });
                        while (layOdds.length < 3) layOdds.push({ odds: 0, size: 0 });

                        const isSuspended =
                          section.gstatus === 'SUSPENDED' || section.gstatus === 'Suspended';
                        const isSelected =
                          selectedBet?.sectionId === section.sid &&
                          selectedBet?.marketId === market.mid;

                        // Calculate potential profit/loss for bookmakers similar to Match Odds
                        // based on currently selected bet, stake and odds
                        const hasSelectedBet = selectedBet && selectedBet.marketId === market.mid;
                        const selectedBetType = hasSelectedBet ? selectedBet.type : null; // 'back' or 'lay'

                        const currentStake = hasSelectedBet && betStake > 0 ? betStake : 0;

                        const bestBackOdd =
                          backOdds.length > 0 && backOdds[backOdds.length - 1]?.odds > 0
                            ? backOdds[backOdds.length - 1].odds
                            : 0;
                        const bestLayOdd =
                          layOdds.length > 0 && layOdds[0]?.odds > 0 ? layOdds[0].odds : 0;

                        // Use selected odds if this section is selected, otherwise use best available odds
                        const currentBackOdd =
                          isSelected && betOdds > 0 && selectedBetType === 'back'
                            ? betOdds
                            : bestBackOdd;
                        const currentLayOdd =
                          isSelected && betOdds > 0 && selectedBetType === 'lay'
                            ? betOdds
                            : bestLayOdd;

                        // Only show profit/loss when a bet is actually selected
                        let potentialProfit = 0;
                        let potentialLoss = 0;

                        if (hasSelectedBet && currentStake > 0) {
                          if (isSelected) {
                            // THIS team is selected
                            if (selectedBetType === 'back') {
                              // BACK (YES) on THIS team: profit = stake × (rate / 100)
                              potentialProfit = calculateBookmakerProfit(currentStake, currentBackOdd);
                            } else if (selectedBetType === 'lay') {
                              // LAY (NO) on THIS team: liability = stake × (rate / 100)
                              potentialLoss = calculateBookmakerLiability(currentStake, currentLayOdd);
                            }
                          } else if (selectedBetType === 'back') {
                            // OTHER team is selected
                            // BACK bet on OTHER team: show loss (stake amount)
                            potentialLoss = currentStake;
                          } else if (selectedBetType === 'lay') {
                            // LAY bet on OTHER team: show profit (stake amount)
                            potentialProfit = currentStake;
                          }
                        }

                        // Market analysis (bookmakers): net if THIS selection wins
                        // net = this totalPossibleProfit − other totalPossibleLoss
                        const bookmakerPL = getServerPL(marketTypeKey, section.sid);
                        const thisPossibleProfit = Number(bookmakerPL?.totalPossibleProfit ?? 0);
                        const thisPossibleLoss = Number(bookmakerPL?.totalPossibleLoss ?? 0);

                        const otherSelectionId = (market.section || []).find(
                          (s) => String(s?.sid) !== String(section.sid),
                        )?.sid;
                        const otherPL =
                          otherSelectionId != null
                            ? getServerPL(marketTypeKey, otherSelectionId)
                            : {
                                profitLoss: 0,
                                totalPossibleProfit: 0,
                                totalPossibleLoss: 0,
                                totalExposure: 0,
                                unsettledExposure: 0,
                              };
                        const otherPossibleLoss = Number(otherPL?.totalPossibleLoss ?? 0);

                        const netIfWin = thisPossibleProfit - otherPossibleLoss;
                        const bookmakerNetPL = Number(bookmakerPL?.profitLoss ?? 0);
                        const showNetIfWin = thisPossibleProfit !== 0 || otherPossibleLoss !== 0;

                        return (
                          <React.Fragment key={section.sid}>
                            <tr
                              className={`${isSuspended ? 'suspended' : ''} ${isSelected ? 'selected' : ''
                                }`}
                            >
                              <td className="td-team">
                                <span className="team-name">
                                  {section.nat}

                                  {/* Show net if THIS selection wins (Bookmakers) */}
                                  {showNetIfWin ? (
                                    <span
                                      className={`profit-loss-label ${
                                        netIfWin >= 0 ? 'profit-text' : 'loss-text'
                                      }`}
                                    >
                                      {' '}
                                      {netIfWin >= 0
                                        ? `+${netIfWin.toLocaleString()}`
                                        : netIfWin.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span
                                      className={`profit-loss-label ${
                                        bookmakerNetPL > 0 ? 'profit-text' : 'loss-text'
                                      }`}
                                    >
                                      {bookmakerNetPL > 0
                                        ? ` +${bookmakerNetPL.toLocaleString()}`
                                        : ` ${Number(bookmakerNetPL || 0).toFixed(2)}`}
                                    </span>
                                  )}

                                  {/* Show potential profit/loss for current bet selection (Bookmakers) */}
                                  <>
                                    {potentialProfit > 0 && (
                                      <span className="profit-loss-label profit-text">
                                        {' '}
                                        (
                                        {potentialProfit.toLocaleString()}
                                        )
                                      </span>
                                    )}
                                    {potentialLoss > 0 && (
                                      <span className="profit-loss-label loss-text">
                                        {' '}
                                        (
                                        {potentialLoss.toLocaleString()}
                                        )
                                      </span>
                                    )}
                                  </>
                                </span>
                              </td>
                              {backOdds.map((odd, idx) => (
                                <td
                                  key={`back-${idx}`}
                                  className={`td-odds back ${idx === 2 ? 'best' : ''} ${odd.odds > 0 ? 'clickable' : ''
                                    }`}
                                  onClick={() =>
                                    odd.odds > 0 &&
                                    !isSuspended &&
                                    handleOddsClick(odd, section, 'back', market)
                                  }
                                >
                                  {odd.odds > 0 ? (
                                    <>
                                      <OddsCell value={odd.odds} type="back" />
                                      <span className="size">{formatSize(odd.size)}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="odds">0</span>
                                      <span className="size">0</span>
                                    </>
                                  )}
                                </td>
                              ))}
                              {layOdds.map((odd, idx) => (
                                <td
                                  key={`lay-${idx}`}
                                  className={`td-odds lay ${idx === 0 ? 'best' : ''} ${odd.odds > 0 ? 'clickable' : ''
                                    }`}
                                  onClick={() =>
                                    odd.odds > 0 &&
                                    !isSuspended &&
                                    handleOddsClick(odd, section, 'lay', market)
                                  }
                                >
                                  {isSuspended ? (
                                    <span className="suspended-label">Suspended</span>
                                  ) : odd.odds > 0 ? (
                                    <>
                                      <OddsCell value={odd.odds} type="lay" />
                                      <span className="size">{formatSize(odd.size)}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="odds">0</span>
                                      <span className="size">0</span>
                                    </>
                                  )}
                                </td>
                              ))}
                            </tr>
                            {isSelected && (
                              <tr className="bet-slip-row">
                                <td colSpan="8">{renderBetSlip()}</td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
        </div>
      )})}

            {/* Card Style Market Section - For Toss and Similar Markets with 2 Options */}
            {eventData
              .filter((market) => {
                const sections = market.section || [];
                const mname = (market.mname || '').toLowerCase();

                // Special handling for fancy1 where toss sections are mixed with others
                if (mname === 'fancy1') {
                  const tossSections = sections.filter((section) => {
                    const sectionName = (section.nat || '').toLowerCase();
                    return (
                      sectionName.includes('toss') || sectionName.includes('win the toss')
                    );
                  });

                  return tossSections.length === 2;
                }

                // For non-fancy1 markets, keep previous logic: require exactly two sections
                if (sections.length !== 2) return false;

                // Check if market name contains toss/which
                if (mname.includes('toss') || mname.includes('which')) {
                  return true;
                }

                // Check if any section name contains "toss" or "win the toss"
                const hasTossInSection = sections.some((section) => {
                  const sectionName = (section.nat || '').toLowerCase();
                  return (
                    sectionName.includes('toss') ||
                    sectionName.includes('win the toss')
                  );
                });

                return hasTossInSection;
              })
              .map((market) => {
                const allSections = market.section || [];
                const mname = (market.mname || '').toLowerCase();

                // For fancy1, only use the two toss sections for the card view
                let sections = allSections;
                if (mname === 'fancy1') {
                  const tossSections = allSections.filter((section) => {
                    const sectionName = (section.nat || '').toLowerCase();
                    return (
                      sectionName.includes('toss') || sectionName.includes('win the toss')
                    );
                  });

                  if (tossSections.length !== 2) {
                    return null;
                  }

                  sections = tossSections;
                }

                if (sections.length < 2) return null;

                // Extract market title from section names if it's fancy1
                let marketTitle = market.mname || 'Market';
                if (market.mname === 'fancy1' || market.mname?.toLowerCase() === 'fancy1') {
                  const firstSectionName = sections[0]?.nat || '';
                  // Extract "Which Team Will Win The Toss" from section name like "AUS U19 Will Win the Toss(AUS U19 vs WI U19)adv"
                  if (firstSectionName.includes('Will Win the Toss')) {
                    const match = firstSectionName.match(/(.+?)\s+Will Win the Toss/);
                    if (match) {
                      // Extract team names from the section name
                      const teamMatch = firstSectionName.match(/\((.+?)\s+vs\s+(.+?)\)/);
                      if (teamMatch) {
                        marketTitle = 'Which Team Will Win The Toss';
                      } else {
                        marketTitle = 'Which Team Will Win The Toss';
                      }
                    }
                  } else {
                    marketTitle = 'Which Team Will Win The Toss';
                  }
                }

                // Calculate matched amount for this market
                const marketMatched = sections.reduce((total, section) => {
                  if (Array.isArray(section.odds)) {
                    return (
                      total +
                      section.odds.reduce((sum, odd) => sum + (odd.size || 0), 0)
                    );
                  }
                  return total;
                }, 0);

                // Get best odds for each section
                const section1 = sections[0];
                const section2 = sections[1];

                const section1BackOdds = (section1.odds || [])
                  .filter((o) => o.otype === 'back' && o.odds > 0)
                  .sort((a, b) => b.odds - a.odds)[0];
                const section2BackOdds = (section2.odds || [])
                  .filter((o) => o.otype === 'back' && o.odds > 0)
                  .sort((a, b) => b.odds - a.odds)[0];

                const section1Matched = (section1.odds || []).reduce(
                  (sum, odd) => sum + (odd.size || 0),
                  0,
                );
                const section2Matched = (section2.odds || []).reduce(
                  (sum, odd) => sum + (odd.size || 0),
                  0,
                );

                // Extract clean team names from section names
                const getTeamName = (sectionName) => {
                  if (!sectionName) return 'Team';
                  // Extract team name from "AUS U19 Will Win the Toss(AUS U19 vs WI U19)adv"
                  const match = sectionName.match(/^(.+?)\s+Will Win the Toss/);
                  if (match) {
                    return match[1].trim();
                  }
                  // Fallback: return first part before any parentheses
                  return sectionName.split('(')[0].trim();
                };

                const isCardMarketSelected = selectedBet?.marketId === market.mid;
                const isSection1Selected =
                  isCardMarketSelected && selectedBet?.sectionId === section1.sid;
                const isSection2Selected =
                  isCardMarketSelected && selectedBet?.sectionId === section2.sid;

                // Profit/Loss preview for Toss card (treat as 2‑way Match Odds)
                const hasSelectedBet = isCardMarketSelected;
                const selectedBetType = hasSelectedBet ? selectedBet.type : null; // 'back' or 'lay'
                const currentStake =
                  hasSelectedBet && betStake > 0 ? betStake : 0;

                const section1Odd =
                  isSection1Selected && betOdds > 0 ? betOdds : section1BackOdds?.odds || 0;
                const section2Odd =
                  isSection2Selected && betOdds > 0 ? betOdds : section2BackOdds?.odds || 0;

                let section1Profit = 0;
                let section1Loss = 0;
                let section2Profit = 0;
                let section2Loss = 0;

                if (hasSelectedBet && currentStake > 0) {
                  if (selectedBetType === 'back') {
                    // Back one side, simple 2‑way market like Match Odds
                    if (isSection1Selected) {
                      // Back Section 1: profit on Section 1, loss (stake) on Section 2
                      section1Profit =
                        Math.round(currentStake * (section1Odd - 1) * 100) / 100;
                      section2Loss = currentStake;
                    } else if (isSection2Selected) {
                      // Back Section 2: profit on Section 2, loss (stake) on Section 1
                      section2Profit =
                        Math.round(currentStake * (section2Odd - 1) * 100) / 100;
                      section1Loss = currentStake;
                    }
                  } else if (selectedBetType === 'lay') {
                    // Lay support (future‑proof, same idea as Match Odds)
                    if (isSection1Selected) {
                      // Lay Section 1: loss = liability on Section 1, profit = stake on Section 2
                      section1Loss = calculateLayLiability(currentStake, section1Odd);
                      section2Profit = currentStake;
                    } else if (isSection2Selected) {
                      // Lay Section 2: loss = liability on Section 2, profit = stake on Section 1
                      section2Loss = calculateLayLiability(currentStake, section2Odd);
                      section1Profit = currentStake;
                    }
                  }
                }

                // P/L for toss: net if this side wins = this side possible profit − other side possible loss
                // e.g. SL wins: net = 196 − 100; PAK wins: net = 98 − 200
                const tossMarketType = 'tos_market';
                const section1ServerPL = getServerPL(tossMarketType, section1.sid);
                const section2ServerPL = getServerPL(tossMarketType, section2.sid);
                const section1PossibleProfit = Number(section1ServerPL.totalPossibleProfit ?? 0);
                const section1PossibleLoss = Number(section1ServerPL.totalPossibleLoss ?? 0);
                const section2PossibleProfit = Number(section2ServerPL.totalPossibleProfit ?? 0);
                const section2PossibleLoss = Number(section2ServerPL.totalPossibleLoss ?? 0);
                const section1NetIfWin = section1PossibleProfit - section2PossibleLoss; // e.g. 196 - 100
                const section2NetIfWin = section2PossibleProfit - section1PossibleLoss; // e.g. 98 - 200
                const hasSection1PL = section1NetIfWin !== 0;
                const hasSection2PL = section2NetIfWin !== 0;

                return (
                  <div key={market.mid} className="gd-card-market">
                    <div className="gd-card-market-header">
                      <div className="card-header-left">
                        <span className="card-market-title">{marketTitle}</span>
                        <span className="card-info-icon">i</span>
                      </div>
                      <div className="card-header-right">
                        <span className="card-matched-text">
                          Matched
                          {' '}
                          {formatMatchedAmount(marketMatched)}
                        </span>
                      </div>
                    </div>
                    <div className="gd-card-market-content">
                      <div
                        className={`card-team-box ${isSection1Selected ? 'selected' : ''}`}
                        onClick={() => {
                          if (section1BackOdds && section1BackOdds.odds > 0) {
                            // Use clean team name + section min/max for fancy markets
                            handleOddsClick(
                              section1BackOdds,
                              { ...section1, nat: getTeamName(section1.nat) },
                              'back',
                              market,
                            );
                          }
                        }}
                      >
                        <div className="card-team-name">
                          {getTeamName(section1.nat)}
                          {hasSection1PL && (
                            <span
                              className={`profit-loss-label ${section1NetIfWin >= 0 ? 'profit-text' : 'loss-text'}`}
                            >
                              {' '}
                              {section1NetIfWin >= 0
                                ? `+${section1NetIfWin.toLocaleString()}`
                                : section1NetIfWin.toLocaleString()}
                            </span>
                          )}
                          {section1Profit > 0 && (
                            <span className="profit-loss-label profit-text">
                              {' '}
                              (
                              {section1Profit.toLocaleString()}
                              )
                            </span>
                          )}
                          {section1Loss > 0 && (
                            <span className="profit-loss-label loss-text">
                              {' '}
                              (
                              {section1Loss.toLocaleString()}
                              )
                            </span>
                          )}
                        </div>
                        <div className="card-betting-box">
                          <div className="card-odds">
                            {section1BackOdds
                              ? section1BackOdds.odds.toFixed(2)
                              : '0.00'}
                          </div>
                          <div className="card-matched">{formatSize(section1Matched)}</div>
                        </div>
                      </div>
                      <div
                        className={`card-team-box ${isSection2Selected ? 'selected' : ''}`}
                        onClick={() => {
                          if (section2BackOdds && section2BackOdds.odds > 0) {
                            handleOddsClick(
                              section2BackOdds,
                              { ...section2, nat: getTeamName(section2.nat) },
                              'back',
                              market,
                            );
                          }
                        }}
                      >
                        <div className="card-team-name">
                          {getTeamName(section2.nat)}
                          {hasSection2PL && (
                            <span
                              className={`profit-loss-label ${section2NetIfWin >= 0 ? 'profit-text' : 'loss-text'}`}
                            >
                              {' '}
                              {section2NetIfWin >= 0
                                ? `+${section2NetIfWin.toLocaleString()}`
                                : section2NetIfWin.toLocaleString()}
                            </span>
                          )}
                          {section2Profit > 0 && (
                            <span className="profit-loss-label profit-text">
                              {' '}
                              (
                              {section2Profit.toLocaleString()}
                              )
                            </span>
                          )}
                          {section2Loss > 0 && (
                            <span className="profit-loss-label loss-text">
                              {' '}
                              (
                              {section2Loss.toLocaleString()}
                              )
                            </span>
                          )}
                        </div>
                        <div className="card-betting-box">
                          <div className="card-odds">
                            {section2BackOdds
                              ? section2BackOdds.odds.toFixed(2)
                              : '0.00'}
                          </div>
                          <div className="card-matched">{formatSize(section2Matched)}</div>
                        </div>
                      </div>
                    </div>
                    {/* When clicking odds, open stake selection (bet slip) */}
                    {isCardMarketSelected && (
                      <div className="gd-card-betslip">{renderBetSlip()}</div>
                    )}
                  </div>
                );
              })}

            {/* Fancy Bet / Sportsbook Section */}
            {(fancyBets.length > 0 || sportbookMarkets.length > 0) && (
              <div className="gd-market-section fancy-section">
                <div className="gd-fancy-tabs">
                  <div className="fancy-tab-group">
                    <button
                      type="button"
                      className={`fancy-tab ${activeMainTab === 'fancy' ? 'active' : ''}`}
                      onClick={() => setActiveMainTab('fancy')}
                    >
                      Fancy Bet
                      {' '}
                      <span className="card-info-icon">i</span>
                    </button>
                    <button
                      type="button"
                      className={`fancy-tab orange ${activeMainTab === 'sportbook' ? 'active' : ''
                        }`}
                      onClick={() => setActiveMainTab('sportbook')}
                    >
                      Sportsbook
                      {' '}
                      <span className="card-info-icon">i</span>
                    </button>
                  </div>
                  {activeMainTab === 'fancy' && (
                    <div className="fancy-filter-tabs">
                      <button
                        type="button"
                        className={`filter-tab ${activeFancyTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFancyTab('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeFancyTab === 'fancy' ? 'active' : ''
                          }`}
                        onClick={() => setActiveFancyTab('fancy')}
                      >
                        Fancy
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeFancyTab === 'line' ? 'active' : ''
                          }`}
                        onClick={() => setActiveFancyTab('line')}
                      >
                        Line Market
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeFancyTab === 'ball' ? 'active' : ''
                          }`}
                        onClick={() => setActiveFancyTab('ball')}
                      >
                        Ball by Ball
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeFancyTab === 'meter' ? 'active' : ''
                          }`}
                        onClick={() => setActiveFancyTab('meter')}
                      >
                        Meter Market
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeFancyTab === 'khado' ? 'active' : ''
                          }`}
                        onClick={() => setActiveFancyTab('khado')}
                      >
                        Khado Market
                      </button>
                    </div>
                  )}
                  {activeMainTab === 'sportbook' && (
                    <div className="fancy-filter-tabs">
                      <button
                        type="button"
                        className={`filter-tab ${activeSportbookTab === 'all' ? 'active' : ''
                          }`}
                        onClick={() => setActiveSportbookTab('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeSportbookTab === 'match' ? 'active' : ''
                          }`}
                        onClick={() => setActiveSportbookTab('match')}
                      >
                        Match
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeSportbookTab === 'odds/even' ? 'active' : ''
                          }`}
                        onClick={() => setActiveSportbookTab('odds/even')}
                      >
                        Odds/Even
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeSportbookTab === 'batsman' ? 'active' : ''
                          }`}
                        onClick={() => setActiveSportbookTab('batsman')}
                      >
                        Batsman
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeSportbookTab === 'bowler' ? 'active' : ''
                          }`}
                        onClick={() => setActiveSportbookTab('bowler')}
                      >
                        Bowler
                      </button>
                      <button
                        type="button"
                        className={`filter-tab ${activeSportbookTab === 'extra' ? 'active' : ''
                          }`}
                        onClick={() => setActiveSportbookTab('extra')}
                      >
                        Extra
                      </button>
                    </div>
                  )}
                </div>

                {activeMainTab === 'fancy' && (
                  <div className="gd-fancy-table">
                    {filteredFancyBets.length === 0 ? (
                      <div className="gd-no-data">No markets match the selected filter</div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th className="th-fancy-name" />
                            <th className="th-book" />
                            <th className="th-no">No</th>
                            <th className="th-yes">Yes</th>
                            <th className="th-minmax">Min/Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFancyBets.flatMap((market) => {
                            const sections = market.section || [];
                            const gtype = (market.gtype || '').toLowerCase();
                            const mname = (market.mname || '').toLowerCase();

                            // Map WS gtype/mname to admin market-analysis marketType
                            const marketTypeKey = (() => {
                              if (gtype === 'fancy2') return 'line_market';
                              if (gtype === 'fancy') {
                                if (mname.includes('over by over')) return 'over_by_over';
                                return 'fancy';
                              }
                              if (gtype === 'meter') return 'meter_market';
                              if (gtype === 'khado') return 'kado_market';
                              if (gtype) return gtype.replace(/-/g, '_');
                              return 'fancy';
                            })();

                            return sections.map((section) => {
                              const noOdd = section?.odds?.find(
                                (o) => o.otype === 'back' || o.otype === 'no',
                              );
                              const yesOdd = section?.odds?.find(
                                (o) => o.otype === 'lay' || o.otype === 'yes',
                              );
                              const isSuspended =
                                (section?.gstatus || '').toUpperCase() === 'SUSPENDED' ||
                                (section?.gstatus || '') === 'Suspended';
                              const isFancySelected =
                                selectedBet?.marketId === market.mid &&
                                selectedBet?.sectionId === section?.sid;
                              const rowMin = section?.min ?? market?.min ?? 100;
                              const rowMax = section?.max ?? market?.max ?? 25000;
                              const displayName = section?.nat?.trim()
                                ? section.nat
                                : market.mname || '';
                              const fancyPL = getServerPL(marketTypeKey, section?.sid);
                              const fancyPossibleProfit = Number(
                                fancyPL?.totalPossibleProfit ?? 0,
                              );

                              return (
                                <React.Fragment key={`${market.mid}-${section.sid}`}>
                                  <tr className={isSuspended ? 'suspended' : ''}>
                                    <td className="td-fancy-name">
                                      {displayName}
                                      {fancyPossibleProfit > 0 && (
                                        <span className="profit-loss-label profit-text">
                                          {' '}
                                          +{fancyPossibleProfit.toLocaleString()}
                                        </span>
                                      )}
                                    </td>
                                    <td
                                      className="td-book"
                                      ref={
                                        fancyInfoMarketId === market.mid && fancyInfoMarketId !== null
                                          ? fancyInfoRef
                                          : null
                                      }
                                    >
                                      <button
                                        type="button"
                                        className="book-btn fancy-book-desktop"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBookModal({ market, section });
                                        }}
                                      >
                                        Book
                                      </button>
                                      <button
                                        type="button"
                                        className="fancy-info-btn fancy-info-mobile"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFancyInfoMarketId((prev) =>
                                            prev === market.mid ? null : market.mid,
                                          );
                                        }}
                                        aria-label="Show min/max"
                                      >
                                        i
                                      </button>
                                      {fancyInfoMarketId === market.mid && (
                                        <div className="fancy-minmax-popover" role="tooltip">
                                          Min/Max:
                                          {' '}
                                          {rowMin}
                                          {' '}
                                          -
                                          {' '}
                                          {rowMax}
                                        </div>
                                      )}
                                    </td>
                                    <td
                                      className={`td-odds no clickable ${isFancySelected && selectedBet?.type === 'back'
                                          ? 'selected'
                                          : ''
                                        }`}
                                      onClick={() =>
                                        !isSuspended &&
                                        noOdd?.odds > 0 &&
                                        handleOddsClick(noOdd, section, 'back', market)
                                      }
                                    >
                                      {isSuspended ? (
                                        <span className="suspended-label">Suspended</span>
                                      ) : noOdd ? (
                                        <>
                                          <OddsCell value={noOdd.odds || 0} type="lay" />
                                          <span className="size">{noOdd.size || 0}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="odds">0</span>
                                          <span className="size">0</span>
                                        </>
                                      )}
                                    </td>
                                    <td
                                      className={`td-odds yes clickable ${isFancySelected && selectedBet?.type === 'lay'
                                          ? 'selected'
                                          : ''
                                        }`}
                                      onClick={() =>
                                        !isSuspended &&
                                        yesOdd?.odds > 0 &&
                                        handleOddsClick(yesOdd, section, 'lay', market)
                                      }
                                    >
                                      {isSuspended ? (
                                        <span className="suspended-label">Suspended</span>
                                      ) : yesOdd ? (
                                        <>
                                          <OddsCell value={yesOdd.odds || 0} type="back" />
                                          <span className="size">{yesOdd.size || 0}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="odds">0</span>
                                          <span className="size">0</span>
                                        </>
                                      )}
                                    </td>
                                    <td className="td-minmax-fancy fancy-minmax-desktop">
                                      {rowMin}
                                      {' '}
                                      -
                                      {' '}
                                      {rowMax}
                                    </td>
                                  </tr>
                                  {isFancySelected && (
                                    <tr className="bet-slip-row">
                                      <td colSpan={5}>{renderBetSlip()}</td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeMainTab === 'sportbook' && filteredSportbookMarkets.length > 0 && (
                  <div className="gd-sportbook-tables">
                    {filteredSportbookMarkets.map((market) => (
                      <div key={market.mid} className="gd-market-table sportbook-inline">
                        <div className="gd-market-header sportbook-inline-header">
                          <span className="market-title">{market.mname}</span>
                          <span className="minmax-value">
                            Min/Max:
                            {' '}
                            {market.min || 100}
                            -
                            {market.max || 25000}
                          </span>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th className="th-team" />
                              <th className="th-back">Back</th>
                              <th className="th-lay">Lay</th>
                            </tr>
                          </thead>
                          <tbody>
                            {market.section?.map((section) => {
                              const backOdds = (section.odds || [])
                                .filter((o) => o.otype === 'back')
                                .sort((a, b) => a.odds - b.odds)
                                .slice(0, 3);
                              const layOdds = (section.odds || [])
                                .filter((o) => o.otype === 'lay')
                                .sort((a, b) => a.odds - b.odds)
                                .slice(0, 3);
                              const isSuspended =
                                section.gstatus === 'SUSPENDED' || section.gstatus === 'Suspended';
                              const isSelected =
                                selectedBet?.sectionId === section.sid &&
                                selectedBet?.marketId === market.mid;
                              const { netProfitLoss: sportbookNetPL } =
                                getSelectionTotalProfitLoss(section.sid, market.mid);

                              return (
                                <React.Fragment key={section.sid}>
                                  <tr
                                    className={`${isSuspended ? 'suspended' : ''} ${isSelected ? 'selected' : ''
                                      }`}
                                  >
                                    <td className="td-team">
                                      {section.nat}
                                      <span
                                        className={`profit-loss-label ${
                                          sportbookNetPL > 0 ? 'profit-text' : 'loss-text'
                                        }`}
                                      >
                                        {sportbookNetPL > 0
                                          ? ` +${sportbookNetPL.toLocaleString()}`
                                          : ` ${Number(sportbookNetPL || 0).toFixed(2)}`}
                                      </span>
                                    </td>
                                    <td
                                      className="td-odds back clickable"
                                      onClick={() =>
                                        backOdds[0]?.odds > 0 &&
                                        !isSuspended &&
                                        handleOddsClick(
                                          backOdds[backOdds.length - 1],
                                          section,
                                          'back',
                                          market,
                                        )
                                      }
                                    >
                                      {backOdds.length &&
                                        backOdds[backOdds.length - 1]?.odds > 0 ? (
                                        <>
                                          <OddsCell
                                            value={backOdds[backOdds.length - 1].odds}
                                            type="back"
                                          />
                                          <span className="size">
                                            {formatSize(backOdds[backOdds.length - 1].size)}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="odds">0</span>
                                      )}
                                    </td>
                                    <td
                                      className="td-odds lay clickable"
                                      onClick={() =>
                                        layOdds[0]?.odds > 0 &&
                                        !isSuspended &&
                                        handleOddsClick(layOdds[0], section, 'lay', market)
                                      }
                                    >
                                      {layOdds.length && layOdds[0]?.odds > 0 ? (
                                        <>
                                          <OddsCell value={layOdds[0].odds} type="lay" />
                                          <span className="size">
                                            {formatSize(layOdds[0].size)}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="odds">0</span>
                                      )}
                                    </td>
                                  </tr>
                                  {isSelected && (
                                    <tr className="bet-slip-row">
                                      <td colSpan={3}>{renderBetSlip()}</td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {activeMainTab === 'sportbook' &&
                  filteredSportbookMarkets.length === 0 && (
                    <div className="gd-no-data">No markets match the selected filter</div>
                  )}
              </div>
            )}

            {eventData.length === 0 && (
              <div className="gd-no-data">No market data available</div>
            )}
          </div>

          <div className="gd-side">
            {/* Scoreboard Section */}
            <div className="gd-scoreboard">
              <div className="gd-scoreboard-header">
                <span className="powered-by">{event?.matchName}</span>
                <div className="score-stats">
                  <span className="stat-label">SCORE</span>
                  <span className="stat-label">OVS</span>
                  <span className="stat-label">RR</span>
                  <span className="stat-label">4S</span>
                  <span className="stat-label">6S</span>
                  <span className="stat-label">WIDES</span>
                </div>
              </div>
             
              <div className="gd-scoreboard-footer">
                <span className="live-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot active" />
                </span>
                <span className="over-info">1 | 1</span>
              </div>
            </div>

            {/* Book panel below scoreboard */}
            <div className="gd-book-panel">
              <div className="gd-book-header">
                <span className="gd-book-title">Book</span>
              </div>

              <div className="gd-book-tabs">
                <button
                  type="button"
                  className="gd-book-tab active"
                  onClick={() => setBookListModal({ type: 'master' })}
                >
                  Master Book
                </button>
                <button
                  type="button"
                  className="gd-book-tab"
                  onClick={() => setBookListModal({ type: 'user' })}
                >
                  User Book
                </button>
              </div>

              <div className="gd-book-toolbar">
                <div className="gd-book-toggle-group">
                  <span className="gd-book-toggle-label">Live Bet</span>
                  <label className="gd-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="gd-toggle-slider" />
                  </label>
                  <span className="gd-book-toggle-label">Partnership Book</span>
                  <label className="gd-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="gd-toggle-slider" />
                  </label>
                </div>
                <button type="button" className="gd-book-view-more">
                  View More
                </button>
              </div>

              <div className="gd-book-table-wrapper">
                <table className="gd-book-table">
                  <thead>
                    <tr>
                      <th>Market Name</th>
                      <th>Odds</th>
                      <th>Stake</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="gd-book-time-row">
                      <td colSpan={4}>
                        Time: Feb 18, 2026, 8:31:19 PM
                      </td>
                    </tr>
                    <tr className="gd-book-row gd-book-row-back">
                      <td>
                        <div className="gd-book-market-name">
                          <span className="gd-book-bet-type">BACK</span>
                          <div className="gd-book-market-text">
                            <span className="gd-book-selection">India</span>
                            <span className="gd-book-market-sub">Match Odds</span>
                          </div>
                        </div>
                      </td>
                      <td>1.06</td>
                      <td>100</td>
                      <td className="gd-book-username">demo2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Book Modal */}
        {bookModal && (
          <div
            className="custom-modal-backdrop"
            onClick={() => setBookModal(null)}
            role="presentation"
          >
            <div
              className="custom-modal-container book-modal-container"
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Book</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setBookModal(null)}
                  aria-label="Close"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0 8px',
                    lineHeight: '1',
                  }}
                >
                  ×
                </button>
              </div>
              <div className="custom-modal-body book-modal-body">
                <div className="book-table-container">
                  <table className="book-table">
                    <thead>
                      <tr>
                        <th>Run</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateBookData(bookModal.market, bookModal.section).map(
                        (item, index) => (
                          <tr
                            key={index}
                            className={
                              item.amount >= 0 ? 'book-profit' : 'book-loss'
                            }
                          >
                            <td>{item.run}</td>
                            <td
                              className={
                                item.amount >= 0 ? 'amount-profit' : 'amount-loss'
                              }
                            >
                              {item.amount > 0 ? '+' : ''}
                              {item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Market List Modal for Master/User Book */}
      {bookListModal && (
        <div
          className="custom-modal-backdrop"
          onClick={() => setBookListModal(null)}
          role="presentation"
        >
          <div
            className="custom-modal-container gd-marketlist-modal"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="custom-modal-header gd-marketlist-header">
              <h5 className="custom-modal-title">Market List</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBookListModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="custom-modal-body gd-marketlist-body">
              <ul className="gd-marketlist-list">
                {marketList.map((name, index) => (
                  <li
                    key={name}
                    className="gd-marketlist-item"
                  >
                    {name}
                  </li>
                ))}
                {marketList.length === 0 && (
                  <li className="gd-marketlist-item gd-marketlist-empty">
                    No markets available.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default GametableDetail;
