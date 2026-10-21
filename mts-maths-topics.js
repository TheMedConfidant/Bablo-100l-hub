/* MTS Maths content pack. Original practice questions in a Bowen-style exam format; not official past questions. */
(function(){
 const bank=window.__BANK__||(window.__BANK__=[]), notes=window.__NOTES__||(window.__NOTES__={});
 const old=new Set(bank.map(q=>q.i)); let seq=1;
 function add(t,q,opts,correct,why){
  const id='MTH101-MTS-'+String(seq++).padStart(3,'0'); if(old.has(id))return;
  const shift=(seq*3)%4, all=opts.slice(shift).concat(opts.slice(0,shift));
  bank.push({i:id,c:'MTH101',u:t,s:'mcq',q:q,o:all,a:all.indexOf(correct),e:why});old.add(id);
 }
 function mc(t,q,correct,wrong,why){add(t,q,[correct,...wrong].slice(0,4),correct,why)}
 const S='Elementary Set Theory', I='Mathematical Induction';
 [
 ['A set is best described as:','A well-defined collection of distinct objects',['A list whose order always matters','A collection where repetitions count as new members','A group with no defining rule'],'A set is well-defined; repeated elements do not add members.'],
 ['Which symbol means “is an element of”?','∈',['⊆','∪','∅'],'Use ∈ for membership and ⊆ to compare sets.'],
 ['Which notation means x is not an element of A?','x ∉ A',['x ⊆ A','A ∈ x','x ∪ A'],'∉ means “is not an element of”.'],
 ['Which is an empty set?','∅',['{0}','{∅}','{1}'],'∅ has no members; {0} has one member.'],
 ['A set with exactly one element is a:','Singleton set',['Power set','Universal set','Infinite set'],'A singleton contains exactly one member.'],
 ['The cardinality of A is written as:','n(A)',['A′','P(A)','A×A'],'n(A) counts distinct members of A.'],
 ['If A={2,4,6}, then n(A)=','3',['2','6','{3}'],'There are three distinct elements.'],
 ['Which is set-builder notation?','A={x∈ℕ : 1≤x≤4}',['A={1,2,3,4}','A has four members','A is drawn as a circle'],'Set-builder notation states a property members satisfy.'],
 ['The rectangle in a standard Venn diagram represents:','The universal set',['The empty set','Only the intersection','A singleton'],'The rectangle represents U.'],
 ['Equal sets have:','Exactly the same elements',['The same number of elements only','The same written order','No common elements'],'Equality requires the same members; order is irrelevant.'],
 ['Equivalent sets have:','The same cardinality',['Exactly the same members','An empty intersection always','The same written order'],'Equivalent sets have the same number of elements.'],
 ['If every element of A belongs to B, then:','A ⊆ B',['A ∈ B','B ⊆ A always','A ∩ B=∅'],'This is the definition of a subset.'],
 ['Which set is a subset of every set?','∅',['U only','Every singleton only','No set'],'The empty set is a subset of every set.'],
 ['If A has 4 elements, the number of subsets of A is:','16',['4','8','24'],'A set with n elements has 2ⁿ subsets.'],
 ['P(A) denotes:','The power set of A',['The complement of A','The cardinality of A','The product A×A'],'The power set contains all subsets of A.'],
 ['The union A∪B contains elements:','In A or B or both',['In both A and B only','In A but never B','Outside both sets'],'Union includes every element found in at least one set.'],
 ['The intersection A∩B contains elements:','Common to A and B',['In A only','In B only','Outside both sets'],'Intersection contains shared elements only.'],
 ['A−B consists of elements:','In A but not in B',['In B but not A','In both A and B','Outside A'],'Difference is directional.'],
 ['The complement A′ consists of:','Elements of U not in A',['Elements of A only','Elements in every set','Elements outside U'],'Complement depends on the stated universal set U.'],
 ['Symmetric difference A △ B contains elements:','In exactly one of A or B',['In both sets only','Outside both sets only','Always in A∩B'],'A △ B=(A−B)∪(B−A).']
 ].forEach(x=>mc(S,x[0],x[1],x[2],x[3]));
 const cases=[
 ['{1,2,3}','{3,4}','{1,2,3,4}','{3}','{1,2}'],
 ['{a,b,c}','{b,c,d}','{a,b,c,d}','{b,c}','{a}'],
 ['{2,4,6}','{4,6,8}','{2,4,6,8}','{4,6}','{2}'],
 ['{1,3,5,7}','{3,6,7}','{1,3,5,6,7}','{3,7}','{1,5}'],
 ['{p,q}','{q,r,s}','{p,q,r,s}','{q}','{p}'],
 ['{0,1,2,3}','{2,3,4}','{0,1,2,3,4}','{2,3}','{0,1}'],
 ['{red,blue}','{blue,green}','{red,blue,green}','{blue}','{red}'],
 ['{5,10,15}','{10,20}','{5,10,15,20}','{10}','{5,15}'],
 ['{m,n,o}','{n,o,p}','{m,n,o,p}','{n,o}','{m}'],
 ['{1,2,4,8}','{2,8,16}','{1,2,4,8,16}','{2,8}','{1,4}']
 ];
 cases.forEach(x=>{
  mc(S,'Let A='+x[0]+' and B='+x[1]+'. Find A∪B.',x[2],[x[3],x[4],x[0]],'Union combines all members of either set without duplication.');
  mc(S,'Let A='+x[0]+' and B='+x[1]+'. Find A∩B.',x[3],[x[2],x[4],'∅'],'Intersection contains only common members.');
  mc(S,'Let A='+x[0]+' and B='+x[1]+'. Find A−B.',x[4],[x[3],x[2],'∅'],'Remove from A every element that also belongs to B.');
 });
 [
 ['Which identity is commutative for union?','A∪B=B∪A',['A∪∅=∅','A−B=B−A','A∩A′=U'],'The order of sets does not change their union.'],
 ['Which is the associative law?','(A∪B)∪C=A∪(B∪C)',['A∪A=A′','A−B=B−A','A∩A′=U'],'Associativity changes grouping, not order.'],
 ['Which is the idempotent law?','A∩A=A',['A∩A′=U','A∪∅=∅','A−A=U'],'Repeating the same set under intersection changes nothing.'],
 ['Which is a union identity?','A∪∅=A',['A∪U=A','A∪A′=∅','A∪∅=∅'],'The empty set is the identity for union.'],
 ['Which is an intersection identity?','A∩U=A',['A∩∅=A','A∩A′=U','A∩U=U'],'Intersecting with U leaves A unchanged.'],
 ['A∪A′ equals:','U',['∅','A','A′'],'A and its complement cover U.'],
 ['A∩A′ equals:','∅',['U','A','A′'],'No element can be in A and outside A at once.'],
 ['Which is De Morgan’s law?','(A∪B)′=A′∩B′',['(A∪B)′=A′∪B′','A−B=B−A','A∩A′=U'],'Complementing a union changes union to intersection.'],
 ['Which is the other De Morgan law?','(A∩B)′=A′∪B′',['(A∩B)′=A′∩B′','A∪A′=∅','A−B=A∩B'],'Complementing an intersection changes intersection to union.'],
 ['If n(A)=6, n(B)=5 and n(A∩B)=2, find n(A∪B).','9',['11','13','3'],'n(A∪B)=6+5−2=9.']
 ].forEach(x=>mc(S,x[0],x[1],x[2],x[3]));
 [
 ['Mathematical induction is used to prove statements about:','Integers in a specified range',['All real numbers without conditions','Only geometric constructions','Only two-variable equations'],'Induction proves a statement for each integer from a specified start.'],
 ['The first step in a standard induction proof is to:','Verify the base case',['Assume the conclusion is false','Skip to k+1','Differentiate both sides'],'The base case confirms the first required integer.'],
 ['The induction hypothesis assumes that:','P(k) is true for an arbitrary allowed k',['P(n) is false for every n','P(k+1) is true without proof','Only P(1) is true'],'Assume the k case to establish the next case.'],
 ['The inductive step must establish:','P(k) ⇒ P(k+1)',['P(k+1) ⇒ P(k) only','P(k) is false','P(1) ⇒ P(0) always'],'The implication moves from one integer case to its successor.'],
 ['If P(1) is true and P(k)⇒P(k+1) for all k≥1, then P(n) is true for:','Every integer n≥1',['Only n=1','Only even n','Every real number n'],'This is the principle of mathematical induction.'],
 ['If a claim starts “for all n≥4”, the base case is normally:','n=4',['n=0 in every case','n=1 regardless of domain','n=100'],'Use the first integer included in the claim.'],
 ['Strong induction may assume:','P(n₀), P(n₀+1), …, P(k) to prove P(k+1)',['P(k+1) to prove P(k+1) itself','No base case','The claim for all real numbers'],'Strong induction allows all previous cases to be assumed.'],
 ['Which is a common logical gap in a faulty induction proof?','Not proving the inductive step',['Showing the base case','Defining P(n)','Stating the domain'],'A base case alone does not establish all later cases.'],
 ['In an induction proof, k should be:','An arbitrary fixed integer in the stated range',['Always the final integer','A real variable without restriction','The answer to an equation'],'The step must work for any allowed k.'],
 ['The correct conclusion after a successful induction proof is:','P(n) holds for every integer in the stated range',['P(n) holds for every real number','Only the base case holds','Only even cases hold'],'The base case and step establish the whole integer range.'],
 ['To prove 1+2+…+n=n(n+1)/2, the base case n=1 is:','1=1(2)/2',['1=1+2','1=1²+1','1=2/1'],'Both sides equal 1.'],
 ['For P(k): 1+…+k=k(k+1)/2, the next sum is:','1+…+k+(k+1)',['1+…+k only','1+…+(k−1)','(k+1)(k+2)/2 only'],'The next case adds k+1 to the sum.'],
 ['Using the hypothesis, k(k+1)/2+(k+1) simplifies to:','(k+1)(k+2)/2',['k(k+2)/2','(k+1)²/2','k(k+1)/2'],'Factor k+1 to obtain (k+1)(k+2)/2.'],
 ['The sum of the first n odd positive integers is:','n²',['n(n+1)/2','2n','n²+1'],'1+3+…+(2n−1)=n².'],
 ['If 1+3+…+(2k−1)=k², the next term added is:','2k+1',['k+1','2k−1','k²'],'The next odd number after 2k−1 is 2k+1.'],
 ['The sum of squares 1²+2²+…+n² is:','n(n+1)(2n+1)/6',['n²(n+1)²/4','n(n+1)/2','n(2n+1)/3'],'This is the standard sum-of-squares formula.'],
 ['The sum of cubes 1³+2³+…+n³ is:','[n(n+1)/2]²',['n(n+1)(2n+1)/6','n²','n(n+1)/2'],'The sum of the first n cubes equals the square of the triangular sum.'],
 ['For n≥1, 2+4+…+2n equals:','n(n+1)',['n(n+1)/2','n²','2n+1'],'Factor 2 from the sum 1+…+n.'],
 ['In proving a divisibility claim, the inductive step should:','Rewrite the k+1 expression using the induction hypothesis',['Assume the k+1 claim directly','Skip the base case','Use numerical examples only'],'The hypothesis must be used to establish the next case.'],
 ['Why is one example not a proof of a statement for all n?','It verifies only one particular case',['Examples are never useful','Induction cannot prove formulas','The base case is always irrelevant'],'A general proof must cover every integer in the stated domain.']
 ].forEach(x=>mc(I,x[0],x[1],x[2],x[3]));
 [
 ['For 1+2+…+10, the sum is:','55',['45','50','100'],'Use n(n+1)/2=10×11/2=55.'],
 ['The sum of the first 8 odd positive integers is:','64',['36','16','81'],'The sum is n², so 8²=64.'],
 ['The sum 1²+2²+3²+4² equals:','30',['20','25','16'],'1+4+9+16=30.'],
 ['The sum 2+4+6+…+20 equals:','110',['100','120','210'],'This is 2(1+…+10)=2×55=110.'],
 ['The sum 1³+2³+3³ equals:','36',['14','27','18'],'1+8+27=36.'],
 ['For P(k+1), the right-hand side of 1+…+n=n(n+1)/2 is:','(k+1)(k+2)/2',['k(k+1)/2','k(k+2)/2','(k+2)/2'],'Replace n with k+1.'],
 ['To prove 5ⁿ−1 divisible by 4, use:','5ᵏ⁺¹−1=5(5ᵏ−1)+4',['5ᵏ⁺¹−1=5ᵏ−1','5ᵏ⁺¹−1=4(5ᵏ+1)','5ᵏ⁺¹−1=5(5ᵏ+1)'],'The right side is a multiple of 4 if the hypothesis is true.'],
 ['To prove 4ⁿ−1 divisible by 3, use:','4ᵏ⁺¹−1=4(4ᵏ−1)+3',['4ᵏ⁺¹−1=4ᵏ−1','4ᵏ⁺¹−1=3(4ᵏ−1)','4ᵏ⁺¹−1=4(4ᵏ+1)'],'The hypothesis term and 3 are both divisible by 3.'],
 ['To prove 8ⁿ−1 divisible by 7, use:','8ᵏ⁺¹−1=8(8ᵏ−1)+7',['8ᵏ⁺¹−1=7(8ᵏ−1)','8ᵏ⁺¹−1=8ᵏ−1','8ᵏ⁺¹−1=8(8ᵏ+1)'],'This expresses the next case using the induction hypothesis.'],
 ['If 11ᵏ−1 is divisible by 10, then 11ᵏ⁺¹−1 equals:','11(11ᵏ−1)+10',['10(11ᵏ−1)','11ᵏ−1−10','11(11ᵏ+1)'],'The rearrangement makes divisibility by 10 clear.']
 ].forEach(x=>mc(I,x[0],x[1],x[2],x[3]));
 [
 ['For every integer n, which product is always even?','n(n+1)',['n(n+2)','n²+1','n(n+3)+1'],'Two consecutive integers include an even integer.'],
 ['n³−n can be factorized as:','n(n−1)(n+1)',['n(n+1)+1','n³+n','(n−1)²'],'The factors are three consecutive integers.'],
 ['Why is n³−n divisible by 3 for every integer n?','Three consecutive integers include a multiple of 3',['Every cube is divisible by 3','n−1 is always divisible by 3','The expression is always odd'],'Among any three consecutive integers, one is divisible by 3.'],
 ['If 3ᵏ≥2k+1, multiplying by 3 gives:','3ᵏ⁺¹≥6k+3',['3ᵏ⁺¹≥2k+1 only','3ᵏ⁺¹=k+4','3ᵏ⁺¹≥6k−3'],'Multiplying both sides by positive 3 preserves the inequality.'],
 ['For n≥1, 2ⁿ≥n+1 has base case:','2¹≥2',['2⁰≥2','1≥2','2²≥2 only'],'Both sides equal 2 at n=1.'],
 ['If 2ᵏ≥k+1, then 2ᵏ⁺¹≥2k+2; for k≥0, why is this enough?','2k+2≥k+2',['2k+2<k+2 always','2k+2=k+1 always','No comparison is needed'],'Since k≥0, subtracting k+2 leaves k≥0.'],
 ['For n≥1, 3ⁿ≥2n+1 has base case:','3≥3',['3≥2','1≥3','3=2'],'Both sides equal 3 at n=1.'],
 ['Which is the correct order of an induction proof?','Base case, hypothesis, inductive step, conclusion',['Conclusion, base case, hypothesis','Inductive step only','Hypothesis and no base case'],'The proof verifies the start, then the step, then states the result.'],
 ['If a statement starts at n=0, the base case should normally be:','P(0)',['P(1) only','P(2) only','P(−1) only'],'Use the first integer in the stated range.'],
 ['A proof establishes P(2) and P(k)⇒P(k+1) for k≥2. It proves:','P(n) for all integers n≥2',['P(n) for all n≥0','P(1) and all real n','Only P(2)'],'The domain starts at the base case 2.']
 ].forEach(x=>mc(I,x[0],x[1],x[2],x[3]));
 notes.MTH101={title:'MTS Maths',topics:[
 {title:S,sections:[
 'A set is a well-defined collection of distinct objects. Membership is written x ∈ A; non-membership is x ∉ A. Order does not matter and repeated entries do not add members.',
 'Represent sets using roster/tabular form, set-builder notation, word description or Venn diagrams. The universal set U contains the objects under discussion and is usually shown as the rectangle in a Venn diagram.',
 'Types include empty set ∅ or {}, singleton, finite and infinite sets, universal set, equal sets, equivalent sets, subsets A ⊆ B, proper subsets, and the power set P(A). Equal sets have the same members; equivalent sets have the same cardinality.',
 'If n(A)=m, then n(P(A))=2ᵐ. For finite sets n(A×B)=n(A)n(B). Cartesian-product pairs are ordered, so A×B is not generally equal to B×A.',
 'Operations: A∪B is union; A∩B is intersection; A−B contains members of A not in B; A′ contains members of U outside A; A △ B=(A−B)∪(B−A).',
 'Laws include commutative, associative, idempotent, identity, complement, absorption and distributive laws. De Morgan: (A∪B)′=A′∩B′ and (A∩B)′=A′∪B′.',
 'For finite sets n(A∪B)=n(A)+n(B)−n(A∩B). If A and B are disjoint, n(A∩B)=0, so add the cardinalities directly. Example: 7+5−2=10 when the intersection has 2 elements.',
 'Exam traps: distinguish ∈ from ⊆; A−B is not generally B−A; specify U before finding a complement; subtract the intersection once in cardinality problems; do not count duplicate roster entries twice.',
 'Worked example (two sets): In a class of 30 students, 18 study Biology, 14 study Chemistry and 6 study both. The number studying at least one is 18+14−6=26. The number studying neither is 30−26=4. The overlap is subtracted once because those 6 students were counted in both groups.',
 'Worked example (complement): If U={1,2,3,4,5,6,7,8} and A={2,4,6,8}, then A′={1,3,5,7}. A complement is always relative to the stated universal set; changing U can change the answer.',
 'How to read set-builder notation: {x∈ℤ : 1≤x≤4} means all integers x such that x is between 1 and 4 inclusive, so the roster form is {1,2,3,4}. The colon means “such that”, and ℤ denotes the integers.',
 'Quick method for Venn questions: write the intersection first, subtract it from each given set total to fill the non-overlapping regions, then use the universal total to find the outside region. Check that every region adds to n(U).'
 ]},
 {title:I,sections:[
 'Mathematical induction proves a statement P(n) for every integer in a specified range. A standard proof has a base case, induction hypothesis, inductive step and conclusion.',
 'Base case: verify P(n₀) at the first integer included in the claim. Do not automatically start at 1 if the question begins at 0 or 4.',
 'Induction hypothesis: assume P(k) for an arbitrary allowed integer k. This is a temporary assumption used to prove the next case.',
 'Inductive step: use P(k) to establish P(k+1). Show the algebra clearly and do not assume P(k+1) itself.',
 'Conclusion: once the base case and step are established, P(n) holds for every integer n≥n₀. Strong induction may assume all previous cases through k to prove k+1.',
 'Worked example: 1+2+…+n=n(n+1)/2. Base n=1: 1=1(2)/2. Assume 1+…+k=k(k+1)/2. Then add k+1: k(k+1)/2+(k+1)=(k+1)(k+2)/2.',
 'Worked example: 1+3+…+(2n−1)=n². Assume the sum to k is k²; add 2k+1 to obtain k²+2k+1=(k+1)².',
 'Divisibility strategy: rearrange the k+1 expression into a multiple of the induction-hypothesis expression plus a multiple of the required divisor. Example: 5ᵏ⁺¹−1=5(5ᵏ−1)+4.',
 'For inequalities, multiply by a positive quantity to preserve the inequality direction, then show the resulting bound is enough for the next case.',
 'Exam traps: use the correct starting integer; label P(k); prove the exact next case; do not confuse examples with proof; do not claim induction proves statements for all real numbers.',
 'Full worked example: Prove 1+2+…+n=n(n+1)/2 for n≥1. Base case n=1: left side 1 and right side 1(2)/2=1. Assume 1+…+k=k(k+1)/2. For k+1, add the next term: k(k+1)/2+(k+1)=[(k+1)(k+2)]/2. This is the required formula with n=k+1, so the result holds for every n≥1.',
 'Worked divisibility example: Prove 7ⁿ−1 is divisible by 6 for n≥1. Base case: 7−1=6. Assume 7ᵏ−1=6m for some integer m. Then 7ᵏ⁺¹−1=7(7ᵏ−1)+6=7(6m)+6=6(7m+1), a multiple of 6. Therefore the claim holds by induction.',
 'Choosing a proof structure: for a sum identity, write the assumed sum and add the next term; for divisibility, rewrite the next expression as a multiple of the assumed divisible expression plus a multiple of the divisor; for inequalities, preserve the inequality direction and explicitly justify the final comparison.',
 'Checklist before submitting: state the domain; verify the base case numerically; write “assume P(k)”; begin the next case with the expression for k+1; use the hypothesis visibly; simplify to the exact target; finish with a conclusion covering the stated domain.'
 ]}
 ]};
})();