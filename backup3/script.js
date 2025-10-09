// CSV converted to JS object

// Group data by symptom
const groupedData = {};
data.forEach(item => {
  if (!groupedData[item.symptom]) groupedData[item.symptom] = [];
  groupedData[item.symptom].push({ specialty: item.specialty, confidence: item.confidence });
});

// Populate the form dynamically
const questionsDiv = document.getElementById("questions");

// Question 1: Select symptoms (multiple)
const symptomQuestion = document.createElement("div");
symptomQuestion.classList.add("question");
symptomQuestion.innerHTML = `<h3>Select your main symptom(s):</h3>`;

Object.keys(groupedData).forEach((symptom, idx) => {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "symptoms";
  checkbox.value = symptom;
  checkbox.id = `symptom-${idx}`;

  const label = document.createElement("label");
  label.htmlFor = `symptom-${idx}`;
  label.textContent = symptom;

  symptomQuestion.appendChild(checkbox);
  symptomQuestion.appendChild(label);
  symptomQuestion.appendChild(document.createElement("br"));
});

questionsDiv.appendChild(symptomQuestion);

// Question 2: General vs Specialist
const typeQuestion = document.createElement("div");
typeQuestion.classList.add("question");
typeQuestion.innerHTML = `
  <h3>Do you prefer a general check-up or seeing a specialist?</h3>
  <input type="radio" id="general" name="visitType" value="General Check-up" checked>
  <label for="general">General Check-up</label><br>
  <input type="radio" id="specialist" name="visitType" value="Specialist">
  <label for="specialist">Specialist</label>
`;
questionsDiv.appendChild(typeQuestion);

// Handle submission
document.getElementById("quizForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedSymptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(i => i.value);
  const visitType = document.querySelector('input[name="visitType"]:checked').value;

  if (selectedSymptoms.length === 0) {
    alert("Please select at least one symptom.");
    return;
  }

  // Compute weighted recommendation
  const specialtyScores = {};
  selectedSymptoms.forEach(symptom => {
    groupedData[symptom].forEach(entry => {
      specialtyScores[entry.specialty] = (specialtyScores[entry.specialty] || 0) + entry.confidence;
    });
  });

  // Sort specialties by score
  const recommended = Object.entries(specialtyScores)
    .sort((a,b) => b[1] - a[1])
    .map(item => item[0]);

  // Display result
  const resultDiv = document.getElementById("result");
  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <h3>Recommended Clinic(s):</h3>
    <p>${recommended.join(", ")}</p>
    <p>Visit Type Preference: ${visitType}</p>
  `;
});
