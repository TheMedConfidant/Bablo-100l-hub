/* Additional Mathematical Induction questions to complete the 60-question topic bank. */
(function(){
 const b=window.__BANK__||(window.__BANK__=[]), old=new Set(b.map(q=>q.i));
 const topic='Mathematical Induction';
 const rows=[
 ['The sum 1+2+…+n is 78 when n is:','12',['11','13','14'],'12×13/2=78.'],
 ['The sum of the first 5 odd positive integers is:','25',['15','20','30'],'The sum of the first n odd numbers is n².'],
 ['For n≥1, 5ⁿ≥n+4 has base case:','5≥5',['5≥4','1≥5','5=4'],'At n=1 both sides equal 5.'],
 ['If P(k) is 1+…+k=k(k+1)/2, then the next case requires adding:','k+1',['k','2k+1','k²'],'The next partial sum adds the next integer k+1.'],
 ['Which expression is a correct factorization of k²+3k+2?','(k+1)(k+2)',['(k+1)²','k(k+2)','(k+3)(k−1)'],'Expanding (k+1)(k+2) gives k²+3k+2.'],
 ['To prove 10ⁿ−1 is divisible by 9, write the next case as:','10(10ᵏ−1)+9',['9(10ᵏ−1)','10ᵏ−1−9','10(10ᵏ+1)'],'The expression is 10 times the hypothesis term plus 9.'],
 ['To prove 2ⁿ−1 is odd for n≥1, use the fact that:','2ⁿ is even, so 2ⁿ−1 is odd',['2ⁿ is odd','2ⁿ−1 is always prime','Every odd number is a power of 2'],'An even integer minus one is odd.'],
 ['If P(k) gives 1+3+…+(2k−1)=k², the next sum is:','k²+(2k+1)',['k²+(k+1)','k²+(2k−1)','k²−(2k+1)'],'The next odd term is 2k+1.'],
 ['Simplify k²+(2k+1):','(k+1)²',['k²+1','(k+2)²','k(k+1)'],'k²+2k+1 is a perfect square.'],
 ['Which statement is necessary for standard induction?','A verified base case and a valid inductive step',['A numerical check for n=1 only','A graph of P(n)','The statement is true for real numbers'],'Both the base case and implication to the next case are needed.'],
 ['For n≥2, a claim should normally be checked first at:','n=2',['n=1 always','n=0 always','n=100'],'Start at the first integer included in the claim.'],
 ['If 6ᵏ−1 is divisible by 5, then 6ᵏ⁺¹−1 equals:','6(6ᵏ−1)+5',['5(6ᵏ−1)','6ᵏ−1−5','6(6ᵏ+1)'],'The rearrangement isolates a multiple of 5.'],
 ['If 3ᵏ−1 is even, then 3ᵏ⁺¹−1 can be written as:','3(3ᵏ−1)+2',['2(3ᵏ−1)','3ᵏ−1−2','3(3ᵏ+1)'],'Three times an even number plus 2 is even.'],
 ['Which inequality operation preserves direction automatically?','Multiplying both sides by a positive number',['Multiplying by a negative number without reversing the sign','Squaring both sides in every case','Taking reciprocals in every case'],'Multiplication by a positive number preserves inequality direction.'],
 ['For all integers n, n(n+1)(n+2) is divisible by 6 because:','Three consecutive integers include a multiple of 2 and a multiple of 3',['Every integer is divisible by 6','n+1 is always divisible by 6','The product is always prime'],'Among three consecutive integers, one is even and one is divisible by 3.'],
 ['What is the induction hypothesis when proving 2ⁿ≥n+1?','Assume 2ᵏ≥k+1 for an allowed k',['Assume 2ᵏ⁺¹≥k+2 without proof','Assume the claim for real n','Assume 2ᵏ=0'],'The hypothesis is the k-case of the statement being proved.'],
 ['What must the final line of an induction proof state?','Therefore P(n) holds for every integer in the stated range',['Therefore P(n) holds for all real numbers','Only P(1) is true','The hypothesis is always false'],'The conclusion applies the induction principle to the specified integer range.'],
 ['Which is an example of a divisibility claim suited to induction?','7ⁿ−1 is divisible by 6 for all integers n≥1',['Every real number is an integer','A circle has four corners','x+1=x for all real x'],'A family of integer-indexed powers can be proved by induction.'],
 ['If P(k) is true and the step proves P(k+1), which case follows next?','P(k+1)',['P(k−1) only','P(k) is false','No case follows'],'The inductive step establishes the successor case.'],
 ['Why must the induction hypothesis be used carefully?','It is an assumption for the k-case, not the conclusion for k+1',['It proves the result for every real number','It replaces the base case','It means the statement is false'],'Use the k-case to derive, not assume, the next case.']
 ];
 rows.forEach((r,i)=>{
  const id='MTH101-MTS-EXTRA-'+String(i+1).padStart(3,'0'); if(old.has(id))return;
  const opts=[r[1],...r[2]], shift=(i*3+1)%4, rotated=opts.slice(shift).concat(opts.slice(0,shift));
  b.push({i:id,c:'MTH101',u:topic,s:'mcq',q:r[0],o:rotated,a:rotated.indexOf(r[1]),e:r[3]}); old.add(id);
 });
})();