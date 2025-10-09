const quizContainer = document.getElementById("quiz-container");

let currentQuestion = 0;
let answers = {};

const questions = [
	{
		id: "location",
		text: "Where are your symptoms most prevelant? (Choose any that apply)",
		options: ["Head", "Chest", "Back", "Abdomin", "Arms", "Legs", "Eyes", "Ears", "Mouth/Throat", "Skin", "Other"]
	},
	{
		id: "symptoms",
		text: "Which symptoms are you experiencing? (Choose any that apply)",
		options: []
	},
	{
		id: "severity",
		text: "How severe are the symptoms?",
		options: ["Mild", "Moderate", "Severe"]
	},
	{
		id: "preference",
		text: "Would you prefer a general checkup or to see a specialist?",
		options: ["General Checkup", "See a Specialist"]
	}
];

function showQuestion(index) {
	const q = questions[index];
	if (index == 1) {
		q.options = [...new Set(quizData.filter(item => answers["location"].some(location => location.toLowerCase() == item.location)).map(item => item.symptom[0].toUpperCase() + item.symptom.substring(1)))].sort();
		q.options.push("Other");
	}	
	let type = "radio";
	if (index < 2)
		type = "checkbox";
	quizContainer.innerHTML = `
		<div class="question">
		<p>${q.text}</p>
		${q.options.map(opt => `
			<input type="${type}" name="${q.id}" value="${opt}" />
			<label>
			${opt}
			</label><br/>
		`).join("")}
		</div>
		<button onclick="nextQuestion()">Next</button>
	`;
}

function nextQuestion() {
		const q = questions[currentQuestion];
		if (currentQuestion < 2)
		{
			const selected = Array.from(document.querySelectorAll(`input[name="${q.id}"]:checked`))
                      .map(el => el.value);
			if (!selected) return alert("Please select an option.");
			answers[q.id] = selected;
		}
		else {
			const selected = document.querySelector(`input[name="${q.id}"]:checked`);
			if (!selected) return alert("Please select an option.");
			answers[q.id] = selected.value;
		}
		currentQuestion++;
		if (currentQuestion < questions.length) {
			showQuestion(currentQuestion);
		} else {
			showResults();
		}
}

function showResults() {
	let relevantEntries = [];
	if (answers['symptoms'][0] == 'Other')
		relevantEntries = quizData.filter(entry => (answers['location'].some(locat => locat.toLowerCase() == entry.location)));
	else
		relevantEntries = quizData.filter(entry => (answers['symptoms'].some(symp => symp.toLowerCase() == entry.symptom)));
	
	const scores = {};

	let primary = false;
	relevantEntries.forEach(entry => {
		if (answers.severity == "Mild")
			primary = true;
		if (answers.severity != "Severe" && answers.preference != "Specialist")
			primary = true;

		const score = entry.confidence;

		if (!scores[entry.specialty])
			scores[entry.specialty] = 0;
		scores[entry.specialty] += score;
	});

	let sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
	if (sorted.length > 3) {
		sorted = sorted.slice(0, 3);
	}

	quizContainer.innerHTML = `
		<div class="result">
		<h2>Recommended Department(s) In Order Of Confidence:</h2>
		<ul>
			${sorted.map(([dept, score]) => `<li>${dept}</li><br>`).join("")}
		</ul>
		${primary ? `<p><strong>Note:</strong> In your situation, it is recommended that you get a general check up at a Primary Care clinic before visiting a specialist.` : ''}
		</div>
	`;
}

showQuestion(currentQuestion);
