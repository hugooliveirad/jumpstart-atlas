// Run with an external Playwright installation via NODE_PATH.
const {chromium,firefox}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const catalog=JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const origin=process.env.ATLAS_URL||'http://127.0.0.1:8000/';
const names=[...new Map(catalog.decks.flatMap(d=>d.cards).map(c=>[c.name,c])).values()];
const fixtures=names.map((c,i)=>({id:`hand-${i}`,name:c.name,set:'j25',collector_number:String(i+1),type_line:c.isLand?'Land':'Creature',cmc:c.isLand?0:i%9,image_uris:{normal:`https://cards.scryfall.io/hand-${i}.svg`}}));
const metadata=new Map(fixtures.map(c=>[c.name.toLowerCase(),c]));
const deck=catalog.decks.find(d=>d.id==='legion-1'),expected=Object.fromEntries(deck.cards.map(c=>[c.name.toLowerCase(),c.quantity*2]));
const index={decks:new Map(catalog.decks.map(d=>[d.id,d])),cards:new Map(names.map(c=>[c.name.toLowerCase(),{...c,manaValue:metadata.get(c.name.toLowerCase()).cmc}]))};
const source=html.slice(html.indexOf('function dealSample('),html.indexOf('function handFanHTML('));
const {dealSample,handRows}=vm.runInNewContext(source+';({dealSample,handRows})',{idx:index,normalizeName:s=>s.toLowerCase(),randomIndex:()=>0});
const sample=dealSample(['legion-1','legion-1']),original=[...sample.library];
assert.equal(sample.library.length,40);assert.equal(sample.drawn,7);assert.equal(sample.selected,null);
const counts=keys=>keys.reduce((out,key)=>(out[key]=(out[key]||0)+1,out),{});
assert.deepEqual(counts(sample.library),expected);
for(const drawn of [7,8,14,15,40]){sample.drawn=drawn;const rows=handRows(sample);assert.equal(rows.length,Math.ceil(drawn/7));assert.equal(rows.flat().length,drawn);assert(rows.every(row=>row.length<=7));assert.deepEqual([...sample.library],original,'Layout never mutates draw order');}
// Mana values and land types never change draw order.
index.cards.set('unknown',{name:'Unknown',manaValue:null});index.cards.set('free',{name:'Free',manaValue:0});
const mixed={library:['unknown','plains','free','plains'],drawn:4};
assert.deepEqual(JSON.parse(JSON.stringify(handRows(mixed)[0])).map(c=>c.key),['unknown','plains','free','plains']);
const boardCards=page=>page.locator('.hand-board [data-sample-key]').evaluateAll(els=>els.map(el=>({key:el.dataset.sampleKey,index:Number(el.dataset.drawIndex)})));
const inDrawOrder=cards=>[...cards].sort((a,b)=>a.index-b.index).map(c=>c.key);
const tap=async button=>{
 await button.scrollIntoViewIfNeeded();
 const point=await button.evaluate(button=>{const r=button.getBoundingClientRect();for(let y=r.bottom-8;y>r.top;y-=8)for(let x=r.left+8;x<r.right;x+=8)if(button.contains(document.elementFromPoint(x,y)))return {x,y};});
 assert(point,'Every physical copy has an exposed tappable area');await button.page().mouse.click(point.x,point.y);await button.page().waitForTimeout(220);
};
(async()=>{
 const browser=await (process.env.ATLAS_BROWSER==='firefox'?firefox:chromium).launch();
 try{
  for(const width of [1280,412,320]){
   const context=await browser.newContext({viewport:{width,height:920}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.request().url().startsWith('https://api.scryfall.com/cards/search')?route.fulfill({json:{object:'list',data:fixtures,has_more:false}}):route.request().url().startsWith('https://cards.scryfall.io/hand-')?route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="140" height="196"><rect width="140" height="196" fill="#645975"/></svg>'}):route.abort());
   await page.goto(origin+'#pairings?packs=legion-1,legion-1');await page.getByText('Scryfall connected',{exact:false}).first().waitFor();
   const beforeStorage=await page.evaluate(()=>localStorage.getItem('jumpstart-atlas.collection.v1'));
   await page.locator('.mix-builder [data-action=test-hands]').click();
   const fit=async()=>{
    await page.waitForTimeout(250);
    const batches=await page.locator('.hand-board .hand-row').evaluateAll(rows=>rows.map(row=>({fans:row.querySelectorAll('.hand-fan').length,cards:row.querySelectorAll('.fan-card').length})));
    assert(batches.every((row,i)=>row.fans===1&&(i===batches.length-1?row.cards>=1&&row.cards<=7:row.cards===7)),'Every completed batch is one row of seven, including during selection');
    const overflow=await page.evaluate(()=>[...document.querySelectorAll('.hand-dialog,.hand-dialog .dialog-content,.hand-row-layout')].filter(el=>el.checkVisibility()&&el.scrollWidth>el.clientWidth+1).map(el=>({class:el.className,width:el.clientWidth,scroll:el.scrollWidth,preview:!!el.closest('.hand-preview'),visible:el.checkVisibility(),viewport:innerWidth})));
    assert.deepEqual(overflow,[],'Every fan and the dialog fit without horizontal scrolling');
    const clipped=await page.locator('.hand-row-layout').evaluateAll(rows=>rows.flatMap(row=>{if(!row.checkVisibility())return [];const bounds=row.getBoundingClientRect();return [...row.querySelectorAll('.fan-card-button')].filter(card=>{const r=card.getBoundingClientRect();return r.width&&(r.left<bounds.left-1||r.right>bounds.right+1);}).map(card=>card.id);}));
    assert.deepEqual(clipped,[],'Rotated and selected cards stay fully inside their row');
   };
   await fit();assert.equal((await boardCards(page)).length,7);assert.equal(await page.locator('.sample-mana').count(),0);assert(!/mana value/i.test(await page.locator('.hand-dialog').innerText()));
   const firstRow=await page.locator('.hand-row').first().locator('[data-sample-key]').evaluateAll(els=>els.map(el=>el.dataset.drawIndex));
   const first=page.locator('.hand-board [data-action=hand-card]').first();
   await first.locator('img').waitFor();const selectedArt=await first.locator('img').elementHandle();await tap(first);assert(await selectedArt.evaluate(img=>img.isConnected),'Selecting retains the image node');assert.equal(await page.locator('[data-dialog-kind=hands]').count(),1);assert.equal(await first.getAttribute('aria-pressed'),'true');
   await fit();const openingIds=await page.locator('.hand-board .fan-card-button').evaluateAll(buttons=>buttons.map(button=>button.id));
   const positions=await page.locator('.hand-board .fan-card').evaluateAll(cards=>cards.map(card=>[card.offsetLeft,card.offsetTop]));
   for(const id of openingIds.slice(1)){await tap(page.locator('#'+id));await fit();assert.deepEqual(await page.locator('.hand-board .fan-card').evaluateAll(cards=>cards.map(card=>[card.offsetLeft,card.offsetTop])),positions,'Selecting keeps every card in place');}
   await tap(first);const selectedId=await first.getAttribute('id');await first.click();await page.locator('[data-dialog-kind=card]').waitFor();await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),selectedId);assert.equal(await page.locator('#'+selectedId).getAttribute('aria-pressed'),'true');
   // Expand preview once; it stays open while its first card is consumed by Draw.
   await page.locator('.hand-preview summary').click();
   const preview=()=>page.locator('[aria-label="Upcoming draws"] [data-sample-key]').evaluateAll(els=>els.map(el=>el.dataset.sampleKey));
   await page.waitForFunction(()=>document.querySelector('.hand-board img')?.getAttribute('src'));
   const retainedArt=await page.locator('.hand-board img').first().elementHandle();
   let previous=inDrawOrder(await boardCards(page));
   for(let drawn=8;drawn<=40;drawn++){
    const upcoming=await preview();await page.locator('[data-action=draw-hand]').click();
    assert(await retainedArt.evaluate(img=>img.isConnected),'Drawing retains existing artwork');
    const cards=await boardCards(page),ordered=inDrawOrder(cards);assert.equal(ordered.length,drawn);assert.deepEqual(ordered.slice(0,-1),previous);assert.equal(ordered.at(-1),upcoming[0],'Draw consumes the previewed next physical copy');previous=ordered;
    const rows=await page.locator('.hand-row').evaluateAll(rows=>rows.map(row=>[...row.querySelectorAll('[data-sample-key]')].map(el=>el.dataset.sampleKey)));
    assert.equal(rows.length,Math.ceil(drawn/7));assert(rows.every(row=>row.length<=7));
    assert.deepEqual(cards.map(card=>card.index),Array.from({length:drawn},(_,i)=>i),'Rendered cards stay in exact draw order');
    assert.deepEqual(await page.locator('.hand-row').first().locator('[data-sample-key]').evaluateAll(els=>els.map(el=>el.dataset.drawIndex)),firstRow,'Completed rows stay in place');
    if([8,14,15,40].includes(drawn))await fit();
   }
   assert.deepEqual(counts(previous),expected);assert(await page.locator('[data-action=draw-hand]').isDisabled());assert.equal(await page.locator('.hand-preview').count(),0);assert.match(await page.locator('.hand-draw-status').innerText(),/40 cards · 0 in library/);
   // Selecting one copy must not treat a different copy with the same name as a second tap.
   const copies=page.locator('.hand-board [data-action=hand-card][data-key=plains]');await tap(copies.nth(0));await tap(copies.nth(1));assert.equal(await page.locator('[data-dialog-kind=hands]').count(),1);assert.equal(await page.locator('.hand-board [aria-pressed=true]').count(),1);
   const copyId=await copies.nth(1).getAttribute('id');await page.locator('#'+copyId).focus();await page.keyboard.press('Enter');await page.locator('[data-dialog-kind=card]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),copyId);
   await page.locator('[data-action=deal-hand]').click();assert.equal((await boardCards(page)).length,7);assert.equal(await page.locator('.hand-board [aria-pressed=true]').count(),0);await page.getByRole('button',{name:'Previous sample'}).click();assert.equal((await boardCards(page)).length,40);assert.deepEqual(inDrawOrder(await boardCards(page)),previous);assert.equal(await page.locator('#'+copyId).getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Next sample'}).click();const keyCard=page.locator('.hand-board [data-action=hand-card]').first();await keyCard.focus();await page.keyboard.press('Space');assert.equal(await keyCard.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-dialog-kind=hands]').count(),1);await page.keyboard.press('Space');await page.locator('[data-dialog-kind=card]').waitFor();await page.keyboard.press('Escape');
   await page.locator('.hand-preview summary').click();await fit();await tap(page.locator('.hand-preview [data-action=hand-card]').first());await fit();for(const resizeWidth of [320,412,600,601,768,1280]){await page.setViewportSize({width:resizeWidth,height:920});await fit();}await page.setViewportSize({width,height:920});await page.evaluate(()=>document.documentElement.dir='rtl');await fit();await page.evaluate(()=>{document.documentElement.dir='ltr';document.body.style.zoom='2';});await fit();await page.evaluate(()=>document.body.style.zoom='');
   assert.equal(await page.evaluate(()=>localStorage.getItem('jumpstart-atlas.collection.v1')),beforeStorage);assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px: two-tap fan, 40-card draws/preview, fixed seven-card rows without horizontal scrolling, draw order, duplicates, sample history, focus, keyboard, RTL, zoom`);
  }
  const context=await browser.newContext({viewport:{width:320,height:920}}),page=await context.newPage();await page.route('https://**/*',route=>route.abort());await page.goto(origin+'#pairings?packs=legion-1,legion-1');await page.locator('.mix-builder [data-action=test-hands]').click();await page.locator('[data-action=draw-hand]').click();assert.equal((await boardCards(page)).length,8);assert.equal(await page.locator('.hand-row').count(),2);await tap(page.locator('.hand-board [data-action=hand-card]').first());assert.equal(await page.locator('.hand-board [aria-pressed=true]').count(),1);await context.close();console.log('PASS offline: bundled card copies remain drawable and inspectable');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
