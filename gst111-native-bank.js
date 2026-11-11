/* GST 111 source audit manifest.
 * The supplied PDF was audited as 1,093 candidate records: 1,092 answer-keyed
 * records were extractable; one additional candidate lacked a usable key.
 * Original source wording and source option sets are intentionally not shipped
 * to the student-facing app. Original topical practice lives in
 * gst111-curated-pack.js and is grouped into the existing course sections.
 */
(function () {
  window.__GST111_SOURCE_AUDIT__ = {
    sourceFile: "GST 111 PQ(4)(1).pdf",
    candidateRecords: 1093,
    answerKeyedRecordsExtracted: 1092,
    unkeyedOrMalformedCandidates: 1,
    importedSourceQuestionText: 0,
    exactDuplicateOccurrences: 279,
    normalizedUniqueStems: 813,
    duplicateStemGroups: 146,
    answerMappingsRequiringReview: 22,
    answerKeysIndependentlyVerified: false,
    topicCounts: {
      "Study skills": 71,
      "Morphology and word formation": 224,
      "Phonetics and phonology": 180,
      "Communication skills": 80,
      "Essay writing": 67,
      "Correspondence": 60,
      "Dictionary skills, lexis and vocabulary": 46,
      "Paragraph development": 31,
      "Language, society and English in Nigeria": 29,
      "Creative writing and literary forms": 25,
      "Meetings and reports": 20,
      "Research and academic writing": 17,
      "Reading and listening": 12,
      "Grammar and sentence construction": 231
    },

    studentFacingQuestionSource: "gst111-curated-pack.js"
  };
  window.__GST111_SOURCE_IMPORT__ = Object.assign({}, window.__GST111_SOURCE_IMPORT__ || {}, {
    questions: 0,
    sourceRecordsAudited: 1093,
    sourceRecordsExtracted: 1092,
    sourceTextImported: false,
    answerKeysIndependentlyVerified: false
  });
})();
