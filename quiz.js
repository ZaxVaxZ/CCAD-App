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
		id: "duration",
		text: "How long have you had these symptoms?",
		options: ["< 1 day", "1-3 days", "1 week", "More than 1 week"]
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
	const relevantEntries = quizData.filter(entry => (entry.symptom == answers['symptom'] || (entry.symptom == "other" && answers.location.some(location => location.toLowerCase() == entry.location))));
	console.log(relevantEntries);
	const scores = {};

	relevantEntries.forEach(entry => {
		let weight = 1;
		if (answers.severity === "Severe") weight += 0.5;
		if (answers.duration === "More than 1 week") weight += 0.5;
		if (answers.preference === "Specialist") weight += 0.5;
		const score = entry.confidence * weight;

		if (!scores[entry.department])
			scores[entry.department] = 0;
		scores[entry.department] += score;
	});

	const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

	quizContainer.innerHTML = `
		<div class="result">
		<h2>Recommended Department(s):</h2>
		<ul>
			${sorted.slice(0, 3).map(([dept, score]) => `<li>${dept} (${(score * 100).toFixed(1)}% confidence)</li>`).join("")}
		</ul>
		</div>
	`;
}

showQuestion(currentQuestion);
