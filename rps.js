// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/gJc2-VcMm/";

let model, webcam, labelContainer, maxPredictions;
let gameStarted = false;
let gameActive = false;
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


// Load the image model and setup the webcam
async function init() {
    startBtn.disabled = true;
    gameStarted = true;
    gameActive = true;

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    webcamContainer.innerHTML = ''; // Clear previous webcam if any
    webcamContainer.appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ''; // Clear previous labels
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }

    // Start countdown after webcam is set up
    startCountdown();
}

async function loop() {
    if (gameActive) {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }
}

// run the webcam image through the image model
async function predict() {
    // This will be modified later to only predict during specific game phases
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
            setTimeout(() => {
                countdownDiv.style.display = 'none';
                captureUserChoice();
            }, 500); // Display "GO!" for a moment
        }
    }, 1000);
}

async function captureUserChoice() {
    const prediction = await model.predict(webcam.canvas);
    let highestProbability = 0;
    let predictedClass = '';

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability.toFixed(2) > highestProbability) {
            highestProbability = prediction[i].probability.toFixed(2);
            predictedClass = prediction[i].className;
        }
    }
    userChoice = predictedClass;
    makeComputerChoice();
    displayChoices();
    determineWinner();
    endGame();
}

function makeComputerChoice() {
    const choices = ['Rock', 'Paper', 'Scissors'];
    computerChoice = choices[Math.floor(Math.random() * choices.length)];
}

function displayChoices() {
    const emojiMap = {
        'Rock': '🪨',
        'Paper': '📄',
        'Scissors': '✂️'
    };
    userChoiceDiv.textContent = `You: ${emojiMap[userChoice]}`;
    computerChoiceDiv.textContent = `Computer: ${emojiMap[computerChoice]}`;
    userChoiceDiv.style.display = 'block';
    computerChoiceDiv.style.display = 'block';
}

function determineWinner() {
    if (userChoice === computerChoice) {
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
    startBtn.style.display = 'none';
    restartBtn.style.display = 'block';
    webcam.stop(); // Stop webcam stream after game ends
}

function restartGame() {
    startBtn.disabled = false;
    startBtn.style.display = 'block';
    restartBtn.style.display = 'none';
    countdownDiv.style.display = 'none';
    userChoiceDiv.style.display = 'none';
    computerChoiceDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    userChoice = '';
    computerChoice = '';
    resultText = '';
    labelContainer.innerHTML = ''; // Clear labels
    webcamContainer.innerHTML = ''; // Clear webcam canvas
}

startBtn.addEventListener('click', init);
restartBtn.addEventListener('click', restartGame);