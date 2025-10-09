const quizContainer = document.getElementById("quizContainer");
const resultDiv = document.getElementById("result");

const locations = ["Head", "Chest", "Abdomen", "Back", "Limbs", "Skin", "Other"];
const types = ["Pain", "Swelling", "Fatigue", "Nausea", "Cough", "Fever", "Rash", "Weakness", "Other"];
const severities = ["Mild", "Moderate", "Severe"];
const durations = ["Hours", "Days", "Weeks", "Months"];
const visitTypes = ["General Check-up", "Specialist"];

let currentStep = 0;
const answers = {
  location: [],
  type: [],
  severity: [],
  duration: "",
  visitType: ""
};

function renderStep(pushHistory = true) {
  quizContainer.innerHTML = "";

  if (currentStep > 4) {
    calculateRecommendation();
    return;
  }

  const div = document.createElement("div");
  div.classList.add("question");

  let questionText = "";
  let options = [];
  let key = "";

  switch (currentStep) {
    case 0:
      questionText = "Select all locations where you have symptoms:";
      options = locations;
      key = "location";
      break;
    case 1:
      questionText = "Select all symptoms you are experiencing:";
      options = types;
      key = "type";
      break;
    case 2:
      questionText = "Select severity of your symptoms:";
      options = severities;
      key = "severity";
      break;
    case 3:
      questionText = "Select duration of your symptoms:";
      options = durations;
      key = "duration";
      break;
    case 4:
      questionText = "Do you prefer a general check-up or seeing a specialist?";
      options = visitTypes;
      key = "visitType";
      break;
  }

  div.innerHTML = `<h3>${questionText}</h3>`;

  if (currentStep === 0 || currentStep === 1) {
    options.forEach((opt, idx) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `${key}-${idx}`;
      checkbox.value = opt;
      if (answers[key].includes(opt)) checkbox.checked = true;

      const label = document.createElement("label");
      label.htmlFor = `${key}-${idx}`;
      label.textContent = opt;

      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(document.createElement("br"));
    });
  } else {
    options.forEach((opt, idx) => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = key;
      radio.id = `${key}-${idx}`;
      radio.value = opt;
      if (answers[key] === opt || (!answers[key] && idx === 0)) radio.checked = true;

      const label = document.createElement("label");
      label.htmlFor = `${key}-${idx}`;
      label.textContent = opt;

      div.appendChild(radio);
      div.appendChild(label);
      div.appendChild(document.createElement("br"));
    });
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = currentStep === 4 ? "Submit" : "Next";
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    saveAnswer(key);
    currentStep++;
    renderStep();
  });
  div.appendChild(nextBtn);

  if (currentStep > 0) {
    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.style.backgroundColor = "#6c757d";
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveAnswer(key);
      currentStep--;
      renderStep(false);
    });
    div.appendChild(backBtn);
  }

  quizContainer.appendChild(div);

  // Push to browser history if requested
  if (pushHistory) {
    history.pushState({ step: currentStep }, "", `#step${currentStep}`);
  }
}

// Save current step's answers
function saveAnswer(key) {
  const div = quizContainer.querySelector(".question");
  if (currentStep === 0 || currentStep === 1) {
    const selected = Array.from(div.querySelectorAll("input[type=checkbox]:checked")).map(c => c.value);
    answers[key] = selected;
  } else {
    const selected = div.querySelector(`input[name="${key}"]:checked`);
    if (selected) answers[key] = selected.value;
  }
}

function calculateRecommendation() {
  const matched = data.filter(d => {
    return answers.type.some(type => d.symptom.toLowerCase().includes(type.toLowerCase()));
  });

  const specialtyScores = {};
  matched.forEach(entry => {
    specialtyScores[entry.specialty] = (specialtyScores[entry.specialty] || 0) + parseFloat(entry.confidence);
  });

  const recommended = Object.entries(specialtyScores)
    .sort((a,b) => b[1] - a[1])
    .map(e => e[0]);

  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <h3>Recommended Clinic(s):</h3>
    <p>${recommended.join(", ") || "No match found"}</p>
    <p>Visit Type Preference: ${answers.visitType}</p>
    <p>Symptom Locations: ${answers.location.join(", ")}</p>
    <p>Symptom Types: ${answers.type.join(", ")}</p>
    <p>Severity: ${answers.severity}</p>
    <p>Duration: ${answers.duration}</p>
  `;
}

// Handle browser back/forward buttons
window.addEventListener("popstate", (event) => {
  if (event.state && typeof event.state.step === "number") {
    currentStep = event.state.step;
    renderStep(false);
  }
});

renderStep();
