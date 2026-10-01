// Early Letters prompt library (English).
// Hand-written prompts, picked by rules. Keys are stable: never reuse a key for new wording.
// Placeholders: {child}. No gendered pronouns for the child.

import type { Prompt } from '@scribe/core';
export type { Prompt, PromptBand, PromptKind } from '@scribe/core';
export const PROMPT_LIBRARY_VERSION = 2;

export const PROMPTS: Prompt[] = [
  // Openings, any age
  { key: "opening.any.remember", text: "What did {child} do today that you want to remember?", band: "any", kind: "opening" },
  { key: "opening.any.know", text: "What do you want {child} to know about today?", band: "any", kind: "opening" },
  { key: "opening.any.surprise", text: "What surprised you about {child} today?", band: "any", kind: "opening" },
  { key: "opening.any.laugh", text: "What made {child} laugh today? Describe the sound.", band: "any", kind: "opening" },
  { key: "opening.any.ordinary-minute", text: "Describe one ordinary minute from today, exactly as it was.", band: "any", kind: "opening" },
  { key: "opening.any.weather", text: "What was the weather like today, and where were you both?", band: "any", kind: "opening" },
  { key: "opening.any.smell", text: "What does {child} smell like right now? Try to put it in words.", band: "any", kind: "opening" },
  { key: "opening.any.window", text: "What can you see out the window tonight?", band: "any", kind: "opening" },
  { key: "opening.any.song", text: "What song was playing, or being sung, in your home today?", band: "any", kind: "opening" },
  { key: "opening.any.kitchen", text: "What was cooking in your kitchen today?", band: "any", kind: "opening" },

  // Openings, 0-3 months
  { key: "opening.0-3.night-sounds", text: "What does the middle of the night sound like right now?", band: "0-3", kind: "opening" },
  { key: "opening.0-3.looks-like", text: "Who does {child} look like today? Which feature gives it away?", band: "0-3", kind: "opening" },
  { key: "opening.0-3.calms", text: "What calms {child} down right now? A song, a sway, a sound?", band: "0-3", kind: "opening" },
  { key: "opening.0-3.hands", text: "Describe {child}'s hands. How small are they next to yours?", band: "0-3", kind: "opening" },
  { key: "opening.0-3.first-home", text: "Tell {child} about the first day home. What do you remember?", band: "0-3", kind: "opening" },
  { key: "opening.0-3.sleep-face", text: "What does {child}'s face do while sleeping?", band: "0-3", kind: "opening" },
  { key: "opening.0-3.name", text: "Tell {child} how the name was chosen.", band: "0-3", kind: "opening" },
  { key: "opening.0-3.visitors", text: "Who came to meet {child} this week? What did they say?", band: "0-3", kind: "opening" },

  // Openings, 4-6 months
  { key: "opening.4-6.grab", text: "What did {child} grab today and refuse to let go of?", band: "4-6", kind: "opening" },
  { key: "opening.4-6.sounds", text: "What new sound is {child} making? Try to say it the same way.", band: "4-6", kind: "opening" },
  { key: "opening.4-6.roll", text: "Where does {child} like to lie and look around?", band: "4-6", kind: "opening" },
  { key: "opening.4-6.taste", text: "What did {child} try to taste today?", band: "4-6", kind: "opening" },
  { key: "opening.4-6.smile-for", text: "Who gets the biggest smile from {child} these days?", band: "4-6", kind: "opening" },
  { key: "opening.4-6.bath", text: "What is bath time like right now?", band: "4-6", kind: "opening" },

  // Openings, 7-9 months
  { key: "opening.7-9.first-food", text: "What food did {child} try this week? What was the face?", band: "7-9", kind: "opening" },
  { key: "opening.7-9.sitting", text: "What does {child} see from sitting up that was out of reach before?", band: "7-9", kind: "opening" },
  { key: "opening.7-9.games", text: "What little game do you two play right now?", band: "7-9", kind: "opening" },
  { key: "opening.7-9.on-the-move", text: "Where did {child} try to go today?", band: "7-9", kind: "opening" },
  { key: "opening.7-9.favorite-thing", text: "What is {child}'s favorite thing in the house this week?", band: "7-9", kind: "opening" },
  { key: "opening.7-9.peekaboo", text: "Describe {child}'s face at the end of peekaboo.", band: "7-9", kind: "opening" },

  // Openings, 10-12 months
  { key: "opening.10-12.standing", text: "What does {child} hold on to when standing up?", band: "10-12", kind: "opening" },
  { key: "opening.10-12.first-words", text: "What sounds like a word from {child} lately? What do you think it means?", band: "10-12", kind: "opening" },
  { key: "opening.10-12.point", text: "What did {child} point at today?", band: "10-12", kind: "opening" },
  { key: "opening.10-12.wave", text: "Who does {child} wave to? Who waves back?", band: "10-12", kind: "opening" },
  { key: "opening.10-12.year-ago", text: "Where were you a year ago tonight? Tell {child}.", band: "10-12", kind: "opening" },
  { key: "opening.10-12.birthday-wish", text: "What do you hope year two feels like for {child}?", band: "10-12", kind: "opening" },

  // Openings, 13-18 months
  { key: "opening.13-18.steps", text: "Where is {child} walking to these days? What is the hurry?", band: "13-18", kind: "opening" },
  { key: "opening.13-18.words", text: "Which words does {child} say now? Say them the way {child} does.", band: "13-18", kind: "opening" },
  { key: "opening.13-18.no", text: "What did {child} say no to today, and how?", band: "13-18", kind: "opening" },
  { key: "opening.13-18.helper", text: "How did {child} try to help today?", band: "13-18", kind: "opening" },
  { key: "opening.13-18.outside", text: "What did {child} find outside today?", band: "13-18", kind: "opening" },
  { key: "opening.13-18.book", text: "Which book does {child} bring you again and again?", band: "13-18", kind: "opening" },

  // Openings, 19-24 months
  { key: "opening.19-24.sentence", text: "What is the funniest thing {child} said this week?", band: "19-24", kind: "opening" },
  { key: "opening.19-24.mine", text: "What does {child} call mine right now?", band: "19-24", kind: "opening" },
  { key: "opening.19-24.pretend", text: "What did {child} pretend to be or do today?", band: "19-24", kind: "opening" },
  { key: "opening.19-24.dance", text: "Describe how {child} dances.", band: "19-24", kind: "opening" },
  { key: "opening.19-24.bedtime", text: "What does bedtime look like right now, step by step?", band: "19-24", kind: "opening" },
  { key: "opening.19-24.friend", text: "Who is {child}'s favorite person to play with outside the family?", band: "19-24", kind: "opening" },

  // Openings, 25-36 months
  { key: "opening.25-36.why", text: "What did {child} ask you today? How did you answer?", band: "25-36", kind: "opening" },
  { key: "opening.25-36.own-story", text: "How does {child} tell the story of the day? Use {child}'s words.", band: "25-36", kind: "opening" },
  { key: "opening.25-36.big-feeling", text: "What gave {child} a big feeling today, happy or otherwise?", band: "25-36", kind: "opening" },
  { key: "opening.25-36.clothes", text: "What did {child} insist on wearing today?", band: "25-36", kind: "opening" },
  { key: "opening.25-36.mixed-words", text: "Which home-language words does {child} use the most?", band: "25-36", kind: "opening" },
  { key: "opening.25-36.kindness", text: "When was {child} kind to someone today?", band: "25-36", kind: "opening" },

  // Openings, 37-60 months
  { key: "opening.37-60.when-big", text: "What does {child} want to be when grown up, this week?", band: "37-60", kind: "opening" },
  { key: "opening.37-60.drawing", text: "Describe something {child} drew or built today.", band: "37-60", kind: "opening" },
  { key: "opening.37-60.joke", text: "What joke does {child} tell? Tell it the way {child} does.", band: "37-60", kind: "opening" },
  { key: "opening.37-60.brave", text: "When was {child} brave this week?", band: "37-60", kind: "opening" },
  { key: "opening.37-60.question", text: "What big question did {child} ask lately? What did you say?", band: "37-60", kind: "opening" },
  { key: "opening.37-60.school", text: "What did {child} tell you about school or play group today?", band: "37-60", kind: "opening" },
  { key: "opening.37-60.rules", text: "What rule did {child} make up for a game?", band: "37-60", kind: "opening" },
  { key: "opening.37-60.proud", text: "What is {child} proud of right now?", band: "37-60", kind: "opening" },

  // Gap: easy ways back in, never about time away
  { key: "gap.any.right-now", text: "What is {child} doing right now, this very minute?", band: "any", kind: "gap" },
  { key: "gap.any.one-word", text: "One word for {child} lately. Then say why.", band: "any", kind: "gap" },
  { key: "gap.any.new-thing", text: "What is something {child} does now that is new?", band: "any", kind: "gap" },
  { key: "gap.any.this-week", text: "What has this week been like in your home?", band: "any", kind: "gap" },
  { key: "gap.any.favorite-lately", text: "What is {child}'s favorite thing lately?", band: "any", kind: "gap" },
  { key: "gap.any.one-picture", text: "Pick one photo on your phone of {child}. Tell the story behind it.", band: "any", kind: "gap" },
  { key: "gap.any.small", text: "Tell {child} one small thing. That is a whole letter.", band: "any", kind: "gap" },

  // Hard: honoring the work, never auditing
  { key: "hard.any.asked-of-you", text: "What did today ask of you?", band: "any", kind: "hard" },
  { key: "hard.any.got-through", text: "What helped you get through today, even a little?", band: "any", kind: "hard" },
  { key: "hard.any.tired-truth", text: "Tired tonight? Tell {child} what today was really like.", band: "any", kind: "hard" },
  { key: "hard.any.small-win", text: "What went right today, even something tiny?", band: "any", kind: "hard" },
  { key: "hard.any.who-helped", text: "Who helped you this week? Tell {child} about them.", band: "any", kind: "hard" },
  { key: "hard.any.learning", text: "What are you learning about being {child}'s parent?", band: "any", kind: "hard" },
  { key: "hard.any.held-on", text: "What held you together today? A cup of tea, a call, a song?", band: "any", kind: "hard" },
  { key: "hard.0-3.night-shift", text: "What is the night shift like right now? Tell {child} honestly.", band: "0-3", kind: "hard" },
  { key: "hard.any.hope", text: "Even on a long day, what do you hope for {child}?", band: "any", kind: "hard" },

  // Family: grandparents, aunts, uncles
  { key: "family.any.see-parent", text: "What do you see of {child}'s parent in {child}?", band: "any", kind: "family" },
  { key: "family.any.parent-small", text: "Tell {child} a story from when {child}'s parent was little.", band: "any", kind: "family" },
  { key: "family.any.first-meeting", text: "Tell {child} about the first time you met.", band: "any", kind: "family" },
  { key: "family.any.your-childhood", text: "What did you play with when you were small?", band: "any", kind: "family" },
  { key: "family.any.your-home", text: "Describe the home you grew up in. One room is enough.", band: "any", kind: "family" },
  { key: "family.any.recipe", text: "What dish will you cook for {child} one day? How is it made?", band: "any", kind: "family" },
  { key: "family.any.song", text: "Sing or say a song you sang to {child}'s parent.", band: "any", kind: "family" },
  { key: "family.any.watching-parent", text: "What have you noticed about {child}'s parent as a parent?", band: "any", kind: "family" },
  { key: "family.any.family-saying", text: "What saying does our family repeat? Tell {child} what it means.", band: "any", kind: "family" },
  { key: "family.any.where-from", text: "Tell {child} about the town or village our family comes from.", band: "any", kind: "family" },
  { key: "family.any.wish", text: "What do you wish for {child}?", band: "any", kind: "family" },
  { key: "family.any.do-together", text: "What do you want to do with {child} one day?", band: "any", kind: "family" },

  // Together: made with the child present
  { key: "together.any.hello", text: "Say hello to the book together. Let {child} add a sound.", band: "any", kind: "together" },
  { key: "together.0-3.lullaby", text: "Sing {child} the song you sing most. Let the recording catch the coos.", band: "0-3", kind: "together" },
  { key: "together.7-9.babble", text: "Talk to {child} and leave pauses. Keep the babbling answers.", band: "7-9", kind: "together" },
  { key: "together.13-18.name-things", text: "Point at things in the room. Let {child} name them.", band: "13-18", kind: "together" },
  { key: "together.19-24.favorite", text: "Ask {child}: what is your favorite food? Keep the answer.", band: "19-24", kind: "together" },
  { key: "together.25-36.today", text: "Ask {child}: what was the best part of today?", band: "25-36", kind: "together" },
  { key: "together.25-36.love-who", text: "Ask {child}: who do you love? Let the list run long.", band: "25-36", kind: "together" },
  { key: "together.25-36.animal", text: "Ask {child}: if you were an animal, which one?", band: "25-36", kind: "together" },
  { key: "together.37-60.grown-up", text: "Ask {child}: what will you do when you are big?", band: "37-60", kind: "together" },
  { key: "together.37-60.older-self", text: "Ask {child} to say hello to the {child} who reads this later.", band: "37-60", kind: "together" },
  { key: "together.37-60.tell-story", text: "Let {child} tell you a story. You just listen and keep it.", band: "37-60", kind: "together" },
  { key: "together.37-60.about-you", text: "Ask {child}: what is something you know about me?", band: "37-60", kind: "together" },
  { key: "together.37-60.funny", text: "Ask {child}: what is the silliest thing that happened today?", band: "37-60", kind: "together" },
];
