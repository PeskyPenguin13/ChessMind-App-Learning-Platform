import React, { useState } from "react";
import { PUZZLES, AVAILABLE_COUNTS, getRandomPuzzle } from "./puzzles.js";

// ─── Board constants ──────────────────────────────────────────────────────────

const FILES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const GLYPH = {
  pawn:   { white: "♙", black: "♟" },
  knight: { white: "♘", black: "♞" },
  bishop: { white: "♗", black: "♝" },
  rook:   { white: "♖", black: "♜" },
  queen:  { white: "♕", black: "♛" },
  king:   { white: "♔", black: "♚" },
};

// ─── Chess helpers ────────────────────────────────────────────────────────────

function sqToColRow(sq) {
  return { col: FILES.indexOf(sq[0]), row: Number(sq[1]) - 1 };
}

function colRowToSq(col, row) {
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return FILES[col] + (row + 1);
}

function pieceAt(sq, list) {
  return list.find((p) => p.square === sq) ?? null;
}

// Sliding moves — white pieces are transparent (puzzle rule), stops at black piece
function sliding(piece, list, dirs) {
  const result = [];
  const { col, row } = sqToColRow(piece.square);
  for (const [dc, dr] of dirs) {
    let c = col + dc, r = row + dr;
    while (c >= 0 && c < 8 && r >= 0 && r < 8) {
      const sq = colRowToSq(c, r);
      const occ = pieceAt(sq, list);
      result.push(sq);
      if (occ && occ.color === "black") break;
      c += dc; r += dr;
    }
  }
  return result;
}

function legalMoves(piece, list) {
  const { col, row } = sqToColRow(piece.square);
  if (piece.type === "pawn") {
    const moves = [];
    const fwd = colRowToSq(col, row + 1);
    if (fwd) {
      moves.push(fwd);
      const fwd2 = colRowToSq(col, row + 2);
      if (row === 1 && fwd2) moves.push(fwd2);
    }
    for (const dc of [-1, 1]) {
      const cap = colRowToSq(col + dc, row + 1);
      if (cap && pieceAt(cap, list)) moves.push(cap);
    }
    return moves;
  }
  if (piece.type === "knight") {
    return [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]
      .map(([dc, dr]) => colRowToSq(col + dc, row + dr))
      .filter(Boolean);
  }
  if (piece.type === "bishop") return sliding(piece, list, [[1,1],[1,-1],[-1,1],[-1,-1]]);
  if (piece.type === "rook")   return sliding(piece, list, [[1,0],[-1,0],[0,1],[0,-1]]);
  if (piece.type === "queen")  return sliding(piece, list, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  return [];
}

// ─── Shared Board component ───────────────────────────────────────────────────

function Board({ pieces, selSquare, hlSquares, finalSquares, onClick }) {
  return (
    <div className="board-wrap">
      <div className="board-grid">
        <div className="corner" />
        {FILES.map((f) => <div key={f} className="file-label">{f}</div>)}
        {RANKS.map((rank, ri) => (
          <React.Fragment key={rank}>
            <div className="rank-label">{rank}</div>
            {FILES.map((file, ci) => {
              const sq = file + rank;
              const piece = pieceAt(sq, pieces);
              const dark = (ri + ci) % 2 === 1;
              return (
                <button
                  key={sq}
                  className={[
                    "sq",
                    dark ? "dark" : "light",
                    selSquare === sq          ? "sel"   : "",
                    hlSquares.includes(sq)    ? "hl"    : "",
                    finalSquares.includes(sq) ? "final" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => onClick(sq)}
                  aria-label={sq}
                >
                  <span className="sq-name">{sq}</span>
                  {piece
                    ? <span className={`glyph ${piece.color}`}>{GLYPH[piece.type][piece.color]}</span>
                    : <span className="dot" />}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Play Mode ────────────────────────────────────────────────────────────────

function PlayMode({ puzzle }) {
  const whiteIds = puzzle.pieces.filter((p) => p.color === "white").map((p) => p.id);

  const [pieces, setPieces]   = useState(() => puzzle.pieces.map((p) => ({ ...p })));
  const [selId,  setSelId]    = useState(null);
  const [hlMoves, setHlMoves] = useState([]);
  const [history, setHistory] = useState([]);
  const [status,  setStatus]  = useState("Click the first white piece to start the chain.");
  const [won, setWon]         = useState(false);

  // Which white piece should be moved next (index into puzzle.chain)
  const [chainStep, setChainStep] = useState(0);

  const usedCount = whiteIds.filter((id) => !pieces.some((p) => p.id === id)).length;
  const nextInChain = puzzle.chain[chainStep]; // { pieceId, from, to, note }

  const tracker = puzzle.pieces
    .filter((p) => p.color === "white")
    .map((base) => {
      const live = pieces.find((p) => p.id === base.id);
      return { id: base.id, label: base.label, type: base.type, onBoard: !!live, square: live?.square ?? "—" };
    });

  function handleClick(sq) {
    if (won) return;

    // ── Priority 1: execute move if a piece is selected and this is a highlighted square
    if (selId !== null && hlMoves.includes(sq)) {
      const moving = pieces.find((p) => p.id === selId);
      if (!moving) { setSelId(null); setHlMoves([]); return; }

      const target = pieceAt(sq, pieces);
      const freshUsed = whiteIds.filter((id) => !pieces.some((p) => p.id === id)).length;

      // Must land on an occupied square (chain rule)
      if (!target) {
        setStatus("Invalid — you must land on another piece's square to continue the chain.");
        return;
      }

      const isKingCapture = target.id === "bk";

      if (isKingCapture) {
        if (freshUsed !== whiteIds.length - 1) {
          const remaining = pieces.filter((p) => p.color === "white" && p.id !== moving.id).map((p) => p.label);
          setStatus(`Not yet! Use these pieces first: ${remaining.join(", ")}`);
          setSelId(null); setHlMoves([]);
          return;
        }
        setPieces([]);
        setHistory((h) => [...h, `${moving.label} ${moving.square} × ${sq} — FINAL CAPTURE 🎉`]);
        setSelId(null); setHlMoves([]);
        setWon(true);
        setStatus("🎉 Black King captured! Puzzle solved!");
        return;
      }

      // Normal chain move: moving piece disappears, target stays
      const movingId    = moving.id;
      const movingLabel = moving.label;
      const from        = moving.square;
      setPieces((prev) => prev.filter((p) => p.id !== movingId));
      setHistory((h) => [...h, `${movingLabel}: ${from} → ${sq} (onto ${target.label})`]);
      setChainStep((s) => s + 1);
      setSelId(null); setHlMoves([]);
      setStatus(`${movingLabel} used. Now move the ${target.label} at ${sq}.`);
      return;
    }

    // ── Priority 2: select a white piece
    const clicked = pieceAt(sq, pieces);
    if (clicked?.color === "white") {
      const allMoves = legalMoves(clicked, pieces);
      // Only show squares that have a piece on them (chain rule)
      const validMoves = allMoves.filter((m) => pieceAt(m, pieces) !== null);
      setSelId(clicked.id);
      setHlMoves(validMoves);
      setStatus(
        validMoves.length
          ? `${clicked.label} at ${clicked.square} — select a highlighted square to continue the chain.`
          : `${clicked.label} at ${clicked.square} cannot reach any piece right now.`
      );
      return;
    }

    setStatus(selId ? "That square is empty — land on another piece to chain." : "Click a white piece to start.");
  }

  const selPiece = pieces.find((p) => p.id === selId);

  return (
    <div className="layout">
      <main className="board-panel">
        <div className="status-bar">
          <div className="status-bar-row1">
            <span className="status-chip">Mode: <strong>Play</strong></span>
            <span className="status-chip">Puzzle: <strong>{puzzle.label}</strong></span>
            <span className="status-chip">Pieces used: <strong>{usedCount} / {whiteIds.length}</strong></span>
            {nextInChain && !won && (
              <span className="status-chip hint">
                Next: <strong>{pieces.find(p => p.id === nextInChain.pieceId)?.label ?? "?"}</strong> → {nextInChain.to}
              </span>
            )}
          </div>
          <div className={`status-msg${won ? " won" : ""}`}>{status}</div>
        </div>

        <Board
          pieces={pieces}
          selSquare={selPiece?.square ?? null}
          hlSquares={hlMoves}
          finalSquares={[]}
          onClick={handleClick}
        />

        {won && (
          <div className="win-banner">
            ♔ Puzzle Solved!
          </div>
        )}
      </main>

      <aside className="sidebar">
        <section className="panel">
          <h2>Rules</h2>
          <ol className="rule-list">
            <li>Click a white piece to select it.</li>
            <li>It must land on another white piece's square.</li>
            <li>The moved piece <strong>disappears</strong> — the target piece stays.</li>
            <li>Continue the chain until one piece remains.</li>
            <li>The last piece must capture the Black King to win.</li>
          </ol>
        </section>

        <section className="panel">
          <h2>White Pieces</h2>
          <div className="piece-list">
            {tracker.map((item) => (
              <div key={item.id} className={`piece-card ${item.onBoard ? "active" : "used"}`}>
                <span className="pc-glyph">{GLYPH[item.type].white}</span>
                <div className="pc-info">
                  <div className="pc-name">{item.label}</div>
                  <div className="pc-sub">{item.onBoard ? `On board · ${item.square}` : "Used & removed"}</div>
                </div>
                <span className={`pc-badge${item.onBoard ? "" : " done"}`}>
                  {item.onBoard ? "Active" : "✓ Used"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Move History</h2>
          {history.length === 0
            ? <p className="muted">No moves yet.</p>
            : <ol className="history-list">{history.map((m, i) => <li key={i}>{m}</li>)}</ol>}
        </section>
      </aside>
    </div>
  );
}

// ─── Solution Mode ────────────────────────────────────────────────────────────

function SolutionMode({ puzzle }) {
  const [step, setStep] = useState(0);
  const current = puzzle.solutionSteps[step];
  const boardPieces = puzzle.pieces.filter((p) => current.visibleIds.includes(p.id));

  return (
    <div className="layout">
      <main className="board-panel">
        <div className="status-bar">
          <div className="status-bar-row1">
            <span className="status-chip">Mode: <strong>Solution</strong></span>
            <span className="status-chip">Puzzle: <strong>{puzzle.label}</strong></span>
            <span className="status-chip">Step: <strong>{step + 1} / {puzzle.solutionSteps.length}</strong></span>
          </div>
        </div>
        <Board
          pieces={boardPieces}
          selSquare={null}
          hlSquares={current.highlights}
          finalSquares={current.isFinal ? [puzzle.blackKing] : []}
          onClick={() => {}}
        />
      </main>

      <aside className="sidebar">
        <section className="panel">
          <h2>Solution Guide</h2>
          <div className="sol-step-card">
            <div className="sol-step-label">Step {step + 1} of {puzzle.solutionSteps.length}</div>
            <div className="sol-step-title">{current.title}</div>
            <p className="sol-step-desc">{current.description}</p>
          </div>
          <div className="sol-nav">
            <button className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              ← Prev
            </button>
            <button className="btn btn-active" onClick={() => setStep((s) => Math.min(puzzle.solutionSteps.length - 1, s + 1))} disabled={step === puzzle.solutionSteps.length - 1}>
              Next →
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>All Steps</h2>
          <div className="step-list">
            {puzzle.solutionSteps.map((s, i) => (
              <button key={i} className={`step-item${i === step ? " active" : ""}`} onClick={() => setStep(i)}>
                <span className="step-num">{i + 1}</span>
                <span className="step-item-title">{s.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Chain Summary</h2>
          <div className="chain-list">
            {puzzle.chain.map((c, i) => {
              const base = puzzle.pieces.find((p) => p.id === c.pieceId);
              return (
                <div key={i} className="chain-item">
                  <span className="chain-num">{i + 1}</span>
                  <span className="chain-glyph">{GLYPH[base.type].white}</span>
                  <span className="chain-move">{c.from} → {c.to}</span>
                  {i < puzzle.chain.length - 1 && <span className="chain-arrow">↓</span>}
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}

// ─── Lobby (puzzle selector) ──────────────────────────────────────────────────

function Lobby({ onStart }) {
  const [selectedCount, setSelectedCount] = useState(AVAILABLE_COUNTS[0]);

  function handleStart() {
    const puzzle = getRandomPuzzle(selectedCount);
    if (puzzle) onStart(puzzle);
  }

  // Group puzzles by count for the preview table
  const grouped = AVAILABLE_COUNTS.map((count) => ({
    count,
    puzzles: PUZZLES.filter((p) => p.pieceCount === count),
  }));

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h2>Select Puzzle Size</h2>
        <p className="muted">Choose how many white pieces you want in the chain.</p>

        <div className="count-selector">
          {AVAILABLE_COUNTS.map((count) => (
            <button
              key={count}
              className={`count-btn${selectedCount === count ? " active" : ""}`}
              onClick={() => setSelectedCount(count)}
            >
              <span className="count-num">{count}</span>
              <span className="count-label">pieces</span>
              <span className="count-avail">
                {PUZZLES.filter((p) => p.pieceCount === count).length} puzzle{PUZZLES.filter((p) => p.pieceCount === count).length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>

        <button className="btn btn-active start-btn" onClick={handleStart}>
          ♟ Start Random {selectedCount}-Piece Puzzle
        </button>

        <div className="puzzle-table-wrap">
          <h3>All Puzzles</h3>
          <table className="puzzle-table">
            <thead>
              <tr>
                <th>Pieces</th>
                <th>Label</th>
                <th>Chain</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {PUZZLES.map((puzzle) => (
                <tr key={puzzle.id} className={puzzle.pieceCount === selectedCount ? "highlighted-row" : ""}>
                  <td>{puzzle.pieceCount}</td>
                  <td>{puzzle.label}</td>
                  <td className="chain-preview">
                    {puzzle.chain.map((c) => {
                      const base = puzzle.pieces.find((p) => p.id === c.pieceId);
                      return (
                        <span key={c.pieceId} className="chain-glyph-sm" title={`${base.label}: ${c.from}→${c.to}`}>
                          {GLYPH[base.type].white}
                        </span>
                      );
                    })}
                    <span className="chain-glyph-sm">♚</span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => onStart(puzzle)}>
                      Play
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode,   setMode]   = useState("lobby"); // "lobby" | "play" | "solution"
  const [puzzle, setPuzzle] = useState(null);

  function startPuzzle(p) {
    setPuzzle(p);
    setMode("play");
  }

  function goLobby() {
    setPuzzle(null);
    setMode("lobby");
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-title">
          <h1>♟ Chess Puzzle</h1>
          <p>Chain every white piece — end by capturing the Black King.</p>
        </div>
        <div className="topbar-actions">
          <button className={`btn ${mode === "lobby" ? "btn-active" : "btn-ghost"}`} onClick={goLobby}>
            ← Puzzles
          </button>
          {puzzle && (
            <>
              <button className={`btn ${mode === "play" ? "btn-active" : "btn-ghost"}`} onClick={() => setMode("play")}>
                Play
              </button>
              <button className={`btn ${mode === "solution" ? "btn-active" : "btn-ghost"}`} onClick={() => setMode("solution")}>
                Solution Guide
              </button>
              <button className="btn btn-ghost" onClick={() => startPuzzle(getRandomPuzzle(puzzle.pieceCount))}>
                New {puzzle.pieceCount}-piece
              </button>
            </>
          )}
        </div>
      </header>

      {mode === "lobby" && <Lobby onStart={startPuzzle} />}

      {/* Each mode gets a fresh key so state resets when puzzle changes */}
      {mode === "play"     && puzzle && <PlayMode     key={puzzle.id + "-play"}     puzzle={puzzle} />}
      {mode === "solution" && puzzle && <SolutionMode key={puzzle.id + "-solution"} puzzle={puzzle} />}
    </div>
  );
}