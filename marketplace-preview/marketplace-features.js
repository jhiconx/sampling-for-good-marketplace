/* Sampling For Good marketplace extensions — secure Supabase-backed features.
   No private contact details are loaded into public discovery cards. */
(() => {
// Keep the public brand offer catalog aligned with the approved Marketplace list.
const hiddenOfferNames=['Mighty Spark Chicken Snack Sticks','Reed’s Coffee','Claude 1 Month','Dove Baby','Bumble Bee','Mr. Pibb Zero Sugar'];
for(const name of hiddenOfferNames){
  const i=brands.findIndex(b=>b.name===name);
  if(i!==-1)brands.splice(i,1);
  interest.delete(name);
  delete brandIds[name];
}
// Display authentic brand-site marks instead of hand-drawn imitation packaging.
// Brand-site favicons are fetched from the brands' own domains via Google's favicon endpoint.
const officialBrandDomains={
  'Celsius':'celsius.com',
  'Alani Nu':'alaninu.com',
  'Liquid Death':'liquiddeath.com',
  'Red Bull':'redbull.com',
  'Olipop':'drinkolipop.com',
  'Martie Free Item':'martie.com',
  'Poppi':'drinkpoppi.com',
  'e.l.f.':'elfcosmetics.com',
  'Starface':'starface.world'
};
const originalBrandArt=brandArt;
brandArt=function(b){
  const domain=officialBrandDomains[b.name];
  if(!domain)return originalBrandArt(b);
  const name=String(b.name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const url='https://www.google.com/s2/favicons?domain='+encodeURIComponent(domain)+'&sz=256';
  return '<div class="product-art simple"><img src="'+url+'" alt="'+name+' brand mark" loading="lazy" referrerpolicy="no-referrer" style="width:104px;height:104px;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.08))" onerror="this.outerHTML=\x27<span class=brand-logo-word>'+name.replace(/'/g,'&#39;')+'</span>\x27"></div>';
};
const m={chapters:[],brands:[],events:[],proposals:[],threads:[],messages:[],activeThread:null,loading:false,loaded:false,eventChoice:null,authRole:null};
const states=['Arizona','California','Texas','Florida','Georgia','Alabama','North Carolina','South Carolina','Tennessee','Mississippi','Louisiana','Kentucky','Michigan','Ohio','Indiana','Illinois','Wisconsin','Minnesota','Iowa','Missouri','Kansas','Nebraska','Oklahoma','Colorado','Utah','Nevada','Oregon','Washington','Idaho','New York','New Jersey','Pennsylvania','Massachusetts','Connecticut','Virginia','Maryland','Other'];
const regions=['Nationwide','Northeast','Southeast','Midwest','Southwest','West','Pacific Northwest','Mid-Atlantic'];
const encode=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const opt=(items,value)=>items.map(x=>'<option value="'+encode(x)+'" '+(x===value?'selected':'')+'>'+encode(x)+'</option>').join('');
const dbClient=()=>auth();
function say(t){let e=document.getElementById('marketplaceStatus');if(!e){e=document.createElement('div');e.id='marketplaceStatus';e.className='market-status';document.getElementById('page')?.prepend(e)}e.textContent=t; e.hidden=false}
function showError(error,prefix='Could not complete request'){say(prefix+': '+(error?.message||'Please try again.'));console.warn(prefix,error?.code||error?.message||'unknown')}
function currentRole(){return m.authRole||role}
const oldOrgPage=orgPage,oldBrandPage=brandPage,oldSave=saveAccount,oldRead=readAccount,oldNavigate=navigate,oldStart=start,oldRender=render,oldLogout=logoutAccount,oldIcon=iconFor;
if(!nav.org.includes('Messages'))nav.org.splice(nav.org.indexOf('Campaigns'),0,'Messages');
if(!nav.brand.includes('Proposals'))nav.brand.splice(nav.brand.indexOf('Campaigns'),0,'Proposals');
if(!nav.brand.includes('Messages'))nav.brand.splice(nav.brand.indexOf('Campaigns'),0,'Messages');
iconFor=function(t){return t==='Messages'?'✉':oldIcon(t)};

// Signed-in account menu, shared by every Organization and Brand dashboard view.
const marketTop=document.querySelector('header.top');
const marketAccountMenu=document.createElement('div');
marketAccountMenu.id='market-account-menu';
marketAccountMenu.className='market-account-menu';
marketAccountMenu.hidden=true;
marketAccountMenu.innerHTML='<button type="button" id="market-account-toggle" class="market-account-toggle" aria-label="Account options" aria-haspopup="menu" aria-controls="market-account-options" aria-expanded="false" title="Account options"><span class="market-account-dots" aria-hidden="true"><i></i><i></i><i></i></span></button><div id="market-account-options" class="market-account-options" role="menu" hidden><button type="button" role="menuitem" id="market-account-logout">↪ Log out</button></div>';
function closeAccountMenu(){
  const popup=document.getElementById('market-account-options'),toggle=document.getElementById('market-account-toggle');
  if(popup)popup.hidden=true;
  if(toggle)toggle.setAttribute('aria-expanded','false');
}
function syncAccountMenu(){
  marketAccountMenu.hidden=!currentUser;
  if(!currentUser)closeAccountMenu();
}
if(marketTop){
  const actions=document.createElement('div');
  actions.className='market-account-actions';
  const choosePortal=marketTop.querySelector('button[onclick="home()"]');
  if(choosePortal)actions.appendChild(choosePortal);
  actions.appendChild(marketAccountMenu);
  marketTop.appendChild(actions);
  const toggle=marketAccountMenu.querySelector('#market-account-toggle');
  const popup=marketAccountMenu.querySelector('#market-account-options');
  toggle.addEventListener('click',()=>{
    if(!currentUser)return;
    const opening=popup.hidden;
    closeAccountMenu();
    if(opening){popup.hidden=false;toggle.setAttribute('aria-expanded','true')}
  });
  toggle.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();popup.hidden=false;toggle.setAttribute('aria-expanded','true');popup.querySelector('button')?.focus()}
  });
  marketAccountMenu.querySelector('#market-account-logout').addEventListener('click',()=>{
    closeAccountMenu();
    logoutAccount();
  });
  document.addEventListener('click',e=>{if(!marketAccountMenu.contains(e.target))closeAccountMenu()});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!popup.hidden){closeAccountMenu();toggle.focus()}
  });
}
const originalHomeForAccountMenu=home;
home=function(options={}){
  const result=originalHomeForAccountMenu(options);
  syncAccountMenu();
  return result;
};

const signOutBtn=document.createElement('button');signOutBtn.className='nav market-logout';signOutBtn.textContent='↪ Log out';signOutBtn.onclick=()=>logoutAccount();
const sidebar=document.querySelector('.sidebar');if(sidebar)sidebar.append(signOutBtn);
let accountLogoutBusy=false;
logoutAccount=async function(){
 if(accountLogoutBusy)return false;
 accountLogoutBusy=true;
 const menuLogout=document.getElementById('market-account-logout');
 if(menuLogout)menuLogout.disabled=true;
 try{
  const {error}=await auth().auth.signOut({scope:'local'});
  if(error){say('Could not confirm logout: '+error.message+'. Please try again.');return false}
  currentUser=null;requestedRole=null;m.authRole=null;m.loaded=false;m.loading=false;
  m.chapters=[];m.brands=[];m.proposals=[];m.events=[];m.threads=[];m.messages=[];m.activeThread=null;
  interest.clear();previewNote='';role='org';tab='Overview';
  Object.assign(data.org,{name:'',university:'',members:0,charity:'',contactName:'',phone:'',email:'',region:'',organizationType:'Sorority'});
  Object.assign(data.brand,{name:'',category:'',region:'Nationwide',members:'Any size'});
  const email=document.getElementById('signin-email'),password=document.getElementById('signin-password');
  if(email)email.value='';if(password)password.value='';
  closeAccountMenu();
  closeModal();home({history:'replace'});signMessage('Signed out. Sign in or create an account.');openSignIn();
  return true;
 }catch(e){
  say('Could not log out: '+(e?.message||'Please try again.'));
  return false;
 }finally{
  if(menuLogout)menuLogout.disabled=false;
  accountLogoutBusy=false;
  syncAccountMenu();
 }
};
async function fetchAll(){
 if(!currentUser||m.loading)return;
 m.loading=true;
 try{
  const [cs,bs,es,ps,ts]=await Promise.all([
   dbClient().from('sfg_marketplace_chapters').select('user_id,organization_name,university,members,region,charity,organization_type,is_visible').eq('is_visible',true).order('organization_name'),
   dbClient().from('sfg_marketplace_brands').select('user_id,brand_name,category,target_region,target_size,is_visible').eq('is_visible',true).order('brand_name'),
   dbClient().from('sfg_marketplace_events').select('*').order('event_date'),
   dbClient().from('sfg_marketplace_proposals').select('*').order('created_at',{ascending:false}),
   dbClient().from('sfg_marketplace_threads').select('*').order('created_at',{ascending:false})
  ]);
  for(const x of [cs,bs,es,ps,ts])if(x.error)throw x.error;
  m.chapters=cs.data||[];m.brands=bs.data||[];m.events=es.data||[];m.proposals=ps.data||[];m.threads=ts.data||[];
  m.loaded=true;
  if(tab==='Messages'&&m.activeThread)await fetchMessages(m.activeThread);
  render();
 }catch(e){showError(e,'Marketplace data unavailable')}finally{m.loading=false}
}
async function publishDirectory(){
 if(!currentUser)return;
 const type=m.authRole||role;
 if(type==='org'){
  if(!data.org.name?.trim()||!data.org.university?.trim())return;
  const p={user_id:currentUser.id,organization_name:data.org.name.trim(),university:data.org.university.trim(),members:Number(data.org.members)||null,region:data.org.region||null,charity:data.org.charity||'',organization_type:data.org.organizationType||'Organization',is_visible:true,updated_at:new Date().toISOString()};
  const {error}=await dbClient().from('sfg_marketplace_chapters').upsert(p,{onConflict:'user_id'});if(error)throw error;
 }else if(type==='brand'){
  const bn=data.brand.name?.trim();
  if(!bn||/^(sample brand co\.?|brand name)$/i.test(bn))return;
  const p={user_id:currentUser.id,brand_name:bn,category:data.brand.category||'',target_region:data.brand.region||'Nationwide',target_size:data.brand.members||'Any size',is_visible:true,updated_at:new Date().toISOString()};
  const {error}=await dbClient().from('sfg_marketplace_brands').upsert(p,{onConflict:'user_id'});if(error)throw error;
 }
}
readAccount=async function(){
 const user=currentUser;let savedRole=null;
 if(user){const r=await dbClient().from('sfg_marketplace_profiles').select('account_type').eq('user_id',user.id).maybeSingle();if(!r.error)savedRole=r.data?.account_type||null}
 m.authRole=savedRole;
 await oldRead();
 if(currentUser){
   m.authRole=savedRole||role;
   if(m.authRole==='org'){const r=await dbClient().from('sfg_marketplace_chapters').select('region,organization_type').eq('user_id',currentUser.id).maybeSingle();if(r.data){data.org.region=r.data.region||'';data.org.organizationType=r.data.organization_type||'Organization'}}
   fetchAll();
 }
};
function showRoleSwitch(nextRole){
 const signedInAs=m.authRole==='org'?'Organization':'Brand',requested=nextRole==='org'?'Organization':'Brand';
 home({history:'replace'});
 document.getElementById('modalbody').innerHTML=`<h2>Switch to ${requested}?</h2><p>This login belongs to an ${signedInAs} account. Sign out and use a ${requested} account to switch portals.</p><div class="btnrow"><button class="limebtn" onclick="sfgMarket.switchAccount('${nextRole}')">Switch account</button><button class="ghost" onclick="closeModal()">Stay signed in</button></div>`;
 document.getElementById('drawer').style.display='flex';
}
start=function(r,options={}){
 if(!nav[r])return;
 if(currentUser&&m.authRole&&r!==m.authRole){showRoleSwitch(r);return}
 oldStart(r,options);if(currentUser)fetchAll();
};
async function switchAccount(nextRole){
 await logoutAccount();
 requestedRole=nextRole;
 signMessage('Sign in or create a '+(nextRole==='brand'?'Brand':'Organization')+' account.');
 openSignIn();
}
navigate=function(n,options={}){oldNavigate(n,options);if(['Find Chapters','Proposals','Create Proposal','Messages','Events','Profile','New Interests'].includes(n)&&currentUser)fetchAll()};
async function saveOrgProfile(){
 if(!currentUser)return;
 for(const [field,id] of [['name','mp-org-name'],['university','mp-org-university'],['charity','mp-org-charity'],['contactName','mp-org-contact'],['phone','mp-org-phone'],['email','mp-org-email']])data.org[field]=document.getElementById(id)?.value?.trim()||'';
 data.org.members=Number(document.getElementById('mp-org-members')?.value)||0;
 data.org.region=document.getElementById('mp-org-region')?.value||'';
 data.org.organizationType=document.getElementById('mp-org-type')?.value||'Organization';
 if(!data.org.name||!data.org.university){say('Organization name and university are required.');return}
 await oldSave();try{await publishDirectory();await fetchAll();say('Chapter saved and available to registered brands.')}catch(e){showError(e,'Chapter publication failed')}
}
async function saveBrandProfile(){
 if(!currentUser)return;
 data.brand.name=document.getElementById('mp-brand-name')?.value.trim()||'';
 data.brand.category=document.getElementById('mp-brand-category')?.value.trim()||'';
 data.brand.region=document.getElementById('mp-brand-region')?.value||'Nationwide';
 data.brand.members=document.getElementById('mp-brand-size')?.value||'Any size';
 if(!data.brand.name){say('Enter your brand name.');return}
 await oldSave();try{await publishDirectory();await fetchAll();say('Brand profile and target region saved.')}catch(e){showError(e,'Brand publication failed')}
}
function orgSettings(){return title('ACCOUNT','Organization profile','Your chapter appears in the Brand directory after you save.')+
'<section class="panel"><div class="formgrid">'+
field('Organization','mp-org-name',data.org.name)+field('University','mp-org-university',data.org.university)+
field('Total members','mp-org-members',data.org.members,'number')+
'<div class="field"><label>State or region</label><select id="mp-org-region"><option value="">Choose state</option>'+opt(states,data.org.region||'')+'</select></div>'+
'<div class="field"><label>Organization type</label><select id="mp-org-type">'+opt(['Sorority','Fraternity','Other organization'],data.org.organizationType||'Sorority')+'</select></div>'+
field('Charitable partner','mp-org-charity',data.org.charity)+field('Contact name','mp-org-contact',data.org.contactName)+field('Private phone','mp-org-phone',data.org.phone)+field('Private email','mp-org-email',data.org.email,'email')+
'</div><div class="btnrow"><button class="limebtn" onclick="sfgMarket.saveOrgProfile()">Save chapter profile</button></div><p class="market-footnote">Only organization, university, member count, region and charity are shown to brands. Contact information stays private.</p></section>'}
function field(name,id,value,type='text'){return '<div class="field"><label>'+encode(name)+'</label><input type="'+type+'" id="'+id+'" value="'+encode(value)+'"></div>'}
function brandSettings(){return title('BRAND ACCOUNT','Brand profile','Select regions and chapter sizes for your sampling programs.')+
'<section class="panel"><div class="formgrid">'+field('Brand','mp-brand-name',data.brand.name)+field('Product category','mp-brand-category',data.brand.category)+
'<div class="field"><label>Preferred regions</label><select id="mp-brand-region">'+opt(regions,data.brand.region||'Nationwide')+'</select></div>'+
'<div class="field"><label>Target chapter size</label><select id="mp-brand-size">'+opt(['Any size','1–50','51–150','151–300','301+'],data.brand.members||'Any size')+'</select></div></div>'+
'<div class="btnrow"><button class="limebtn" onclick="sfgMarket.saveBrandProfile()">Save brand profile</button></div><p class="market-footnote">Only public brand details are visible to chapters. Contacts and messages remain private.</p></section>'}
function chaptersView(){
 const rows=m.chapters,searchBar='<div class="formgrid"><div class="field"><label>Search by chapter or university</label><input id="mp-search" oninput="sfgMarket.filterChapters()" placeholder="Search chapters..."></div><div class="field"><label>State</label><select id="mp-region" onchange="sfgMarket.filterChapters()"><option value="">All states</option>'+opt(states,'')+'</select></div></div>';
 return title('BRAND DISCOVERY','Find chapters','Only registered chapters appear here. Contact names, phones and emails are private.')+
 '<section class="panel">'+searchBar+'<div id="mp-chapter-list">'+chapterCards(rows)+'</div></section>';
}
function chapterCards(rows){if(!rows.length)return '<div class="empty">No registered chapters match yet. Chapters can publish their profile from Organization → Profile.</div>';
 return rows.map(c=>'<div class="chapter-row"><div class="chapter-main"><span class="greek-logo mini">'+encode((c.organization_name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,4))+'</span><div class="chapter-text"><strong>'+encode(c.organization_name)+'</strong><small>'+encode(c.university)+' · '+(c.members||'Not stated')+' members · '+encode(c.region||'Region not specified')+'</small></div></div><div class="market-row-actions"><button class="ghost" onclick="sfgMarket.openThreadWith(\''+c.user_id+'\')">Contact</button><button class="ghost" onclick="sfgMarket.createProposalTo(\''+c.user_id+'\')">Make proposal →</button></div></div>').join('')}
function filterChapters(){const q=document.getElementById('mp-search')?.value?.toLowerCase()||'',st=document.getElementById('mp-region')?.value||'';
 const rows=m.chapters.filter(c=>(c.organization_name+' '+c.university).toLowerCase().includes(q)&&(!st||c.region===st));document.getElementById('mp-chapter-list').innerHTML=chapterCards(rows)}
function eventView(){const mine=m.events.filter(e=>e.chapter_user_id===currentUser?.id);
 return title('CHAPTER EVENTS','Event calendar','Edit philanthropy week, bid day, work week, parents weekend and more.')+
 '<section class="panel"><div class="panelhead"><h2>Chapter event dates</h2><button class="limebtn" onclick="sfgMarket.editEvent(null)">+ Add event</button></div>'+
 [...new Set(['Philanthropy Week','Bid Day','Work Week','Parents Weekend',...mine.map(e=>e.event_name)])].map(name=>{const e=mine.find(x=>x.event_name===name);return '<div class="chapter-row"><div class="chapter-text"><strong>'+encode(name)+'</strong><small>'+(e?.event_date?new Date(e.event_date+'T12:00:00').toLocaleDateString():'Date not set')+'</small></div><button class="ghost" onclick="sfgMarket.editEvent(decodeURIComponent(\''+encodeURIComponent(name).replace(/'/g,'%27')+'\'))">Edit date →</button></div>'}).join('')+'</section>'}
function editEvent(name){const item=m.events.find(e=>e.chapter_user_id===currentUser?.id&&e.event_name===name);
 document.getElementById('modalbody').innerHTML='<h2>'+encode(name?'Edit event date':'Add chapter event')+'</h2><form onsubmit="event.preventDefault();sfgMarket.saveEvent()"><div class="formgrid">'+
 '<div class="field"><label>Event name</label><input id="mp-event-name" value="'+encode(name||'')+'" '+(name?'readonly':'')+' required maxlength="120"></div>'+
 '<div class="field"><label>Event date</label><input type="date" id="mp-event-date" value="'+encode(item?.event_date||'')+'" required></div></div>'+
 '<div class="btnrow"><button type="submit" class="limebtn">Save date</button><button type="button" class="ghost" onclick="closeModal()">Cancel</button></div></form>';
 document.getElementById('drawer').style.display='flex'}
async function saveEvent(){const name=document.getElementById('mp-event-name')?.value.trim(),date=document.getElementById('mp-event-date')?.value;if(!name||!date)return;
 const {error}=await dbClient().from('sfg_marketplace_events').upsert({chapter_user_id:currentUser.id,event_name:name,event_date:date},{onConflict:'chapter_user_id,event_name'});if(error){showError(error,'Could not save event');return}
 closeModal();await fetchAll();say(name+' saved for '+date)}
function proposalBuilder(){return title('BRAND PROPOSAL','Send a proposal to a chapter','Your brand is the sender. The selected chapter receives the offer.')+
 '<section class="panel"><div class="formgrid"><div class="field"><label>Recipient chapter</label><select id="mp-proposal-chapter">'+m.chapters.map(c=>'<option value="'+c.user_id+'">'+encode(c.organization_name)+' — '+encode(c.university)+'</option>').join('')+'</select></div>'+
 field('Product','mp-proposal-product',data.brand.name+' sample')+
 '<div class="field"><label>Samples offered</label><input id="mp-proposal-qty" type="number" min="1" max="100000" value="250"></div><div class="field"><label>Donation per verified redemption ($)</label><input id="mp-proposal-donation" type="number" min="0" step="0.01" value="1.00"></div>'+
 '<div class="field wide"><label>Event or availability</label><input id="mp-proposal-event" placeholder="Proposed event"></div><div class="field wide"><label>Note to chapter</label><textarea id="mp-proposal-note" rows="3"></textarea></div></div>'+
 '<div class="btnrow"><button class="limebtn" '+(m.chapters.length?'':'disabled')+' onclick="sfgMarket.sendProposal()">Send proposal to chapter</button></div><p class="market-footnote">A proposal is an offer from the brand to the chapter. Nothing is shipped until both agree.</p></section>'}
async function sendProposal(){const val=id=>document.getElementById(id)?.value||'';
 const p={brand_user_id:currentUser.id,chapter_user_id:val('mp-proposal-chapter'),product_name:val('mp-proposal-product').trim(),sample_quantity:Number(val('mp-proposal-qty')),donation_per_redemption:Number(val('mp-proposal-donation')),event_name:val('mp-proposal-event').trim(),note:val('mp-proposal-note').trim()};
 if(!p.chapter_user_id||!p.product_name||p.sample_quantity<1){say('Select a chapter, product and valid quantity.');return}
 const {error}=await dbClient().from('sfg_marketplace_proposals').insert(p);if(error){showError(error,'Proposal not sent');return}
 tab='Proposals';await fetchAll();say('Proposal sent to chapter for review.')}
function proposalView(){const mine=m.proposals.filter(p=>role==='brand'?p.brand_user_id===currentUser?.id:p.chapter_user_id===currentUser?.id);
 const outgoing=role==='brand';return title('MARKETPLACE PROPOSALS',outgoing?'Proposals sent by your brand':'Offers received by your chapter',outgoing?'Track proposals your brand has sent.':'Review proposals brands have sent to your chapter.')+
 '<section class="market-proposals">'+(mine.length?mine.map(p=>{const brand=m.brands.find(x=>x.user_id===p.brand_user_id)?.brand_name||(p.brand_user_id===currentUser?.id?data.brand.name:'Brand');const chapter=m.chapters.find(x=>x.user_id===p.chapter_user_id)?.organization_name||(p.chapter_user_id===currentUser?.id?data.org.name:'Chapter');
 return '<div class="market-proposal"><div class="market-direction">'+(outgoing?'Sent by '+encode(brand)+' → '+encode(chapter):'From '+encode(brand)+' → '+encode(chapter))+'</div><h3>'+encode(p.product_name)+'</h3><div class="market-small">'+p.sample_quantity+' samples · $'+Number(p.donation_per_redemption).toFixed(2)+' per redemption · '+encode(p.event_name||'Date TBD')+'</div><p>'+encode(p.note||'No note')+'</p><span class="market-pill">'+encode(p.status)+'</span><div class="btnrow">'+(!outgoing&&p.status==='pending'?'<button class="limebtn" onclick="sfgMarket.setProposalStatus(\''+p.id+'\',\'accepted\')">Accept</button><button class="ghost" onclick="sfgMarket.setProposalStatus(\''+p.id+'\',\'declined\')">Decline</button>':'')+'<button class="ghost" onclick="sfgMarket.openThreadWith(\''+(outgoing?p.chapter_user_id:p.brand_user_id)+'\')">Contact '+(outgoing?'chapter':'brand')+' →</button></div></div>'}).join(''):'<div class="empty">No proposals yet. Brands can start one from Create Proposal.</div>')+'</section>'}
async function setProposalStatus(id,status){const {error}=await dbClient().from('sfg_marketplace_proposals').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('chapter_user_id',currentUser.id);if(error){showError(error,'Could not update proposal');return}await fetchAll();say('Proposal '+status+'.')}
function partnerOptions(){return role==='org'?m.brands.map(b=>({id:b.user_id,name:b.brand_name,meta:b.category})):m.chapters.map(c=>({id:c.user_id,name:c.organization_name,meta:c.university}))}
function messagesView(){const partner=partnerOptions();const selected=m.threads.find(t=>t.id===m.activeThread);let other=selected?(role==='org'?m.brands.find(b=>b.user_id===selected.brand_user_id):m.chapters.find(c=>c.user_id===selected.chapter_user_id)):null;
 return title('MARKETPLACE','Messages','Private conversations between registered brands and chapters.')+
 '<section class="market-messaging"><aside class="market-peers"><h3>Find a conversation</h3><select id="mp-peer"><option value="">Choose '+(role==='org'?'brand':'chapter')+'</option>'+partner.map(b=>'<option value="'+b.id+'">'+encode(b.name)+' · '+encode(b.meta||'')+'</option>').join('')+'</select><button class="limebtn" onclick="sfgMarket.startConversation()">Open conversation</button><hr><h3>Recent threads</h3>'+m.threads.map(t=>{const peer=role==='org'?m.brands.find(b=>b.user_id===t.brand_user_id):m.chapters.find(c=>c.user_id===t.chapter_user_id);return '<button class="market-peer '+(t.id===m.activeThread?'active':'')+'" onclick="sfgMarket.chooseThread(\''+t.id+'\')">'+encode(peer?.brand_name||peer?.organization_name||'Conversation')+'</button>'}).join('')+'</aside>'+
 '<div class="market-chat"><div class="market-chat-head">'+encode(other?.brand_name||other?.organization_name||(selected?'Conversation':'Choose a registered partner'))+' <button class="market-refresh" onclick="sfgMarket.refreshMessages()">Refresh ↻</button></div><div class="market-chat-history">'+(m.messages.length?m.messages.map(x=>'<div class="market-bubble '+(x.sender_user_id===currentUser?.id?'mine':'')+'"><div>'+encode(x.body)+'</div><small>'+new Date(x.created_at).toLocaleString()+'</small></div>').join(''):'<div class="empty">No messages yet. Choose a partner and write the first message.</div>')+'</div><form class="market-composer" onsubmit="event.preventDefault();sfgMarket.sendMessage()"><input id="mp-message" required maxlength="2000" '+(selected?'':'disabled')+' placeholder="Ask about events, product quantities, shipping…"><button class="limebtn" '+(selected?'':'disabled')+' type="submit">Send</button></form></div></section>'}
async function openThreadWith(otherUserId){if(!currentUser||!otherUserId)return;const pair=role==='brand'?{brand_user_id:currentUser.id,chapter_user_id:otherUserId}:{brand_user_id:otherUserId,chapter_user_id:currentUser.id};
 let q=await dbClient().from('sfg_marketplace_threads').select('id').eq('brand_user_id',pair.brand_user_id).eq('chapter_user_id',pair.chapter_user_id).maybeSingle();if(q.error){showError(q.error,'Cannot open conversation');return}
 let thread=q.data;
 if(!thread){const ins=await dbClient().from('sfg_marketplace_threads').insert(pair).select('id').single();if(ins.error){if(ins.error.code==='23505'){q=await dbClient().from('sfg_marketplace_threads').select('id').eq('brand_user_id',pair.brand_user_id).eq('chapter_user_id',pair.chapter_user_id).single();thread=q.data}else{showError(ins.error,'Cannot create conversation');return}}else thread=ins.data}
 if(!thread?.id){say('Conversation could not be opened.');return}
 m.activeThread=thread.id;tab='Messages';await fetchAll();
}
async function startConversation(){await openThreadWith(document.getElementById('mp-peer')?.value)}
async function fetchMessages(id){if(!id){m.messages=[];return}const r=await dbClient().from('sfg_marketplace_messages').select('id,body,sender_user_id,created_at').eq('thread_id',id).order('created_at');if(r.error){showError(r.error,'Messages could not be loaded');return}m.messages=r.data||[]}
async function chooseThread(id){m.activeThread=id;await fetchMessages(id);render()}
async function refreshMessages(){await fetchAll()}
async function sendMessage(){const input=document.getElementById('mp-message');const body=input?.value?.trim();if(!body||!m.activeThread)return;const r=await dbClient().from('sfg_marketplace_messages').insert({thread_id:m.activeThread,sender_user_id:currentUser.id,body});if(r.error){showError(r.error,'Message not sent');return}await fetchMessages(m.activeThread);render()}
orgPage=function(){switch(tab){case 'Events':return eventView();case 'Proposals':return proposalView();case 'Messages':return messagesView();case 'Profile':return orgSettings();default:return oldOrgPage()}};
brandPage=function(){switch(tab){case 'Find Chapters':return chaptersView();case 'Create Proposal':return proposalBuilder();case 'Proposals':return proposalView();case 'Messages':return messagesView();case 'Profile':return brandSettings();default:return oldBrandPage()}};
const baseRender=render;
render=function(){baseRender();const bar=document.getElementById('mobilebar');if(bar&&!bar.querySelector('.market-mobile-logout')){const b=document.createElement('button');b.className='market-mobile-logout';b.textContent='↪ Log out';b.onclick=()=>logoutAccount();bar.append(b)}syncAccountMenu()};
window.sfgMarket={switchAccount,saveOrgProfile,saveBrandProfile,filterChapters,editEvent,saveEvent,sendProposal,setProposalStatus,openThreadWith,startConversation,chooseThread,refreshMessages,sendMessage};
window.setInterval(()=>{if(document.visibilityState==='visible'&&currentUser&&tab==='Messages'&&!m.loading)fetchAll()},15000);
function mountAmbassadorEntry(){
 const grid=document.querySelector('.rolegrid-v2');
 if(!grid||document.getElementById('ambassador-home-callout'))return;
 const style=document.createElement('style');
 style.textContent=`
 .ambassador-home-callout{position:fixed;right:22px;bottom:22px;z-index:100;max-width:min(320px,calc(100vw - 32px));display:flex;align-items:center;gap:10px;padding:15px 19px;background:linear-gradient(105deg,#e252b2,#8756e8,#5380fa);border-radius:18px;box-shadow:0 10px 28px #4222794d;color:#fff!important;text-decoration:none;font:800 14px/1.35 Manrope,sans-serif;transition:transform .2s,box-shadow .2s}
 .ambassador-home-callout:hover,.ambassador-home-callout:focus-visible{transform:translateY(-3px);box-shadow:0 14px 32px #42227966}
 @media(max-width:700px){.ambassador-home-callout{right:12px;bottom:78px;max-width:calc(100vw - 24px);font-size:12px;padding:11px 14px}}
 `;
 document.head.appendChild(style);
 const callout=document.createElement('a');
 callout.id='ambassador-home-callout';
 callout.className='ambassador-home-callout';
 callout.href='./ambassador.html';
 callout.textContent='Become A Campus Brand Ambassador →';
 document.body.appendChild(callout);
}

// SFG calendar and authentication repair 2026-11-17.
// The Overview "Edit date" labels were non-clickable spans and never showed saved dates.
const overviewDates=[['Philanthropy Week','Chapter date pending'],['Bid Day','Chapter date pending'],['Parents Weekend','School date pending'],['Work Week','School date pending']];
events=function(){
 const mine=m.events.filter(e=>e.chapter_user_id===currentUser?.id);
 return overviewDates.map(([name,pending])=>{
  const found=mine.find(e=>e.event_name===name);
  let display=pending;
  if(found?.event_date&&/^\d{4}-\d{2}-\d{2}$/.test(found.event_date))display=new Date(found.event_date+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  return '<div class="event"><div>'+encode(name)+'<br><small>'+encode(display)+'</small></div><button type="button" class="tag sfg-event-edit" data-sfg-event="'+encode(name)+'" aria-label="Edit date for '+encode(name)+'">Edit date</button></div>';
 }).join('');
};
document.addEventListener('click',e=>{
 const b=e.target.closest?.('button[data-sfg-event]');
 if(!b)return;
 e.preventDefault();
 if(!currentUser){requestedRole='org';openSignIn();signMessage('Sign in to edit your chapter calendar.');return}
 window.sfgMarket.editEvent(b.getAttribute('data-sfg-event'));
});
const repairStyle=document.createElement('style');
repairStyle.textContent=[
 '.sfg-event-edit{font:inherit;color:#9552ce;background:#faf5ff;border:1px solid #ead8f6;border-radius:999px;cursor:pointer;padding:8px 15px}',
 '.sfg-event-edit:hover,.sfg-event-edit:focus-visible{background:#f2e3fb;outline:2px solid #b98add;outline-offset:2px}',
 '#signin .auth-msg:not(:empty){position:static;display:block!important;transform:none;width:100%;min-height:0;margin:12px 0;padding:12px 14px;background:#f8f3ff;border:1px solid #ad78e6;border-radius:12px;font:700 13px/1.5 Manrope,sans-serif;color:#51366d;text-align:left;pointer-events:auto;overflow-wrap:anywhere}',
 '#signin .auth-msg[data-state="error"]{border-color:#d05a75;color:#9f2745}'
].join('\n');
document.head.appendChild(repairStyle);
// The original status text appeared below the form, often outside the visible area.
signMessage=function(message){
 const el=document.getElementById('signin-msg');
 if(!el)return;
 el.textContent=String(message||'');
 el.setAttribute('role','status');
 el.setAttribute('aria-live','polite');
 el.dataset.state=/invalid|incorrect|failed|error|could not|unavailable|try again|not confirmed/i.test(String(message))?'error':'info';
};
let authBusy=false;
async function withAuthButton(btn,label,task){
 if(authBusy)return;
 authBusy=true;
 const original=btn?.textContent;
 if(btn){btn.disabled=true;btn.textContent=label}
 try{await task()}
 catch(e){signMessage('Request could not be completed: '+(e?.message||'Please try again.'))}
 finally{if(btn){btn.disabled=false;btn.textContent=original}authBusy=false}
}
// Deduplicate profile loading when sign-in and the Supabase observer fire together.
const originalReadAccount=readAccount;
let accountLoad=null;
readAccount=async function(){
 if(accountLoad)return accountLoad;
 const p=Promise.resolve().then(()=>originalReadAccount());
 accountLoad=p;
 try{return await p}finally{if(accountLoad===p)accountLoad=null}
};
passwordSignIn=async function(e){
 e?.preventDefault?.();
 const email=document.getElementById('signin-email')?.value.trim(),password=document.getElementById('signin-password')?.value||'';
 if(!email||!password){signMessage('Enter your email and password.');return}
 await withAuthButton(document.querySelector('#signin button[type="submit"]'),'Signing in…',async()=>{
  signMessage('Signing in…');
  const {data:result,error}=await auth().auth.signInWithPassword({email,password});
  if(error)throw error;
  if(!result?.user){signMessage('Sign in could not be confirmed. Please try again.');return}
  currentUser=result.user;
  signMessage('Signed in. Loading your saved account…');
  await readAccount();
 });
};
registerAccount=async function(){
 const input=document.getElementById('signin-email'),email=input?.value.trim()||'',password=document.getElementById('signin-password')?.value||'';
 if(currentUser){signMessage('Already signed in. Sign out before creating a different account.');return}
 if(!email||!input.checkValidity()||password.length<8){signMessage('Enter a valid email and a password of at least 8 characters.');return}
 await withAuthButton(document.querySelector('#signin button[onclick="registerAccount()"]'),'Creating account…',async()=>{
  signMessage('Creating account…');
  const {data:result,error}=await auth().auth.signUp({email,password,options:{emailRedirectTo:authRedirectUrl()}});
  if(error){
   if(/already registered|already exists/i.test(error.message||'')){signMessage('An account may already exist for this email. Use Sign in or Forgot password.');return}
   throw error;
  }
  if(result?.session?.user){
   currentUser=result.session.user;signMessage('Account created. Loading your portal…');await readAccount();
  }else signMessage('Request received. If this email is new, check your inbox for confirmation. If already registered, use Sign in or Forgot password.');
 });
};
resetPassword=async function(){
 const input=document.getElementById('signin-email'),email=input?.value.trim()||'';
 if(!email||!input.checkValidity()){signMessage('Enter a valid email address above first.');return}
 await withAuthButton(document.querySelector('#signin button[onclick="resetPassword()"]'),'Sending link…',async()=>{
  signMessage('Requesting a password-reset email…');
  const {error}=await auth().auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl()});
  if(error)throw error;
  signMessage('Password reset requested. If an account exists, check your inbox and spam folder for the reset link.');
 });
};
window.sfgMarket.saveEvent=async function(){
 const name=document.getElementById('mp-event-name')?.value.trim(),date=document.getElementById('mp-event-date')?.value;
 if(!currentUser||!name||!date){say('Enter an event name and date.');return}
 const button=document.querySelector('#modalbody button[type="submit"]');
 if(button?.disabled)return;
 if(button){button.disabled=true;button.textContent='Saving…'}
 try{
  const {data:saved,error}=await dbClient().from('sfg_marketplace_events').upsert({chapter_user_id:currentUser.id,event_name:name,event_date:date},{onConflict:'chapter_user_id,event_name'}).select('id,chapter_user_id,event_name,event_date').single();
  if(error)throw error;
  m.events=m.events.filter(e=>!(e.chapter_user_id===currentUser.id&&e.event_name===name));
  m.events.push(saved);
  closeModal();render();say(name+' saved for '+new Date(date+'T12:00:00').toLocaleDateString()+'.');
  await fetchAll();
 }catch(e){
  let el=document.getElementById('mp-event-feedback');
  if(!el){el=document.createElement('p');el.id='mp-event-feedback';el.setAttribute('role','alert');document.getElementById('modalbody')?.appendChild(el)}
  el.textContent='Could not save date: '+(e?.message||'Please try again.');
 }finally{if(button){button.disabled=false;button.textContent='Save date'}}
};

// Password recovery uses an inline form, never a browser prompt. Subscribe
// before getSession can consume the password-recovery authentication event.
const sfgSigninBox=document.querySelector('#signin .signin-box');
const sfgLoginForm=sfgSigninBox.querySelector('form');
const sfgSigninStatus=document.getElementById('signin-msg');
sfgLoginForm.noValidate=true;
sfgLoginForm.before(sfgSigninStatus);
document.getElementById('signin').setAttribute('role','dialog');
document.getElementById('signin').setAttribute('aria-modal','true');
const sfgCloseSignIn=sfgSigninBox.querySelector(':scope > button');
sfgCloseSignIn.setAttribute('aria-label','Close sign-in');
const sfgRecoveryPanel=document.createElement('section');
sfgRecoveryPanel.id='sfg-password-recovery';
sfgRecoveryPanel.setAttribute('aria-label','Create new password');
sfgRecoveryPanel.hidden=true;
sfgRecoveryPanel.innerHTML=
 '<h2>Create your new password</h2>'+
 '<p class="auth-note">Choose a new password to get back into Sampling For Good.</p>'+
 '<form id="sfg-recovery-form" novalidate>'+
 '<label for="sfg-new-password">New password</label>'+
 '<input id="sfg-new-password" type="password" autocomplete="new-password" minlength="8" required>'+
 '<label for="sfg-confirm-password">Confirm new password</label>'+
 '<input id="sfg-confirm-password" type="password" autocomplete="new-password" minlength="8" required>'+
 '<button type="submit">Save new password</button>'+
 '<button type="button" id="sfg-recovery-back">Back to sign in</button>'+
 '</form>';
sfgSigninBox.appendChild(sfgRecoveryPanel);
const sfgStandardLogin=[...sfgSigninBox.children].filter(
 el=>el!==sfgRecoveryPanel&&el!==sfgSigninStatus&&el!==sfgCloseSignIn&&!el.classList.contains('auth-logo'));
const sfgRecoveryParams=new URLSearchParams(location.search);
const sfgRecoveryHash=new URLSearchParams(location.hash.replace(/^#/,''));
const sfgRecoveryError=sfgRecoveryParams.get('error')||sfgRecoveryHash.get('error');
let sfgRecoveryActive=!sfgRecoveryError&&(
 sfgRecoveryParams.get('reset')==='1'||sfgRecoveryParams.get('type')==='recovery'||
 sfgRecoveryHash.get('type')==='recovery');
let sfgRecoveryVerified=false;
function sfgRecoveryUrlClean(){
 const url=new URL(location.href);
 for(const key of ['reset','type','token','token_hash','code','error','error_code','error_description'])url.searchParams.delete(key);
 url.hash='';
 window.history.replaceState(window.history.state,'',url.pathname+url.search);
}
function sfgSwitchAuthView(recovery){
 for(const el of sfgStandardLogin)el.hidden=Boolean(recovery);
 sfgRecoveryPanel.hidden=!recovery;
 if(!recovery){
  document.getElementById('sfg-new-password').value='';
  document.getElementById('sfg-confirm-password').value='';
 }
}
function sfgShowRecovery(){
 sfgRecoveryActive=true;
 sfgSwitchAuthView(true);
 openSignIn();
 sfgSigninStatus.textContent='';
 document.getElementById('sfg-new-password').focus();
}
async function sfgLeaveRecovery(close=false){
 sfgRecoveryActive=false;
 sfgRecoveryVerified=false;
 try{await auth().auth.signOut({scope:'local'})}
 catch(e){console.error('Recovery sign-out failed',e instanceof Error?e.name:'unexpected')}
 currentUser=null;
 sfgSwitchAuthView(false);
 sfgRecoveryUrlClean();
 signMessage('');
 if(close)closeSignIn();else openSignIn();
}
sfgCloseSignIn.addEventListener('click',e=>{
 if(!sfgRecoveryActive)return;
 e.preventDefault();e.stopImmediatePropagation();
 sfgLeaveRecovery(true);
},true);
document.getElementById('sfg-recovery-back').addEventListener('click',()=>sfgLeaveRecovery());
document.getElementById('sfg-recovery-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const pwd=document.getElementById('sfg-new-password').value;
 const confirm=document.getElementById('sfg-confirm-password').value;
 if(pwd.length<8){signMessage('Your new password must be at least 8 characters.');return}
 if(pwd!==confirm){signMessage('The passwords do not match. Please try again.');return}
 if(!sfgRecoveryVerified){signMessage('This reset link could not be verified. Request a new password-reset email.');return}
 const btn=e.currentTarget.querySelector('button[type="submit"]');
 if(btn.disabled)return;
 btn.disabled=true;btn.textContent='Saving new password…';
 signMessage('Updating your password…');
 try{
  const email=currentUser?.email||'';
  const {error}=await auth().auth.updateUser({password:pwd});
  if(error)throw error;
  const {error:signoutError}=await auth().auth.signOut({scope:'local'});
  if(signoutError)throw new Error('Password updated, but automatic sign-out was not confirmed. Please sign out and sign in again.');
  currentUser=null;
  sfgRecoveryActive=false;sfgRecoveryVerified=false;
  sfgSwitchAuthView(false);
  sfgRecoveryUrlClean();
  if(email)document.getElementById('signin-email').value=email;
  signMessage('Password updated! Sign in with your new password.');
  openSignIn();
 }catch(error){signMessage(error?.message||'Password could not be updated. Please try again.')}
 finally{btn.disabled=false;btn.textContent='Save new password'}
});
resetPassword=async function(){
 const input=document.getElementById('signin-email'),email=input?.value.trim()||'';
 if(!email||!input.checkValidity()){signMessage('Enter a valid email address above first.');return}
 await withAuthButton(document.querySelector('#signin button[onclick="resetPassword()"]'),'Sending link…',async()=>{
  signMessage('Requesting a password-reset email…');
  const url=new URL(authRedirectUrl());
  url.searchParams.set('reset','1');
  const {error}=await auth().auth.resetPasswordForEmail(email,{redirectTo:url.toString()});
  if(error)throw error;
  signMessage('Password reset requested. If an account exists, check your inbox and spam folder for the reset link.');
 });
};
initializeAccount=async function(){
 try{
  const roleFromUrl=new URLSearchParams(location.search).get('accountType');
  if(!requestedRole&&nav[roleFromUrl])requestedRole=roleFromUrl;
  auth().auth.onAuthStateChange((event,session)=>{
   if(event==='PASSWORD_RECOVERY'){
    sfgRecoveryVerified=Boolean(session?.user);
    currentUser=session?.user||null;
    sfgShowRecovery();
    return;
   }
   if(sfgRecoveryActive)return;
   if(session?.user&&session.user.id!==currentUser?.id){
    currentUser=session.user;
    setTimeout(()=>{if(!sfgRecoveryActive)readAccount()},0);
   }else if(!session?.user&&currentUser){
    currentUser=null;
    home({history:'replace'});
   }
  });
  const {data:{session},error}=await auth().auth.getSession();
  if(error)throw error;
  if(sfgRecoveryError){
   sfgRecoveryUrlClean();
   sfgSwitchAuthView(false);
   openSignIn();
   signMessage('This password-reset link has expired or is invalid. Enter your email and request a new link.');
   return;
  }
  if(sfgRecoveryActive){
   currentUser=session?.user||null;
   sfgRecoveryVerified=Boolean(currentUser)||sfgRecoveryVerified;
   sfgShowRecovery();
   if(!sfgRecoveryVerified)signMessage('This link is not verified yet. Request a new password-reset email if it has expired.');
   return;
  }
  currentUser=session?.user||currentUser||null;
  if(currentUser)await readAccount();
 }catch(error){
  console.error('Sign-in initialization failed',error instanceof Error?error.name:'unexpected');
  if(sfgRecoveryActive){sfgShowRecovery();signMessage('Unable to verify the reset link. Please request a new link.')}
  else{openSignIn();signMessage('Sign in is temporarily unavailable. Please retry.')}
 }finally{syncAccountMenu()}
};
mountAmbassadorEntry();
initializeAccount();
})();
