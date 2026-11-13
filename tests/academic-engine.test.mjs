import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const E=require('../academic-engine.js');
const student={institution:'FUTA',programme:'BIO',level:'100L',semester:'first'};
const mapping={institutionSlug:'futa',programmeCode:'BIO',academicLevel:'100L',semester:'first',status:'verified',verifiedAt:'2026-11-13T00:00:00Z'};
const base={published:true,qualityStatus:'approved',rightsStatus:'cleared',reusePolicy:'shared-after-review',mappings:[mapping]};
test('normalizes academic identity and university aliases',()=>assert.deepEqual(E.identity(student),{institution:'futa',programme:'bio',level:'100L',semester:'first'}));
test('resolves canonical institution slugs',()=>assert.equal(E.resolveInstitutionSlug('Federal University of Technology, Akure'),'federal-university-of-technology-akure'));
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

test('allows course-wide filtering when semester is not selected',()=>{const noSemester={institution:'FUTA',programme:'BIO',level:'100L'};assert.equal(E.resourceVisible(base,E.identity(noSemester)),true);assert.equal(E.validIdentity(E.identity(noSemester)),true);});
