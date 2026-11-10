/* GST 111 topical practice pack — original question variants mapped to the uploaded PQ concepts.
 * Source coverage map: 14 topic clusters from the 246-page GST 111 past-question PDF.
 * These are original practice questions, not copied source questions. Verify flagged source answer-key
 * anomalies against lecturer materials before treating the source key as authoritative.
 */
(function () {
  const topics = [
    ["Study skills", [
      ["A student records key points while a lecturer is explaining a concept. This is:",["Note-taking","Proofreading","Indexing","Paraphrasing"],0,"Note-taking captures important information during a lesson or presentation."],
      ["A learner reorganises lecture notes after class, adds headings and clarifies ideas. This is:",["Note-taking","Note-making","Dictation","Skimming"],1,"Note-making develops, organises and clarifies information during study."],
      ["Which action is most useful before a lecture?",["Arrive without materials","Preview the topic and prepare writing materials","Copy another student's notes","Avoid the course outline"],1,"Preparation helps the learner follow the lecture and identify important points."],
      ["A student studies in a noisy corridor and repeatedly loses concentration. The main obstacle is:",["An external distraction","An internal distraction","A memory cue","A study objective"],0,"Noise in the environment is an external distraction."],
      ["Worrying about an unrelated personal matter while reading is an example of:",["External noise","Internal distraction","A reference source","A reading strategy"],1,"Internal distractions arise from thoughts, feelings or concerns within the learner."],
      ["Which method best checks whether a student understands a topic?",["Rereading without pause","Self-testing and explaining the idea in their own words","Highlighting every sentence","Keeping the book open"],1,"Retrieval practice and self-explanation test understanding rather than familiarity."],
      ["A realistic study timetable should include:",["Only the most difficult course","Specific tasks, time blocks and breaks","No revision periods","Every hour without rest"],1,"A useful timetable allocates achievable tasks and includes breaks and review."],
      ["When lecture notes contain unclear abbreviations, the best action is to:",["Guess their meaning later","Clarify and expand them soon after the lecture","Delete the whole page","Memorise the abbreviations without context"],1,"Clarifying notes promptly reduces later misunderstanding."]
    ]],
    ["Morphology and word formation", [
      ["The smallest unit that carries meaning or grammatical function is a:",["Phoneme","Morpheme","Syllable","Clause"],1,"A morpheme is the smallest meaningful or grammatical unit in a language."],
      ["In the word 'careless', the element 'care' is a:",["Bound morpheme","Free morpheme","Suffix","Inflection"],1,"Care can stand as an independent word, so it is a free morpheme."],
      ["In 'unhappy', the prefix 'un-' is:",["A free morpheme","A bound morpheme","A root word","A compound"],1,"The prefix cannot normally stand alone; it must attach to a base."],
      ["Adding '-ness' to 'kind' to form 'kindness' is:",["Prefixation","Suffixation","Clipping","Back-formation"],1,"Suffixation adds a bound morpheme after a base."],
      ["Which process forms 'disagree' from 'agree'?",["Prefixation","Suffixation","Blending","Reduplication"],0,"The prefix dis- is added before the base agree."],
      ["The grammatical contrast between 'book' and 'books' is an example of:",["Inflection","Blending","Clipping","Borrowing"],0,"The plural suffix marks grammatical number without creating a new lexical category."],
      ["The word 'brunch', formed from parts of 'breakfast' and 'lunch', illustrates:",["Clipping","Blending","Compounding","Conversion"],1,"Blending combines portions of two source words."],
      ["Shortening 'laboratory' to 'lab' is:",["Clipping","Affixation","Compounding","Borrowing"],0,"Clipping reduces a word while retaining its basic meaning."]
    ]],
    ["Phonetics and phonology", [
      ["The physical production and properties of speech sounds are studied in:",["Syntax","Phonetics","Semantics","Morphology"],1,"Phonetics examines how speech sounds are produced, transmitted and perceived."],
      ["The study of how sounds function and pattern in a particular language is:",["Phonology","Lexicography","Pragmatics","Graphology"],0,"Phonology analyses sound systems and meaningful sound contrasts."],
      ["A speech sound produced with a complete closure followed by release is a:",["Plosive","Fricative","Nasal","Approximant"],0,"Plosives involve a complete blockage of airflow and a release."],
      ["Which description best fits a diphthong?",["A steady vowel quality","A glide from one vowel quality to another within one syllable","A consonant cluster","A silent letter"],1,"A diphthong changes vowel quality during its articulation."],
      ["A monophthong is characterised by:",["Two separate syllables","One relatively steady vowel quality","A complete consonant closure","A change in word stress"],1,"A monophthong maintains a relatively stable vowel quality."],
      ["The sound at the beginning of 'thin' is normally classified as:",["Voiced alveolar stop","Voiceless dental fricative","Voiced bilabial nasal","Voiceless velar stop"],1,"The initial sound is /θ/, a voiceless dental fricative."],
      ["When the vocal folds vibrate during articulation, the sound is:",["Voiced","Voiceless","A diphthong","A syllable"],0,"Voicing is associated with vibration of the vocal folds."],
      ["The prominent beat or emphasis within a word is called:",["Stress","Intonation","Assimilation","Elision"],0,"Word stress marks a syllable as more prominent than others."]
    ]],
    ["Communication skills", [
      ["Communication is most accurately described as:",["A one-way transfer only","A process of exchanging meaning or information","The act of speaking loudly","A form of handwriting"],1,"Communication involves sending, receiving and interpreting messages."],
      ["In a basic communication model, the person who initiates a message is the:",["Receiver","Sender","Channel","Feedback"],1,"The sender originates and encodes the message."],
      ["The medium through which a message travels is the:",["Context","Channel","Feedback","Noise"],1,"A channel may be spoken, written, visual or electronic."],
      ["A listener's response showing how a message was understood is:",["Encoding","Feedback","Noise","Transmission"],1,"Feedback allows the sender to assess the receiver's response."],
      ["A barrier caused by unfamiliar technical vocabulary is primarily:",["Semantic noise","Physical noise","Mechanical failure","Silence"],0,"Semantic noise arises when words or symbols are interpreted differently."],
      ["Listening that involves attention, interpretation and response is:",["Active listening","Pretending to listen","Selective hearing","Mechanical hearing"],0,"Active listening requires deliberate attention and engagement."],
      ["Which behaviour supports effective listening?",["Interrupting to finish every sentence","Maintaining attention and asking relevant clarifying questions","Planning a reply while ignoring the speaker","Changing the subject repeatedly"],1,"Attentive listening and clarification improve shared understanding."],
      ["A message is most likely to be misunderstood when it is:",["Clear and audience-appropriate","Ambiguous and poorly organised","Supported by useful feedback","Delivered through a suitable channel"],1,"Ambiguity and poor organisation reduce message clarity."]
    ]],
    ["Grammar and sentence construction", [
      ["Which sentence contains a correctly matched subject and verb?",["The list of items are long","The list of items is long","The list of items were long","The list of items be long"],1,"The head noun list is singular, so it takes the singular verb is."],
      ["In the sentence 'Although it rained, the match continued', the opening clause is:",["A subordinate clause","A main clause","A noun phrase","A prepositional phrase"],0,"Although introduces a dependent adverbial clause."],
      ["Which punctuation mark most directly joins two closely related independent clauses without a conjunction?",["Semicolon","Apostrophe","Hyphen","Question mark"],0,"A semicolon can link closely related independent clauses."],
      ["Choose the sentence with correct pronoun-antecedent agreement.",["Each student must submit their forms yesterday","The students submitted their forms","The students submits their forms","The student have submitted their forms"],1,"The plural antecedent students agrees with the plural pronoun their and verb submitted."],
      ["A group of words that contains a subject and a predicate is a:",["Clause","Morpheme","Prefix","Syllable"],0,"A clause contains a subject and a predicate."],
      ["Which word functions as a conjunction in 'We stayed indoors because it was raining'?",["Stayed","Because","Indoors","Raining"],1,"Because introduces the reason clause and functions as a subordinating conjunction."],
      ["The sentence 'Please close the door' is:",["Imperative","Interrogative","Exclamatory","Declarative"],0,"An imperative sentence gives a command or request."],
      ["Which sentence is in the passive voice?",["The committee approved the proposal","The proposal was approved by the committee","The committee is approving the proposal","The committee will approve the proposal"],1,"The subject proposal receives the action in the passive construction was approved."]
    ]],
    ["Essay writing", [
      ["The central claim an argumentative essay seeks to establish is its:",["Thesis statement","Bibliography","Appendix","Salutation"],0,"The thesis states the main position or controlling argument."],
      ["The opening section of an essay should normally:",["Introduce the subject and establish direction","Present every reference in full","Repeat the conclusion","Contain unrelated examples"],0,"An introduction orients the reader and leads towards the thesis."],
      ["A paragraph that develops one main supporting reason should contain:",["A topic sentence and relevant support","Only quotations","Several unrelated claims","A list of references only"],0,"A coherent body paragraph develops one controlling idea with evidence or explanation."],
      ["Which practice helps an essay maintain coherence?",["Randomly changing subjects","Using logical sequencing and appropriate transitions","Repeating the same sentence","Removing paragraph breaks"],1,"Logical order and transitions show how ideas relate."],
      ["An essay conclusion should generally:",["Introduce several new arguments","Synthesize the discussion and reinforce the main position","Copy the introduction word for word","List unrelated definitions"],1,"A conclusion draws together the argument without opening a new line of discussion."],
      ["The purpose of an outline is to:",["Organise ideas before drafting","Replace the need for a thesis","Provide the final bibliography","Correct spelling automatically"],0,"An outline gives the essay a planned structure."],
      ["Using another writer's words without acknowledgement is:",["Paraphrasing","Plagiarism","Summarising","Proofreading"],1,"Unacknowledged use of another person's expression constitutes plagiarism."],
      ["Which revision improves an overly wordy sentence?",["Add more filler phrases","Remove repetition while preserving the meaning","Delete the subject and verb","Replace clear words with jargon"],1,"Concise revision removes unnecessary wording without losing meaning."]
    ]],
    ["Correspondence", [
      ["A formal letter normally begins with:",["An appropriate address and date","A personal diary entry","A bibliography","A table of contents"],0,"Formal correspondence follows an organised layout that identifies sender, date and recipient."],
      ["The subject line of a formal email should:",["Summarise the purpose briefly","Contain the entire message","Use an unrelated joke","Be left deliberately confusing"],0,"A concise subject helps the recipient identify the message's purpose."],
      ["Which salutation is suitable when writing formally to a named recipient?",["Dear Dr Adeyemi,","Hi bestie,","Yo there,","What's up?"],0,"A respectful title and surname are suitable in formal correspondence."],
      ["The main body of a formal request should:",["State the request clearly and provide necessary context","Hide the purpose until the final line","Use slang throughout","Contain unrelated personal stories"],0,"The body should communicate the purpose, relevant details and requested action."],
      ["A complimentary close is:",["The polite ending of a letter","The opening address","The subject heading","The reference list"],0,"A complimentary close provides a courteous ending before the signature."],
      ["Which feature distinguishes a memo from many personal letters?",["It is commonly used for internal organisational communication","It must always be handwritten","It has no purpose","It is written only to family members"],0,"Memos commonly communicate information within an organisation."],
      ["When replying to an official complaint, the writer should:",["Acknowledge the issue and respond professionally","Attack the complainant","Ignore the facts","Use insulting language"],0,"Professional replies acknowledge concerns and address them clearly."],
      ["Before sending an official email, it is important to:",["Check recipient, attachment and tone","Send without proofreading","Use an empty subject","Include confidential details unnecessarily"],0,"A final check helps prevent delivery errors and inappropriate disclosure."]
    ]],
    ["Dictionary skills, lexis and vocabulary", [
      ["The complete vocabulary of a language is its:",["Lexis","Syntax","Phonetics","Orthography"],0,"Lexis refers to the vocabulary or lexical stock of a language."],
      ["Words arranged alphabetically with meanings and usage information are found in a:",["Dictionary","Atlas","Timetable","Memo"],0,"A dictionary provides information about words, including meanings and often pronunciation and usage."],
      ["The guide words at the top of a dictionary page indicate:",["The first and last entries on that page","The author's biography","The book's price","The number of chapters"],0,"Guide words help users locate entries quickly."],
      ["A word with a similar meaning to another word is a:",["Synonym","Antonym","Homophone","Homograph"],0,"Synonyms have similar or closely related meanings."],
      ["A word opposite in meaning to another is an:",["Antonym","Acronym","Synonym","Allophone"],0,"Antonyms express contrasting or opposite meanings."],
      ["Words that sound alike but differ in meaning and often spelling are:",["Homophones","Synonyms","Prefixes","Morphemes"],0,"Homophones share pronunciation but differ in meaning and may differ in spelling."],
      ["The pronunciation guide in a dictionary is commonly represented using:",["Phonetic symbols","Roman numerals","Map coordinates","Musical notation"],0,"Phonetic transcription represents pronunciation using sound symbols."],
      ["Which information may a dictionary entry provide besides meaning?",["Part of speech and pronunciation","The user's examination score","The writer's private messages","A university timetable"],0,"Entries often include pronunciation, grammatical category, usage labels and examples."]
    ]],
    ["Paragraph development", [
      ["A well-developed paragraph is usually organised around:",["One controlling idea","Several unrelated topics","A title only","A list of page numbers"],0,"Unity requires a paragraph to focus on one main idea."],
      ["The sentence that introduces a paragraph's main idea is the:",["Topic sentence","Closing salutation","Footnote","Caption"],0,"The topic sentence states the paragraph's controlling idea."],
      ["Examples and explanations in a paragraph function as:",["Supporting details","The title","The bibliography","The page margin"],0,"Supporting details clarify and substantiate the main point."],
      ["A concluding sentence in a paragraph should:",["Bring the point to a logical close","Introduce a completely new topic","Contradict the topic sentence","Repeat every detail"],0,"A closing sentence reinforces or rounds off the paragraph's idea."],
      ["Paragraph unity is weakened when a writer:",["Includes irrelevant details","Uses relevant evidence","Explains the topic","Maintains a clear focus"],0,"Irrelevant details distract from the paragraph's controlling idea."],
      ["A transition such as 'however' commonly signals:",["Contrast","Chronology only","Definition","An example only"],0,"However introduces a contrast or qualification."],
      ["A paragraph developed by explaining similarities and differences uses:",["Comparison and contrast","Chronological narration only","A salutation","Alphabetical listing"],0,"Comparison and contrast organises information around likenesses and differences."],
      ["Which sequence is most suitable for a process paragraph?",["Steps in the order they occur","Randomly selected details","Alphabetical order regardless of process","Conclusion before the first step"],0,"Process writing normally follows chronological or logical sequence."]
    ]],
    ["Language, society and English in Nigeria", [
      ["A variety of language associated with a particular region is commonly called a:",["Dialect","Register","Idiolect","Jargon list"],0,"A dialect is associated with a regional or social group and may differ in vocabulary, grammar or pronunciation."],
      ["Language variation according to situation or use is called:",["Register","Accent only","Morpheme","Orthography"],0,"Register varies with context, purpose and field of communication."],
      ["The distinctive language habits of an individual speaker are an:",["Idiolect","Isogloss","Register","Alphabet"],0,"An idiolect is an individual's distinctive use of language."],
      ["A language used for wider communication among people with different first languages may serve as a:",["Lingua franca","Private code","Silent letter","Suffix"],0,"A lingua franca enables communication across different language communities."],
      ["In multilingual Nigeria, English commonly functions as:",["A major official and wider communication language","The only indigenous language","A language spoken by every person as a first language","A language without regional variation"],0,"English has official and inter-ethnic communication roles in Nigeria."],
      ["The use of two or more languages by an individual or community is:",["Multilingualism","Monolingualism","Clipping","Concord"],0,"Multilingualism involves the use of multiple languages."],
      ["A speaker's pronunciation pattern is most directly associated with:",["Accent","Paragraph unity","Suffixation","Bibliography"],0,"Accent refers particularly to pronunciation features."],
      ["A specialised vocabulary used by members of a profession is often called:",["Jargon","Homophone","Diphthong","Topic sentence"],0,"Jargon consists of specialised terms used within a field or group."]
    ]],
    ["Creative writing and literary forms", [
      ["A short fictional prose narrative is commonly called a:",["Short story","Minutes","Memo","Abstract"],0,"A short story is a brief work of fictional prose."],
      ["The sequence of events in a literary work is its:",["Plot","Setting","Rhyme","Register"],0,"Plot is the organised sequence of events in a narrative."],
      ["The time and place in which a story occurs form its:",["Setting","Theme","Dialogue","Metre"],0,"Setting establishes the story's temporal and physical context."],
      ["The central idea explored in a literary work is its:",["Theme","Stage direction","Footnote","Title page"],0,"Theme is the central idea or insight developed by a work."],
      ["The person or voice that tells a story is the:",["Narrator","Audience","Editor","Publisher"],0,"The narrator presents the events of a narrative."],
      ["A comparison using 'like' or 'as' is a:",["Simile","Metaphor","Irony","Alliteration"],0,"A simile explicitly compares unlike things using like or as."],
      ["The repetition of initial consonant sounds in nearby words is:",["Alliteration","Hyperbole","Personification","Onomatopoeia"],0,"Alliteration repeats initial consonant sounds for effect."],
      ["A poem arranged in lines and often using condensed language is a form of:",["Poetry","Minutes","Circular","Business letter"],0,"Poetry commonly uses lines, rhythm, imagery and concentrated language."]
    ]],
    ["Meetings and reports", [
      ["The written record of what happened at a meeting is called:",["Minutes","Agenda","Circular","Abstract"],0,"Minutes provide an official record of proceedings, decisions and actions."],
      ["The list of items to be discussed at a meeting is the:",["Agenda","Minutes","Appendix","Memo"],0,"An agenda outlines the business planned for a meeting."],
      ["The person who presides over a meeting is the:",["Chairperson","Typist","Reporter","Audience"],0,"The chairperson guides proceedings and maintains order."],
      ["A quorum is:",["The minimum number of members required for valid business","The final paragraph of a report","A list of apologies only","The meeting venue"],0,"A quorum is the minimum attendance needed for a meeting to conduct valid business."],
      ["Minutes should record decisions and:",["Action points and responsibilities","Every private conversation outside the meeting","Unverified rumours","Unrelated personal opinions"],0,"Useful minutes record decisions, actions and assigned responsibilities."],
      ["A formal report should normally be:",["Clear, organised and evidence-based","Vague and emotional","Unstructured and anonymous","Made entirely of jokes"],0,"Reports communicate findings in a structured, objective manner."],
      ["The section that briefly presents a report's main findings is often the:",["Executive summary","Appendix only","Salutation","Index"],0,"An executive summary gives readers a concise overview of the report."],
      ["A report recommendation should be:",["Linked to the findings","Unrelated to the evidence","A personal attack","A repetition of the title"],0,"Recommendations should follow logically from the evidence and conclusions."]
    ]],
    ["Research and academic writing", [
      ["A research problem identifies:",["The issue or gap the study intends to investigate","The final grade of the researcher","The font used in the report","The number of pages only"],0,"A research problem defines the issue that motivates the investigation."],
      ["A testable tentative explanation is a:",["Hypothesis","Bibliography","Appendix","Acknowledgement"],0,"A hypothesis is a provisional proposition that can be examined using evidence."],
      ["The list of sources cited or consulted is the:",["Reference list or bibliography","Agenda","Abstract title","Topic sentence"],0,"References acknowledge sources and allow readers to locate them."],
      ["A direct quotation should normally be:",["Clearly marked and properly attributed","Presented as the writer's own words","Used without any citation","Changed only by deleting the author"],0,"Quotation marks or block formatting and citation identify borrowed wording."],
      ["A summary should:",["Present the main ideas concisely in new wording","Copy every sentence","Add unsupported claims","Remove the central argument"],0,"A summary condenses the key points without unnecessary detail."],
      ["The abstract of a research report gives:",["A concise overview of the study","A full copy of every chapter","Only the author's home address","A list of unrelated quotations"],0,"An abstract briefly states the problem, approach, key findings and conclusion."],
      ["A variable that is deliberately changed or selected by the researcher is commonly the:",["Independent variable","Dependent variable","Constant result","Reference variable"],0,"The independent variable is the presumed influencing or explanatory variable."],
      ["Academic integrity requires a writer to:",["Acknowledge sources and report evidence honestly","Invent references","Hide borrowed ideas","Alter findings to fit expectations"],0,"Academic integrity depends on honest reporting and proper attribution."]
    ]],
    ["Reading and listening", [
      ["Reading quickly to obtain the general idea of a passage is:",["Skimming","Scanning","Proofreading","Dictation"],0,"Skimming gives an overview of the text's main idea."],
      ["Reading to locate a specific date or name is:",["Scanning","Skimming","Extensive reading","Recitation"],0,"Scanning searches a text for a particular item of information."],
      ["Careful reading to understand details and relationships is:",["Intensive reading","Skimming","Browsing headlines","Guessing"],0,"Intensive reading focuses on close comprehension of a text."],
      ["Reading widely for general interest and overall understanding is:",["Extensive reading","Proofreading","Scanning","Copy-editing"],0,"Extensive reading involves reading larger amounts for general understanding or pleasure."],
      ["A listener who concentrates, interprets and responds is using:",["Active listening","Passive exposure","Selective ignoring","Background hearing"],0,"Active listening involves attention and meaningful response."],
      ["A major purpose of listening for specific information is to:",["Identify particular facts or details","Memorise every sound","Ignore the speaker's purpose","Evaluate handwriting"],0,"Focused listening targets required details such as names, dates or instructions."],
      ["Predicting content from a title before reading is an example of:",["Using prior knowledge","Proofreading","Indexing","Transcription"],0,"Prior knowledge supports prediction and prepares the reader for new information."],
      ["A listener should ask for clarification when:",["A key point is unclear","The message is fully understood","The speaker has finished and no response is needed","The topic is familiar"],0,"Clarification checks meaning and prevents misunderstanding."]
    ]]
  ];
  const bank = window.__BANK__ || (window.__BANK__ = []);
  const seen = new Set(bank.map(x => x.i));
  let n = 0;
  topics.forEach(([topic, questions], ti) => questions.forEach(([q,o,a,e]) => {
    const id = "GST111-TOPIC-" + String(ti+1).padStart(2,"0") + "-" + String(++n).padStart(3,"0");
    if (!seen.has(id)) bank.push({i:id,c:"GST111",u:topic,s:"mcq",q,o,a,e});
  }));
  const cards = [
    ["Study skills",[
      ["What is note-taking?","Recording important information during a lecture, lesson or meeting."],
      ["How does note-making differ from note-taking?","Note-making develops and organises information during study; note-taking records information as it is presented."],
      ["What are internal distractions?","Distractions arising within the learner, such as worry or unrelated thoughts."],
      ["What are external distractions?","Distractions arising from the environment, such as noise or interruptions."]
    ]],
    ["Morphology and word formation",[
      ["Define a morpheme.","The smallest unit in a language that carries meaning or grammatical function."],
      ["Differentiate free and bound morphemes.","A free morpheme can stand alone; a bound morpheme must attach to another morpheme."],
      ["What is prefixation?","The addition of a bound morpheme before a base or root."],
      ["How do clipping and blending differ?","Clipping shortens one word; blending combines parts of two or more words."]
    ]],
    ["Phonetics and phonology",[
      ["What does phonetics study?","The production, transmission and perception of speech sounds."],
      ["What does phonology study?","The organisation and function of sounds within a language."],
      ["Differentiate a monophthong and a diphthong.","A monophthong has a relatively steady vowel quality; a diphthong glides between vowel qualities."],
      ["What is word stress?","The relative prominence given to a syllable in a word."]
    ]],
    ["Communication skills",[
      ["What is feedback in communication?","A receiver's response that indicates how a message has been understood."],
      ["What is a communication channel?","The medium through which a message is transmitted."],
      ["What is semantic noise?","Interference caused by unclear, unfamiliar or differently interpreted words and symbols."],
      ["What is active listening?","Attentive listening that involves interpreting, checking and responding to a message."]
    ]],
    ["Grammar and sentence construction",[
      ["What is grammatical concord?","Agreement between grammatical elements, especially a subject and its verb."],
      ["What is a clause?","A group of words containing a subject and a predicate."],
      ["What is an imperative sentence?","A sentence that gives a command, instruction or request."],
      ["What distinguishes active and passive voice?","In active voice the subject performs the action; in passive voice the subject receives the action."]
    ]],
    ["Essay writing",[
      ["What is a thesis statement?","The central claim or controlling position an essay develops."],
      ["What is the purpose of an essay outline?","To organise the main ideas and supporting points before drafting."],
      ["What should a conclusion do?","Synthesize the discussion and reinforce the main argument without introducing a major new one."],
      ["What is plagiarism?","Presenting another person's words or ideas as one's own without proper acknowledgement."]
    ]],
    ["Correspondence",[
      ["What is formal correspondence?","Official or professional written communication that follows accepted conventions of tone and layout."],
      ["What is the function of an email subject line?","To summarise the message's purpose so the recipient can identify it quickly."],
      ["What is a complimentary close?","The polite closing phrase placed before the writer's name or signature."],
      ["What should be checked before sending an official email?","The recipient, subject, message clarity, tone and any intended attachment."]
    ]],
    ["Dictionary skills, lexis and vocabulary",[
      ["What does lexis mean?","The vocabulary or complete stock of words in a language."],
      ["What are guide words in a dictionary?","Words showing the first and last entries on a page."],
      ["What is a synonym?","A word with the same or a closely related meaning as another word."],
      ["What is a homophone?","A word that shares pronunciation with another word but differs in meaning and often spelling."]
    ]],
    ["Paragraph development",[
      ["What is paragraph unity?","The quality of a paragraph in which all sentences support one controlling idea."],
      ["What is a topic sentence?","A sentence that states the main idea of a paragraph."],
      ["What is the role of supporting details?","They explain, illustrate or provide evidence for the paragraph's main idea."],
      ["What is a transition in paragraph writing?","A word or phrase that signals a relationship between ideas or sentences."]
    ]],
    ["Language, society and English in Nigeria",[
      ["What is a dialect?","A language variety associated with a region or social group."],
      ["What is register?","Language variation according to situation, purpose or field of use."],
      ["What is an idiolect?","The distinctive language habits of an individual speaker."],
      ["What is a lingua franca?","A language used for communication among people with different first languages."]
    ]],
    ["Creative writing and literary forms",[
      ["What is plot?","The organised sequence of events in a narrative."],
      ["What is setting?","The time and place in which a literary work occurs."],
      ["What is theme?","The central idea or insight explored in a literary work."],
      ["What is a simile?","A comparison of unlike things using words such as like or as."]
    ]],
    ["Meetings and reports",[
      ["What are minutes?","The formal written record of a meeting's proceedings, decisions and action points."],
      ["What is an agenda?","The list of items planned for discussion at a meeting."],
      ["What is a quorum?","The minimum number of members required for a meeting to conduct valid business."],
      ["What is an executive summary?","A concise overview of a report's purpose, main findings and conclusions."]
    ]],
    ["Research and academic writing",[
      ["What is a research problem?","The issue, question or knowledge gap that a study sets out to investigate."],
      ["What is a hypothesis?","A tentative proposition that can be examined using evidence."],
      ["Why are sources cited?","To acknowledge borrowed ideas and enable readers to trace the supporting material."],
      ["What is an abstract?","A brief overview of a research work, including its focus, approach and key findings."]
    ]],
    ["Reading and listening",[
      ["What is skimming?","Reading quickly to grasp the general idea or overall structure of a text."],
      ["What is scanning?","Searching a text for a specific fact or piece of information."],
      ["What is intensive reading?","Close reading aimed at understanding details and relationships in a text."],
      ["What is extensive reading?","Reading larger amounts for general understanding, information or enjoyment."]
    ]]
  ];
  window.__CARDS__ = window.__CARDS__ || {};
  const prior = window.__CARDS__.GST111 || [];
  const cardSeen = new Set(prior.map(c => (c.front || c.q || "").trim().toLowerCase()));
  let ci = 0;
  cards.forEach(([topic, items]) => items.forEach(([front,back]) => {
    if (!cardSeen.has(front.toLowerCase())) prior.push({id:"GST111-FC-"+String(++ci).padStart(3,"0"),front,back,u:topic});
  }));
  window.__CARDS__.GST111 = prior;
})();