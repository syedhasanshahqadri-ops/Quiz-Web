/* =========================================
   STUDENT INFORMATION
========================================= */

const studentForm = document.getElementById("studentForm");

if (studentForm) {

    studentForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name =
            document.getElementById("studentName").value.trim();

        const roll =
            document.getElementById("rollNumber").value.trim();


        if (name === "" || roll === "") {

            alert("Please enter your name and roll number.");

            return;
        }


        localStorage.setItem("studentName", name);

        localStorage.setItem("rollNumber", roll);


        // Start quiz

        window.location.href = "quiz.html";

    });

}


/* =========================================
   QUIZ SYSTEM
========================================= */

const questionCards =
    document.querySelectorAll(".question-card");

const timerElement =
    document.getElementById("timer");

const submitButton =
    document.getElementById("submitBtn");


let score = 0;

let answered = 0;

let testSubmitted = false;


/* =========================================
   TIMER
========================================= */

let totalSeconds = 30 * 60;

let timerInterval;


if (timerElement) {

    // Display student information

    const studentName =
        localStorage.getItem("studentName");

    const rollNumber =
        localStorage.getItem("rollNumber");


    document.getElementById("displayName").textContent =
        studentName || "Student";

    document.getElementById("displayRoll").textContent =
        rollNumber || "N/A";


    startTimer();

}


/* TIMER FUNCTION */

function startTimer() {

    updateTimer();


    timerInterval = setInterval(function () {

        totalSeconds--;


        updateTimer();


        if (totalSeconds <= 0) {

            clearInterval(timerInterval);

            alert("Time is over! Your test will be submitted automatically.");

            finishTest();

        }

    }, 1000);

}


/* UPDATE TIMER */

function updateTimer() {

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        totalSeconds % 60;


    const formattedMinutes =
        String(minutes).padStart(2, "0");

    const formattedSeconds =
        String(seconds).padStart(2, "0");


    timerElement.textContent =
        `${formattedMinutes}:${formattedSeconds}`;


    // Red warning when 5 minutes remain

    if (totalSeconds <= 300) {

        timerElement.style.color = "#dc2626";

        timerElement.style.fontWeight = "bold";

    }

}


/* =========================================
   MCQ OPTIONS
========================================= */

questionCards.forEach(function (card) {

    const options =
        card.querySelectorAll(".option");

    const correctAnswer =
        card.dataset.answer;


    options.forEach(function (option) {

        option.addEventListener("click", function () {

            // Don't allow changing answer

            if (card.classList.contains("answered")) {

                return;

            }


            const selectedAnswer =
                option.dataset.option;


            card.classList.add("answered");


            // Disable all options

            options.forEach(function (btn) {

                btn.classList.add("disabled");

            });


            if (selectedAnswer === correctAnswer) {

                // Correct answer

                option.classList.add("correct");

                score++;

            }

            else {

                // Wrong answer

                option.classList.add("wrong");


                // Also show correct answer

                options.forEach(function (btn) {

                    if (btn.dataset.option === correctAnswer) {

                        btn.classList.add("correct");

                    }

                });

            }


            answered++;

            updateProgress();

        });

    });

});


/* =========================================
   UPDATE PROGRESS
========================================= */

function updateProgress() {

    const answeredElement =
        document.getElementById("answeredCount");

    const progress =
        document.getElementById("progress");


    if (answeredElement) {

        answeredElement.textContent = answered;

    }


    if (progress) {

        const percentage =
            (answered / 20) * 100;

        progress.style.width =
            percentage + "%";

    }

}


/* =========================================
   SUBMIT BUTTON
========================================= */

if (submitButton) {

    submitButton.addEventListener("click", function () {

        const unanswered =
            20 - answered;


        if (unanswered > 0) {

            const confirmSubmit =
                confirm(
                    `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
                );


            if (!confirmSubmit) {

                return;

            }

        }


        finishTest();

    });

}


/* =========================================
   FINISH TEST
========================================= */

function finishTest() {

    if (testSubmitted) {

        return;

    }


    testSubmitted = true;


    if (timerInterval) {

        clearInterval(timerInterval);

    }


    const totalQuestions = 20;

    const wrong =
        answered - score;

    const unanswered =
        totalQuestions - answered;


    const percentage =
        Math.round((score / totalQuestions) * 100);


    const timeUsed =
        (30 * 60) - totalSeconds;


    const minutesUsed =
        Math.floor(timeUsed / 60);

    const secondsUsed =
        timeUsed % 60;


    const formattedTime =
        String(minutesUsed).padStart(2, "0")
        + ":"
        + String(secondsUsed).padStart(2, "0");


    // Save result

    localStorage.setItem("score", score);

    localStorage.setItem("wrong", wrong);

    localStorage.setItem("unanswered", unanswered);

    localStorage.setItem("percentage", percentage);

    localStorage.setItem("timeUsed", formattedTime);


    // Open result page

    window.location.href = "result.html";

}


/* =========================================
   RESULT PAGE
========================================= */

const percentageElement =
    document.getElementById("percentage");


if (percentageElement) {

    const name =
        localStorage.getItem("studentName") || "Student";

    const roll =
        localStorage.getItem("rollNumber") || "N/A";


    const scoreValue =
        Number(localStorage.getItem("score")) || 0;

    const wrongValue =
        Number(localStorage.getItem("wrong")) || 0;

    const unansweredValue =
        Number(localStorage.getItem("unanswered")) || 0;

    const percentageValue =
        Number(localStorage.getItem("percentage")) || 0;

    const timeValue =
        localStorage.getItem("timeUsed") || "00:00";


    document.getElementById("resultName").textContent =
        name;

    document.getElementById("resultRoll").textContent =
        roll;


    document.getElementById("percentage").textContent =
        percentageValue + "%";


    document.getElementById("correctAnswers").textContent =
        scoreValue;


    document.getElementById("wrongAnswers").textContent =
        wrongValue;


    document.getElementById("unanswered").textContent =
        unansweredValue;


    document.getElementById("finalScore").textContent =
        `${scoreValue} / 20`;


    document.getElementById("timeUsed").textContent =
        timeValue;

}