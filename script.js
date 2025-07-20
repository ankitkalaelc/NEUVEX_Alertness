
// Neuvex Survey – script.js

let currentQuestion = 0;
const questions = document.querySelectorAll(".question");
const nextButtons = document.querySelectorAll(".next-button");
const form = document.getElementById("survey-form");

let startTime = new Date();
let questionTimings = {};
let currentQuestionStartTime = startTime;

function showQuestion(index) {
    questions.forEach((q, i) => {
        q.style.display = i === index ? "block" : "none";
    });
    currentQuestionStartTime = new Date();
}

function getQuestionTime(index) {
    const now = new Date();
    return Math.floor((now - currentQuestionStartTime) / 1000);
}

function detectMetadata() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenWidth = screen.width;
    const screenHeight = screen.height;
    const timezoneOffset = new Date().getTimezoneOffset();

    return {
        user_agent: userAgent,
        platform,
        language,
        screen_width: screenWidth,
        screen_height: screenHeight,
        timezone_offset_minutes: timezoneOffset
    };
}

function validateQuestion(question) {
    const requiredInputs = question.querySelectorAll("input[required], textarea[required], select[required]");
    for (const input of requiredInputs) {
        if ((input.type === "radio" || input.type === "checkbox") && !question.querySelector(`input[name="${input.name}"]:checked`)) {
            return false;
        }
        if ((input.type === "text" || input.tagName === "TEXTAREA") && !input.value.trim()) {
            return false;
        }
    }
    return true;
}

function handleNextClick(event) {
    const question = questions[currentQuestion];
    if (!validateQuestion(question)) {
        console.log("Please complete this question before continuing.");
        return;
    }

    const qid = question.dataset.qid;
    const qtime = getQuestionTime(currentQuestion);
    questionTimings[qid + "_time"] = qtime;

    currentQuestion++;
    if (currentQuestion < questions.length) {
        showQuestion(currentQuestion);
    } else {
        handleSubmit();
    }
}

nextButtons.forEach(btn => {
    btn.addEventListener("click", handleNextClick);
});

let copyDetected = false;
let pasteDetected = false;
document.addEventListener("copy", () => copyDetected = true);
document.addEventListener("paste", () => pasteDetected = true);

function handleSubmit() {
    const endTime = new Date();
    const totalTime = Math.floor((endTime - startTime) / 1000);

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    const pid = new URLSearchParams(window.location.search).get("pid") || "NA";

    const metadata = detectMetadata();

    const payload = {
        pid,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_time_sec: totalTime,
        ...questionTimings,
        ...metadata,
        copy_detected: copyDetected,
        paste_detected: pasteDetected,
        ...data
    };

    fetch("https://hook.us1.make.com/r47xrmntxly33jbih9dfopnmeeeian8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => {
        window.location.href = `https://api.opnion.io/processfinish?status=1&transactionid=${pid}`;
    })
    .catch((err) => {
        console.error("Submission error:", err);
    });
}

window.onload = () => {
    showQuestion(currentQuestion);
};
