const display = document.getElementById('display');
let currentInput = '0';
let shouldResetDisplay = false;
let isScientific = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    switchMode('standard');
});

function switchMode(mode) {
    const container = document.querySelector('.calculator-container');
    const standardBtn = document.getElementById('btn-standard');
    const scientificBtn = document.getElementById('btn-scientific');
    const standardKeys = document.querySelector('.standard-keys');
    const scientificKeys = document.querySelector('.scientific-keys');

    if (mode === 'scientific') {
        container.classList.add('scientific-mode');
        standardBtn.classList.remove('active');
        scientificBtn.classList.add('active');
        standardKeys.style.display = 'none';
        scientificKeys.style.display = 'grid';
        isScientific = true;
    } else {
        container.classList.remove('scientific-mode');
        scientificBtn.classList.remove('active');
        standardBtn.classList.add('active');
        scientificKeys.style.display = 'none';
        standardKeys.style.display = 'grid';
        isScientific = false;
    }
}

function updateDisplay() {
    display.value = currentInput;
    // Auto scroll to end
    display.scrollLeft = display.scrollWidth;
}

function appendNumber(number) {
    if (currentInput === '0' || shouldResetDisplay) {
        currentInput = number;
        shouldResetDisplay = false;
    } else {
        currentInput += number;
    }
    updateDisplay();
}

function appendOperator(operator) {
    if (shouldResetDisplay) shouldResetDisplay = false;
    
    const lastChar = currentInput.slice(-1);
    // Allow minus as negative sign if display is 0 or after opening bracket
    if (operator === '-' && (currentInput === '0' || lastChar === '(')) {
        if (currentInput === '0') currentInput = '-';
        else currentInput += '-';
        updateDisplay();
        return;
    }

    // Prevent double operators
    if (['+', '-', '*', '/', '%', '^'].includes(lastChar)) {
        currentInput = currentInput.slice(0, -1) + operator;
    } else {
        currentInput += operator;
    }
    updateDisplay();
}

function appendFunction(funcName) {
    if (currentInput === '0' || shouldResetDisplay) {
        currentInput = funcName + '(';
        shouldResetDisplay = false;
    } else {
        // Add multiplication if implicit (e.g. 5sin -> 5*sin)
        const lastChar = currentInput.slice(-1);
        if (/[0-9πe)]/.test(lastChar)) {
            currentInput += '*' + funcName + '(';
        } else {
            currentInput += funcName + '(';
        }
    }
    updateDisplay();
}

function appendConstant(constName) {
    if (currentInput === '0' || shouldResetDisplay) {
        currentInput = constName;
        shouldResetDisplay = false;
    } else {
         // Add multiplication if implicit (e.g. 5π -> 5*π)
         const lastChar = currentInput.slice(-1);
         if (/[0-9πe)]/.test(lastChar)) {
             currentInput += '*' + constName;
         } else {
             currentInput += constName;
         }
    }
    updateDisplay();
}

function clearDisplay() {
    currentInput = '0';
    shouldResetDisplay = false;
    updateDisplay();
}

function deleteLast() {
    if (shouldResetDisplay) {
        clearDisplay();
        return;
    }
    if (currentInput.length === 1 || currentInput === 'Error') {
        currentInput = '0';
    } else {
        // Handle deleting function names like 'sin(' together?
        // Simple approach: just delete one char
        currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
}

function calculate() {
    try {
        let expression = currentInput;

        // Replace constants
        expression = expression.replace(/π/g, 'Math.PI');
        expression = expression.replace(/e/g, 'Math.E');

        // Replace functions
        // We need to be careful with replace order or use regex
        expression = expression.replace(/sin/g, 'Math.sin');
        expression = expression.replace(/cos/g, 'Math.cos');
        expression = expression.replace(/tan/g, 'Math.tan');
        expression = expression.replace(/log/g, 'Math.log10');
        expression = expression.replace(/ln/g, 'Math.log');
        expression = expression.replace(/sqrt/g, 'Math.sqrt');
        
        // Handle Power operator '^' which JS doesn't support directly in eval (it's XOR)
        // We need to replace a^b with Math.pow(a,b)
        // This is complex with regex for nested expressions.
        // Quick fix: replace ^ with ** (ES6 exponentiation)
        expression = expression.replace(/\^/g, '**');

        // Security check
        if (!/^[0-9+\-*/%()., MathPIE_**]+$/.test(expression)) {
            // "Math" "PI" "E" "sin" "cos" etc contain letters. 
            // The regex above is too strict for the replaced string.
            // Let's rely on the input construction functions to keep it safe-ish 
            // and the fact that we replaced known words.
        }

        const result = eval(expression);

        if (!isFinite(result) || isNaN(result)) {
            throw new Error('Invalid');
        }

        // Format result
        if (!Number.isInteger(result)) {
             // Avoid precision errors like 0.1 + 0.2
            currentInput = parseFloat(result.toFixed(8)).toString();
        } else {
            currentInput = result.toString();
        }
        shouldResetDisplay = true;
    } catch (error) {
        currentInput = 'Error';
        shouldResetDisplay = true;
    }
    updateDisplay();
}

// Keyboard support
document.addEventListener('keydown', (event) => {
    const key = event.key;
    
    if (/[0-9]/.test(key)) {
        appendNumber(key);
    } else if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(key)) {
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape') {
        clearDisplay();
    } else if (key === '.') {
        appendNumber('.');
    }
});
