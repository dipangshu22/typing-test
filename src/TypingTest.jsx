import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { PARAGRAPHS, PATTERNS, TIMES, addPunctuation, stripPunctuation } from "./textData.js";

const formatTime = sec => {
  const s = Math.ceil(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function Segmented({ options, value, onChange }) {
  return (
    <div className="seg" role="group">
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TypingTest() {
  // setup
  const [mode, setMode] = useState("paragraph"); // "paragraph" | "words"
  const [paraChoice, setParaChoice] = useState("random");
  const [pattern, setPattern] = useState("common");
  const [duration, setDuration] = useState(60);
  const [punct, setPunct] = useState(true);

  // test state
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "running" | "done"
  const [startAt, setStartAt] = useState(0);
  const [now, setNow] = useState(0);
  const [focused, setFocused] = useState(false);

  const nextParaRef = useRef(0);
  const poolRef = useRef(PARAGRAPHS);
  const inputRef = useRef(null);
  const viewRef = useRef(null);
  const cursorRef = useRef(null);

  // Apply the punctuation setting to paragraphs and to word patterns that support it
  const shapeParagraph = useCallback(t => (punct ? t : stripPunctuation(t)), [punct]);
  const shapeWords = useCallback(
    t => (punct && PATTERNS[pattern].punctuable ? addPunctuation(t) : t),
    [punct, pattern]
  );

  const makeInitial = useCallback(() => {
    if (mode === "paragraph") {
      // Which pool to draw from and continue with
      const pool = paraChoice === "random-long" ? PARAGRAPHS.filter(p => p.long)
        : paraChoice === "random-short" ? PARAGRAPHS.filter(p => !p.long)
        : PARAGRAPHS;
      poolRef.current = pool;
      const start = paraChoice.startsWith("random")
        ? Math.floor(Math.random() * pool.length)
        : Number(paraChoice);
      nextParaRef.current = start + 1;
      return shapeParagraph(pool[start].text);
    }
    return shapeWords(PATTERNS[pattern].gen(90));
  }, [mode, paraChoice, pattern, shapeParagraph, shapeWords]);

  const makeMore = useCallback(() => {
    if (mode === "paragraph") {
      const pool = poolRef.current;
      const p = pool[nextParaRef.current % pool.length];
      nextParaRef.current += 1;
      return shapeParagraph(p.text);
    }
    return shapeWords(PATTERNS[pattern].gen(40));
  }, [mode, pattern, shapeParagraph, shapeWords]);

  const reset = useCallback(keepText => {
    if (!keepText) setText(makeInitial());
    setTyped("");
    setStatus("idle");
    setStartAt(0);
    setNow(0);
    if (viewRef.current) viewRef.current.scrollTop = 0;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [makeInitial]);

  // New text whenever the setup changes
  useEffect(() => {
    reset(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, paraChoice, pattern, duration, punct]);

  // Keep the text ahead of the typist
  useEffect(() => {
    if (text && typed.length > text.length - 160) setText(t => t + " " + makeMore());
  }, [typed.length, text, makeMore]);

  // Countdown
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if ((t - startAt) / 1000 >= duration) {
        setStatus("done");
        inputRef.current?.blur();
      }
    }, 100);
    return () => clearInterval(id);
  }, [status, startAt, duration]);

  // Keep the cursor on the second visible line
  useLayoutEffect(() => {
    const c = cursorRef.current;
    const v = viewRef.current;
    if (!c || !v) return;
    const lineH = c.offsetHeight || 30;
    v.scrollTop = Math.max(0, c.offsetTop - lineH);
  }, [typed.length, text]);

  // Tab = new text, Esc = restart same text
  useEffect(() => {
    const onKey = e => {
      if (e.key === "Tab" && !e.shiftKey && (document.activeElement === inputRef.current || status === "done")) {
        e.preventDefault();
        reset(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        reset(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset, status]);

  // Block Backspace, Delete, undo and caret movement
  const BLOCKED_KEYS = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"];
  function handleKeyDown(e) {
    if (BLOCKED_KEYS.includes(e.key)) { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && ["z", "y", "x", "a"].includes(e.key.toLowerCase())) e.preventDefault();
  }

  // Mobile keyboards don't always send a Backspace key event, so also stop deletions at the input level
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onBeforeInput = e => {
      if (e.inputType && (e.inputType.startsWith("delete") || e.inputType.startsWith("history"))) e.preventDefault();
    };
    el.addEventListener("beforeinput", onBeforeInput);
    return () => el.removeEventListener("beforeinput", onBeforeInput);
  }, []);

  // Keep the caret pinned to the end
  function pinCaret(e) {
    const len = e.target.value.length;
    if (e.target.selectionStart !== len || e.target.selectionEnd !== len) e.target.setSelectionRange(len, len);
  }

  function handleInput(e) {
    if (status === "done") return;
    const value = e.target.value.replace(/[\r\n]/g, "");
    // No going back: reject anything that deletes or edits earlier characters
    if (value.length <= typed.length || !value.startsWith(typed)) {
      e.target.value = typed;
      return;
    }
    if (status === "idle" && value.length > 0) {
      const t = Date.now();
      setStartAt(t);
      setNow(t);
      setStatus("running");
    }
    setTyped(value);
  }

  const elapsed = status === "idle" ? 0 : Math.min(duration, (now - startAt) / 1000);
  const remaining = Math.max(0, duration - elapsed);

  // Split target into words, keeping each word's global character offset
  const words = useMemo(() => {
    const out = [];
    const re = /\S+\s*/g;
    let m;
    while ((m = re.exec(text))) out.push({ s: m[0], start: m.index });
    return out;
  }, [text]);

  const results = useMemo(() => {
    if (status !== "done") return null;
    const minutes = duration / 60;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;

    const mistakes = [];
    for (const w of words) {
      if (w.start >= typed.length) break;
      const word = w.s.trimEnd();
      const end = w.start + word.length;
      if (end > typed.length) break; // last word was left unfinished
      const got = typed.slice(w.start, end);
      if (got !== word) mistakes.push({ exp: word, got });
    }

    return {
      wpm: Math.round(correct / 5 / minutes),
      raw: Math.round(typed.length / 5 / minutes),
      accuracy: typed.length ? Math.round((correct / typed.length) * 1000) / 10 : 0,
      correct,
      total: typed.length,
      wrong: typed.length - correct,
      mistakes,
    };
  }, [status, typed, text, words, duration]);

  const verdict = !results ? "" :
    results.total === 0 ? "Nothing was typed this round. Click the text box and start typing to begin the next one." :
    results.accuracy >= 97 ? "Very clean. You're typing accurately without looking, so speed is the thing to push next." :
    results.accuracy >= 90 ? "Solid. A few slips crept in; slowing down slightly usually raises net speed when you can't see your mistakes." :
    "Lots of errors went unnoticed. Try a slower pace or a home row drill to build position memory.";

  return (
    <main className="wrap">
      <h1>Blind typing test for Anurag!</h1>
      <p className="lede">You see the text you need to type, never the keys you press. Your accuracy shows up only at the end.</p>

      <div className="controls">
        <div className="group">
          <span>Text</span>
          <Segmented
            options={[{ value: "paragraph", label: "Paragraphs" }, { value: "words", label: "Word patterns" }]}
            value={mode}
            onChange={setMode}
          />
        </div>

        {mode === "paragraph" ? (
          <label className="group">
            <span>Paragraph</span>
            <select value={paraChoice} onChange={e => setParaChoice(e.target.value)}>
              <option value="random">Random (any length)</option>
              <option value="random-short">Random short</option>
              <option value="random-long">Random long</option>
              <optgroup label="Short paragraphs">
                {PARAGRAPHS.map((p, i) => !p.long && <option key={i} value={String(i)}>{p.title}</option>)}
              </optgroup>
              <optgroup label="Long paragraphs">
                {PARAGRAPHS.map((p, i) => p.long && <option key={i} value={String(i)}>{p.title}</option>)}
              </optgroup>
            </select>
          </label>
        ) : (
          <label className="group">
            <span>Pattern</span>
            <select value={pattern} onChange={e => setPattern(e.target.value)}>
              {Object.entries(PATTERNS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </label>
        )}

        {(mode === "paragraph" || PATTERNS[pattern].punctuable) && (
          <div className="group">
            <span>Punctuation</span>
            <Segmented
              options={[{ value: true, label: "On" }, { value: false, label: "Off" }]}
              value={punct}
              onChange={setPunct}
            />
          </div>
        )}

        <div className="group">
          <span>Time</span>
          <Segmented
            options={TIMES.map(t => ({ value: t, label: t < 60 ? `${t}s` : `${t / 60} min` }))}
            value={duration}
            onChange={setDuration}
          />
        </div>
      </div>

      <div className="statusbar">
        <div className={"clock" + (status === "running" ? " running" : "")}>{formatTime(remaining)}</div>
        <div className="hint">
          {status === "idle" && "The timer starts on your first key. Backspace is off. "}
          {status === "running" && "Keep going, you won't see your keys. "}
          <kbd>Tab</kbd> new text &nbsp;<kbd>Esc</kbd> restart
        </div>
      </div>

      <div className={"stage" + (status === "running" ? " typing" : "")} onClick={() => inputRef.current?.focus()}>
        <div className="viewport" ref={viewRef} aria-label="Text to type">
          {words.map((w, wi) => (
            <span className="word" key={wi}>
              {Array.from(w.s).map((ch, ci) => {
                const i = w.start + ci;
                const cls = i < typed.length ? "ch done" : i === typed.length ? "ch cur" : "ch";
                return (
                  <span key={ci} className={cls} ref={i === typed.length ? cursorRef : null}>{ch}</span>
                );
              })}
            </span>
          ))}
        </div>

        <textarea
          ref={inputRef}
          className="ghost"
          aria-label="Typing input (hidden)"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={typed}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onSelect={pinCaret}
          onPaste={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={status === "done"}
        />

        {!focused && status !== "done" && (
          <div className="veil">
            {status === "running" ? "Paused focus. Click here to keep typing." : "Click here, then start typing"}
          </div>
        )}
      </div>

      {results && (
        <section className="results" aria-live="polite">
          <div className="headline">
            <div className="big"><b>{results.wpm}</b><small>words per minute</small></div>
            <div className="big"><b>{results.accuracy}%</b><small>accuracy</small></div>
          </div>

          <div className="minor">
            <div><span>Raw speed</span><strong>{results.raw} wpm</strong></div>
            <div><span>Correct characters</span><strong>{results.correct} / {results.total}</strong></div>
            <div><span>Wrong characters</span><strong>{results.wrong}</strong></div>
            <div><span>Time</span><strong>{formatTime(duration)}</strong></div>
          </div>

          <p className="verdict">{verdict}</p>

          <h2>What you actually typed</h2>
          <div className="review">
            {results.total === 0 ? (
              <span className="none">Nothing typed.</span>
            ) : (
              Array.from(typed).map((c, i) =>
                c === text[i] ? (
                  <span key={i}>{c}</span>
                ) : (
                  <span key={i} className="bad" title={`Expected ${JSON.stringify(text[i])}`}>{c === " " ? "␣" : c}</span>
                )
              )
            )}
          </div>

          <h2>Words with mistakes</h2>
          {results.mistakes.length === 0 ? (
            <p className="none">No mistaken words.</p>
          ) : (
            <ul className="mistakes">
              {results.mistakes.slice(0, 30).map((m, i) => (
                <li key={i}>
                  <span className="exp">{m.exp}</span>{"  "}
                  <span className="got">{m.got.replace(/ /g, "␣") || "(skipped)"}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="actions">
            <button className="btn" type="button" onClick={() => reset(false)}>New text</button>
            <button className="btn alt" type="button" onClick={() => reset(true)}>Retry same text</button>
          </div>
        </section>
      )}
    </main>
  );
}
