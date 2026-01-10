// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/gJc2-VcMm/";

let model, webcam, labelContainer, maxPredictions;
let gameInitialized = false; // Tracks if webcam and model are loaded
let gameActive = false;     // Tracks if a game round is in progress
let countdownInterval;
let userChoice = '';
let computerChoice = '';
let resultText = '';

// DOM elements
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const countdownDiv = document.getElementById('countdown');
const userChoiceDiv = document.getElementById('user-choice');
const computerChoiceDiv = document.getElementById('computer-choice');
const resultDiv = document.getElementById('result');
const webcamContainer = document.getElementById("webcam-container");
const tmImageModelLabel = document.querySelector("#rps-container > div:nth-child(4)"); // "Teachable Machine Image Model" text


// Load the image model and setup the webcam
async function init() {
    if (gameInitialized) {
        // If already initialized, just start a new game round
        startGame();
        return;
    }

    startBtn.disabled = true;
    startBtn.style.display = 'none'; // Hide start button after first click
    restartBtn.style.display = 'block'; // Show restart button

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    await webcam.setup();
    await webcam.play();
    webcamContainer.innerHTML = '';
    webcamContainer.appendChild(webcam.canvas);

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = '';
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    gameInitialized = true;
    tmImageModelLabel.style.display = 'none'; // Hide the "Teachable Machine Image Model" text
    startGame();
}

function startGame() {
    gameActive = true;
    clearGameDisplay();
    startCountdown();
}

function clearGameDisplay() {
    userChoiceDiv.textContent = '';
    computerChoiceDiv.textContent = '';
    resultDiv.textContent = '';
    userChoiceDiv.style.display = 'none';
    computerChoiceDiv.style.display = 'none';
    resultDiv.style.display = 'none';
}

async function loop() {
    if (webcam) { // Ensure webcam is initialized
        webcam.update();
        if (gameActive) {
            await predict();
        } else if (gameInitialized) {
            // Keep labels updated even if not in an active game round
            await predictAndDisplayLabels();
        }
        window.requestAnimationFrame(loop);
    }
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    let highestProbability = -1; // Use -1 to ensure 0.00 is a valid probability
    let predictedClassName = 'Unknown'; // Default to unknown

    // Find the class with the highest probability
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            predictedClassName = prediction[i].className;
        }
    }

    // Optional: Add a confidence threshold for 'Unknown'
    const confidenceThreshold = 0.7; // 70% confidence
    if (highestProbability < confidenceThreshold) {
        predictedClassName = 'Unknown';
    }
    
    // Map model output to simple choices
    let mappedChoice = 'Unknown';
    if (predictedClassName.includes('Rock')) {
        mappedChoice = 'Rock';
    } else if (predictedClassName.includes('Paper')) {
        mappedChoice = 'Paper';
    } else if (predictedClassName.includes('Scissors')) {
        mappedChoice = 'Scissors';
    }

    userChoice = mappedChoice;
    // Update labels for debugging/visual feedback during prediction
    predictAndDisplayLabels(); 
}

async function predictAndDisplayLabels() {
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

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDiv.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownDiv.textContent = "GO!";
            setTimeout(async () => {
                countdownDiv.style.display = 'none';
                await captureUserChoice(); // Wait for user choice capture
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

// captureUserChoice now just processes the current userChoice from predict()
async function captureUserChoice() {
    // The userChoice is already being updated by the loop -> predict function
    // We just need to wait a moment to allow the webcam to update and predict
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure prediction update
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
    gameActive = false;
    restartBtn.style.display = 'block';
}

function restartGame() {
    clearGameDisplay();
    // Keep webcam active, just reset game state and start new countdown
    // The loop is still running, continuously predicting
    startGame(); // Start a new game round
}

// Event Listeners
startBtn.addEventListener('click', init);
restartBtn.addEventListener('click', restartGame);

// Initial call to loop to keep webcam preview running after init
if (webcam && gameInitialized) {
    window.requestAnimationFrame(loop);
}