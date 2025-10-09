/*
  Simple client-side navigation helper.
  - Options in .options (data-step) will navigate to the next page while appending the selected option as opt{step}=index
  - Keeps existing query string values so previous choices persist.
  - On results.html it will read and display the choices.
*/

(function(){
  function qsToObj(qs){
    const o = {};
    const params = new URLSearchParams(qs);
    for(const [k,v] of params.entries()) o[k]=v;
    return o;
  }

  function objToQs(obj){
    const s = new URLSearchParams();
    Object.keys(obj).forEach(k=>s.set(k,obj[k]));
    return s.toString();
  }

  // Attach click handlers to option buttons if present
  document.querySelectorAll('.options').forEach(container=>{
    const step = Number(container.dataset.step || 0);
    const buttons = Array.from(container.querySelectorAll('.option'));
    buttons.forEach((btn, idx)=>{
      btn.addEventListener('click', ()=>{
        // Build new query
        const url = new URL(window.location.href);
        const q = qsToObj(url.search);
        q['opt'+step] = String(idx+1); // store 1-based index so it's human-friendly
        // decide next page
        if(step < 3){
          const nextPage = 'page' + (step+1) + '.html';
          const nextQs = objToQs(q);
          window.location.href = nextPage + (nextQs ? ('?'+nextQs) : '');
        } else {
          // finished step 3 -> go to results.html
          const nextQs = objToQs(q);
          window.location.href = 'results.html' + (nextQs ? ('?'+nextQs) : '');
        }
      });
    });
  });

  // Results page: render a human-friendly summary
  if(window.location.pathname.endsWith('results.html')){
    const list = document.getElementById('result-list');
    const q = qsToObj(window.location.search);
    const labels = {
      opt1: ['0 times','1–2 times','3–4 times','5+ times'],
      opt2: ['Mostly processed','Mixed','Mostly whole foods','Plant-forward'],
      opt3: ['Less than 5','5–6','7–8','9+ hours']
    };
    const keys = ['opt1','opt2','opt3'];
    keys.forEach(k=>{
      const val = q[k];
      const el = document.createElement('div');
      el.className = 'result-item';
      if(val && labels[k] && labels[k][Number(val)-1]){
        el.textContent = (k.toUpperCase() + ': ' + labels[k][Number(val)-1]);
      } else if(val){
        el.textContent = (k.toUpperCase() + ': ' + val);
      } else {
        el.textContent = (k.toUpperCase() + ': not answered');
      }
      list.appendChild(el);
    });

    // restart link
    const restart = document.getElementById('restart');
    if(restart) restart.addEventListener('click', ()=>{ window.location.href = 'index.html' });
  }

})();
