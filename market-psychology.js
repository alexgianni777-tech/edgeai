"use strict";
// Transparent price/market-breadth FEAR/GREED PROXY for AG Invest.
// NOT CNN Fear & Greed and NOT independently validated alpha.
// Uses only completed index and constituent bars; no survey/social feed data.

const clamp = (n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,n));
const mean = xs => xs.reduce((a,b)=>a+b,0)/xs.length;
function maAt(closes,n){return closes.length>=n?mean(closes.slice(-n)):null;}
function std(xs) {if(xs.length<2)return null; const m=mean(xs);return Math.sqrt(mean(xs.map(x=>(x-m)**2)));}
function returns(bars) {
  const closes=bars.map(b=>b.close);
  return closes.slice(1).map((v,i)=>v/closes[i]-1);
}
function scoreSentiment(indexBars, universe, {asOf=null}={}) {
  const unavailable=(reason)=>({source:"PRICE_BREADTH_PROXY",status:"UNAVAILABLE",reason,asOf,score:null,label:"UNKNOWN",components:null,
    interpretation:"Inga handelsbeslut baserade på sentiment utan fullständiga jämförbara dagskurser."});
  if(!Array.isArray(indexBars)||indexBars.length<201||!indexBars.every(b=>Number.isFinite(b.close)&&b.close>0))return unavailable("INDEX_HISTORY_MISSING");
  const now=indexBars.at(-1).close,closes=indexBars.map(x=>x.close);
  const twenty=closes.at(-21),peak63=Math.max(...closes.slice(-63)),ma50=maAt(closes,50),ma200=maAt(closes,200);
  const ret20=(now/twenty)-1, drawdown=(now/peak63)-1;
  const rets=returns(indexBars),recent=std(rets.slice(-20)),prior=std(rets.slice(-120,-20));
  if(!(Number.isFinite(ret20)&&Number.isFinite(drawdown)&&recent!=null&&prior>0))return unavailable("INDEX_VOLATILITY_UNAVAILABLE");
  let eligible=0, above200=0, positive20=0;
  for(const bars of Object.values(universe||{})) {
    if(!Array.isArray(bars)||bars.length<201)continue;
    if(asOf && new Date(bars.at(-1).t).toISOString().slice(0,10)!==asOf)continue;
    const c=bars.map(b=>b.close);
    if(!(c.at(-1)>0&&c.at(-21)>0&&c.every(x=>Number.isFinite(x)&&x>0)))continue;
    eligible++;
    if(c.at(-1)>maAt(c,200))above200++;
    if(c.at(-1)>c.at(-21))positive20++;
  }
  if(eligible<5)return unavailable("BREADTH_INSUFFICIENT");
  const volRatio=recent/prior;
  const components={
    momentum20:Math.round(clamp(50+400*ret20)),
    drawdown63:Math.round(clamp(100+650*drawdown)),
    volatility:Math.round(clamp(75-25*volRatio)),
    breadth200:Math.round(100*above200/eligible),
    breadth20:Math.round(100*positive20/eligible),
    trend:now>ma50&&now>ma200?100:now<ma50&&now<ma200?0:50,
  };
  const score=Math.round(mean(Object.values(components)));
  const label=score<=25?"EXTREME_FEAR":score<=40?"FEAR":score<60?"NEUTRAL":score<75?"GREED":"EXTREME_GREED";
  return {
    source:"PRICE_BREADTH_PROXY",status:"OK",asOf,score,label,components,
    breadthSample:eligible,metrics:{indexReturn20Pct:+(ret20*100).toFixed(2),indexDrawdown63Pct:+(drawdown*100).toFixed(2),volatilityRatio:+volRatio.toFixed(2),breadthAbove200Pct:+(100*above200/eligible).toFixed(1),breadthPositive20Pct:+(100*positive20/eligible).toFixed(1)},
    interpretation:"Heuristisk marknadspositionering, inte CNN-index eller bevisad köp-/säljsignal.",
  };
}
function assessCrowdRisk(setup,marketSentiment) {
  const warnings=[];
  const direction=setup?.dir;
  const label=marketSentiment?.status==="OK"?marketSentiment.label:"UNKNOWN";
  if(label==="UNKNOWN")warnings.push("SENTIMENT_DATA_MISSING");
  if(["FEAR","EXTREME_FEAR"].includes(label)&&direction==="short")
    warnings.push("SHORT_CHASE_RISK_IN_FEAR");
  if(["FEAR","EXTREME_FEAR"].includes(label)&&direction==="long")
    warnings.push("COUNTERTREND_LONG_NEEDS_REVERSAL_CONFIRMATION");
  if(["GREED","EXTREME_GREED"].includes(label)&&direction==="long")
    warnings.push("LONG_FOMO_RISK_IN_GREED");
  if(["GREED","EXTREME_GREED"].includes(label)&&direction==="short")
    warnings.push("SHORT_SQUEEZE_RISK_IN_GREED");
  const c=setup?.chart?.map(b=>b.c).filter(Number.isFinite)||[];
  if(c.length>=6&&c.at(-6)>0) {
    const move=c.at(-1)/c.at(-6)-1;
    if(direction==="long"&&move>=.08)warnings.push("LONG_RALLIED_8PCT_IN_5D");
    if(direction==="short"&&move<=-.08)warnings.push("SHORT_FELL_8PCT_IN_5D");
  }
  if(Number(setup?.barsAgo)>2)warnings.push("OLD_SIGNAL_REQUIRES_FRESH_TRIGGER");
  if(Number(setup?.maxBars)>15)warnings.push("HOLD_EXCEEDS_3_WEEK_MANDATE");
  if(setup?.evidenceStatus!=="VALIDATED")warnings.push("NOT_VALIDATED_TO_80_3");
  return {
    status:setup?.eliteQualified===true&&warnings.length===0?"REVIEW_REQUIRED":"WATCH",
    warnings,
    manualConfirmation:"Ingen affär förrän entry/stop/target på aktuellt pris, katalysator, mini-future spread/knock-out, samt eget FOMO/tilt/lugn har kontrollerats.",
  };
}
function buildIdeaRadar(setups, sentiment, maxPerSide=3) {
  const result={long:[],short:[],basis:"research-watchlist",scoreMeaning:"Heuristisk prioritet, ej sannolikhet eller verifierad alpha",asOf:sentiment?.asOf||null};
  const eligible=(setups||[]).filter(s=>["long","short"].includes(s?.dir)&&Number.isFinite(s.barsAgo)&&s.barsAgo<=2
    &&Number.isFinite(s.entry)&&Number.isFinite(s.stop)&&Number.isFinite(s.target));
  const rank=s=>((s.eliteQualified?100:0) + Math.max(-5,Math.min(5,Number(s.edge?.expectancyR)||0))*10
     + (s.dir==="short" ? (100-(s.rs??50)):(s.rs??50))/10
     + (Number(s.rr)>=3?5:0) - s.barsAgo*3);
  for(const direction of ["long","short"]){
    const seen=new Set();
    for(const s of eligible.filter(x=>x.dir===direction).sort((a,b)=>rank(b)-rank(a))){
      if(seen.has(s.ticker))continue;
      seen.add(s.ticker);
      const psych=assessCrowdRisk(s,sentiment);
      result[direction].push({
        ticker:s.ticker,setup:s.setup,direction,
        entry:s.entry,stop:s.stop,target:s.target,rr:s.rr,barsAgo:s.barsAgo,
        evidenceStatus:s.evidenceStatus,psychologyStatus:psych.status,
        warnings:psych.warnings,
        rationale: direction==="short"?"Bevaka bekräftad svaghetsrekyl, inte fallande kniv.":"Bevaka bekräftad trend/pullback, undvik att jaga.",
      });
      if(result[direction].length>=maxPerSide)break;
    }
  }
  return result;
}
function assessTraderReadiness(flags={}) {
 const blockers=[];
 if(flags.planComplete!==true)blockers.push("PLAN_MISSING");
 if(flags.fomo===true)blockers.push("FOMO");
 if(flags.revenge===true)blockers.push("REVENGE");
 if(flags.tilt===true)blockers.push("TILT");
 if(flags.distracted===true)blockers.push("DISTRACTED");
 if(flags.canMonitor!==true && flags.protectiveOrderVerified!==true)blockers.push("EXECUTION_NOT_READY");
 return {status:blockers.length?"PAUSE":"REVIEW",blockers,
   note:"Endast självrapporterad handelsdisciplin. Kan inte härledas från marknadsindex eller kontot automatiskt."};
}
module.exports={scoreSentiment,assessCrowdRisk,buildIdeaRadar,assessTraderReadiness};
