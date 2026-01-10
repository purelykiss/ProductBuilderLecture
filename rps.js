// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/gJc2-VcMm/";

let model, webcam, labelContainer, maxPredictions;
let gameInitialized = false; // Tracks if model is loaded
let webcamActive = false;     // Tracks if webcam is actively streaming and displaying
let gameActive = false;      // Tracks if a game round is in progress (countdown, choice capture)
let countdownInterval;
let userChoice = '';
let computerChoice = '';
let resultText = '';
let gameRoundRunning = false; // To prevent multiple countdowns/captures

// DOM elements
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const countdownDiv = document.getElementById('countdown');
const userChoiceDiv = document.getElementById('user-choice');
const computerChoiceDiv = document.getElementById('computer-choice');
const resultDiv = document.getElementById('result');
const webcamContainer = document.getElementById("webcam-container");
const tmImageModelLabel = document.getElementById('tm-image-model-label');


// Load the image model and setup the webcam
async function init() {
    startBtn.disabled = true;
    startBtn.style.display = 'none'; // Hide start button once clicked

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        gameInitialized = true;
    } catch (error) {
        console.error("Failed to load Teachable Machine model:", error);
        webcamContainer.innerHTML = 'Failed to load AI model. Please check the model URL.';
        startBtn.style.display = 'block'; // Show start button again
        startBtn.disabled = false;
        return;
    }

    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    
    try {
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(webcam.canvas);
        webcamContainer.style.display = 'block'; // Ensure webcam canvas is visible

        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = '';
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
        labelContainer.style.display = 'block';

        webcamActive = true;
        tmImageModelLabel.style.display = 'none'; // Hide the "Teachable Machine Image Model" text
        window.requestAnimationFrame(loop); // Start continuous webcam update and prediction display

        startGame(); // Start the first round automatically after init
    } catch (error) {
        console.error("Webcam setup failed:", error);
        webcamContainer.innerHTML = 'Failed to load webcam. Please ensure you have a webcam and have granted permissions.';
        startBtn.style.display = 'block'; // Show start button again if webcam fails
        startBtn.disabled = false;
        // Optionally, stop model if webcam fails
        if (webcam && webcam.stop) webcam.stop();
    }
}

function startGame() {
    if (!webcamActive || !gameInitialized) {
        console.error("Webcam or model not ready, cannot start game!");
        return;
    }
    if (gameRoundRunning) return; // Prevent starting multiple rounds if one is already in progress

    gameRoundRunning = true;
    clearGameDisplay();
    restartBtn.style.display = 'none'; // Hide restart button at start of round
    
    webcamContainer.style.display = 'block'; // Ensure webcam canvas is visible
    labelContainer.style.display = 'block'; // Ensure prediction labels are visible

    startCountdown();
}

function clearGameDisplay() {
    countdownDiv.style.display = 'none';
    userChoiceDiv.textContent = '';
    computerChoiceDiv.textContent = '';
    resultDiv.textContent = '';
    userChoiceDiv.style.display = 'none';
    computerChoiceDiv.style.display = 'none';
    resultDiv.style.display = 'none';
}

async function loop() {
    if (webcamActive) {
        webcam.update();
        if (!gameActive) { // Only display labels when not in an active game round
            await predictAndDisplayLabels();
        }
    }
    window.requestAnimationFrame(loop);
}

async function predictAndDisplayLabels() {
    if (!webcamActive || !model) return; // Ensure webcam and model are ready
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}


function startCountdown() {
    let count = 3;
    countdownDiv.textContent = count;
    countdownDiv.style.display = 'block';

    gameActive = true; // Set gameActive to true during countdown

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDiv.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownDiv.textContent = "GO!";
            setTimeout(async () => {
                countdownDiv.style.display = 'none';
                await captureUserChoice(); // Capture user's final choice
                makeComputerChoice();
                displayChoices();
                // Delay result display by 1 second
                setTimeout(() => {
                    determineWinner();
                    endGame();
                }, 1000);
            }, 500); // Display "GO!" for a moment
        }
    }, 1000);
}

async function captureUserChoice() {
    if (!webcamActive || !model) return;
    const prediction = await model.predict(webcam.canvas);
    let highestProbability = -1;
    let predictedClassName = 'Unknown';

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            predictedClassName = prediction[i].className;
        }
    }

    const confidenceThreshold = 0.7; // 70% confidence
    if (highestProbability < confidenceThreshold) {
        predictedClassName = 'Unknown';
    }
    
    let mappedChoice = 'Unknown';
    if (predictedClassName.includes('Rock')) {
        mappedChoice = 'Rock';
    } else if (predictedClassName.includes('Paper')) {
        mappedChoice = 'Paper';
    } else if (predictedClassName.includes('Scissors')) {
        mappedChoice = 'Scissors';
    }
    userChoice = mappedChoice;
    gameActive = false; // End active game phase after capturing choice
}


function makeComputerChoice() {
    const choices = ['Rock', 'Paper', 'Scissors'];
    computerChoice = choices[Math.floor(Math.random() * choices.length)];
}

function displayChoices() {
    const emojiMap = {
        'Rock': '✊',    // Fist for Rock
        'Paper': '✋',   // Open hand for Paper
        'Scissors': '✌️', // Victory hand for Scissors
        'Unknown': '❓'
    };
    userChoiceDiv.innerHTML = `You: <span class="emoji">${emojiMap[userChoice]}</span>`;
    computerChoiceDiv.innerHTML = `Computer: <span class="emoji">${emojiMap[computerChoice]}</span>`;
    userChoiceDiv.style.display = 'block';
    computerChoiceDiv.style.display = 'block';
    labelContainer.style.display = 'none'; // Hide prediction labels during result display
    webcamContainer.style.display = 'none'; // Hide webcam during result display
}

function determineWinner() {
    if (userChoice === 'Unknown') {
        resultText = "Couldn't detect your move!";
    } else if (userChoice === computerChoice) {
        resultText = "It's a Tie!";
    } else if (
        (userChoice === 'Rock' && computerChoice === 'Scissors') ||
        (userChoice === 'Paper' && computerChoice === 'Rock') ||
        (userChoice === 'Scissors' && computerChoice === 'Paper')
    ) {
        resultText = "You Win!";
    } else {
        resultText = "Computer Wins!";
    }
    resultDiv.textContent = resultText;
    resultDiv.style.display = 'block';
}

function endGame() {
    gameRoundRunning = false;
    restartBtn.style.display = 'block';
}

function restartGame() {
    clearGameDisplay();
    labelContainer.style.display = 'block'; // Show labels again (they are hidden after displayChoices)
    webcamContainer.style.display = 'block'; // Show webcam again
    startGame(); // Start a new game round
}

// Event Listeners
startBtn.addEventListener('click', init);
restartBtn.addEventListener('click', restartGame);

// Initial state: ensure start button is visible
startBtn.style.display = 'block';
// And other elements are hidden as they should be revealed by JS
restartBtn.style.display = 'none';
webcamContainer.style.display = 'none';
labelContainer.style.display = 'none';
tmImageModelLabel.style.display = 'block'; // Show "Teachable Machine Image Model" text initially
