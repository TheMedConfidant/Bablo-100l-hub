/* Bablo Hub academic identity and resource-filtering contract.
 * Browser-safe, dependency-free module. Untagged legacy content fails closed.
 */
(function(root){
 'use strict';
 const LEVELS=['100L','200L','300L','400L','500L','600L','700L','Other'];
 const SEMESTERS=['first','second','summer','year-round'];
 const SURFACES=['dashboard','courses','notes','flashcards','questions','quizzes','practicals','past-papers','labs','search','recommendations','notifications'];
 const norm=v=>String(v==null?'':v).trim().toLowerCase();
 const slug=v=>norm(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 function identity(input){
  input=input||{};
  return Object.freeze({
   institution:slug(input.institutionSlug||input.institution||''),
   programme:norm(input.programmeCode||input.programme||''),
   level:String(input.academicLevel||input.level||''),
   semester:norm(input.semester||'')
  });
 }
 function validIdentity(id){
  return !!(id&&id.institution&&id.programme&&LEVELS.includes(id.level)&&SEMESTERS.includes(id.semester));
 }
 function isBscPathwayEligible(input){
  const p=input||{};
  const institution=slug(p.institutionSlug||p.institution||'');
  const programme=norm(p.programmeCode||p.programme||'');
  const level=String(p.academicLevel||p.level||'');
  return institution==='bowen-university'&&programme==='mbbs'&&LEVELS.indexOf(level)>=1&&LEVELS.indexOf(level)<=6;
 }
 function mappingMatches(mapping,id){
  if(!mapping||!id)return false;
  return slug(mapping.institutionSlug||mapping.institution||'')===id.institution
   &&norm(mapping.programmeCode||mapping.programme||'')===id.programme
   &&String(mapping.academicLevel||mapping.level||'')===id.level
   &&norm(mapping.semester)===id.semester
   &&mapping.status==='verified'
   &&!!mapping.verifiedAt;
 }
 function resourceVisible(resource,id){
  if(!resource||!validIdentity(id))return false;
  if(resource.published!==true||resource.qualityStatus!=='approved'||resource.rightsStatus!=='cleared')return false;
  const policy=resource.reusePolicy;
  if(policy!=='institution-only'&&policy!=='shared-after-review')return false;
  if(policy==='institution-only'&&slug(resource.ownerInstitutionSlug||resource.ownerInstitution)!==id.institution)return false;
  // Shared resources may retain an originating institution; exact verified target mapping is required below.
  return Array.isArray(resource.mappings)&&resource.mappings.some(m=>mappingMatches(m,id));
 }
 function filterResources(resources,studentIdentity){
  const id=identity(studentIdentity);
  if(!validIdentity(id)||!Array.isArray(resources))return [];
  return resources.filter(r=>resourceVisible(r,id));
 }
 function groupBySurface(resources,studentIdentity){
  const allowed=filterResources(resources,studentIdentity),out={};
  SURFACES.forEach(s=>out[s]=allowed.filter(r=>Array.isArray(r.surfaces)&&r.surfaces.includes(s)));
  return out;
 }
 function assertNoFallback(resources,studentIdentity){
  const id=identity(studentIdentity);
  return filterResources(resources,studentIdentity).every(r=>r.mappings.some(m=>mappingMatches(m,id)));
 }
 const api={LEVELS,SEMESTERS,SURFACES,identity,validIdentity,isBscPathwayEligible,mappingMatches,resourceVisible,filterResources,groupBySurface,assertNoFallback};
 root.BabloAcademicEngine=Object.freeze(api);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
