// ─── Puzzle Data ──────────────────────────────────────────────────────────────
// Each puzzle has:
//   - id: unique identifier
//   - label: display name
//   - pieceCount: total white pieces
//   - blackKing: square of the black king
//   - pieces: all white pieces with their starting squares
//   - chain: ordered array describing each step of the solution
//     Each chain step: { pieceId, from, to, note }
//   - solutionSteps: human-readable guided steps for Solution Mode
//     Each step shows which pieces are still on the board and which squares to highlight

export const PUZZLES = [

  // ── Puzzle 1 — 5 pieces ────────────────────────────────────────────────────
  {
    id: "p5a",
    label: "Puzzle 1",
    pieceCount: 5,
    blackKing: "H8",
    pieces: [
      { id: "w1", type: "pawn",   color: "white", square: "A2", label: "Pawn"   },
      { id: "w2", type: "knight", color: "white", square: "B3", label: "Knight" },
      { id: "w3", type: "queen",  color: "white", square: "D2", label: "Queen"  },
      { id: "w4", type: "rook",   color: "white", square: "D6", label: "Rook"   },
      { id: "w5", type: "bishop", color: "white", square: "F6", label: "Bishop" },
      { id: "bk", type: "king",   color: "black", square: "H8", label: "King"   },
    ],
    // chain[i].to === chain[i+1].from (each piece lands on the next piece's square)
    chain: [
      { pieceId: "w1", from: "A2", to: "B3", note: "Pawn captures diagonally onto Knight" },
      { pieceId: "w2", from: "B3", to: "D2", note: "Knight jumps to Queen's square" },
      { pieceId: "w3", from: "D2", to: "D6", note: "Queen slides up to Rook's square" },
      { pieceId: "w4", from: "D6", to: "F6", note: "Rook slides right to Bishop's square" },
      { pieceId: "w5", from: "F6", to: "H8", note: "Bishop captures the Black King" },
    ],
    solutionSteps: [
      {
        title: "Step 1 — Pawn moves to Knight",
        description: "The White Pawn on A2 captures diagonally onto B3, where the Knight stands. The Pawn disappears.",
        visibleIds: ["w1", "w2", "w3", "w4", "w5", "bk"],
        highlights: ["A2", "B3"],
      },
      {
        title: "Step 2 — Knight jumps to Queen",
        description: "The Knight on B3 jumps to D2, landing on the Queen's square. The Knight disappears.",
        visibleIds: ["w2", "w3", "w4", "w5", "bk"],
        highlights: ["B3", "D2"],
      },
      {
        title: "Step 3 — Queen slides to Rook",
        description: "The Queen on D2 slides straight up to D6, landing on the Rook's square. The Queen disappears.",
        visibleIds: ["w3", "w4", "w5", "bk"],
        highlights: ["D2", "D6"],
      },
      {
        title: "Step 4 — Rook slides to Bishop",
        description: "The Rook on D6 slides right to F6, landing on the Bishop's square. The Rook disappears.",
        visibleIds: ["w4", "w5", "bk"],
        highlights: ["D6", "F6"],
      },
      {
        title: "Step 5 — Bishop captures the King!",
        description: "The Bishop on F6 moves diagonally to H8, capturing the Black King. Puzzle solved!",
        visibleIds: ["w5", "bk"],
        highlights: ["F6", "H8"],
        isFinal: true,
      },
    ],
  },

  // ── Puzzle 2 — 5 pieces ────────────────────────────────────────────────────
  {
    id: "p5b",
    label: "Puzzle 2",
    pieceCount: 5,
    blackKing: "H8",
    pieces: [
      { id: "w1", type: "rook",   color: "white", square: "A7", label: "Rook"   },
      { id: "w2", type: "queen",  color: "white", square: "A3", label: "Queen"  },
      { id: "w3", type: "pawn",   color: "white", square: "D3", label: "Pawn"   },
      { id: "w4", type: "knight", color: "white", square: "E4", label: "Knight" },
      { id: "w5", type: "bishop", color: "white", square: "F6", label: "Bishop" },
      { id: "bk", type: "king",   color: "black", square: "H8", label: "King"   },
    ],
    chain: [
      { pieceId: "w1", from: "A7", to: "A3", note: "Rook slides down to Queen's square" },
      { pieceId: "w2", from: "A3", to: "D3", note: "Queen slides right to Pawn's square" },
      { pieceId: "w3", from: "D3", to: "E4", note: "Pawn captures diagonally onto Knight" },
      { pieceId: "w4", from: "E4", to: "F6", note: "Knight jumps to Bishop's square" },
      { pieceId: "w5", from: "F6", to: "H8", note: "Bishop captures the Black King" },
    ],
    solutionSteps: [
      {
        title: "Step 1 — Rook slides to Queen",
        description: "The Rook on A7 slides straight down to A3, landing on the Queen's square. The Rook disappears.",
        visibleIds: ["w1", "w2", "w3", "w4", "w5", "bk"],
        highlights: ["A7", "A3"],
      },
      {
        title: "Step 2 — Queen slides to Pawn",
        description: "The Queen on A3 slides right to D3, landing on the Pawn's square. The Queen disappears.",
        visibleIds: ["w2", "w3", "w4", "w5", "bk"],
        highlights: ["A3", "D3"],
      },
      {
        title: "Step 3 — Pawn captures onto Knight",
        description: "The Pawn on D3 captures diagonally to E4, landing on the Knight's square. The Pawn disappears.",
        visibleIds: ["w3", "w4", "w5", "bk"],
        highlights: ["D3", "E4"],
      },
      {
        title: "Step 4 — Knight jumps to Bishop",
        description: "The Knight on E4 jumps to F6, landing on the Bishop's square. The Knight disappears.",
        visibleIds: ["w4", "w5", "bk"],
        highlights: ["E4", "F6"],
      },
      {
        title: "Step 5 — Bishop captures the King!",
        description: "The Bishop on F6 moves diagonally to H8, capturing the Black King. Puzzle solved!",
        visibleIds: ["w5", "bk"],
        highlights: ["F6", "H8"],
        isFinal: true,
      },
    ],
  },

  // ── Puzzle 3 — 6 pieces ────────────────────────────────────────────────────
  {
    id: "p6a",
    label: "Puzzle 3",
    pieceCount: 6,
    blackKing: "H8",
    pieces: [
      { id: "w1", type: "bishop", color: "white", square: "C5", label: "Bishop" },
      { id: "w2", type: "rook",   color: "white", square: "A7", label: "Rook"   },
      { id: "w3", type: "queen",  color: "white", square: "A3", label: "Queen"  },
      { id: "w4", type: "pawn",   color: "white", square: "D3", label: "Pawn"   },
      { id: "w5", type: "knight", color: "white", square: "E4", label: "Knight" },
      { id: "w6", type: "bishop", color: "white", square: "F6", label: "Bishop" },
      { id: "bk", type: "king",   color: "black", square: "H8", label: "King"   },
    ],
    chain: [
      { pieceId: "w1", from: "C5", to: "A7", note: "Bishop slides diagonally to Rook's square" },
      { pieceId: "w2", from: "A7", to: "A3", note: "Rook slides down to Queen's square" },
      { pieceId: "w3", from: "A3", to: "D3", note: "Queen slides right to Pawn's square" },
      { pieceId: "w4", from: "D3", to: "E4", note: "Pawn captures diagonally onto Knight" },
      { pieceId: "w5", from: "E4", to: "F6", note: "Knight jumps to Bishop's square" },
      { pieceId: "w6", from: "F6", to: "H8", note: "Bishop captures the Black King" },
    ],
    solutionSteps: [
      {
        title: "Step 1 — Bishop slides to Rook",
        description: "The Bishop on C5 slides diagonally (C5→B6→A7) to land on the Rook's square. The Bishop disappears.",
        visibleIds: ["w1", "w2", "w3", "w4", "w5", "w6", "bk"],
        highlights: ["C5", "B6", "A7"],
      },
      {
        title: "Step 2 — Rook slides to Queen",
        description: "The Rook on A7 slides straight down to A3, landing on the Queen's square. The Rook disappears.",
        visibleIds: ["w2", "w3", "w4", "w5", "w6", "bk"],
        highlights: ["A7", "A3"],
      },
      {
        title: "Step 3 — Queen slides to Pawn",
        description: "The Queen on A3 slides right to D3, landing on the Pawn's square. The Queen disappears.",
        visibleIds: ["w3", "w4", "w5", "w6", "bk"],
        highlights: ["A3", "D3"],
      },
      {
        title: "Step 4 — Pawn captures onto Knight",
        description: "The Pawn on D3 captures diagonally to E4, landing on the Knight's square. The Pawn disappears.",
        visibleIds: ["w4", "w5", "w6", "bk"],
        highlights: ["D3", "E4"],
      },
      {
        title: "Step 5 — Knight jumps to Bishop",
        description: "The Knight on E4 jumps to F6, landing on the Bishop's square. The Knight disappears.",
        visibleIds: ["w5", "w6", "bk"],
        highlights: ["E4", "F6"],
      },
      {
        title: "Step 6 — Bishop captures the King!",
        description: "The Bishop on F6 moves diagonally to H8, capturing the Black King. Puzzle solved!",
        visibleIds: ["w6", "bk"],
        highlights: ["F6", "H8"],
        isFinal: true,
      },
    ],
  },

  // ── Puzzle 4 — 7 pieces ────────────────────────────────────────────────────
  {
    id: "p7a",
    label: "Puzzle 4",
    pieceCount: 7,
    blackKing: "H8",
    pieces: [
      { id: "w1", type: "pawn",   color: "white", square: "B4", label: "Pawn"   },
      { id: "w2", type: "bishop", color: "white", square: "C5", label: "Bishop" },
      { id: "w3", type: "rook",   color: "white", square: "A7", label: "Rook"   },
      { id: "w4", type: "queen",  color: "white", square: "A3", label: "Queen"  },
      { id: "w5", type: "pawn",   color: "white", square: "D3", label: "Pawn"   },
      { id: "w6", type: "knight", color: "white", square: "E4", label: "Knight" },
      { id: "w7", type: "bishop", color: "white", square: "F6", label: "Bishop" },
      { id: "bk", type: "king",   color: "black", square: "H8", label: "King"   },
    ],
    chain: [
      { pieceId: "w1", from: "B4", to: "C5", note: "Pawn captures diagonally onto Bishop" },
      { pieceId: "w2", from: "C5", to: "A7", note: "Bishop slides diagonally to Rook's square" },
      { pieceId: "w3", from: "A7", to: "A3", note: "Rook slides down to Queen's square" },
      { pieceId: "w4", from: "A3", to: "D3", note: "Queen slides right to Pawn's square" },
      { pieceId: "w5", from: "D3", to: "E4", note: "Pawn captures diagonally onto Knight" },
      { pieceId: "w6", from: "E4", to: "F6", note: "Knight jumps to Bishop's square" },
      { pieceId: "w7", from: "F6", to: "H8", note: "Bishop captures the Black King" },
    ],
    solutionSteps: [
      {
        title: "Step 1 — Pawn captures onto Bishop",
        description: "The Pawn on B4 captures diagonally to C5, landing on the Bishop's square. The Pawn disappears.",
        visibleIds: ["w1","w2","w3","w4","w5","w6","w7","bk"],
        highlights: ["B4", "C5"],
      },
      {
        title: "Step 2 — Bishop slides to Rook",
        description: "The Bishop on C5 slides diagonally to A7, landing on the Rook's square. The Bishop disappears.",
        visibleIds: ["w2","w3","w4","w5","w6","w7","bk"],
        highlights: ["C5", "B6", "A7"],
      },
      {
        title: "Step 3 — Rook slides to Queen",
        description: "The Rook on A7 slides straight down to A3, landing on the Queen's square. The Rook disappears.",
        visibleIds: ["w3","w4","w5","w6","w7","bk"],
        highlights: ["A7", "A3"],
      },
      {
        title: "Step 4 — Queen slides to Pawn",
        description: "The Queen on A3 slides right to D3, landing on the Pawn's square. The Queen disappears.",
        visibleIds: ["w4","w5","w6","w7","bk"],
        highlights: ["A3", "D3"],
      },
      {
        title: "Step 5 — Pawn captures onto Knight",
        description: "The Pawn on D3 captures diagonally to E4, landing on the Knight's square. The Pawn disappears.",
        visibleIds: ["w5","w6","w7","bk"],
        highlights: ["D3", "E4"],
      },
      {
        title: "Step 6 — Knight jumps to Bishop",
        description: "The Knight on E4 jumps to F6, landing on the Bishop's square. The Knight disappears.",
        visibleIds: ["w6","w7","bk"],
        highlights: ["E4", "F6"],
      },
      {
        title: "Step 7 — Bishop captures the King!",
        description: "The Bishop on F6 moves diagonally to H8, capturing the Black King. Puzzle solved!",
        visibleIds: ["w7","bk"],
        highlights: ["F6", "H8"],
        isFinal: true,
      },
    ],
  },

  // ── Puzzle 5 — 8 pieces ────────────────────────────────────────────────────
  {
    id: "p8a",
    label: "Puzzle 5",
    pieceCount: 8,
    blackKing: "H8",
    pieces: [
      { id: "w1", type: "knight", color: "white", square: "A2", label: "Knight" },
      { id: "w2", type: "pawn",   color: "white", square: "B4", label: "Pawn"   },
      { id: "w3", type: "bishop", color: "white", square: "C5", label: "Bishop" },
      { id: "w4", type: "rook",   color: "white", square: "A7", label: "Rook"   },
      { id: "w5", type: "queen",  color: "white", square: "A3", label: "Queen"  },
      { id: "w6", type: "pawn",   color: "white", square: "D3", label: "Pawn"   },
      { id: "w7", type: "knight", color: "white", square: "E4", label: "Knight" },
      { id: "w8", type: "bishop", color: "white", square: "F6", label: "Bishop" },
      { id: "bk", type: "king",   color: "black", square: "H8", label: "King"   },
    ],
    chain: [
      { pieceId: "w1", from: "A2", to: "B4", note: "Knight jumps to Pawn's square" },
      { pieceId: "w2", from: "B4", to: "C5", note: "Pawn captures diagonally onto Bishop" },
      { pieceId: "w3", from: "C5", to: "A7", note: "Bishop slides diagonally to Rook's square" },
      { pieceId: "w4", from: "A7", to: "A3", note: "Rook slides down to Queen's square" },
      { pieceId: "w5", from: "A3", to: "D3", note: "Queen slides right to Pawn's square" },
      { pieceId: "w6", from: "D3", to: "E4", note: "Pawn captures diagonally onto Knight" },
      { pieceId: "w7", from: "E4", to: "F6", note: "Knight jumps to Bishop's square" },
      { pieceId: "w8", from: "F6", to: "H8", note: "Bishop captures the Black King" },
    ],
    solutionSteps: [
      {
        title: "Step 1 — Knight jumps to Pawn",
        description: "The Knight on A2 jumps to B4, landing on the Pawn's square. The Knight disappears.",
        visibleIds: ["w1","w2","w3","w4","w5","w6","w7","w8","bk"],
        highlights: ["A2", "B4"],
      },
      {
        title: "Step 2 — Pawn captures onto Bishop",
        description: "The Pawn on B4 captures diagonally to C5, landing on the Bishop's square. The Pawn disappears.",
        visibleIds: ["w2","w3","w4","w5","w6","w7","w8","bk"],
        highlights: ["B4", "C5"],
      },
      {
        title: "Step 3 — Bishop slides to Rook",
        description: "The Bishop on C5 slides diagonally to A7, landing on the Rook's square. The Bishop disappears.",
        visibleIds: ["w3","w4","w5","w6","w7","w8","bk"],
        highlights: ["C5", "B6", "A7"],
      },
      {
        title: "Step 4 — Rook slides to Queen",
        description: "The Rook on A7 slides straight down to A3, landing on the Queen's square. The Rook disappears.",
        visibleIds: ["w4","w5","w6","w7","w8","bk"],
        highlights: ["A7", "A3"],
      },
      {
        title: "Step 5 — Queen slides to Pawn",
        description: "The Queen on A3 slides right to D3, landing on the Pawn's square. The Queen disappears.",
        visibleIds: ["w5","w6","w7","w8","bk"],
        highlights: ["A3", "D3"],
      },
      {
        title: "Step 6 — Pawn captures onto Knight",
        description: "The Pawn on D3 captures diagonally to E4, landing on the Knight's square. The Pawn disappears.",
        visibleIds: ["w6","w7","w8","bk"],
        highlights: ["D3", "E4"],
      },
      {
        title: "Step 7 — Knight jumps to Bishop",
        description: "The Knight on E4 jumps to F6, landing on the Bishop's square. The Knight disappears.",
        visibleIds: ["w7","w8","bk"],
        highlights: ["E4", "F6"],
      },
      {
        title: "Step 8 — Bishop captures the King!",
        description: "The Bishop on F6 moves diagonally to H8, capturing the Black King. Puzzle solved!",
        visibleIds: ["w8","bk"],
        highlights: ["F6", "H8"],
        isFinal: true,
      },
    ],
  },

];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get all puzzles with a given piece count */
export function getPuzzlesByCount(count) {
  return PUZZLES.filter((p) => p.pieceCount === count);
}

/** Get all available piece counts */
export const AVAILABLE_COUNTS = [...new Set(PUZZLES.map((p) => p.pieceCount))].sort((a, b) => a - b);

/** Pick a random puzzle from those matching a piece count */
export function getRandomPuzzle(count) {
  const matches = getPuzzlesByCount(count);
  if (!matches.length) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}