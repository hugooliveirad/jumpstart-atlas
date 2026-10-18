// Run with an external Playwright installation via NODE_PATH.
const {chromium,firefox}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const catalog=JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const origin=process.env.ATLAS_URL||'http://127.0.0.1:8000/';
const source=html.slice(html.indexOf('function openingHandGroups('),html.indexOf('function sampleCardsHTML('));
const index={cards:new Map([['forest',{name:'Forest',isLand:true}],['swamp',{name:'Swamp',isLand:true}],['expensive',{name:'Expensive',manaValue:6}],['cheap',{name:'Cheap',manaValue:1}],['free',{name:'Free',manaValue:0}],['unknown',{name:'Unknown',manaValue:null}]])};
const group=vm.runInNewContext(source+';openingHandGroups',{idx:index});
const sample=['expensive','forest','unknown','cheap','forest','free','swamp'];
const original=[...sample],result=JSON.parse(JSON.stringify(group(sample)));
assert.deepEqual(sample,original,'Grouping never changes the dealt sample');
assert.deepEqual(result.nonlands,['free','cheap','expensive','unknown'],'Zero first, unknown last');
assert.deepEqual(result.lands,[{key:'forest',quantity:2},{key:'swamp',quantity:1}]);
assert.equal(group(Array(7).fill('forest')).lands[0].quantity,7);
assert.equal(group(['free','cheap']).lands.length,0);
const fixtures=[...new Map(catalog.decks.flatMap(d=>d.cards).map(c=>[c.name,c])).values()].map((c,i)=>({id:`layout-${i}`,name:c.name,set:'j25',collector_number:String(i+1),type_line:c.isLand?'Land':'Creature',cmc:c.isLand?0:i%9}));
const mana=new Map(fixtures.map(c=>[c.name.toLowerCase(),c.cmc]));
const deck=catalog.decks.find(d=>d.id==='legion-1');
const expected=[0,0,0,0,0];for(const c of deck.cards){const value=mana.get(c.name.toLowerCase());if(!c.isLand&&value>0)expected[Math.min(5,value)-1]+=c.quantity;}
const keys=scope=>scope.locator('[data-sample-key]').evaluateAll(els=>els.flatMap(el=>Array(Number(el.dataset.sampleQuantity)).fill(el.dataset.sampleKey)));
(async()=>{
 const browser=await (process.env.ATLAS_BROWSER==='firefox'?firefox:chromium).launch();
 try{
  for(const width of [1280,412,320]){
   const context=await browser.newContext({viewport:{width,height:920}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.request().url().startsWith('https://api.scryfall.com/cards/search')?route.fulfill({json:{object:'list',data:fixtures,has_more:false}}):route.abort());
   const fit=async(dialogOnly=false)=>assert(await page.evaluate(dialogOnly=>[...(dialogOnly?[]:[document.documentElement]),...document.querySelectorAll('.dialog,.dialog-content')].every(el=>el.scrollWidth<=el.clientWidth+1),dialogOnly),`No overflow at ${width}`);
   const curve=()=>page.locator('.deck-profile [data-mana-bucket]');
   const counts=()=>curve().evaluateAll(els=>els.map(el=>Number(el.dataset.count)));
   await page.goto(origin+'#explore?pack=legion-1');
   await page.waitForFunction(()=>document.querySelector('.curve-trigger')&&!document.querySelector('.curve-trigger').getAttribute('aria-label').includes('unknown'));
   assert.deepEqual(await curve().evaluateAll(els=>els.map(el=>el.dataset.manaBucket)),['1','2','3','4','5+']);
   assert.deepEqual(await counts(),expected);
   // Filtering the visible card list must not change full-deck summaries.
   await page.locator('#trigger-popover-pack-filters').click();await page.locator('#pack-card-filter').selectOption('owned');await page.keyboard.press('Escape');assert.deepEqual(await counts(),expected);
   await fit();await page.screenshot({path:`/tmp/atlas-curve-${width}.png`});
   await page.goto(origin+'#pairings?packs=legion-1,legion-1');await page.reload();
   await page.locator('.mix-builder [data-action="test-hands"]').click();
   let stacked=false;
   for(let n=0;n<15;n++){
    const hand=page.getByRole('region',{name:'Opening hand',exact:true}),draws=page.getByRole('region',{name:'Next three draws',exact:true});
    assert.equal((await keys(hand)).length,7);assert.equal((await keys(draws)).length,3);
    const spells=await hand.locator('.sample-cards:not(.sample-lands) [data-sample-key]').evaluateAll(els=>els.map(el=>el.dataset.sampleKey));
    const values=spells.map(key=>mana.get(key));assert.deepEqual(values,[...values].sort((a,b)=>a-b));
    assert.deepEqual(await draws.locator('.sample-mana').allTextContents(),['Draw 1','Draw 2','Draw 3']);
    stacked||=await hand.locator('.stacked').count()>0;
    const before=await keys(page),drawOrder=await keys(draws);
    await page.locator('[data-sample-key] [data-action="card"]').first().click();await page.getByRole('button',{name:'Back',exact:true}).click();
    assert.deepEqual(await keys(page),before);assert.deepEqual(await keys(draws),drawOrder);
    if(n===0){await fit();await page.screenshot({path:`/tmp/atlas-hand-${width}.png`});}
    await page.locator('[data-action="deal-hand"]').click();
   }
   assert(stacked,'Duplicate lands have a visual stack');
   await page.evaluate(()=>document.documentElement.dir='rtl');await fit();await page.evaluate(()=>{document.documentElement.dir='ltr';document.body.style.zoom='2';});await fit(true);await page.evaluate(()=>document.body.style.zoom='');
   await page.keyboard.press('Escape');
   await page.locator('#trigger-popover-mix-more').click();await page.locator('.mix-builder [data-action="open-play-deck"]').click();assert.deepEqual(await counts(),expected.map(n=>n*2));await fit();
   assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px: pack/pair curve, full-list quantities, mana sorting, stacked lands, card exploration, preserved draws, RTL, 200% zoom`);
  }
  for(const mode of ['offline','partial']){
   const context=await browser.newContext({viewport:{width:320,height:920}}),page=await context.newPage();
   const omitted=deck.cards.find(c=>!c.isLand).name;
   await page.route('https://**/*',route=>mode==='partial'&&route.request().url().startsWith('https://api.scryfall.com/cards/search')?route.fulfill({json:{object:'list',data:fixtures.filter(c=>c.name!==omitted),has_more:false}}):route.abort());
   await page.goto(origin+'#explore?pack=legion-1');await page.locator('.deck-profile').waitFor();
   if(mode==='partial')await page.waitForFunction(()=>document.querySelector('.curve-trigger')?.getAttribute('aria-label').includes('1 with unknown'));
   assert.match(await page.locator('.curve-trigger').getAttribute('aria-label'),/unknown mana value/);
   if(mode==='offline')assert.equal(await page.locator('.curve-fill.unknown').count(),5);
   await context.close();console.log(`PASS ${mode}: missing metadata stays explicit`);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
