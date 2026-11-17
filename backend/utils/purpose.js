// Guesses why a call happened by counting keywords in the transcript.
// English, Hinglish and Hindi words are included. Add more words anytime.
const RULES = [
  ['Fee payment / reminder', /\bfees?\b|payment|\bpaid\b|pending|\bdue\b|instal+ment|receipt|scholarship|फीस|भुगतान/g],
  ['Admission & course enquiry', /admission|enrol+|apply|application|course|branch|b\.?tech|m\.?tech|mba|bca|diploma|eligib|cut-?off|seats?|syllabus|एडमिशन|कोर्स|प्रवेश/g],
  ['Hostel & transport', /hostel|\bmess\b|\bbus\b|transport|\broom\b|होस्टल|बस/g],
  ['Placement & internship', /placement|package|recruit|internship|\bjob\b|\bcompanies\b|प्लेसमेंट/g],
  ['Exam, results & attendance', /\bexams?\b|result|\bmarks\b|attendance|semester|backlog|परीक्षा|रिजल्ट/g],
];

module.exports = function purpose(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return 'No conversation';
  let best = 'General enquiry', max = 0;
  for (const [label, re] of RULES) {
    const n = (t.match(re) || []).length;
    if (n > max) { max = n; best = label; }
  }
  return best;
};