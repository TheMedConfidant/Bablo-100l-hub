import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const E=require('../academic-engine.js');
const student={institution:'FUTA',programme:'BIO',level:'100L',semester:'first'};
const mapping={institutionSlug:'futa',programmeCode:'BIO',academicLevel:'100L',semester:'first',status:'verified',verifiedAt:'2026-11-13T00:00:00Z'};
const base={published:true,qualityStatus:'approved',rightsStatus:'cleared',reusePolicy:'shared-after-review',mappings:[mapping]};
test('normalizes academic identity and university aliases',()=>assert.deepEqual(E.identity(student),{institution:'futa',programme:'bio',level:'100L',semester:'first'}));
test('resolves canonical institution slugs',()=>assert.equal(E.resolveInstitutionSlug('Federal University of Technology, Akure'),'futa'));
test('shows explicitly shared, reviewed resource for exact target mapping',()=>assert.equal(E.resourceVisible(base,E.identity(student)),true));
test('does not leak a Bowen-only resource into FUTA',()=>assert.equal(E.resourceVisible({...base,reusePolicy:'institution-only',ownerInstitutionSlug:'bowen-university'},E.identity(student)),false));
test('allows shared resource with Bowen provenance when explicitly mapped to FUTA',()=>assert.equal(E.resourceVisible({...base,ownerInstitutionSlug:'bowen-university'},E.identity(student)),true));
test('does not show unverified or unmapped resources',()=>{
 assert.equal(E.resourceVisible({...base,mappings:[{...mapping,status:'candidate'}]},E.identity(student)),false);
 assert.equal(E.resourceVisible({...base,mappings:[]},E.identity(student)),false);
});
test('does not show resources from another level or semester',()=>{
 assert.equal(E.resourceVisible({...base,mappings:[{...mapping,academicLevel:'200L'}]},E.identity(student)),false);
 assert.equal(E.resourceVisible({...base,mappings:[{...mapping,semester:'second'}]},E.identity(student)),false);
});
test('fails closed when identity is incomplete',()=>assert.deepEqual(E.filterResources([base],{institution:'FUTA'}),[]));
test('BSc selector is limited to Bowen MBBS 200L+',()=>{
 assert.equal(E.isBscPathwayEligible({institution:'Bowen University',programme:'MBBS',level:'200L'}),true);
 assert.equal(E.isBscPathwayEligible({institution:'FUTA',programme:'MBBS',level:'200L'}),false);
 assert.equal(E.isBscPathwayEligible({institution:'Bowen University',programme:'MBBS',level:'100L'}),false);
 assert.equal(E.isBscPathwayEligible({institution:'Bowen University',programme:'BSc Anatomy',level:'200L'}),false);
});

test('fails closed when semester is missing or invalid',()=>{const noSemester={institution:'FUTA',programme:'BIO',level:'100L'};assert.equal(E.resourceVisible(base,E.identity(noSemester)),false);assert.equal(E.validIdentity(E.identity(noSemester)),false);const invalidSemester={...student,semester:'third'};assert.equal(E.filterResources([base],invalidSemester).length,0);});

test('loads a staged Notion resource by bundle index',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({resources:[{title:'one'},{title:'two'}]})});
 try{
  const item=await E.loadResourceContent({resource_key:'shared-test',content_reference:'./data/test.json',metadata:{resource_index:1}});
  assert.equal(item.title,'two');
 }finally{globalThis.fetch=original;}
});
test('loads a dataset from the combined pilot bundle',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({datasets:[{key:'futa-bio101-flashcards',itemCount:75}]})});
 try{
  const item=await E.loadResourceContent({resource_key:'futa-100l-bio101-flashcards',content_reference:'./data/pilot.json',metadata:{resource_index:null}});
  assert.equal(item.itemCount,75);
 }finally{globalThis.fetch=original;}
});


test('app requires a semester and persists it through the v2 profile RPCs',()=>{
 const fs=require('node:fs');
 const app=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(app,/Choose your semester/);
 assert.match(app,/academicSemester: semester\.value/);
 assert.match(app,/hub_save_academic_profile_v2/);
 assert.match(app,/hub_save_guest_academic_profile_v2/);
 assert.match(app,/Choose your current semester/);
});


test('static course access requires an exact semester mapping',()=>{
 assert.equal(E.courseSemesterMatches({semester:'first'},student),true);
 assert.equal(E.courseSemesterMatches({semester:'second'},student),false);
 assert.equal(E.courseSemesterMatches({semester:null},student),false);
 assert.equal(E.courseSemesterMatches({semester:'first'},{institution:'FUTA',programme:'BIO',level:'100L'}),false);
 const fs=require('node:fs');
 const app=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(app,/courseSemesterMatches\(c, DB\.profile \|\| \{\}\)/);
 assert.match(app,/c\.semesterVerified === true/);
 assert.match(app,/document\.addEventListener\('DOMContentLoaded', \(\) => route\(\), \{ once: true \}\)/);
});
