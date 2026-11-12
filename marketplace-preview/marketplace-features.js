/* Sampling For Good marketplace extensions — secure Supabase-backed features.
   No private contact details are loaded into public discovery cards. */
(() => {
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
const signOutBtn=document.createElement('button');signOutBtn.className='nav market-logout';signOutBtn.textContent='↪ Log out';signOutBtn.onclick=()=>logoutAccount();
const sidebar=document.querySelector('.sidebar');if(sidebar)sidebar.append(signOutBtn);
logoutAccount=async function(){
 const {error}=await auth().auth.signOut();
 if(error){signMessage(error.message);openSignIn();return}
 currentUser=null;requestedRole=null;m.authRole=null;m.loaded=false;m.loading=false;
 m.chapters=[];m.brands=[];m.proposals=[];m.events=[];m.threads=[];m.messages=[];m.activeThread=null;
 interest.clear();previewNote='';role='org';tab='Overview';
 Object.assign(data.org,{name:'',university:'',members:0,charity:'',contactName:'',phone:'',email:'',region:'',organizationType:'Sorority'});
 Object.assign(data.brand,{name:'',category:'',region:'Nationwide',members:'Any size'});
 const email=document.getElementById('signin-email'),password=document.getElementById('signin-password');
 if(email)email.value='';if(password)password.value='';
 closeModal();home({history:'replace'});signMessage('Signed out. Sign in or create an account.');openSignIn();
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
render=function(){baseRender();const bar=document.getElementById('mobilebar');if(bar&&!bar.querySelector('.market-mobile-logout')){const b=document.createElement('button');b.className='market-mobile-logout';b.textContent='↪ Log out';b.onclick=()=>logoutAccount();bar.append(b)}};
window.sfgMarket={switchAccount,saveOrgProfile,saveBrandProfile,filterChapters,editEvent,saveEvent,sendProposal,setProposalStatus,openThreadWith,startConversation,chooseThread,refreshMessages,sendMessage};
window.setInterval(()=>{if(document.visibilityState==='visible'&&currentUser&&tab==='Messages'&&!m.loading)fetchAll()},15000);
function mountAmbassadorEntry(){
 const grid=document.querySelector('.rolegrid-v2');
 if(!grid||document.getElementById('ambassador-portal-option'))return;
 const style=document.createElement('style');
 style.textContent=`
 .rolegrid-v2{grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:stretch;gap:20px}
 .rolegrid-v2>.role{min-width:0}
 .ambassador-role{background:linear-gradient(148deg,#f9f4ff 0%,#f2eaff 62%,#eaf0ff 100%);border:1px solid #ded0f5!important;border-radius:25px;position:relative;overflow:hidden;padding:30px 25px!important;display:flex!important;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:15px;min-height:450px}
 .ambassador-role .amb-icon{width:80px;height:80px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,#9158ea,#dc5ab6);font-size:43px;color:#fff;box-shadow:0 17px 29px #7950d82e}
 .ambassador-role .amb-eyebrow{font:800 11px Manrope,sans-serif;text-transform:uppercase;letter-spacing:1.6px;color:#8651c0}
 .ambassador-role h2{font:800 clamp(24px,2.4vw,35px)/1.15 Manrope,sans-serif;margin:0;letter-spacing:-1.25px;color:#21162f}
 .ambassador-role p{font-size:14px;line-height:1.65;margin:0;color:#675976}
 .ambassador-role .amb-photo{display:flex;flex:1 1 auto;width:100%;min-height:220px;max-height:420px;overflow:hidden;margin:8px 0 10px;border-radius:19px;background:#d9c9ed;box-shadow:0 12px 27px #50328c1c}
 .ambassador-role .amb-photo img{width:100%;height:100%;min-height:220px;max-height:420px;display:block;object-fit:cover;object-position:center center}
 .ambassador-role .amb-pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:auto}
 .ambassador-role .amb-pills span{padding:7px 9px;font:800 10px Manrope,sans-serif;background:white;border-radius:50px;color:#72509a}
 .ambassador-role .amb-cta{display:flex;align-items:center;justify-content:center;border-radius:99px;padding:14px 16px;font:800 13px Manrope,sans-serif;background:linear-gradient(100deg,#e252b2,#8756e8,#5380fa);color:white;text-decoration:none;margin-top:8px;box-shadow:0 8px 18px #8158e62c}
 .ambassador-role .amb-cta:hover{transform:translateY(-2px)}
 @media(max-width:1100px){.rolegrid-v2{grid-template-columns:repeat(2,minmax(0,1fr))!important}.ambassador-role{grid-column:1/-1;min-height:auto;max-width:none}}
 @media(max-width:700px){.rolegrid-v2{grid-template-columns:minmax(0,1fr)!important}.ambassador-role{grid-column:auto;padding:25px!important;min-height:auto}.ambassador-role .amb-photo,.ambassador-role .amb-photo img{flex:0 0 auto;min-height:205px;max-height:250px}}
 `;
 document.head.append(style);
 const card=document.createElement('article');
 card.id='ambassador-portal-option';
 card.className='role role-v2 ambassador-role';
 card.innerHTML=`
   <div class="amb-icon" aria-hidden="true">✦</div>
   <div class="amb-eyebrow">Third way to join · Students</div>
   <h2>Campus Brand Ambassador</h2>
   <p>Set up meetings with university chapters, help them join the Marketplace, train new chapters, and support their first three sampling events.</p>
   <div class="amb-photo"><img src="./assets/campus-ambassador-photo.webp" alt="University of Arizona student presenting a beverage sample at a campus event" loading="lazy"></div>
   <div class="amb-pills"><span>$25 / signed-up chapter</span><span>$1 / unique redemption in first 3 events</span><span>Final campus bonus: TBD</span></div>
   <a class="amb-cta" href="./ambassador.html">Apply to represent your school →</a>`;
 grid.appendChild(card);
}
mountAmbassadorEntry();
initializeAccount();
})();
