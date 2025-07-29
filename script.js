document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const gameContainer = document.getElementById('game-container');

    setTimeout(() => {
        splashScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
    }, 2000);

    const boardContainer = document.getElementById('board-container');
    const keyboardContainer = document.getElementById('keyboard-container');

    // Game variables
    const wordLength = 5;
    const maxGuesses = 6;
    let currentGuess = [];
    let currentRow = 0;
    let targetWord = '';
    let isGameOver = false;

    const keys = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
        ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'del']
    ];

    let gameMode = 'infinite'; // 'daily' or 'infinite'

    function init() {
        // ... (init code before event listeners)

        // Event Listeners
        document.getElementById('daily-challenge-btn').addEventListener('click', () => setGameMode('daily'));
        document.getElementById('stats-btn').addEventListener('click', showStats);
        document.addEventListener('keydown', handleKeyPress);
        keyboardContainer.addEventListener('click', handleKeyPress);

        setGameMode('daily'); // Default mode
    }

    function setGameMode(mode) {
        gameMode = mode;
        resetGame();
    }

    function getDailyWord() {
        const startDate = new Date('2024-01-01');
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const wordIndex = diffDays % dictionary.es.length;
        return dictionary.es[wordIndex];
    }

    function resetGame() {
        // Clear board
        boardContainer.innerHTML = '';
        for (let i = 0; i < maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < wordLength; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                row.appendChild(tile);
            }
            boardContainer.appendChild(row);
        }

        // Reset keys
        const keys = keyboardContainer.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.remove('correct', 'misplaced', 'incorrect');
        });

        // Select a new word based on game mode
        if (gameMode === 'daily') {
            targetWord = getDailyWord();
        } else {
            targetWord = dictionary.es[Math.floor(Math.random() * dictionary.es.length)];
        }
        console.log(`Target word: ${targetWord}`); // For debugging

        // Reset game state
        currentGuess = [];
        currentRow = 0;
        isGameOver = false;
    }

    function handleKeyPress(e) {
        if (isGameOver) return;

        const key = e.type === 'keydown' ? e.key.toLowerCase() : e.target.dataset.key;

        if (key === 'enter' && currentGuess.length === wordLength) {
            submitGuess();
        } else if (key === 'del' || key === 'backspace') {
            deleteLetter();
        } else if (key.match(/^[a-zñ]$/) && currentGuess.length < wordLength) {
            addLetter(key);
        }
    }

    function addLetter(letter) {
        currentGuess.push(letter);
        const row = boardContainer.children[currentRow];
        const tile = row.children[currentGuess.length - 1];
        tile.textContent = letter;
        tile.classList.add('filled');
    }

    function deleteLetter() {
        if (currentGuess.length === 0) return;
        const row = boardContainer.children[currentRow];
        const tile = row.children[currentGuess.length - 1];
        tile.textContent = '';
        tile.classList.remove('filled');
        currentGuess.pop();
    }

    function submitGuess() {
        const guess = currentGuess.join('');

        if (!dictionary.es.includes(guess)) {
            alert('Palabra no encontrada en el diccionario.');
            return;
        }

        const row = boardContainer.children[currentRow];
        const guessLetters = guess.split('');
        const targetLetters = targetWord.split('');

        const colors = Array(wordLength).fill('');

        // Mark correct letters (green)
        for (let i = 0; i < wordLength; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                colors[i] = 'correct';
                updateKeyStatus(guessLetters[i], 'correct');
                targetLetters[i] = null;
            }
        }

        // Mark misplaced (yellow) and incorrect (gray) letters
        for (let i = 0; i < wordLength; i++) {
            if (colors[i] === 'correct') continue;

            if (targetLetters.includes(guessLetters[i])) {
                colors[i] = 'misplaced';
                updateKeyStatus(guessLetters[i], 'misplaced');
                targetLetters[targetLetters.indexOf(guessLetters[i])] = null;
            } else {
                colors[i] = 'incorrect';
                updateKeyStatus(guessLetters[i], 'incorrect');
            }
        }

        // Animate the tiles
        for (let i = 0; i < wordLength; i++) {
            setTimeout(() => {
                row.children[i].classList.add('flip');
                setTimeout(() => {
                    row.children[i].classList.add(colors[i]);
                }, 250);
            }, i * 300);
        }


        setTimeout(() => {
            if (guess === targetWord) {
                updateStats(true, currentRow + 1);
                alert('¡Felicidades! Has adivinado la palabra.');
                isGameOver = true;
                showStats();
            } else if (currentRow + 1 === maxGuesses) {
                updateStats(false);
                alert(`Fin del juego. La palabra era ${targetWord}.`);
                isGameOver = true;
                showStats();
            }

            currentRow++;
            currentGuess = [];
        }, wordLength * 300);
    }

    const statsModal = document.getElementById('stats-modal');
    const statsContainer = document.getElementById('stats-container');
    const closeBtn = document.querySelector('.close-btn');

    let stats = JSON.parse(localStorage.getItem('wordle-stats')) || {
        wins: 0,
        losses: 0,
        distribution: [0, 0, 0, 0, 0, 0]
    };

    function updateStats(didWin, guessCount) {
        if (didWin) {
            stats.wins++;
            stats.distribution[guessCount - 1]++;
        } else {
            stats.losses++;
        }
        localStorage.setItem('wordle-stats', JSON.stringify(stats));
    }

    function showStats() {
        statsContainer.innerHTML = `
            <p>Victorias: ${stats.wins}</p>
            <p>Derrotas: ${stats.losses}</p>
            <h3>Distribución de Victorias:</h3>
            <div class="chart">
                ${stats.distribution.map((count, i) => `
                    <div class="bar-container">
                        <span class="bar-label">${i + 1}</span>
                        <div class="bar" style="width: ${count > 0 ? (count / Math.max(...stats.distribution) * 100) : 0}%">${count}</div>
                    </div>
                `).join('')}
            </div>
        `;
        statsModal.style.display = 'block';
    }

    closeBtn.onclick = () => {
        statsModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == statsModal) {
            statsModal.style.display = 'none';
        }
    };

    function updateKeyStatus(key, status) {
        const keyElement = document.querySelector(`[data-key="${key}"]`);
        if (!keyElement) return;

        const currentStatus = keyElement.classList.contains('correct') ? 'correct'
                            : keyElement.classList.contains('misplaced') ? 'misplaced'
                            : '';

        if (status === 'correct' || (status === 'misplaced' && currentStatus !== 'correct')) {
            keyElement.classList.remove('misplaced', 'incorrect');
            keyElement.classList.add(status);
        } else if (status === 'incorrect' && !currentStatus) {
            keyElement.classList.add(status);
        }
    }

    // Initial setup
    (function() {
        // Create keyboard
        keyboardContainer.innerHTML = '';
        keys.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            row.forEach(key => {
                const keyButton = document.createElement('button');
                keyButton.className = 'key';
                keyButton.textContent = key;
                keyButton.setAttribute('data-key', key);
                if (key === 'enter' || key === 'del') {
                    keyButton.classList.add('large');
                }
                rowDiv.appendChild(keyButton);
            });
            keyboardContainer.appendChild(rowDiv);
        });

        // Event Listeners
        document.getElementById('daily-challenge-btn').addEventListener('click', () => setGameMode('daily'));
        document.getElementById('stats-btn').addEventListener('click', showStats);
        document.addEventListener('keydown', handleKeyPress);
        keyboardContainer.addEventListener('click', handleKeyPress);

        setGameMode('daily'); // Default mode
    })();
});
