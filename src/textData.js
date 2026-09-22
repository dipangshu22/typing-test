export const PARAGRAPHS = [
  { title: "The river ferry", text: "The ferry left at six every morning, whether or not anyone was aboard. Fishermen said the captain kept time by the smell of the tea stalls opening on the bank. By the time the fog lifted, the boat was already halfway across, cutting a pale line through the brown water while gulls argued over what the nets had missed." },
  { title: "Small bugs", text: "Most bugs are not mysteries; they are small misunderstandings that grew quietly. A variable holds a value you did not expect, a function runs twice instead of once, or a date is read in the wrong time zone. The fix is rarely clever. It usually begins with reading the error message slowly and asking what the program actually did, not what you hoped it would do." },
  { title: "Tea gardens", text: "Rows of tea bushes roll over the low hills like a green sea frozen mid-wave. Pickers move between them with baskets on their backs, choosing only the top two leaves and a bud. It is careful work, done by hand, and the rhythm of it has barely changed in a hundred years, even as the machines in the factory below grow louder." },
  { title: "First monsoon rain", text: "The first heavy rain of the season arrives without much warning. One moment the air is thick and still; the next, the street is a shallow river and every roof is drumming. Children run out to stand in it, shopkeepers drag their goods under awnings, and for a few minutes the whole neighbourhood forgets whatever it was worried about." },
  { title: "The front desk", text: "A good front desk runs on small promises kept. The room is ready when the guest was told it would be, the booking from last night actually appears in the system, and the late checkout someone asked for at breakfast is still remembered by the afternoon shift. Guests rarely notice any of this until one piece goes missing." },
  { title: "Old starlight", text: "Light from the nearest star beyond the sun takes a little over four years to reach us. When you look at it, you are seeing a message that left before you last changed your phone. The farthest objects we can observe are so distant that their light began travelling before the Earth itself had formed." },
  { title: "Showing up", text: "Practice is less about effort on a single day than about showing up on ordinary ones. Ten focused minutes every evening will carry you further than a long weekend of determination followed by a month of rest. The trick is to make the first step so small that skipping it feels more awkward than doing it." },
  { title: "Grandfather's radio", text: "My grandfather owned a radio the size of a suitcase, with a dial that glowed orange when it warmed up. He would turn the knob slowly, past crackling stations in languages none of us spoke, until he found the evening news. Then he would sit back, close his eyes, and listen as if the voice were in the room." },
];

const COMMON = ("the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line").split(" ");
const HOME = "as ask add all ash dad fad gas had has lad lag sad hall fall gall lass flask flash glass salad alas shall dash gash lash half jag hag sag slag slash hash sash skald".split(" ");
const TOP = "we were wet quiet quit quote rope ripe route tire tower power poet pour prey pretty type typo your you yet toy trip writer put pure pew wiper outer tier query rote pier".split(" ");
const DRILLS = "fjf jfj dkd kdk sls lsl a;a ;a; ghg hgh fjdk skal ruru eiei wowo qpqp tyty vmvm bnbn cxcx fj dk sl a; gh ty vn".split(" ");
const PUNCT_WORDS = "yes no well wait really okay today maybe however first then also still after before here there because although".split(" ");

function pick(list, prev) {
  let w;
  do { w = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && w === prev);
  return w;
}
function fromList(list, n) {
  const out = [];
  let prev = null;
  for (let i = 0; i < n; i++) { prev = pick(list, prev); out.push(prev); }
  return out.join(" ");
}
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function numbers(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = rint(0, 5);
    out.push(
      k === 0 ? String(rint(1, 99)) :
      k === 1 ? String(rint(100, 9999)) :
      k === 2 ? `${rint(1, 99)}.${rint(0, 9)}` :
      k === 3 ? `${rint(1, 12)}:${String(rint(0, 59)).padStart(2, "0")}` :
      k === 4 ? `${rint(1, 99)},${String(rint(0, 999)).padStart(3, "0")}` :
      String(rint(1990, 2030))
    );
  }
  return out.join(" ");
}

function punctuation(n) {
  const out = [];
  let prev = null;
  for (let i = 0; i < n; i++) {
    prev = pick(i % 2 ? PUNCT_WORDS : COMMON, prev);
    const k = rint(0, 7);
    out.push(
      k === 0 ? prev + "," : k === 1 ? prev + "." : k === 2 ? prev + "?" : k === 3 ? prev + "!" :
      k === 4 ? `(${prev})` : k === 5 ? `"${prev}"` : k === 6 ? prev + ";" : prev + ":"
    );
  }
  return out.join(" ");
}

export const PATTERNS = {
  common:   { label: "Common words",   gen: n => fromList(COMMON, n) },
  home:     { label: "Home row words", gen: n => fromList(HOME, n) },
  top:      { label: "Top row words",  gen: n => fromList(TOP, n) },
  drills:   { label: "Finger drills",  gen: n => fromList(DRILLS, n) },
  numbers:  { label: "Numbers",        gen: numbers },
  punct:    { label: "Punctuation",    gen: punctuation },
  capitals: { label: "Capital letters", gen: n => fromList(COMMON, n).split(" ").map((w, i) => (i % 2 === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ") },
};

export const TIMES = [15, 30, 60, 120];
