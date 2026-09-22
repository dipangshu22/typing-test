# Blind typing test

A React (Vite) typing test where you see the text to type but never what you type.
Results show net WPM, raw WPM, accuracy, keystroke accuracy, and a review of your mistakes.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build     # output goes to dist/
npm run preview   # serve the built files locally
```

## Files

- `src/TypingTest.jsx` – the component (timer, hidden input, scoring, results)
- `src/textData.js` – paragraphs, word patterns and time options; add your own here
- `src/TypingTest.css` – styles, with light and dark themes
- `standalone/blind-typing-test.html` – single-file version, no install needed

## Controls

- Tab: new text
- Esc: restart the same text
