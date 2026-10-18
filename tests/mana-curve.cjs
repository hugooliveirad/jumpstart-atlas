// NODE_PATH points to an external Playwright installation; see docs/development.md.
const {chromium,firefox}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const catalog=JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const origin=process.env.ATLAS_URL||'http://127.0.0.1:8000/';
const deck=catalog.decks.find(d=>d.id==='legion-1');
const fixtures=[...new Map(catalog.decks.flatMap(d=>d.cards).map(c=>[c.name,c])).values()].map((c,i)=>({id:`curve-${i}`,name:c.name,set:'j25',collector_number:String(i+1),type_line:c.isLand?'Land':'Creature',cmc:c.isLand?0:i%9}));
const metadata=new Map(fixtures.map(c=>[c.name.toLowerCase(),c]));
const expected=Object.fromEntries(deck.cards.filter(c=>!c.isLand).map(c=>[c.name.toLowerCase(),c.quantity]));
// Explicit zero, 5+, unknown and repeated-half calculations, independent of browser randomness.
const index={decks:new Map([['fixture',{cards:[{name:'Free',quantity:2},{name:'Large',quantity:1},{name:'Unknown',quantity:1},{name:'Land',quantity:8,isLand:true}]}]]),cards:new Map([['free',{name:'Free',manaValue:0}],['large',{name:'Large',manaValue:8}],['unknown',{name:'Unknown',manaValue:null}]])};
const source=html.slice(html.indexOf('function manaCurveGroups('),html.indexOf('function manaCurveDialogHTML('));
const groups=vm.runInNewContext(source+';manaCurveGroups', {idx:index,normalizeName:s=>s.toLowerCase()});
const grouped=JSON.parse(JSON.stringify(groups(['fixture','fixture'])));
assert.deepEqual(grouped.map(g=>g.label),['0','1','2','3','4','5+','unknown']);
assert.deepEqual(grouped.filter(g=>g.cards.length).map(g=>g.cards[0].quantity),[4,2,2]);
const allCopies=page=>page.locator('[data-curve-key]').evaluateAll(els=>Object.fromEntries(els.map(el=>[el.dataset.curveKey,Number(el.dataset.curveQuantity)])));
async function assertSummaryGeometry(page){
 const geometry=await page.locator('.deck-profile').evaluate(profile=>{
  const rect=el=>{const {x,y,width,height}=el.getBoundingClientRect();return {x,y,width,height};};
  const spark=profile.querySelector('.compact-curve'),pip=profile.closest('.page-summary').querySelector('.rarity-pip');
  return {spark:rect(spark),trigger:rect(profile.querySelector('.curve-trigger')),bars:[...spark.children].map(el=>({...rect(el),expectedHeight:el.classList.contains('unknown')?8:Number(el.dataset.count)===0?2:parseFloat(el.style.getPropertyValue('--bar-height'))})),pip:pip&&rect(pip),icon:pip&&rect(pip.querySelector('svg'))};
 });
 const {spark,trigger,bars,pip,icon}=geometry;
 const centered=(a,b)=>{assert(Math.abs(a.x+a.width/2-b.x-b.width/2)<.6,'Horizontally centered');assert(Math.abs(a.y+a.height/2-b.y-b.height/2)<.6,'Vertically centered');};
 centered(spark,trigger);if(pip)centered(icon,pip);
 assert.equal(bars.length,5);
 bars.forEach((bar,i)=>{
  assert(Math.abs(bar.width-6)<.6,'Every mana bucket remains a separate narrow bar');
  assert(Math.abs(bar.height-bar.expectedHeight)<.6,'Bar height reflects counts, zero or unknown state');
  assert(bar.x>=spark.x-.5&&bar.x+bar.width<=spark.x+spark.width+.5&&bar.y>=spark.y-.5&&bar.y+bar.height<=spark.y+spark.height+.5,'Individual bars stay inside the sparkline');
  if(i)assert(bar.x>=bars[i-1].x+bars[i-1].width+2.5,'Bars remain separated');
 });
}
(async()=>{
 const browser=await (process.env.ATLAS_BROWSER==='firefox'?firefox:chromium).launch();
 try{
  for(const width of [1280,412,393,320]){
   const context=await browser.newContext({viewport:{width,height:920}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.request().url().startsWith('https://api.scryfall.com/cards/search')?route.fulfill({json:{object:'list',data:fixtures,has_more:false}}):route.abort());
   await page.goto(origin+'#explore?pack=chaos-1');
   await page.waitForFunction(()=>document.querySelector('.curve-trigger')&&!document.querySelector('.curve-trigger').getAttribute('aria-label').includes('unknown'));
   assert(await page.locator('.curve-fill[data-count="0"]').count()>0,'Chaos exercises the empty-bucket regression');
   await assertSummaryGeometry(page);
   await page.goto(origin+'#explore?pack=legion-1');await page.reload();
   await page.waitForFunction(()=>document.querySelector('.curve-trigger')&&!document.querySelector('.curve-trigger').getAttribute('aria-label').includes('unknown'));
   const before=await page.evaluate(()=>localStorage.getItem('jumpstart-atlas.collection.v1'));
   const spark=page.locator('.compact-curve'),trigger=page.locator('.curve-trigger');
   assert.equal((await spark.innerText()).trim(),'','Mini curve has no visible labels');
   assert((await spark.boundingBox()).height<=16);assert((await trigger.boundingBox()).height>=44);
   await assertSummaryGeometry(page);
   await trigger.focus();await page.keyboard.press('Enter');await page.locator('.curve-dialog').waitFor();
   assert.deepEqual(await allCopies(page),expected);
   for(const el of await page.locator('[data-curve-key]').all()){
    const key=await el.getAttribute('data-curve-key'),mv=metadata.get(key).cmc;
    assert.equal(await el.evaluate(el=>el.closest('[data-curve-column]').dataset.curveColumn),String(Math.min(5,mv)).replace(/^5$/,'5+'));
   }
   const fit=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.dialog').scrollWidth<=document.querySelector('.dialog').clientWidth+1),'Only the column rail scrolls horizontally');
   await fit();if(width<=600){const box=await page.locator('.curve-dialog').boundingBox();assert(Math.abs(box.y)<1&&box.y+box.height<=920.5,'Mobile explorer fits viewport vertically');}
   const rail=page.locator('.curve-columns');assert(await rail.evaluate(el=>el.scrollWidth>el.clientWidth));
   // Click the exposed top of an intermediate overlapping card, without forcing.
   const covered=page.locator('.curve-stack>li:not(:last-child) [data-action=card]').first();await covered.scrollIntoViewIfNeeded();await covered.click({position:{x:35,y:20}});
   await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'card');
   const nextExposed=covered.locator('xpath=../following-sibling::li[1]').locator('[data-action=card]');await nextExposed.click({position:{x:35,y:20}});await page.getByRole('button',{name:'Back',exact:true}).click();
   await rail.evaluate(el=>el.scrollLeft=el.scrollWidth);await page.waitForTimeout(150);
   const scroll=await rail.evaluate(el=>el.scrollLeft),last=page.locator('.curve-column').last().locator('[data-action=card]').last();
   await last.click();await page.getByRole('button',{name:'Back',exact:true}).click();assert(Math.abs(await rail.evaluate(el=>el.scrollLeft)-scroll)<2,'Card Back retains horizontal position');
   await rail.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(150);assert.equal(await page.locator('.curve-dialog').count(),1,'Arrow keys do not navigate parent packs');
   await page.keyboard.press('Escape');assert.equal(await page.locator('.pack-dialog').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'mana-curve','Back returns focus to the tiny curve');
   // Full list, despite hidden owned-only results.
   await page.locator('#trigger-popover-pack-filters').click();await page.locator('#pack-card-filter').selectOption('owned');await page.keyboard.press('Escape');await trigger.click();assert.deepEqual(await allCopies(page),expected);await page.keyboard.press('Escape');
   await page.goto(origin+'#pairings?packs=legion-1,legion-1');await page.reload();await page.locator('#trigger-popover-mix-more').click();await page.locator('.mix-builder [data-action=open-play-deck]').click();await assertSummaryGeometry(page);await trigger.click();
   assert.deepEqual(await allCopies(page),Object.fromEntries(Object.entries(expected).map(([key,q])=>[key,q*2])));
   await fit();await page.evaluate(()=>document.documentElement.dir='rtl');await fit();
   assert.equal(await page.evaluate(()=>localStorage.getItem('jumpstart-atlas.collection.v1')),before);assert.deepEqual(errors,[]);
   await context.close();console.log(`PASS ${width}px: text-height bars, 44px trigger, columns/quantities, overlapped-card taps, keyboard, modal focus/scroll, full lists, identical halves, RTL`);
  }
  const context=await browser.newContext({viewport:{width:320,height:920}}),page=await context.newPage();await page.route('https://**/*',route=>route.abort());
  await page.goto(origin+'#explore?pack=legion-1');await page.locator('.curve-trigger').waitFor();await assertSummaryGeometry(page);await page.locator('.curve-trigger').click();
  assert.equal(await page.locator('[data-curve-column]').count(),1,'Offline opens directly to Unknown');assert.equal(await page.locator('[data-curve-column=unknown] [data-curve-key]').count(),Object.keys(expected).length);assert.deepEqual(await allCopies(page),expected);assert.match(await page.locator('.curve-data-note').innerText(),/unavailable/);await context.close();console.log('PASS offline: unknown mana retains every nonland copy');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
