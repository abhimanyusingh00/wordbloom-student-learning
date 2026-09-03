'use client';
import { useEffect, useMemo, useState } from 'react';

type BaseWord = { word: string; emoji: string; category: string; article?: 'a' | 'an' };
type Card = BaseWord & { id: string; label: string; sentence: string; color: string };

const bases: BaseWord[] = [
  ['apple','🍎','Food','an'],['banana','🍌','Food'],['orange','🍊','Food','an'],['lemon','🍋','Food'],['grapes','🍇','Food'],['watermelon','🍉','Food'],['strawberry','🍓','Food'],['cherry','🍒','Food'],['peach','🍑','Food'],['pear','🍐','Food'],['pineapple','🍍','Food'],['carrot','🥕','Food'],['corn','🌽','Food'],['tomato','🍅','Food'],['bread','🍞','Food'],['cheese','🧀','Food'],['egg','🥚','Food','an'],['cookie','🍪','Food'],['cake','🍰','Food'],['milk','🥛','Food'],
  ['cat','🐈','Animals'],['dog','🐕','Animals'],['rabbit','🐇','Animals'],['mouse','🐁','Animals'],['hamster','🐹','Animals'],['fox','🦊','Animals'],['bear','🐻','Animals'],['panda','🐼','Animals'],['lion','🦁','Animals'],['tiger','🐯','Animals'],['cow','🐄','Animals'],['pig','🐖','Animals'],['frog','🐸','Animals'],['monkey','🐒','Animals'],['chicken','🐔','Animals'],['penguin','🐧','Animals'],['bird','🐦','Animals'],['duck','🦆','Animals'],['owl','🦉','Animals'],['fish','🐟','Animals'],
  ['pen','🖊️','School'],['pencil','✏️','School'],['book','📘','School'],['notebook','📓','School'],['backpack','🎒','School'],['ruler','📏','School'],['scissors','✂️','School'],['crayon','🖍️','School'],['paper','📄','School'],['bell','🔔','School'],['globe','🌎','School'],['calculator','🧮','School'],['paintbrush','🖌️','School'],['clock','🕐','School'],['desk','🪑','School'],
  ['umbrella','☂️','Things','an'],['phone','📱','Things'],['camera','📷','Things'],['key','🔑','Things'],['balloon','🎈','Things'],['gift','🎁','Things'],['lamp','💡','Things'],['basket','🧺','Things'],['broom','🧹','Things'],['soap','🧼','Things'],['toothbrush','🪥','Things'],['spoon','🥄','Things'],['cup','🥤','Things'],['plate','🍽️','Things'],['bottle','🍼','Things'],
  ['car','🚗','Places'],['bus','🚌','Places'],['train','🚆','Places'],['bicycle','🚲','Places'],['airplane','✈️','Places','an'],['boat','⛵','Places'],['house','🏠','Places'],['school','🏫','Places'],['hospital','🏥','Places'],['store','🏪','Places'],['park','🏞️','Places'],['bridge','🌉','Places'],['mountain','⛰️','Places'],['beach','🏖️','Places'],['farm','🚜','Places'],
  ['sun','☀️','Nature'],['moon','🌙','Nature'],['star','⭐','Nature'],['cloud','☁️','Nature'],['rainbow','🌈','Nature'],['tree','🌳','Nature'],['flower','🌻','Nature'],['leaf','🍃','Nature'],['seedling','🌱','Nature'],['fire','🔥','Nature'],['snowflake','❄️','Nature'],['wave','🌊','Nature'],['rock','🪨','Nature'],['earth','🌍','Nature'],['shell','🐚','Nature'],
].map(([word,emoji,category,article]) => ({word,emoji,category,article: article as 'a'|'an'|undefined}));

const descriptors = [
  {word:'', prefix:'', tone:'#ff725e'}, {word:'red',prefix:'red ',tone:'#ef5b55'}, {word:'blue',prefix:'blue ',tone:'#596bef'},
  {word:'green',prefix:'green ',tone:'#1aa283'}, {word:'yellow',prefix:'yellow ',tone:'#f2ad32'}, {word:'big',prefix:'big ',tone:'#8358d9'},
  {word:'small',prefix:'small ',tone:'#ec79a7'}, {word:'happy',prefix:'happy ',tone:'#f17d35'}, {word:'new',prefix:'new ',tone:'#2b9eb3'},
  {word:'little',prefix:'little ',tone:'#9a6c43'}, {word:'bright',prefix:'bright ',tone:'#d95485'}, {word:'lovely',prefix:'lovely ',tone:'#4c8a6b'},
];
const categories = ['All','Food','Animals','School','Things','Places','Nature'];
const pluralWords = new Set(['grapes','scissors']);
const allCards: Card[] = descriptors.flatMap((d,di) => bases.map((base,bi) => {
  const label = `${d.prefix}${base.word}`;
  const article = base.article || (/^[aeiou]/.test(label) ? 'an' : 'a');
  const sentence = pluralWords.has(base.word) ? `These are ${label}.` : `This is ${article} ${label}.`;
  return {...base,id:`${di}-${bi}`,label,sentence,color:d.tone};
}));

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); const voice = new SpeechSynthesisUtterance(text); const voices=window.speechSynthesis.getVoices(); voice.voice=voices.find(v=>/samantha|ava|serena|google us english/i.test(v.name))||voices.find(v=>v.lang.startsWith('en')&&v.localService)||null; voice.rate=.68; voice.pitch=1.02; voice.volume=.82; window.speechSynthesis.speak(voice);
}

export default function Home() {
  const [active,setActive]=useState(3); const [query,setQuery]=useState(''); const [category,setCategory]=useState('All');
  const [mastered,setMastered]=useState<string[]>([]); const [showLibrary,setShowLibrary]=useState(false); const [soundEnabled,setSoundEnabled]=useState(false); const [learningMode,setLearningMode]=useState(false);
  useEffect(()=>{try{setMastered(JSON.parse(localStorage.getItem('wordbloom-mastered')||'[]'))}catch{} return()=>window.speechSynthesis?.cancel()},[]);
  const filtered=useMemo(()=>allCards.filter(c=>(category==='All'||c.category===category)&&(`${c.label} ${c.sentence}`.includes(query.toLowerCase()))),[category,query]);
  const item=filtered[active%Math.max(filtered.length,1)]||allCards[0];
  useEffect(()=>{if(soundEnabled)speak(`${item.label}. ${item.sentence}`)},[active,soundEnabled,item.label,item.sentence]);
  function toggleMastered(){const next=mastered.includes(item.id)?mastered.filter(x=>x!==item.id):[...mastered,item.id];setMastered(next);localStorage.setItem('wordbloom-mastered',JSON.stringify(next))}
  function pickNext(direction=1){setActive(a=>(a+direction+filtered.length)%filtered.length)}
  function startLibrary(){setShowLibrary(true);setLearningMode(true);setSoundEnabled(true)}
  if(learningMode) return <main className="focus-lesson" style={{'--card-color':item.color} as React.CSSProperties}>
    <div className="focus-picture"><span className="focus-spark one">✦</span><span className="focus-spark two">✦</span><span role="img" aria-label={item.label}>{item.emoji}</span></div>
    <div className="focus-copy"><p className="focus-counter">WORD {(active%filtered.length)+1} OF {filtered.length}</p><h1>{item.label}</h1><p>{item.sentence}</p><span className="now-speaking">🔊 Sound plays automatically</span></div>
    <button className="focus-next" onClick={()=>pickNext(1)} aria-label="Next word"><span>Next word</span><b>→</b></button>
  </main>;
  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">W</span><span>WordBloom</span></a><nav><a className="active-link" href="#learn">Learn</a><a href="#library">Explore</a><a href="#progress">My progress</a></nav><button className="profile" aria-label="Student profile">AS</button></header>
    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span>✦</span> Make words your superpower</p><h1>See it. Hear it.<br/><em>Say it!</em></h1><p className="intro">Build a world of words with playful pictures, clear pronunciation, and little wins every day.</p><div className="hero-actions"><button className="primary-button" onClick={startLibrary}>Start learning <span>→</span></button><button className="sound-button" onClick={()=>speak('Welcome to WordBloom. Let us learn together!')}><span>🔊</span> Try the sound</button></div><div className="mini-proof"><div className="faces"><span>🧒</span><span>👧</span><span>👦</span></div><p><strong>{allCards.length.toLocaleString()} picture words</strong><br/>ready to explore</p></div></div>
      <div className="practice-card" id="learn" style={{'--card-color':item.color} as React.CSSProperties}><div className="card-topline"><span>Listen and speak</span><span>{(active%filtered.length)+1} / {filtered.length}</span></div><div className="picture-stage"><span className="spark one">✦</span><span className="spark two">✦</span><span className="main-emoji" role="img" aria-label={item.label}>{item.emoji}</span></div><div className="word-row"><div><p className="word">{item.label}</p><p className="phonetic">Sound plays when each new card appears</p></div><span className="sound-status" aria-label="Automatic sound on">🔊</span></div><div className="sentence"><span>♪</span> “{item.sentence}”</div><div className="manual-controls"><button className="small-back" onClick={()=>pickNext(-1)} aria-label="Previous word">←</button><button className="big-next" onClick={()=>{setSoundEnabled(true);pickNext(1)}} aria-label="Next word"><span>Next word</span> →</button></div><button className={`learned-button ${mastered.includes(item.id)?'mastered':''}`} onClick={toggleMastered}>{mastered.includes(item.id)?'★ Learned':'☆ I learned it'}</button></div>
    </section>
    <section className="promise"><p>GROW A LITTLE EVERY DAY</p><h2>A joyful way to learn</h2><div className="promise-grid"><article><span className="icon coral">◉</span><h3>Look closely</h3><p>Friendly pictures make every new word easy to understand.</p></article><article><span className="icon blue">♫</span><h3>Listen clearly</h3><p>Hear each word and sentence spoken aloud at a gentle pace.</p></article><article><span className="icon green">✓</span><h3>Speak bravely</h3><p>Repeat, practise, and celebrate every word you learn.</p></article></div></section>
    <section className="library" id="library"><div className="section-heading"><div><p className="eyebrow">YOUR PICTURE DICTIONARY</p><h2>Explore {allCards.length.toLocaleString()} words</h2><p>Find a picture, press the sound button, and say the sentence out loud.</p></div><div className="progress-pill" id="progress"><span>{mastered.length}</span><small>words<br/>learned</small></div></div>
      <div className="tools"><label className="search"><span>⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setActive(0)}} placeholder="Search for a word…" aria-label="Search words"/></label><div className="category-row">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>{setCategory(c);setActive(0)}}>{c}</button>)}</div></div>
      {!showLibrary?<div className="library-gate"><span>🌱</span><h3>Your word garden is ready</h3><p>Open the library to browse every picture word.</p><button className="primary-button" onClick={()=>setShowLibrary(true)}>Open all words</button></div>:<><div className="results-line"><span>{filtered.length} matching words</span><button onClick={()=>{setSoundEnabled(true);setActive(Math.floor(Math.random()*filtered.length))}}>🎲 Surprise me</button></div><div className="word-grid">{filtered.slice(0,48).map((card,index)=><article className={mastered.includes(card.id)?'learned':''} key={card.id} onClick={()=>{setSoundEnabled(true);setActive(index);document.getElementById('learn')?.scrollIntoView({behavior:'smooth',block:'center'})}}><div className="tile-picture" style={{background:`color-mix(in srgb, ${card.color} 15%, white)`}}><span>{card.emoji}</span>{mastered.includes(card.id)&&<b>✓</b>}</div><div className="tile-copy"><div><h3>{card.label}</h3><p>{card.sentence}</p></div><button onClick={e=>{e.stopPropagation();speak(`${card.label}. ${card.sentence}`)}} aria-label={`Hear ${card.label}`}>🔊</button></div></article>)}</div>{filtered.length>48&&<p className="more-note">Showing 48 at a time. Use search and categories to discover all {filtered.length.toLocaleString()} words.</p>}</>}
    </section>
    <footer><div className="brand"><span className="brand-mark">W</span><span>WordBloom</span></div><p>Made for curious minds and brave voices.</p><button onClick={()=>speak('Great job today! Keep learning and keep speaking!')}>🔊 A little cheer</button></footer>
  </main>;
}
