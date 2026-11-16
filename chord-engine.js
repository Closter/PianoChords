/* PianoChords v2 — analyse harmonique par intervalles. Aucune dépendance. */
function identifyChords(midiNotes) {
  const LETTERS=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
  const bassMidi=Math.min(...midiNotes);
  const bass=((bassMidi%12)+12)%12;
  const notes=[...new Set(midiNotes.map(n=>((n%12)+12)%12))];
  if(notes.length<3)return [];
  const results=[];
  for(let root=0;root<12;root++){
    const s=new Set(notes.map(n=>(n-root+12)%12));
    const has=n=>s.has(n),rootPresent=has(0);
    const major=has(4),minor=has(3)&&!major;
    const seventh=has(10),maj7=has(11);
    const fifth=has(7),dim5=has(6)&&!fifth,aug5=has(8)&&!fifth;
    const sus2=!major&&!minor&&has(2),sus4=!major&&!minor&&has(5);
    if(!(major||minor||sus2||sus4))continue;
    if(!rootPresent && !(major||minor) )continue;
    if(!rootPresent && !(seventh||maj7))continue;
    let consumed=new Set([0]);
    let suffix="",label="",score=0;
    if(major){consumed.add(4);suffix="";label="majeur";score+=15}
    else if(minor){consumed.add(3);suffix="m";label="mineur";score+=15}
    else if(sus4){consumed.add(5);suffix="sus4";label="suspendu 4";score+=9}
    else {consumed.add(2);suffix="sus2";label="suspendu 2";score+=9}
    if(fifth){consumed.add(7);score+=4}
    else if(dim5){consumed.add(6);suffix=minor?"dim":suffix+"♭5";label=minor?"diminué":label+" quinte diminuée";score+=3}
    else if(aug5){consumed.add(8);suffix=major?"aug":suffix+"♯5";label=major?"augmenté":label+" quinte augmentée";score+=2}
    // La septième diminuée est enharmoniquement équivalente à la sixte.
    if(minor&&dim5&&has(9)&&!seventh&&!maj7){consumed.add(9);suffix="dim7";label="septième diminuée";score+=10}
    else if(seventh||maj7){
      consumed.add(seventh?10:11);score+=12;
      if(minor&&dim5&&seventh){suffix="m7♭5";label="demi-diminué"}
      else if(minor&&seventh){suffix="m7";label="septième mineure"}
      else if(minor&&maj7){suffix="m(maj7)";label="mineur avec septième majeure"}
      else if(major&&seventh){suffix="7";label="septième de dominante"}
      else if(major&&maj7){suffix="maj7";label="septième majeure"}
      else {suffix+="7";label+=" avec septième"}
    }
    const has7=seventh||maj7;
    // Les extensions se nomment relativement à la fondamentale théorique.
    const ext=[];
    if(has7){
      if(has(1)){ext.push("♭9");consumed.add(1)}
      if(has(2)){ext.push("9");consumed.add(2)}
      if(major&&has(3)){ext.push("♯9");consumed.add(3)}
      if(has(5)&&!sus4){ext.push("11");consumed.add(5)}
      if(has(6)&&fifth){ext.push("♯11");consumed.add(6)}
      if(has(8)&&fifth){ext.push("♭13");consumed.add(8)}
      if(has(9)){ext.push("13");consumed.add(9)}
      const natural=ext.filter(x=>["9","11","13"].includes(x));
      if(natural.length){
        const highest=natural.includes("13")?"13":natural.includes("11")?"11":"9";
        // Garder le suffixe 7 pour les altérations seules (ex. 7♭9).
        const prefix=seventh?(minor?"m":major?"":""):(major?"maj":minor?"m(maj":"");
        if(major&&seventh)suffix=highest;
        else if(minor&&seventh&&!dim5)suffix="m"+highest;
        else if(major&&maj7)suffix="maj"+highest;
        else if(minor&&maj7)suffix="m(maj7)("+highest+")";
        else suffix+="("+highest+")";
        ext.splice(ext.indexOf(highest),1);
      }
      if(ext.length)suffix+="("+ext.join(",")+")";
    }else{
      if(has(9)&&!consumed.has(9)){consumed.add(9);suffix+="6";label+=" avec sixte"}
      if(has(2)&&!consumed.has(2)){consumed.add(2);suffix=suffix.endsWith("6")?suffix+"/9":suffix+"add9";label+=" et neuvième"}
      if(has(5)&&!consumed.has(5)){consumed.add(5);suffix+="add11"}
      if(has(1)){consumed.add(1);suffix+="add♭9"}
      if(major&&has(3)){consumed.add(3);suffix+="add♯9"}
      if(has(6)&&fifth){consumed.add(6);suffix+="add♯11"}
    }
    const unexplained=[...s].filter(n=>!consumed.has(n));
    if(unexplained.length)continue; // Ne pas inventer une analyse pour les notes inexpliquées.
    if(!rootPresent) suffix+="(sans fondamentale)";
    const name=LETTERS[root]+suffix+(bass!==root?"/"+LETTERS[bass]:"");
    score+=(rootPresent?35:-16)+(bass===root?14:0);
    score+=has7?7:0;
    score-=Math.max(0,ext.length-1)*2;
    if(!rootPresent)score-=10;
    if(!fifth&&!dim5&&!aug5)score-=2;
    if(suffix.includes("add")||suffix.includes("("))score-=1;
    results.push({name,label,root,bass,score,notes:notes.length});
  }
  return results.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}