// Run with an external Playwright installation via NODE_PATH; see docs/development.md.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const catalog=JSON.parse(html.match(/const CATALOG = (.*);/)[1]);
const analysisSource=html.split('// BEGIN DECK COMPARISON')[1].split('// END DECK COMPARISON')[0];
const origin=process.env.ATLAS_URL||'http://127.0.0.1:8000/';
const fixtureCards=[...new Map(catalog.decks.flatMap(d=>d.cards).map(c=>[c.name,c])).values()].map((c,i)=>({id:`fixture-${i}`,name:c.name,set:'j25',collector_number:String(i+1),type_line:c.isLand?'Basic Land':i%2?'Artifact Creature — Construct':'Sorcery',cmc:c.isLand?0:i%10,all_parts:[]}));
const metadata=new Map(fixtureCards.map(c=>[c.name,c]));
function unitTests(){
  const roles={Spell:['R','recursion'],Creature:['B','E'],Unknown:['D'],Land:['land']};
  const index={themes:new Map([['theme',{tags:['Tokens']}]]),cards:new Map([['spell',{metadata:true,type:'Sorcery',manaValue:0}],['creature',{metadata:true,type:'Artifact Creature',manaValue:8}],['unknown',{metadata:false}]])};
  const deck={id:'fixture',themeId:'theme',color:'W',cards:[{name:'Spell',quantity:2},{name:'Creature',quantity:3},{name:'Unknown',quantity:1},{name:'Land',quantity:14,isLand:true}]};
  const context={idx:index,DRAFT_ROLES:Object.fromEntries(['B','R','E','A','D','draw','ramp','trick','recursion','tokens','synergy','land'].map(k=>[k,[k]])),normalizeName:s=>s.toLowerCase(),cardDraftTags:c=>roles[c.name],e:s=>String(s),pairSynergy:()=>({score:7,shared:['Tokens']})};
  vm.createContext(context);vm.runInContext(analysisSource,context);
  let a=context.deckAnalysis([deck]);assert.equal(a.total,20);assert.equal(a.nonlands,6);assert.equal(a.lands,14);assert.equal(a.creatures,3);assert.equal(a.otherSpells,2);assert.equal(a.unknownTypes,1);assert.equal(a.curve[0],2);assert.equal(a.curve[7],3);assert.equal(a.knownMana,5);assert.equal(a.unknownMana,1);assert.equal(a.averageMana,24/5);assert.equal(a.roles.R,2);assert.equal(a.roles.recursion,2);assert.equal(a.roles.B,3);assert.equal(a.roles.E,3);
  let twice=context.deckAnalysis([deck,deck]);for(const key of ['total','lands','nonlands','creatures','unknownTypes','knownMana','unknownMana','manaSum'])assert.equal(twice[key],a[key]*2,key);assert.equal(twice.averageMana,a.averageMana);
  const markup=context.deckAnalysisHTML([{label:'One',decks:[deck]},{label:'Both',decks:[deck,deck]}],{kind:'mix'});assert.ok(markup.includes('5/6 copies known'));assert.ok(markup.includes('Known mana values only'));assert.ok(!markup.includes('NaN'));assert.ok(!markup.includes('Infinity'));
  index.cards.set('spell',{metadata:true,type:'Sorcery',manaValue:Infinity});index.cards.set('creature',{metadata:true,type:'Creature',manaValue:-1});a=context.deckAnalysis([deck]);assert.equal(a.knownMana,0);assert.equal(a.averageMana,null);assert.equal(a.unknownMana,6);assert.ok(context.deckAnalysisHTML([{label:'One',decks:[deck]}]).includes('Mana data is unavailable'));
  assert.ok(context.deckAnalysisHTML([{label:'Empty',decks:[null]}]).includes('Choose a pack'));
  console.log('PASS unit: weighted quantities, multi-type creatures, overlapping roles, identical halves, zero/7+ bins, unknown and invalid metadata');
}
async function run(){
  unitTests();const browser=await chromium.launch();
  try{
    for(const width of [1280,412,320]){
      const context=await browser.newContext({viewport:{width,height:920}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await context.addInitScript(()=>{window.JSATLAS_STANDALONE=true;});
      await page.route('https://**/*',route=>route.request().url().startsWith('https://api.scryfall.com/cards/search')?route.fulfill({json:{object:'list',data:fixtureCards,total_cards:fixtureCards.length,has_more:false}}):route.abort());
      const action=(name,scope=page)=>scope.locator(`[data-action="${name}"]`);
      const clickAction=async(name,scope=page)=>{const locator=action(name,scope);const popoverId=await locator.evaluate(el=>el.closest('[popover]')?.id);if(popoverId&&!await page.locator('#'+popoverId).evaluate(el=>el.matches(':popover-open')))await page.locator(`[popovertarget="${popoverId}"]:not([popovertargetaction="hide"])`).click();await locator.click();};
      const mix=()=>page.locator('[aria-label="Mix analysis"]');
      const widthCheck=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`viewport overflow at ${width}`);
      const collection=()=>page.evaluate(()=>localStorage.getItem('jumpstart-atlas.collection.v1'));
      const statsCells=async(scope,label)=>scope.getByRole('region',{name:'Deck statistics',exact:true}).locator('tbody tr').filter({has:page.locator('th',{hasText:new RegExp(`^${label}$`)})}).locator('td .analysis-number').allTextContents();
      const focusAction=async(name)=>assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),name,'toggle retains keyboard focus');
      await page.goto(origin+'#pairings?packs=legion-1,legion-1');await page.locator('.pair-slot').first().waitFor();
      const before=await collection();assert.equal(await mix().count(),0);assert.equal(await action('toggle-pair-analysis').getAttribute('aria-expanded'),'false');
      await action('toggle-pair-analysis').focus();await page.keyboard.press('Enter');await mix().waitFor();await mix().getByRole('region',{name:'Nonland mana curve',exact:true}).waitFor();await focusAction('toggle-pair-analysis');assert.deepEqual(await statsCells(mix(),'Cards'),['20','20','40']);
      const deck=catalog.decks.find(d=>d.id==='legion-1'),expected=Array(8).fill(0);for(const c of deck.cards)if(!c.isLand)expected[Math.min(7,metadata.get(c.name).cmc)]+=c.quantity;
      const rows=mix().getByRole('region',{name:'Nonland mana curve',exact:true}).locator('tbody tr');
      for(let i=0;i<8;i++){assert.deepEqual(await rows.nth(i).locator('.analysis-number').allTextContents(),[String(expected[i]),String(expected[i]),String(expected[i]*2)]);const widths=await rows.nth(i).locator('.analysis-bar-track i').evaluateAll(els=>els.map(el=>parseFloat(el.style.width)));assert.ok(Math.abs(widths[2]-widths[0]*2)<.001,'common scale across halves and combined');}
      await widthCheck();await action('toggle-pair-analysis').click();assert.equal(await mix().count(),0);await focusAction('toggle-pair-analysis');
      // Change the real global Details preference through its existing View popover.
      const details=action('toggle-details').first(),popoverId=await details.evaluate(el=>el.closest('[popover]').id);await page.locator(`[popovertarget="${popoverId}"]:not([popovertargetaction="hide"])`).click();await details.click();await page.keyboard.press('Escape');assert.equal(await mix().count(),0,'global details do not enable analysis');await action('toggle-pair-analysis').click();await mix().waitFor();
      await action('remove-pair').first().click();assert.deepEqual(await statsCells(mix(),'Cards'),['20']);assert.match(await mix().innerText(),/Choose a second pack/);await widthCheck();await action('remove-pair').first().click();assert.match(await page.locator('#mix-analysis').innerText(),/Choose a pack/);assert.equal(await mix().count(),0);await action('toggle-pair-analysis').click();assert.equal(await page.locator('#mix-analysis').count(),0);await action('toggle-pair-analysis').click();assert.match(await page.locator('#mix-analysis').innerText(),/Choose a pack/);await widthCheck();assert.equal(await collection(),before);
      await page.goto(origin+'#pairings?packs=drowned-1,nefarious-1');await page.reload();await action('toggle-pair-analysis').click();await mix().waitFor();await widthCheck();assert.ok(await mix().locator('.analysis-tag-absent').count()>0,'different themes show nonshared tags');
      await page.goto(origin+'#explore?pack=legion-1');await page.reload();await page.locator('.pack-dialog').waitFor();
      const dialog=()=>page.locator('.dialog');await clickAction('compare',dialog());assert.equal(await page.locator('[aria-label="Version analysis"]').count(),0);assert.equal(await page.locator('[data-mode="cards"]').getAttribute('aria-pressed'),'true');
      const chooseMode=async mode=>page.locator(`[data-action="comparison-mode"][data-mode="${mode}"]`).click();
      await chooseMode('analysis');await page.locator('[aria-label="Version analysis"]').waitFor();await focusAction('comparison-mode');assert.equal(await page.evaluate(()=>document.activeElement.dataset.mode),'analysis');assert.deepEqual(await statsCells(page.locator('[aria-label="Version analysis"]'),'Cards'),Array(catalog.themes.find(t=>t.id==='legion').variants.length).fill('20'));await widthCheck();
      await chooseMode('cards');assert.equal(await page.locator('[aria-label="Version analysis"]').count(),0);await focusAction('comparison-mode');
      await action('card',dialog()).first().click();await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.locator('[data-mode="cards"]').getAttribute('aria-pressed'),'true');
      await chooseMode('analysis');await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.pack-dialog').waitFor();await clickAction('compare',dialog());assert.equal(await page.locator('[aria-label="Version analysis"]').count(),0,'reopening comparison defaults to Cards');await page.getByRole('button',{name:'Back',exact:true}).click();
      const next=page.getByRole('button',{name:'Next pack version',exact:true});if(await next.count()&&!await next.isDisabled()){await next.click();await clickAction('compare',dialog());assert.equal(await page.locator('[data-mode="cards"]').getAttribute('aria-pressed'),'true');}
      await page.goto(origin+'#explore?pack=stalwart-1');await page.reload();await page.locator('.pack-dialog').waitFor();await clickAction('compare',dialog());await chooseMode('analysis');assert.deepEqual(await statsCells(page.locator('[aria-label="Version analysis"]'),'Cards'),['20','20','20','20']);
      await widthCheck();assert.equal(await collection(),before);assert.deepEqual(errors,[]);await page.screenshot({path:`/tmp/atlas-comparison-${width}.png`});
      console.log(`PASS ${width}px: hidden defaults, keyboard focus, weighted identical halves/shared scale, empty/incomplete mix, independent Details, version toggles, modal back/navigation, collection unchanged and no overflow`);await context.close();
    }
    // Fresh caches with missing or partial metadata must not become zero-valued curves.
    for(const mode of ['offline','partial']){
      const context=await browser.newContext({viewport:{width:412,height:920}}),page=await context.newPage();const deck=catalog.decks.find(d=>d.id==='legion-1'),omitted=deck.cards.find(c=>!c.isLand).name;
      await context.addInitScript(()=>{window.JSATLAS_STANDALONE=true;});
      await page.route('https://**/*',route=>mode==='partial'&&route.request().url().startsWith('https://api.scryfall.com/cards/search')?route.fulfill({json:{object:'list',data:fixtureCards.filter(c=>c.name!==omitted),has_more:false}}):route.abort());
      await page.goto(origin+'#pairings?packs=legion-1,legion-1');await page.locator('[data-action="toggle-pair-analysis"]').click();const scope=page.locator('[aria-label="Mix analysis"]');await scope.waitFor();
      if(mode==='partial')await scope.getByRole('region',{name:'Nonland mana curve',exact:true}).waitFor();
      assert.equal(await scope.getByRole('region',{name:'BREAD assignments',exact:true}).count(),1);assert.equal(await scope.getByRole('region',{name:'Theme tags',exact:true}).count(),1);
      const unknowns=await scope.getByRole('region',{name:'Mana data coverage',exact:true}).locator('tbody td .analysis-number').allTextContents();const unknown=mode==='partial'?deck.cards.find(c=>c.name===omitted).quantity:deck.cards.filter(c=>!c.isLand).reduce((s,c)=>s+c.quantity,0);assert.deepEqual(unknowns,[String(unknown),String(unknown),String(unknown*2)]);
      assert.match(await scope.innerText(),mode==='offline'?/Mana data is unavailable/:/Known mana values only/);assert.ok(!/NaN|Infinity/.test(await scope.innerText()));await context.close();console.log(`PASS ${mode}: bundled roles/tags remain; unknown mana excluded and counted accurately`);
    }
  }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
