/**
 * Bundle rules — THE CARDS LANE.
 *
 * ✅ OWNED BY THE CARDS CHAT. The city chat does not edit this file.
 *
 * Each rule is [name, RegExp, replacement]. The build asserts every pattern
 * matches EXACTLY ONCE and refuses to write a partial patch.
 */
export const RULES = [
  /* Hand the cards home the journey data.

     The cards need per-scenario facts the rail never writes into the DOM —
     estimated_minutes, difficulty, the outcome band and XP. Rather than scrape
     a hover card sixteen times, expose the very fixture the rail reads, so the
     two can never disagree about the journey.

     Anchored on the CALL SITE rather than the declaration: the roadmap is a
     multi-thousand-character object literal, and a rule that has to find its
     closing brace is a rule waiting to break. A comma expression here is one
     self-contained edit. Assignment only — nothing renders differently when
     the variant is off. */
  [
    'exposeRoadmap',
    // There are THREE call sites; this anchors the rail's own, via the
    // useJourneySelection() that immediately follows only that one. (The
    // build's match-exactly-once assertion is what caught the ambiguity.)
    /buildJourneyTrack\(businessAnalystRoadmap\)(,[A-Za-z_$][\w$]*=useJourneySelection\(\))/,
    'buildJourneyTrack((typeof window<"u"&&(window.__NX_ROADMAP=businessAnalystRoadmap),businessAnalystRoadmap))$1',
  ],
];
