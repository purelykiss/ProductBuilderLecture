document.addEventListener('DOMContentLoaded', () => {
    const numbersContainer = document.getElementById('numbers');
    const generateBtn = document.getElementById('generate');
    const lottoNumbersInput = document.getElementById('lotto-numbers-input');

    if (generateBtn) {
        const getBallColor = (number) => {
            if (number <= 10) return '#fbc400'; // Yellow
            if (number <= 20) return '#69c8f2'; // Blue
            if (number <= 30) return '#ff7272'; // Red
            if (number <= 40) return '#aaa';     // Gray
            return '#b0d840'; // Green
        };

        const generateLottoNumbers = () => {
            if (!numbersContainer) return;
            numbersContainer.innerHTML = '';
            const numbers = new Set();
            while (numbers.size < 6) {
                const randomNumber = Math.floor(Math.random() * 45) + 1;
                numbers.add(randomNumber);
            }

            const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
            
            if (lottoNumbersInput) {
                lottoNumbersInput.value = sortedNumbers.join(', ');
            }

            sortedNumbers.forEach((number, index) => {
                setTimeout(() => {
                    const ball = document.createElement('div');
                    ball.classList.add('number-ball');
                    ball.textContent = number;
                    ball.style.backgroundColor = getBallColor(number);
                    ball.style.animationDelay = `${index * 0.1}s`;
                    numbersContainer.appendChild(ball);
                }, index * 200);
            });
        };

        generateBtn.addEventListener('click', generateLottoNumbers);

        // Initial generation
        generateLottoNumbers();
    }
});