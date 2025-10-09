
/*
  Quiz flow + Weighted scoring engine with severity modifiers.
  - Each question stores answers in the query string as q1..q6 or keys as defined.
  - On results.html the engine computes scores and shows top recommendations.
*/
(function(){
  // Utility helpers for query string state
  function getQS(){ return new URLSearchParams(window.location.search); }
  function setQS(params){ const url = new URL(window.location.href); url.search = params.toString(); window.history.replaceState({}, '', url); }
  function go(path, params){ const qs = params ? ('?' + (typeof params === 'string' ? params : new URLSearchParams(params).toString())) : window.location.search; window.location.href = path + qs; }

  // Page helpers to collect UI inputs and navigate
  function readMulti(container){ const checks = container.querySelectorAll('input[type=checkbox]'); const vals = []; checks.forEach(c=>{ if(c.checked) vals.push(c.value); }); return vals; }
  function readSingle(container){ const radios = container.querySelectorAll('input[type=radio]'); for(const r of radios) if(r.checked) return r.value; return null; }

  // Attach handlers if present
  document.querySelectorAll('.options.multi').forEach(container=>{
    // nothing immediate
  });
  document.querySelectorAll('.options.single').forEach(container=>{
    // nothing immediate
  });

  // Back/Next button wiring
  const btnNext = document.getElementById('next');
  const btnBack = document.getElementById('back');
  const btnFinish = document.getElementById('finish');
  const btnExplain = document.getElementById('explain');

  // Helpers to save current page's answers into QS and navigate
  function saveAndGo(nextPath){
    const qs = getQS();
    // find inputs within this page
    document.querySelectorAll('[data-key]').forEach(cont=>{
      const key = cont.dataset.key;
      if(cont.classList.contains('multi')){
        const vals = readMulti(cont);
        qs.delete(key);
        vals.forEach(v=>qs.append(key, v));
      } else if(cont.classList.contains('single')){
        const val = readSingle(cont);
        if(val !== null){ qs.set(key, val); }
      } else if(cont.classList.contains('severity')){
        const range = cont.querySelector('#sevRange');
        if(range) qs.set('severity', range.value);
      }
    });
    setQS(qs);
    if(nextPath) window.location.href = nextPath + '?' + qs.toString();
  }

  // Hook range display
  const sevRange = document.getElementById('sevRange');
  if(sevRange){
    const sevValue = document.querySelector('.sevValue');
    function updateSV(){ if(sevValue) sevValue.textContent = sevRange.value; }
    updateSV();
    sevRange.addEventListener('input', updateSV);
  }

  if(btnNext){ btnNext.addEventListener('click', ()=>{
    // map current page to next
    const path = window.location.pathname.split('/').pop();
    const map = {
      'q1-location.html': 'q2-type.html',
      'q2-type.html': 'q3-severity.html',
      'q3-severity.html': 'q4-duration.html',
      'q4-duration.html': 'q5-redflags.html',
      'q5-redflags.html': 'q6-urgency-pref.html'
    };
    saveAndGo(map[path]);
  }); }

  if(btnBack){ btnBack.addEventListener('click', ()=>{ const path = window.location.pathname.split('/').pop(); const prev = {
    'q2-type.html':'q1-location.html', 'q3-severity.html':'q2-type.html', 'q4-duration.html':'q3-severity.html', 'q5-redflags.html':'q4-duration.html', 'q6-urgency-pref.html':'q5-redflags.html'
  }[path]; if(prev) { saveAndGo(prev); } else window.history.back(); }); }

  if(btnFinish){ btnFinish.addEventListener('click', ()=>{ saveAndGo('results.html'); }); }

  if(btnExplain){ btnExplain.addEventListener('click', ()=>{ // show explanation by reloading details in-place
    const qs = getQS(); const raw = window.localStorage.getItem('lastExplain'); if(raw) alert(raw); else alert('No explanation available.');
  }); }

  // On results.html compute recommendation
  if(window.location.pathname.endsWith('results.html')){
    const qs = getQS();
    // Build answers object
    const answers = {
      location: qs.getAll('location'),
      symptomType: qs.get('symptomType') || qs.get('symptom') || null,
      severity: Number(qs.get('severity') || 5),
      duration: qs.get('duration') || 'subacute',
      redFlags: qs.getAll('redFlags'),
      urgency: qs.get('urgency') || 'routine',
      preference: qs.get('preference') || 'unsure'
    };

    // Weighted scoring model
    // Institutes
    const INSTITUTES = ['Cancer','Diagnostics','Digestive','Heart','HospitalCare','Surgical','MedicalSpecialty','Neurological'];

    // Symptom-to-institute base weights (comprehensive mapping)
    const symptomMap = {
      // locations
      'chest':      { Heart:6, HospitalCare:3, Cancer:2, Diagnostics:2 },
      'head':       { Neurological:5, HospitalCare:3, Diagnostics:3 },
      'abdomen':    { Digestive:6, HospitalCare:3, Diagnostics:3 },
      'back':       { Neurological:3, Surgical:2, MedicalSpecialty:2 },
      'joint':      { MedicalSpecialty:4, Surgical:2, Neurological:2 },
      'pelvic':     { Surgical:4, Digestive:3, MedicalSpecialty:2 },
      'breast':     { Surgical:5, Cancer:5, Diagnostics:3 },
      'eye':        { Surgical:5, Neurological:2, Diagnostics:3 },
      'ent':        { Surgical:5, MedicalSpecialty:2 },
      'mouth':      { Surgical:5, MedicalSpecialty:2 },
      'urinary':    { Surgical:5, MedicalSpecialty:3, Nephrology:2 },
      'skin':       { MedicalSpecialty:6 },
      'generalized':{ MedicalSpecialty:2, Cancer:2, HospitalCare:2 },
      // symptom types
      'pain':       { MedicalSpecialty:2, Neurological:2, Surgical:2, Heart:3, Digestive:3 },
      'lump':       { Cancer:6, Surgical:4, Diagnostics:3 },
      'rash':       { MedicalSpecialty:6, Diagnostics:2 },
      'bleeding':   { Surgical:4, Cancer:4, HospitalCare:3, Diagnostics:3 },
      'sob':        { Heart:5, HospitalCare:4, Diagnostics:3 },
      'cough':      { MedicalSpecialty:2, Cancer:3, Diagnostics:3, HospitalCare:2 },
      'nausea':     { Digestive:4, MedicalSpecialty:2 },
      'bowel':      { Digestive:6, Diagnostics:3 },
      'vision':     { Surgical:4, Neurological:3, Diagnostics:3 },
      'dizziness':  { Neurological:4, Heart:2, MedicalSpecialty:2 },
      'mh':         { MedicalSpecialty:5, Neurological:2 }
    };

    // Additional red-flag weights
    const redFlagWeights = {
      'unexplained_weight_loss': { Cancer:5 },
      'fever_night_sweats': { Cancer:3, HospitalCare:3, MedicalSpecialty:2 },
      'new_painless_lump': { Cancer:6 },
      'sudden_severe_headache': { Neurological:6, HospitalCare:4 },
      'new_weakness': { Neurological:6, HospitalCare:4 },
      'blood_in_stool': { Digestive:6, HospitalCare:3 },
      'blood_in_urine': { Surgical:5, MedicalSpecialty:3, HospitalCare:3 },
      'persistent_vomiting': { Digestive:4, HospitalCare:3 },
      'fainting': { Heart:5, Neurological:4, HospitalCare:4 }
    };

    // Severity coefficient function (0..10 mapped to 0.5..2.0)
    function severityCoeff(s){
      const sv = Math.max(0, Math.min(10, Number(s || 5)));
      if(sv <= 2) return 0.6;
      if(sv <= 4) return 0.85;
      if(sv <= 6) return 1.0;
      if(sv <= 8) return 1.4;
      return 1.9;
    }

    // Urgency boosts
    function urgencyBoost(u){ if(u === 'emergency') return 1.6; if(u === 'urgent') return 1.2; return 1.0; }

    // Preference tweak
    function preferenceBoost(pref){ return pref === 'specialist' ? 1.05 : 1.0; }

    // Initialize scores
    const rawScores = {}; INSTITUTES.forEach(i=> rawScores[i]=0);

    // Helper to add weighted map to scores with coefficient
    function applyMap(map, coeff){
      for(const [k,v] of Object.entries(map||{})){
        if(!(k in rawScores)) rawScores[k] = 0; // allow undefined institutes like Nephrology mapping earlier
        rawScores[k] += v * coeff;
      }
    }

    // 1) Location contributions
    const locs = answers.location || [];
    locs.forEach(loc => {
      const map = symptomMap[loc];
      applyMap(map, 1.0);
    });

    // 2) Symptom type contribution
    if(answers.symptomType){ const map = symptomMap[answers.symptomType]; applyMap(map, 1.0); }

    // 3) Severity scaling: scale existing scores by severity coefficient (multiplicative)
    const baseSeverity = severityCoeff(answers.severity);
    for(const k of Object.keys(rawScores)) rawScores[k] *= baseSeverity;

    // 4) Duration modifier: chronic boosts specialty clinics for chronic problems
    if(answers.duration === 'chronic'){
      rawScores.Cancer = (rawScores.Cancer || 0) * 1.15;
      rawScores.MedicalSpecialty = (rawScores.MedicalSpecialty || 0) * 1.1;
      rawScores.Neurological = (rawScores.Neurological || 0) * 1.05;
    }

    // 5) Red flags — add strong signals
    (answers.redFlags || []).forEach(rf => {
      if(rf === 'none') return;
      const map = redFlagWeights[rf];
      applyMap(map, 1.0);
    });

    // 6) Urgency boost: if emergency, push HospitalCare strongly
    const uBoost = urgencyBoost(answers.urgency);
    rawScores.HospitalCare = (rawScores.HospitalCare || 0) * uBoost;
    // Also modestly boost Diagnostics if urgent
    rawScores.Diagnostics = (rawScores.Diagnostics || 0) * (answers.urgency === 'emergency' ? 1.2 : 1.0);

    // 7) Preference tweak
    const pBoost = preferenceBoost(answers.preference);
    for(const k of Object.keys(rawScores)) rawScores[k] *= pBoost;

    // 8) Small floor to MedicalSpecialty if nothing else
    const totalBefore = Object.values(rawScores).reduce((a,b)=>a+b,0);
    if(totalBefore < 4){ rawScores.MedicalSpecialty += 2; }

    // Normalize and produce ranking
    const entries = Object.entries(rawScores).map(([k,v])=>({k, v: Math.max(0, v)}));
    const max = Math.max(...entries.map(e=>e.v), 0.0001);
    const normalized = entries.map(e=>({ name: e.k, score: +(e.v/max).toFixed(3) }));
    normalized.sort((a,b)=>b.score - a.score);

    // Build UI
    const container = document.getElementById('recommendation');
    if(!container) return;
    const top = normalized[0];
    const second = normalized[1];

    let html = '';
    html += `<div class=\"reco-card\">`;
    html += `<div class=\"reco-title\">Recommended: ${top.name.replace(/([A-Z])/g,' $1').trim()}</div>`;
    html += `<div class=\"explain\">Confidence score: ${(top.score*100).toFixed(0)}% (relative)</div>`;
    html += `<div class=\"reco-list\">`;
    normalized.slice(0,4).forEach(n => {
      html += `<div class=\"reco-item\"><div>${n.name.replace(/([A-Z])/g,' $1').trim()}</div><div>${(n.score*100).toFixed(0)}%</div></div>`;
    });
    html += `</div></div>`;

    // Explain which answers drove the result (simple transparency)
    const explainLines = [];
    explainLines.push('Inputs:');
    explainLines.push('Locations: ' + (answers.location.length ? answers.location.join(', ') : '—'));
    explainLines.push('Main symptom: ' + (answers.symptomType || '—'));
    explainLines.push('Severity: ' + answers.severity);
    explainLines.push('Duration: ' + answers.duration);
    if(answers.redFlags && answers.redFlags.length) explainLines.push('Red flags: ' + answers.redFlags.join(', '));
    explainLines.push('Urgency: ' + answers.urgency);
    explainLines.push('\nTop contributing mappings:');

    // Find top contributing keys by checking which symptom maps overlap with top institute
    const contributors = [];
    (answers.location||[]).forEach(loc => { const map = symptomMap[loc]; if(map && map[top.name]) contributors.push(loc); });
    if(answers.symptomType && symptomMap[answers.symptomType] && symptomMap[answers.symptomType][top.name]) contributors.push(answers.symptomType);
    if(answers.redFlags && answers.redFlags.length){ answers.redFlags.forEach(rf=>{ if(redFlagWeights[rf] && redFlagWeights[rf][top.name]) contributors.push(rf); }); }
    if(contributors.length) explainLines.push(contributors.join(', '));

    html += `<div class=\"explain\"><pre>${explainLines.join('\n')}</pre></div>`;

    container.innerHTML = html;

    // Store explain text in localStorage for quick access via explain button
    window.localStorage.setItem('lastExplain', explainLines.join('\n'));
  }

})();
