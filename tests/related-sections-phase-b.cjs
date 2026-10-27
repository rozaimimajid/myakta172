// Read-only Phase B audit: legal-text cross-reference candidates and exclusions.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const match=html.match(/const DATA\s*=\s*(\{[\s\S]*?\});\s*(?:function|const sections)/);
assert.ok(match,'DATA block must be present');
const data=JSON.parse(match[1]);
assert.equal(data.sections.length,83);
const candidates=[{"from":"2","to":"38","kind":"subseksyen","exclude":false},{"from":"2","to":"21A","kind":"subseksyen","exclude":false},{"from":"2","to":"10","kind":"subseksyen","exclude":false},{"from":"2","to":"15","kind":"subseksyen","exclude":false},{"from":"13","to":"15","kind":"subseksyen","exclude":false},{"from":"18","to":"19","kind":"perenggan","exclude":false},{"from":"19","to":"24","kind":"subseksyen","exclude":false},{"from":"21A","to":"21","kind":"subseksyen","exclude":false},{"from":"21B","to":"21A","kind":"perenggan","exclude":false},{"from":"21C","to":"58","kind":"perenggan","exclude":false},{"from":"22","to":"34","kind":"subseksyen","exclude":false},{"from":"23","to":"22","kind":"subseksyen","exclude":false},{"from":"23","to":"21","kind":"subseksyen","exclude":false},{"from":"24","to":"22","kind":"subseksyen","exclude":false},{"from":"25","to":"22","kind":"subseksyen","exclude":false},{"from":"27","to":"24","kind":"subseksyen","exclude":false},{"from":"29","to":"2","kind":"perenggan","exclude":true},{"from":"35B","to":"22","kind":"perenggan","exclude":false},{"from":"35C","to":"35A","kind":"perenggan","exclude":false},{"from":"35D","to":"35C","kind":"perenggan","exclude":false},{"from":"35D","to":"35A","kind":"perenggan","exclude":false},{"from":"35E","to":"35A","kind":"subseksyen","exclude":false},{"from":"35E","to":"1","kind":"perenggan","exclude":true},{"from":"35F","to":"35E","kind":"subseksyen","exclude":false},{"from":"35G","to":"22","kind":"subseksyen","exclude":false},{"from":"37","to":"22","kind":"subseksyen","exclude":false},{"from":"37","to":"3","kind":"perenggan","exclude":true},{"from":"39","to":"3","kind":"perenggan","exclude":true},{"from":"40","to":"38","kind":"subseksyen","exclude":false},{"from":"41","to":"38","kind":"subseksyen","exclude":false},{"from":"43","to":"38","kind":"subseksyen","exclude":false},{"from":"44","to":"41","kind":"subseksyen","exclude":false},{"from":"49","to":"48","kind":"subseksyen","exclude":false},{"from":"56","to":"4","kind":"subseksyen","exclude":false},{"from":"57","to":"27","kind":"subseksyen","exclude":false}];
assert.equal(candidates.length,35);
assert.equal(candidates.filter(x=>!x.exclude).length,31);
assert.equal(candidates.filter(x=>x.exclude).length,4);
const sections=new Map(data.sections.map(x=>[x.num,x]));
let passed=0;
for(const c of candidates){
 const s=sections.get(c.from);
 assert.ok(s,'Source section exists: '+c.from);
 assert.ok(sections.has(c.to),'Target number exists: '+c.to);
 const escaped=c.to.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('\\b'+c.kind+'\\s+'+escaped+'(?=\\(|\\b)','i');
 assert.ok(pattern.test(s.text),'Exact citation in '+c.from+': '+c.kind+' '+c.to);
 passed++;
}
const expectedContext={
 '29→2':/perenggan 2\(a\)/i,
 '35E→1':/perenggan 1\(c\)/i,
 '37→3':/perenggan 3\(1\)\(b\) Akta itu/i,
 '39→3':/perenggan 3\(1\)\(b\) Akta itu/i
};
for(const c of candidates.filter(c=>c.exclude)){
 const key=c.from+'→'+c.to;
 assert.ok(expectedContext[key],'Unexpected exclusion '+key);
 assert.match(sections.get(c.from).text,expectedContext[key],key);
}
assert.match(sections.get('56').text,/Akta Suruhanjaya\s+Siasatan 1950\s*\[Akta 119\]/);
console.log('PHASE_B_AUDIT',{sections:83,candidates:35,internalCandidates:31,excluded:4,assertedCitations:passed,failed:0});
