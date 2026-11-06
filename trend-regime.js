"use strict";
// Conservative, point-in-time MARKET CONTEXT for completed daily candles.
// Advisory only: neither this module nor its candidate labels approve orders.
// No intraday/live VIX or CNN Fear & Greed claims are made here.

const round=(n,d=2)=>Number(n.toFixed(d));
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const sma=(xs,n)=>xs.length>=n?mean(xs.slice(-n)):null;
const std=xs=>{
  if(xs.length<2)return null;
  const m=mean(xs);
  return Math.sqrt(mean(xs.map(x=>(x-m)**2)));
};
const dateOf=bar=>{
  const d=new Date(bar?.t);
  return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10);
};
const unavailable=(asOf,reason)=>({
  version:1,status:"UNAVAILABLE",asOf:asOf||null,source:"COMPLETED_DAILY_OHLC_BREADTH",
  regime:"UNKNOWN",bias:"NONE",riskState:"UNKNOWN",reasonCodes:[reason],
  metrics:null,tradeApproved:false,validatedAlpha:false,
  note:"Fail closed: no market direction inferred from missing or mismatched completed sessions."
});

function assessMarketTrend(indexBars,universe,{asOf=null,indexSymbol=null}={}){
  if(!Array.isArray(indexBars)||indexBars.length<201)return unavailable(asOf,"INDEX_HISTORY_INSUFFICIENT");
  const closes=indexBars.map(b=>Number(b?.close));
  if(closes.some(c=>!Number.isFinite(c)||c<=0))return unavailable(asOf,"INDEX_CLOSE_INVALID");
  const lastDate=dateOf(indexBars.at(-1));
  if(!lastDate||(asOf&&asOf!==lastDate))return unavailable(asOf,"INDEX_SESSION_MISMATCH");
  for(let i=1;i<indexBars.length;i++){
    const prior=dateOf(indexBars[i-1]),current=dateOf(indexBars[i]);
    if(!prior||!current||current<=prior)return unavailable(asOf||lastDate,"INDEX_DATES_NOT_ASCENDING");
  }
  const sourceTickers=Object.keys(universe||{});
  let sample=0,above50=0,above200=0;
  for(const tk of sourceTickers){
    const bars=universe[tk];
    if(!Array.isArray(bars)||bars.length<200||dateOf(bars.at(-1))!==lastDate)continue;
    const c=bars.map(b=>Number(b?.close));
    if(c.some(x=>!Number.isFinite(x)||x<=0))continue;
    sample++;
    if(c.at(-1)>sma(c,50))above50++;
    if(c.at(-1)>sma(c,200))above200++;
  }
  if(sample<5||sample/sourceTickers.length<0.8)return unavailable(asOf||lastDate,"BREADTH_INCOMPLETE");
  const rets=closes.slice(1).map((c,i)=>c/closes[i]-1);
  const recent=std(rets.slice(-20)),prior=std(rets.slice(-80,-20));
  if(!Number.isFinite(recent)||!Number.isFinite(prior)||prior<=0)return unavailable(asOf||lastDate,"VOLATILITY_HISTORY_INVALID");

  const last=closes.at(-1),ma20=sma(closes,20),ma50=sma(closes,50),ma200=sma(closes,200);
  const ret5=last/closes.at(-6)-1,ret20=last/closes.at(-21)-1;
  const breadth50=100*above50/sample,breadth200=100*above200/sample;
  const volRatio=recent/prior;
  const bull=last>ma50&&ma50>ma200&&ret20>0&&breadth50>=55;
  const bear=last<ma50&&ma50<ma200&&ret20<0&&breadth50<=45;
  const deterioration=last<ma20&&ret5<0&&breadth50<50;
  const stress=volRatio>=1.5&&ret5<=-0.02&&breadth50<50;
  const regime=stress?"STRESS":bull&&!deterioration?"BULLISH":bear?"BEARISH":"NEUTRAL";
  const bias=regime==="BULLISH"?"LONG_WATCH":regime==="BEARISH"?"SHORT_WATCH":"NONE";
  const reasons=[];
  if(stress)reasons.push("SELL_OFF_WITH_VOL_EXPANSION");
  if(deterioration)reasons.push("SHORT_TERM_DETERIORATION");
  if(regime==="NEUTRAL")reasons.push("TREND_NOT_ALIGNED");
  if(regime==="BULLISH")reasons.push("UPTREND_AND_POSITIVE_BREADTH");
  if(regime==="BEARISH")reasons.push("DOWNTREND_AND_NEGATIVE_BREADTH");
  return {
    version:1,status:"OK",asOf:asOf||lastDate,source:"COMPLETED_DAILY_OHLC_BREADTH",
    indexSymbol,regime,bias,riskState:volRatio>=1.5?"ELEVATED":"NORMAL",
    reasonCodes:reasons,
    metrics:{
      close:round(last),sma20:round(ma20),sma50:round(ma50),sma200:round(ma200),
      return5Pct:round(ret5*100),return20Pct:round(ret20*100),
      breadthAbove50Pct:round(breadth50,1),breadthAbove200Pct:round(breadth200,1),
      breadthSample:sample,breadthExpected:sourceTickers.length,
      realizedVol20Pct:round(recent*Math.sqrt(252)*100,1),
      realizedVolRatio20v60:round(volRatio),
    },
    tradeApproved:false,validatedAlpha:false,
    note:"Heuristic market context from completed daily bars. Not VIX, not live, not OOS-tested alpha; no automatic orders."
  };
}

function assessDirection(trend,direction){
  const unknown=!trend||trend.status!=="OK";
  let code="TREND_NEUTRAL_WAIT";
  if(unknown)code="TREND_DATA_UNAVAILABLE";
  else if(trend.regime==="STRESS")code="STRESS_NO_NEW_RISK";
  else if((trend.regime==="BULLISH"&&direction==="long")||(trend.regime==="BEARISH"&&direction==="short"))code="WITH_MARKET_TREND";
  else if(trend.regime!=="NEUTRAL"&&["long","short"].includes(direction))code="COUNTERTREND_REQUIRES_REVIEW";
  return {
    status:code==="WITH_MARKET_TREND"?"WATCH_PREFERRED":"WATCH_CAUTION",
    code,asOf:trend?.asOf||null,
    tradeApproved:false,
    note:"Trend alignment is not proof of edge, entry or acceptable portfolio/instrument risk."
  };
}
module.exports={assessMarketTrend,assessDirection};
