const quizContainer = document.getElementById("quizContainer");
const resultDiv = document.getElementById("result");

const questions = [
  { key: "location", text: "Where is your symptom located?", type: "select", options: ["Head", "Chest", "Abdomen", "Back", "Limbs", "Other"] },
  { key: "type", text: "Type of symptom?", type: "select", options: ["Pain", "Swelling", "Fatigue", "Nausea", "Cough", "Fever", "Rash", "Weakness", "Other"] },
  { key: "severity", text: "Severity?", type: "radio", options: ["Mild", "Moderate", "Severe"] },
  { key: "duration", text: "Duration of symptom?", type: "select", options: ["Hours", "Days", "Weeks", "Months"] },
  { key: "visitType", text: "Do you prefer a general check-up or seeing a specialist?", type: "radio", options: ["General Check-up", "Specialist"] },
];

let currentStep = 0;
const answers = {};

function renderStep() {
  quizContainer.innerHTML = "";
  if (currentStep >= questions.length) {
    calculateRecommendation();
    return;
  }

  const q = questions[currentStep];
  const div = document.createElement("div");
  div.classList.add("question");
  div.innerHTML = `<h3>${q.text}</h3>`;

  if (q.type === "select") {
    const select = document.createElement("select");
    select.id = q.key;
    q.options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    div.appendChild(select);
  }

  if (q.type === "radio") {
    q.options.forEach((opt, idx) => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = q.key;
      radio.id = `${q.key}-${idx}`;
      radio.value = opt;
      if (idx === 0) radio.checked = true;

      const label = document.createElement("label");
      label.htmlFor = `${q.key}-${idx}`;
      label.textContent = opt;

      div.appendChild(radio);
      div.appendChild(label);
      div.appendChild(document.createElement("br"));
    });
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = currentStep === questions.length - 1 ? "Submit" : "Next";
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (q.type === "select") answers[q.key] = document.getElementById(q.key).value;
    if (q.type === "radio") answers[q.key] = document.querySelector(`input[name="${q.key}"]:checked`).value;
    currentStep++;
    renderStep();
  });

  div.appendChild(nextBtn);
  quizContainer.appendChild(div);
}

// Compute recommendation using your CSV data and answers
function calculateRecommendation() {
  // For simplicity, match symptoms containing keywords from type/location
  const matchedSymptoms = data.filter(d => {
    return d.symptom.toLowerCase().includes(answers.type.toLowerCase()) ||
           d.symptom.toLowerCase().includes(answers.location.toLowerCase());
  });

  const specialtyScores = {};
  matchedSymptoms.forEach(entry => {
    specialtyScores[entry.specialty] = (specialtyScores[entry.specialty] || 0) + parseFloat(entry.confidence);
  });

  const recommended = Object.entries(specialtyScores)
    .sort((a,b) => b[1] - a[1])
    .map(e => e[0]);

  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <h3>Recommended Clinic(s):</h3>
    <p>${recommended.join(", ")}</p>
    <p>Visit Type Preference: ${answers.visitType}</p>
    <p>Symptom Location: ${answers.location}</p>
    <p>Symptom Type: ${answers.type}</p>
    <p>Severity: ${answers.severity}</p>
    <p>Duration: ${answers.duration}</p>
  `;
}

renderStep();
