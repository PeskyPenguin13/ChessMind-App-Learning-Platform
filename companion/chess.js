/* ════════════════════════════════════════════════════════════
   Chess App — Full Implementation
   Features: legal moves, castling, en passant, promotion,
   check/checkmate/stalemate, move history, undo/redo,
   configurable clock, SVG pieces, 8 themes (full-page),
   sound effects, material bar, player names, opening book,
   puzzle mode, fullscreen, flip board, 3D view
   ════════════════════════════════════════════════════════════ */

// ── SVG Piece URLs (Wikimedia Commons — Cburnett set) ──────
const PIECE_URLS = {
  w: {
    K: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    Q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    R: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    B: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    N: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    P: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  },
  b: {
    K: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    Q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    R: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    B: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    N: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    P: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  }
};

// ── Board Themes (full page) ───────────────────────────────
const THEMES = {
  classic:   { light:'#f0d9b5', dark:'#b58863', bg:'#1a1a2e', panel:'#16213e', border:'#333',   accent:'#f0d9b5' },
  metro:     { light:'#ffffff', dark:'#4a90d9', bg:'#0a0a1a', panel:'#0d1530', border:'#1a3a6b', accent:'#7ab8f5' },
  leipzig:   { light:'#f5f5f5', dark:'#888888', bg:'#222',    panel:'#1a1a1a', border:'#3a3a3a', accent:'#e0e0e0' },
  wikipedia: { light:'#ffce9e', dark:'#d18b47', bg:'#1e1000', panel:'#160c00', border:'#4a2800', accent:'#f5b06a' },
  uscf:      { light:'#c8d8e8', dark:'#6b8fa8', bg:'#0a1525', panel:'#081020', border:'#1a3a55', accent:'#8ab4cc' },
  dilena:    { light:'#ffe0a0', dark:'#c07030', bg:'#150900', panel:'#100700', border:'#3a1500', accent:'#e09050' },
  green:     { light:'#eeeed2', dark:'#769656', bg:'#0e1a0e', panel:'#0a1408', border:'#254525', accent:'#a0c878' },
  walnut:    { light:'#e8c99a', dark:'#7a4a2e', bg:'#120905', panel:'#0d0603', border:'#3a1a08', accent:'#c8905a' },
};

function applyTheme(name) {
  const t = THEMES[name] || THEMES.classic;
  const r = document.documentElement.style;
  r.setProperty('--sq-light',     t.light);
  r.setProperty('--sq-dark',      t.dark);
  r.setProperty('--bg-color',     t.bg);
  r.setProperty('--panel-color',  t.panel);
  r.setProperty('--border-color', t.border);
  r.setProperty('--accent-color', t.accent);
}

// ── Responsive Board Size ──────────────────────────────────
function updateBoardSize() {
  const header   = document.querySelector('header');
  const controls = document.getElementById('controls');
  const puzzle   = document.getElementById('puzzle-panel');
  const hH = header   ? header.offsetHeight   : 34;
  const cH = controls ? controls.offsetHeight  : 40;
  const pH = puzzle && !puzzle.classList.contains('hidden') ? puzzle.offsetHeight + 5 : 0;
  const overhead = hH + cH + pH + 24*2 + 20*2 + 5*8 + 16;
  const sidebarW = 220; // right sidebar
  const leftW    = 175; // left panel
  const matBarW  = 30;
  const labelW   = 36;
  const maxH = window.innerHeight - overhead;
  const maxW = window.innerWidth  - sidebarW - leftW - matBarW - labelW - 50;
  const size = Math.max(240, Math.min(maxH, maxW));
  const sq   = Math.floor(size / 8);
  document.documentElement.style.setProperty('--sq-size', sq + 'px');
}

window.addEventListener('resize', updateBoardSize);

// ── Sound Engine ───────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const configs = {
      move:    [{ f:440, t:0,    d:0.08, v:0.12 }],
      capture: [{ f:220, t:0,    d:0.12, v:0.18 }, { f:160, t:0.06, d:0.10, v:0.10 }],
      check:   [{ f:660, t:0,    d:0.10, v:0.20 }, { f:880, t:0.10, d:0.08, v:0.15 }],
      gameOver:[{ f:330, t:0,    d:0.20, v:0.20 }, { f:220, t:0.20, d:0.20, v:0.18 }, { f:165, t:0.40, d:0.30, v:0.15 }],
      correct: [{ f:523, t:0,    d:0.10, v:0.15 }, { f:659, t:0.10, d:0.10, v:0.15 }, { f:784, t:0.20, d:0.15, v:0.12 }],
      wrong:   [{ f:200, t:0,    d:0.15, v:0.18 }, { f:150, t:0.15, d:0.20, v:0.15 }],
    };

    const steps = configs[type] || configs.move;
    steps.forEach(({ f, t, d, v }) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = type === 'gameOver' ? 'sawtooth' : 'sine';
      osc.frequency.value = f;
      osc.connect(g);
      g.connect(gain);
      g.gain.setValueAtTime(v, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d + 0.01);
    });
  } catch(e) { /* silently ignore if audio not available */ }
}

// ── Opening Book ───────────────────────────────────────────
// Maps move-sequence prefixes (joined by spaces) to opening names
const OPENING_BOOK = [
  { seq: ['e4','e5','Nf3','Nc6','Bb5'],              name: 'Ruy López' },
  { seq: ['e4','e5','Nf3','Nc6','Bc4','Bc5'],         name: 'Italian Game — Giuoco Piano' },
  { seq: ['e4','e5','Nf3','Nc6','Bc4'],               name: 'Italian Game' },
  { seq: ['e4','e5','Nf3','Nc6','d4'],                name: 'Scotch Game' },
  { seq: ['e4','e5','Nf3','Nf6'],                     name: 'Petrov Defense' },
  { seq: ['e4','e5','Nc3'],                           name: "Vienna Game" },
  { seq: ['e4','e5','f4'],                            name: "King's Gambit" },
  { seq: ['e4','c5','Nf3','d6'],                      name: 'Sicilian — Najdorf (line)' },
  { seq: ['e4','c5','Nf3'],                           name: 'Sicilian Defense — Open' },
  { seq: ['e4','c5'],                                 name: 'Sicilian Defense' },
  { seq: ['e4','e6','d4','d5'],                       name: 'French Defense' },
  { seq: ['e4','e6'],                                 name: 'French Defense' },
  { seq: ['e4','c6'],                                 name: 'Caro-Kann Defense' },
  { seq: ['e4','d6'],                                 name: 'Pirc Defense' },
  { seq: ['e4','g6'],                                 name: 'Modern Defense' },
  { seq: ['e4','d5'],                                 name: 'Scandinavian Defense' },
  { seq: ['e4','Nf6'],                               name: "Alekhine's Defense" },
  { seq: ['e4'],                                     name: "King's Pawn Opening" },
  { seq: ['d4','d5','c4','e6','Nc3','Nf6'],           name: "Queen's Gambit Declined" },
  { seq: ['d4','d5','c4','dxc4'],                     name: "Queen's Gambit Accepted" },
  { seq: ['d4','d5','c4'],                            name: "Queen's Gambit" },
  { seq: ['d4','Nf6','c4','e6','Nc3','Bb4'],          name: 'Nimzo-Indian Defense' },
  { seq: ['d4','Nf6','c4','g6','Nc3','Bg7'],          name: "King's Indian Defense" },
  { seq: ['d4','Nf6','c4','g6'],                      name: "King's Indian Defense" },
  { seq: ['d4','Nf6','c4','e6'],                      name: "Queen's Indian Defense (line)" },
  { seq: ['d4','Nf6','c4'],                           name: 'Indian Game' },
  { seq: ['d4','Nf6'],                               name: 'Indian Defense' },
  { seq: ['d4','d5'],                                name: "Queen's Pawn Game" },
  { seq: ['d4'],                                     name: "Queen's Pawn Opening" },
  { seq: ['c4'],                                     name: 'English Opening' },
  { seq: ['Nf3','d5','c4'],                          name: 'Réti Opening' },
  { seq: ['Nf3'],                                    name: "King's Knight Opening" },
];

function detectOpening(moves) {
  // moves = array of SAN strings (historyDisplay)
  if (!moves.length) return '';
  let best = '';
  for (const entry of OPENING_BOOK) {
    const len = entry.seq.length;
    if (moves.length >= len) {
      const match = entry.seq.every((m, i) => moves[i] === m);
      if (match && len >= best.split('').length) best = entry.name;
    }
  }
  return best;
}

// ── Initial Board ──────────────────────────────────────────
const INIT_PIECES = [
  ['R','N','B','Q','K','B','N','R'],
  ['P','P','P','P','P','P','P','P'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R'],
];

// ── Game State ─────────────────────────────────────────────
let state = {};
let clockMinutes = 5;
let clockInterval = null;
let boardFlipped = false;
let is3D = false;
let puzzleMode = false;
let puzzleSolution = null;
let puzzleAnswered = false;

function createInitialState() {
  const board = [];
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    for (let c = 0; c < 8; c++) {
      const type = INIT_PIECES[r][c];
      const color = type ? (r < 2 ? 'b' : 'w') : null;
      board[r][c] = type ? { type, color } : null;
    }
  }
  return {
    board, turn: 'w',
    castling: { w: { K:true, Q:true }, b: { K:true, Q:true } },
    enPassant: null,
    halfMove: 0,
    moveHistory: [],
    redoStack: [],
    historyDisplay: [],
    capturedByWhite: [],
    capturedByBlack: [],
    selected: null,
    legalMoves: [],
    lastMove: null,
    gameOver: false,
    timeW: clockMinutes * 60,
    timeB: clockMinutes * 60,
  };
}

// ── Board helpers ──────────────────────────────────────────
function cloneBoard(board) {
  return board.map(row => row.map(c => c ? {...c} : null));
}

function opponent(color) { return color === 'w' ? 'b' : 'w'; }

// ── FEN Parser ─────────────────────────────────────────────
function parseFEN(fen) {
  const parts = fen.trim().split(/\s+/);
  const [boardPart, turnStr, castlePart, epPart] = parts;
  const board = [];
  const rows = boardPart.split('/');
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    let c = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) board[r][c++] = null;
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        board[r][c++] = { type: ch.toUpperCase(), color };
      }
    }
    while (board[r].length < 8) board[r].push(null);
  }
  const cp = castlePart || '-';
  const castling = {
    w: { K: cp.includes('K'), Q: cp.includes('Q') },
    b: { K: cp.includes('k'), Q: cp.includes('q') }
  };
  let enPassant = null;
  if (epPart && epPart !== '-') {
    const ec = 'abcdefgh'.indexOf(epPart[0]);
    const er = 8 - parseInt(epPart[1]);
    if (ec >= 0 && er >= 0 && er < 8) enPassant = { r: er, c: ec };
  }
  return { board, turn: (turnStr === 'b' ? 'b' : 'w'), castling, enPassant };
}

function loadPositionFromFEN(fen) {
  try {
    const parsed = parseFEN(fen);
    stopClock();
    state = createInitialState();
    state.board    = parsed.board;
    state.turn     = parsed.turn;
    state.castling = parsed.castling;
    state.enPassant = parsed.enPassant;
    state.gameOver = false;
    puzzleAnswered = false;
    setStatus(`${state.turn === 'w' ? 'White' : 'Black'}'s turn — find the best move!`);
    renderAll();
  } catch(e) {
    alert('Invalid FEN string. Please check and try again.');
  }
}

// ── Move generation ────────────────────────────────────────
function pseudoLegalMoves(board, r, c, castling, enPassant) {
  const p = board[r][c];
  if (!p) return [];
  const { type, color } = p;
  const moves = [];
  const opp = opponent(color);

  const slide = (dr, dc) => {
    let nr = r+dr, nc = c+dc;
    while (nr>=0&&nr<8&&nc>=0&&nc<8) {
      const t = board[nr][nc];
      if (!t) moves.push({r:nr,c:nc});
      else { if (t.color===opp) moves.push({r:nr,c:nc}); break; }
      nr+=dr; nc+=dc;
    }
  };

  const step = (dr, dc) => {
    const nr=r+dr, nc=c+dc;
    if (nr<0||nr>7||nc<0||nc>7) return;
    const t = board[nr][nc];
    if (!t||t.color===opp) moves.push({r:nr,c:nc});
  };

  switch(type) {
    case 'R': slide(1,0);slide(-1,0);slide(0,1);slide(0,-1); break;
    case 'B': slide(1,1);slide(1,-1);slide(-1,1);slide(-1,-1); break;
    case 'Q': slide(1,0);slide(-1,0);slide(0,1);slide(0,-1);
              slide(1,1);slide(1,-1);slide(-1,1);slide(-1,-1); break;
    case 'N':
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
        .forEach(([dr,dc])=>step(dr,dc)); break;
    case 'K':
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
        .forEach(([dr,dc])=>step(dr,dc));
      if (castling[color].K) {
        const rank = color==='w'?7:0;
        if (!board[rank][5]&&!board[rank][6])
          moves.push({r:rank,c:6,castling:'K'});
      }
      if (castling[color].Q) {
        const rank = color==='w'?7:0;
        if (!board[rank][3]&&!board[rank][2]&&!board[rank][1])
          moves.push({r:rank,c:2,castling:'Q'});
      }
      break;
    case 'P': {
      const dir=color==='w'?-1:1, startRank=color==='w'?6:1;
      if (!board[r+dir]?.[c]) {
        moves.push({r:r+dir,c});
        if (r===startRank&&!board[r+2*dir]?.[c])
          moves.push({r:r+2*dir,c,doublePush:true});
      }
      [-1,1].forEach(dc=>{
        const nr=r+dir, nc=c+dc;
        if (nr<0||nr>7||nc<0||nc>7) return;
        const t = board[nr][nc];
        if (t&&t.color===opp) moves.push({r:nr,c:nc});
        if (enPassant&&enPassant.r===nr&&enPassant.c===nc)
          moves.push({r:nr,c:nc,enPassant:true});
      });
      break;
    }
  }
  return moves;
}

function isSquareAttacked(board, r, c, byColor) {
  for (let sr=0;sr<8;sr++)
    for (let sc=0;sc<8;sc++) {
      const p=board[sr][sc];
      if (!p||p.color!==byColor) continue;
      const ms=pseudoLegalMoves(board,sr,sc,{w:{K:false,Q:false},b:{K:false,Q:false}},null);
      if (ms.some(m=>m.r===r&&m.c===c)) return true;
    }
  return false;
}

function findKing(board, color) {
  for (let r=0;r<8;r++)
    for (let c=0;c<8;c++)
      if (board[r][c]?.type==='K'&&board[r][c]?.color===color)
        return {r,c};
  return null;
}

function isInCheck(board, color) {
  const k=findKing(board,color);
  return k ? isSquareAttacked(board,k.r,k.c,opponent(color)) : false;
}

function applyMoveToBoard(board, fromR, fromC, toR, toC, extra) {
  const nb=cloneBoard(board);
  const p=nb[fromR][fromC];
  nb[toR][toC]=p; nb[fromR][fromC]=null;
  if (extra?.enPassant) { const dir=p.color==='w'?1:-1; nb[toR+dir][toC]=null; }
  if (extra?.castling) {
    const rank=p.color==='w'?7:0;
    if (extra.castling==='K'){nb[rank][5]=nb[rank][7];nb[rank][7]=null;}
    else                     {nb[rank][3]=nb[rank][0];nb[rank][0]=null;}
  }
  return nb;
}

function legalMovesForPiece(s, r, c) {
  const {board,turn,castling,enPassant}=s;
  const p=board[r][c];
  if (!p||p.color!==turn) return [];
  const pseudo=pseudoLegalMoves(board,r,c,castling,enPassant);
  const legal=[];
  for (const m of pseudo) {
    if (m.castling) {
      const rank=p.color==='w'?7:0;
      if (isInCheck(board,p.color)) continue;
      const ptc=m.castling==='K'?5:3;
      const nb2=cloneBoard(board);
      nb2[rank][ptc]=nb2[rank][4]; nb2[rank][4]=null;
      if (isSquareAttacked(nb2,rank,ptc,opponent(p.color))) continue;
    }
    const nb=applyMoveToBoard(board,r,c,m.r,m.c,m);
    if (!isInCheck(nb,p.color)) legal.push(m);
  }
  return legal;
}

function hasAnyLegalMove(s) {
  for (let r=0;r<8;r++)
    for (let c=0;c<8;c++)
      if (s.board[r][c]?.color===s.turn)
        if (legalMovesForPiece(s,r,c).length>0) return true;
  return false;
}

// ── SAN ────────────────────────────────────────────────────
function toAlg(c){ return 'abcdefgh'[c]; }
function toRank(r){ return String(8-r); }

function buildSAN(board,fromR,fromC,toR,toC,extra,promo) {
  const p=board[fromR][fromC];
  if (!p) return '';
  if (extra?.castling==='K') return 'O-O';
  if (extra?.castling==='Q') return 'O-O-O';
  let san='';
  if (p.type!=='P') {
    san+=p.type;
    let ambig=false;
    for (let r=0;r<8;r++)
      for (let c=0;c<8;c++) {
        if (r===fromR&&c===fromC) continue;
        const q=board[r][c];
        if (q&&q.type===p.type&&q.color===p.color) {
          const ms=pseudoLegalMoves(board,r,c,{w:{K:false,Q:false},b:{K:false,Q:false}},null);
          if (ms.some(m=>m.r===toR&&m.c===toC)) ambig=true;
        }
      }
    if (ambig) san+=toAlg(fromC);
  }
  const isCap=board[toR][toC]||extra?.enPassant;
  if (isCap) { if (p.type==='P') san+=toAlg(fromC); san+='x'; }
  san+=toAlg(toC)+toRank(toR);
  if (promo) san+='='+promo;
  return san;
}

// ── Material Calculation ───────────────────────────────────
const PIECE_VAL = { Q:9, R:5, B:3, N:3, P:1, K:0 };

function calcMaterial(board) {
  let w=0, b=0;
  for (let r=0;r<8;r++)
    for (let c=0;c<8;c++) {
      const p=board[r][c];
      if (!p) continue;
      if (p.color==='w') w+=PIECE_VAL[p.type]||0;
      else               b+=PIECE_VAL[p.type]||0;
    }
  return {w, b};
}

function renderMaterial() {
  const {w, b} = calcMaterial(state.board);
  const diff = w - b;
  const MAX  = 20;
  // Bar: black on top, white on bottom
  // If white leads: white section grows, black shrinks
  const barEl    = document.getElementById('material-bar');
  const blackFill = document.getElementById('mat-black-fill');
  const whiteFill = document.getElementById('mat-white-fill');
  const scoreB    = document.getElementById('material-score-black');
  const scoreW    = document.getElementById('material-score-white');

  if (!barEl) return;

  const totalH = barEl.offsetHeight || (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sq-size'))*8);
  // black pct: 50% neutral, less if white leads
  const clampedDiff = Math.max(-MAX, Math.min(MAX, diff));
  const blackPct = 50 - (clampedDiff / MAX) * 45;
  blackFill.style.height = blackPct + '%';

  scoreB.textContent = diff < 0 ? `+${Math.abs(diff)}` : '';
  scoreW.textContent = diff > 0 ? `+${diff}` : '';

  // Material adv labels near player names
  const advBlack = document.getElementById('material-adv-black');
  const advWhite = document.getElementById('material-adv-white');
  if (advBlack) advBlack.textContent = diff < 0 ? `+${Math.abs(diff)}` : '';
  if (advWhite) advWhite.textContent = diff > 0 ? `+${diff}` : '';
}

// ── Execute a move ─────────────────────────────────────────
function executeMove(fromR, fromC, toR, toC, extra, promo) {
  const s=state;
  const board=s.board;
  const p=board[fromR][fromC];
  if (!p) return;

  const san=buildSAN(board,fromR,fromC,toR,toC,extra,promo);
  const capturedPiece=board[toR][toC];
  const epCap=extra?.enPassant?board[toR+(p.color==='w'?1:-1)][toC]:null;

  const snap={
    boardSnap:cloneBoard(board), turn:s.turn,
    castling:{w:{...s.castling.w},b:{...s.castling.b}},
    enPassant:s.enPassant?{...s.enPassant}:null,
    lastMove:s.lastMove?{...s.lastMove}:null,
    capturedByWhite:[...s.capturedByWhite],
    capturedByBlack:[...s.capturedByBlack], san,
  };

  const cap=capturedPiece||epCap;
  if (cap) {
    if (p.color==='w') s.capturedByWhite.push(cap.type);
    else               s.capturedByBlack.push(cap.type);
  }

  const nb=applyMoveToBoard(board,fromR,fromC,toR,toC,extra);
  if (promo) nb[toR][toC]={type:promo,color:p.color};

  if (p.type==='K'){s.castling[p.color].K=false;s.castling[p.color].Q=false;}
  if (p.type==='R'){
    const rank=p.color==='w'?7:0;
    if (fromR===rank&&fromC===0) s.castling[p.color].Q=false;
    if (fromR===rank&&fromC===7) s.castling[p.color].K=false;
  }
  if (toR===0&&toC===7) s.castling.b.K=false;
  if (toR===0&&toC===0) s.castling.b.Q=false;
  if (toR===7&&toC===7) s.castling.w.K=false;
  if (toR===7&&toC===0) s.castling.w.Q=false;

  s.enPassant=extra?.doublePush?{r:(fromR+toR)/2,c:toC}:null;
  for (let r=0;r<8;r++) s.board[r]=nb[r];
  s.turn=opponent(s.turn);
  s.lastMove={from:{r:fromR,c:fromC},to:{r:toR,c:toC}};
  s.selected=null; s.legalMoves=[]; s.redoStack=[];
  s.moveHistory.push(snap);
  s.historyDisplay.push(san);

  // Puzzle check
  if (puzzleMode&&puzzleSolution&&!puzzleAnswered) {
    puzzleAnswered=true;
    const hintBox=document.getElementById('puzzle-hint-box');
    if (puzzleSolution.includes(san)||puzzleSolution.some(sol=>san.replace(/[+#]/g,'')===sol.replace(/[+#]/g,''))) {
      hintBox.textContent='✓ Correct! Well done!';
      hintBox.className='correct';
      playSound('correct');
    } else {
      hintBox.textContent=`✗ Not the best move. Try again!`;
      hintBox.className='wrong';
      playSound('wrong');
    }
  }

  switchClock();
  const wasCapture=!!(cap);
  checkGameOver(san, wasCapture);
  renderAll();
}

function checkGameOver(lastSan, wasCapture) {
  const s=state;
  const inCheck=isInCheck(s.board,s.turn);
  const hasMoves=hasAnyLegalMove(s);

  if (!hasMoves) {
    stopClock(); s.gameOver=true;
    if (inCheck) {
      const winner=opponent(s.turn)==='w'?getPlayerName('w'):getPlayerName('b');
      setStatus(`Checkmate! ${winner} wins!`,'checkmate');
      if (s.historyDisplay.length) s.historyDisplay[s.historyDisplay.length-1]+='#';
      playSound('gameOver');
    } else {
      setStatus('Stalemate! Draw.','stalemate');
      playSound('gameOver');
    }
  } else if (inCheck) {
    setStatus(`${s.turn==='w'?getPlayerName('w'):getPlayerName('b')} is in check!`,'check');
    if (s.historyDisplay.length) s.historyDisplay[s.historyDisplay.length-1]+='+';
    playSound('check');
  } else {
    setStatus(`${s.turn==='w'?getPlayerName('w'):getPlayerName('b')}'s turn`);
    playSound(wasCapture?'capture':'move');
  }
}

// ── Player Names ───────────────────────────────────────────
function getPlayerName(color) {
  const id = color==='w'?'name-white':'name-black';
  return document.getElementById(id)?.value.trim() || (color==='w'?'White':'Black');
}

function syncPlayerNames() {
  document.getElementById('clock-label-white').textContent = getPlayerName('w');
  document.getElementById('clock-label-black').textContent = getPlayerName('b');
}

// ── Clock ──────────────────────────────────────────────────
function startClock() {
  stopClock();
  clockInterval=setInterval(()=>{
    if (state.gameOver){stopClock();return;}
    if (state.turn==='w'){
      state.timeW--;
      if (state.timeW<=0){state.timeW=0;onTimeout('w');}
    } else {
      state.timeB--;
      if (state.timeB<=0){state.timeB=0;onTimeout('b');}
    }
    renderClocks();
  },1000);
}

function stopClock(){if(clockInterval){clearInterval(clockInterval);clockInterval=null;}}
function switchClock(){}

function onTimeout(color){
  stopClock(); state.gameOver=true;
  const loser=color==='w'?getPlayerName('w'):getPlayerName('b');
  const winner=color==='w'?getPlayerName('b'):getPlayerName('w');
  setStatus(`${loser} ran out of time! ${winner} wins!`,'checkmate');
  playSound('gameOver');
  renderAll();
}

function formatTime(secs){
  return `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`;
}

function renderClocks(){
  document.getElementById('time-white').textContent=formatTime(state.timeW);
  document.getElementById('time-black').textContent=formatTime(state.timeB);
  const cw=document.getElementById('clock-white');
  const cb=document.getElementById('clock-black');
  cw.classList.toggle('active-clock',state.turn==='w'&&!state.gameOver);
  cb.classList.toggle('active-clock',state.turn==='b'&&!state.gameOver);
  cw.classList.toggle('low-time',state.timeW<=30);
  cb.classList.toggle('low-time',state.timeB<=30);
}

function applyClockSetting(){
  const val=parseInt(document.getElementById('clock-input').value,10);
  if (val>=1&&val<=60){clockMinutes=val;resetGame();}
}

// ── Full Render ────────────────────────────────────────────
function renderAll(){
  renderBoard();
  renderClocks();
  renderHistory();
  renderCaptured();
  renderMaterial();
  renderOpening();
}

// ── Opening Label ──────────────────────────────────────────
function renderOpening(){
  const label=document.getElementById('opening-label');
  if (!label) return;
  const name=detectOpening(state.historyDisplay);
  label.textContent=name||'';
}

// ── Captured Pieces ────────────────────────────────────────
const PIECE_ORDER=['Q','R','B','N','P'];

function makePieceImg(color,type){
  const img=document.createElement('img');
  img.src=PIECE_URLS[color][type];
  img.alt=color+type;
  img.draggable=false;
  return img;
}

function renderCaptured(){
  const s=state;
  ['white','black'].forEach(side=>{
    const el=document.getElementById(`captured-by-${side}`);
    el.innerHTML='';
    const arr=side==='white'?s.capturedByWhite:s.capturedByBlack;
    const capColor=side==='white'?'b':'w';
    if (!arr.length) return;
    const lbl=document.createElement('span');
    lbl.className='cap-label';
    lbl.textContent=(side==='white'?getPlayerName('w'):getPlayerName('b'))+' took:';
    el.appendChild(lbl);
    [...arr].sort((a,b)=>PIECE_ORDER.indexOf(a)-PIECE_ORDER.indexOf(b))
      .forEach(type=>{
        const sp=document.createElement('span');
        sp.className='cap-piece';
        sp.appendChild(makePieceImg(capColor,type));
        el.appendChild(sp);
      });
  });
}

// ── Board Rendering ────────────────────────────────────────
function renderBoard(){
  const s=state;
  const boardEl=document.getElementById('board');
  boardEl.innerHTML='';

  let checkKing=null;
  if (!s.gameOver&&isInCheck(s.board,s.turn))
    checkKing=findKing(s.board,s.turn);

  const legalSet=new Set(s.legalMoves.map(m=>`${m.r},${m.c}`));

  for (let ri=0;ri<8;ri++){
    for (let ci=0;ci<8;ci++){
      // Apply flip
      const r=boardFlipped?7-ri:ri;
      const c=boardFlipped?7-ci:ci;

      const sq=document.createElement('div');
      sq.className='square '+((r+c)%2===0?'light':'dark');
      sq.dataset.r=r; sq.dataset.c=c;

      if (s.lastMove){
        const {from,to}=s.lastMove;
        if ((from.r===r&&from.c===c)||(to.r===r&&to.c===c)) sq.classList.add('last-move');
      }
      if (s.selected&&s.selected.r===r&&s.selected.c===c) sq.classList.add('selected');
      if (legalSet.has(`${r},${c}`)){
        const target=s.board[r][c];
        const isEP=s.legalMoves.find(m=>m.r===r&&m.c===c&&m.enPassant);
        sq.classList.add(target||isEP?'legal-capture':'legal-move');
      }
      if (checkKing&&checkKing.r===r&&checkKing.c===c) sq.classList.add('in-check');

      const cell=s.board[r][c];
      if (cell){
        const img=document.createElement('img');
        img.src=PIECE_URLS[cell.color][cell.type];
        img.alt=cell.color+cell.type;
        img.draggable=false;
        sq.appendChild(img);
      }

      sq.addEventListener('click',()=>onSquareClick(r,c));
      boardEl.appendChild(sq);
    }
  }
  renderLabels();
}

function renderLabels(){
  const left  =document.getElementById('rank-labels-left');
  const right =document.getElementById('rank-labels-right');
  const files =document.getElementById('file-labels');
  left.innerHTML=right.innerHTML=files.innerHTML='';
  for (let ri=0;ri<8;ri++){
    const r=boardFlipped?ri:7-ri;
    [left,right].forEach(el=>{
      const span=document.createElement('span');
      span.textContent=r+1;
      el.appendChild(span);
    });
  }
  const fileChars=boardFlipped?'hgfedcba':'abcdefgh';
  fileChars.split('').forEach(f=>{
    const span=document.createElement('span');
    span.textContent=f;
    files.appendChild(span);
  });
}

function renderHistory(){
  const list=document.getElementById('history-list');
  list.innerHTML='';
  const hist=state.historyDisplay;
  const currentIdx=hist.length-1;
  for (let i=0;i<hist.length;i+=2){
    const row=document.createElement('div');
    row.className='history-row';
    const num=document.createElement('span');
    num.className='move-num';
    num.textContent=(i/2+1)+'.';
    row.appendChild(num);
    [i,i+1].forEach(idx=>{
      const span=document.createElement('span');
      span.className='move-token';
      if (idx<hist.length){
        span.textContent=hist[idx];
        if (idx===currentIdx) span.classList.add('current-move');
      }
      row.appendChild(span);
    });
    list.appendChild(row);
  }
  list.scrollTop=list.scrollHeight;
}

function setStatus(msg,cls){
  const bar=document.getElementById('status-bar');
  bar.textContent=msg;
  bar.className='status-bar'+(cls?' '+cls:'');
}

// ── Click Handler ──────────────────────────────────────────
function onSquareClick(r,c){
  const s=state;
  if (s.gameOver) return;
  const cell=s.board[r][c];
  if (s.selected){
    const move=s.legalMoves.find(m=>m.r===r&&m.c===c);
    if (move){
      const p=s.board[s.selected.r][s.selected.c];
      if (p.type==='P'&&(r===0||r===7)) showPromotion(s.selected.r,s.selected.c,r,c,move);
      else executeMove(s.selected.r,s.selected.c,r,c,move,null);
      return;
    }
    if (cell&&cell.color===s.turn){
      s.selected={r,c}; s.legalMoves=legalMovesForPiece(s,r,c);
      renderBoard(); return;
    }
    s.selected=null; s.legalMoves=[]; renderBoard(); return;
  }
  if (cell&&cell.color===s.turn){
    s.selected={r,c}; s.legalMoves=legalMovesForPiece(s,r,c);
    renderBoard();
  }
}

// ── Pawn Promotion ─────────────────────────────────────────
function showPromotion(fromR,fromC,toR,toC,moveExtra){
  const color=state.board[fromR][fromC].color;
  const choices=document.getElementById('promotion-choices');
  choices.innerHTML='';
  ['Q','R','B','N'].forEach(type=>{
    const btn=document.createElement('button');
    btn.className='promo-btn';
    const img=document.createElement('img');
    img.src=PIECE_URLS[color][type]; img.alt=type; img.draggable=false;
    btn.appendChild(img);
    btn.onclick=()=>{
      document.getElementById('promotion-modal').classList.add('hidden');
      executeMove(fromR,fromC,toR,toC,moveExtra,type);
    };
    choices.appendChild(btn);
  });
  document.getElementById('promotion-modal').classList.remove('hidden');
}

// ── Undo / Redo ────────────────────────────────────────────
function undoMove(){
  const s=state;
  if (!s.moveHistory.length) return;
  const snap=s.moveHistory.pop();
  const san =s.historyDisplay.pop();
  s.redoStack.push({
    boardSnap:cloneBoard(s.board), turn:s.turn,
    castling:{w:{...s.castling.w},b:{...s.castling.b}},
    enPassant:s.enPassant?{...s.enPassant}:null,
    lastMove:s.lastMove?{...s.lastMove}:null, san,
  });
  for (let r=0;r<8;r++) s.board[r]=snap.boardSnap[r];
  s.turn=snap.turn; s.castling=snap.castling;
  s.enPassant=snap.enPassant; s.lastMove=snap.lastMove;
  s.capturedByWhite=snap.capturedByWhite;
  s.capturedByBlack=snap.capturedByBlack;
  s.selected=null; s.legalMoves=[]; s.gameOver=false;
  setStatus(`${s.turn==='w'?getPlayerName('w'):getPlayerName('b')}'s turn`);
  renderAll();
}

function redoMove(){
  const s=state;
  if (!s.redoStack.length) return;
  const snap=s.redoStack.pop();
  const san=snap.san;
  s.moveHistory.push({
    boardSnap:cloneBoard(s.board), turn:s.turn,
    castling:{w:{...s.castling.w},b:{...s.castling.b}},
    enPassant:s.enPassant?{...s.enPassant}:null,
    lastMove:s.lastMove?{...s.lastMove}:null, san,
  });
  s.historyDisplay.push(san);
  for (let r=0;r<8;r++) s.board[r]=snap.boardSnap[r];
  s.turn=snap.turn; s.castling=snap.castling;
  s.enPassant=snap.enPassant; s.lastMove=snap.lastMove;
  s.selected=null; s.legalMoves=[]; s.gameOver=false;
  checkGameOver(san,false);
  renderAll();
}

// ── 3D Toggle ──────────────────────────────────────────────
function toggle3D(){
  is3D=!is3D;
  const wrap=document.getElementById('board-wrap');
  const btn =document.getElementById('btn-3d');
  wrap.classList.toggle('is-3d',is3D);
  btn.classList.toggle('active-3d',is3D);
  btn.textContent=is3D?'⬜ Flat View':'⬛ 3D View';
}

// ── Flip Board ─────────────────────────────────────────────
function flipBoard(){
  boardFlipped=!boardFlipped;
  // Swap captured bars (white-took appears near black side, black-took near white side)
  const boardArea = document.getElementById('board-area');
  const topCap    = document.getElementById('captured-by-white');
  const botCap    = document.getElementById('captured-by-black');
  const statusWrap = document.getElementById('status-wrap');
  if (boardFlipped){
    // Move captured-by-black above the board, white below
    boardArea.insertBefore(botCap, statusWrap);
  } else {
    boardArea.insertBefore(topCap, statusWrap);
  }
  renderAll();
}

// ── Fullscreen ─────────────────────────────────────────────
function toggleFullscreen(){
  if (!document.fullscreenElement){
    document.documentElement.requestFullscreen().catch(()=>{});
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener('fullscreenchange',()=>{
  setTimeout(()=>{updateBoardSize(); renderAll();},100);
});

// ── Puzzle Mode ────────────────────────────────────────────
const PUZZLES = {
  mate1: {
    fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1',
    solution: ['Ra8','Ra8#'],
    hint: 'White to move — Mate in 1! Think rook placement.',
    name: 'Mate in 1 — Rook',
  },
  mate1b: {
    fen: '6k1/6pp/8/8/8/8/6PP/4K2Q w - - 0 1',
    solution: ['Qh7','Qh7#','Qxh7'],
    hint: 'White to move — find the queen move for checkmate!',
    name: 'Mate in 1 — Queen',
  },
  fork: {
    fen: '4k3/8/8/3p4/8/4N3/8/4K3 w - - 0 1',
    solution: ['Nc4','Nxd5'],
    hint: 'White to move — fork the king and pawn with your knight!',
    name: 'Knight Fork',
  },
  pin: {
    fen: '4k3/8/8/8/r7/8/4R3/4K3 w - - 0 1',
    solution: ['Re4','Rxe4','Re8','Re8+'],
    hint: 'White to move — pin or win material!',
    name: 'Pin & Win',
  },
  skewer: {
    fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1',
    solution: ['Ra8','Ra8+'],
    hint: 'White to move — skewer the king to win the rook behind it!',
    name: 'Skewer Tactic',
  },
  backrank: {
    fen: '5rk1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
    solution: ['Re8','Rxe8','Rxf8'],
    hint: 'White to move — exploit the back rank weakness!',
    name: 'Back Rank Mate',
  },
};

function loadPresetPuzzle(key){
  if (!key) return;
  const pz=PUZZLES[key];
  if (!pz) return;
  puzzleMode=true;
  puzzleSolution=pz.solution;
  puzzleAnswered=false;
  loadPositionFromFEN(pz.fen);
  const hintBox=document.getElementById('puzzle-hint-box');
  hintBox.textContent=pz.hint;
  hintBox.className='hint';
}

function loadFENFromInput(){
  const fen=document.getElementById('puzzle-fen').value.trim();
  if (!fen){alert('Please enter a FEN string.');return;}
  puzzleMode=true;
  puzzleSolution=null;
  puzzleAnswered=false;
  loadPositionFromFEN(fen);
  const hintBox=document.getElementById('puzzle-hint-box');
  hintBox.textContent='Custom position loaded — play the best move!';
  hintBox.className='hint';
}

function togglePuzzlePanel(){
  const panel=document.getElementById('puzzle-panel');
  const btn  =document.getElementById('btn-puzzle');
  const hidden=panel.classList.toggle('hidden');
  btn.classList.toggle('active-puzzle',!hidden);
  setTimeout(updateBoardSize,50);
}

// ── Reset ──────────────────────────────────────────────────
function resetGame(){
  stopClock();
  puzzleMode=false; puzzleSolution=null; puzzleAnswered=false;
  const hintBox=document.getElementById('puzzle-hint-box');
  if (hintBox){hintBox.textContent='';hintBox.className='';}
  const sel=document.getElementById('puzzle-select');
  if (sel) sel.value='';
  state=createInitialState();
  setStatus(`${getPlayerName('w')}'s turn`);
  syncPlayerNames();
  renderAll();
  startClock();
}

// ── Init ───────────────────────────────────────────────────
updateBoardSize();
resetGame();
