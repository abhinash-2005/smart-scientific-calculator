// ==========================================
// GET HTML ELEMENTS
// ==========================================

const display =
    document.getElementById("display");

const expressionDisplay =
    document.getElementById("expressionDisplay");

const historyList =
    document.getElementById("history-list");

const themeButton =
    document.getElementById("themeButton");


// ==========================================
// APP STATE
// ==========================================

let lastExpression = "";

let memoryValue = 0;


// ==========================================
// LOAD HISTORY
// ==========================================

let calculationHistory =
    JSON.parse(
        localStorage.getItem(
            "calculatorHistory"
        )
    ) || [];


// ==========================================
// LOAD MEMORY
// ==========================================

memoryValue =
    Number(
        localStorage.getItem(
            "calculatorMemory"
        )
    ) || 0;


// ==========================================
// LOAD THEME
// ==========================================

const savedTheme =
    localStorage.getItem(
        "calculatorTheme"
    );


if (savedTheme === "light") {

    document.body.classList.add("light");

    themeButton.textContent = "☀️";

}


// ==========================================
// LOAD HISTORY UI
// ==========================================

loadHistory();


// ==========================================
// HISTORY
// ==========================================

function loadHistory() {

    historyList.innerHTML = "";


    if (
        calculationHistory.length === 0
    ) {

        showEmptyHistory();

        return;

    }


    calculationHistory.forEach(
        function(item) {

            createHistoryItem(
                item.expression,
                item.result
            );

        }
    );

}


function showEmptyHistory() {

    historyList.innerHTML = `

        <div class="empty-history">

            <div class="history-icon">
                🧮
            </div>

            <p>No calculations yet</p>

            <span>
                Your calculations will appear here
            </span>

        </div>

    `;

}


function saveHistory() {

    localStorage.setItem(
        "calculatorHistory",
        JSON.stringify(
            calculationHistory
        )
    );

}


// ==========================================
// APPEND VALUE
// ==========================================

function appendValue(value) {

    if (
        display.value === "Error"
    ) {

        display.value = "";

        expressionDisplay.textContent = "";

    }


    // --------------------------------------
    // DECIMAL
    // --------------------------------------

    if (value === ".") {

        const parts =
            display.value.split(
                /[\+\-\*\/]/
            );

        const currentNumber =
            parts[
                parts.length - 1
            ];


        if (
            currentNumber.includes(".")
        ) {

            return;

        }

    }


    // --------------------------------------
    // CLOSING PARENTHESIS
    // --------------------------------------

    if (
        value === ")" &&
        (
            display.value === "" ||
            display.value.endsWith("(")
        )
    ) {

        return;

    }


    display.value += value;

}


// ==========================================
// APPEND OPERATOR
// ==========================================

function appendOperator(operator) {

    if (
        display.value === "" ||
        display.value === "Error"
    ) {

        return;

    }


    const lastCharacter =
        display.value.slice(-1);


    if (
        ["+", "-", "*", "/"]
            .includes(lastCharacter)
    ) {

        return;

    }


    if (
        lastCharacter === "(" &&
        operator !== "-"
    ) {

        return;

    }


    display.value += operator;

}


// ==========================================
// CLEAR DISPLAY
// ==========================================

function clearDisplay() {

    display.value = "";

    expressionDisplay.textContent = "";

    lastExpression = "";

}


// ==========================================
// DELETE LAST
// ==========================================

function deleteLast() {

    display.value =
        display.value.slice(0, -1);

}


// ==========================================
// PARENTHESES VALIDATION
// ==========================================

function validParentheses(
    expression
) {

    let count = 0;


    for (
        const character of expression
    ) {

        if (character === "(") {

            count++;

        }


        if (character === ")") {

            count--;

        }


        if (count < 0) {

            return false;

        }

    }


    return count === 0;

}


// ==========================================
// TOKENIZER
// ==========================================

function tokenize(expression) {

    const tokens = [];

    let i = 0;


    while (
        i < expression.length
    ) {

        const character =
            expression[i];


        // Space

        if (
            character === " "
        ) {

            i++;

            continue;

        }


        // Number

        if (
            /[0-9.]/.test(character)
        ) {

            let number = "";


            while (
                i < expression.length &&
                /[0-9.]/.test(
                    expression[i]
                )
            ) {

                number +=
                    expression[i];

                i++;

            }


            if (
                number.split(".")
                    .length > 2
            ) {

                throw new Error(
                    "Invalid number"
                );

            }


            const parsed =
                Number(number);


            if (
                isNaN(parsed)
            ) {

                throw new Error(
                    "Invalid number"
                );

            }


            tokens.push(parsed);

            continue;

        }


        // Power

        if (
            character === "*" &&
            expression[i + 1] === "*"
        ) {

            tokens.push("**");

            i += 2;

            continue;

        }


        // Operators

        if (
            ["+", "-", "*", "/"]
                .includes(character)
        ) {

            tokens.push(character);

            i++;

            continue;

        }


        // Percentage

        if (
            character === "%"
        ) {

            tokens.push("%");

            i++;

            continue;

        }


        // Parentheses

        if (
            character === "(" ||
            character === ")"
        ) {

            tokens.push(character);

            i++;

            continue;

        }


        throw new Error(
            "Invalid character"
        );

    }


    return tokens;

}


// ==========================================
// OPERATOR PRECEDENCE
// ==========================================

function precedence(operator) {

    if (
        operator === "+" ||
        operator === "-"
    ) {

        return 1;

    }


    if (
        operator === "*" ||
        operator === "/"
    ) {

        return 2;

    }


    if (
        operator === "**"
    ) {

        return 3;

    }


    return 0;

}


function isRightAssociative(
    operator
) {

    return operator === "**";

}


// ==========================================
// SAFE EVALUATOR
// ==========================================

function safeEvaluate(
    expression
) {

    const tokens =
        tokenize(expression);


    if (
        tokens.length === 0
    ) {

        throw new Error(
            "Empty expression"
        );

    }


    const output = [];

    const operators = [];

    let previousToken = null;


    // ======================================
    // SHUNTING-YARD ALGORITHM
    // ======================================

    for (
        let i = 0;
        i < tokens.length;
        i++
    ) {

        const token =
            tokens[i];


        // Number

        if (
            typeof token === "number"
        ) {

            output.push(token);

            previousToken = token;

            continue;

        }


        // Percentage

        if (
            token === "%"
        ) {

            if (
                typeof previousToken !==
                "number"
            ) {

                throw new Error(
                    "Invalid percentage"
                );

            }


            output.push("%");

            previousToken = "%";

            continue;

        }


        // Opening bracket

        if (
            token === "("
        ) {

            operators.push("(");

            previousToken = "(";

            continue;

        }


        // Closing bracket

        if (
            token === ")"
        ) {

            while (
                operators.length > 0 &&
                operators[
                    operators.length - 1
                ] !== "("
            ) {

                output.push(
                    operators.pop()
                );

            }


            if (
                operators.length === 0
            ) {

                throw new Error(
                    "Invalid parentheses"
                );

            }


            operators.pop();

            previousToken = ")";

            continue;

        }


        // Operators

        if (
            ["+", "-", "*", "/",
             "**"].includes(token)
        ) {

            // Unary minus

            if (
                token === "-" &&
                (
                    previousToken === null ||
                    previousToken === "(" ||
                    ["+", "-", "*",
                     "/", "**"].includes(
                        previousToken
                    )
                )
            ) {

                operators.push("u-");

                previousToken = "u-";

                continue;

            }


            while (
                operators.length > 0
            ) {

                const top =
                    operators[
                        operators.length - 1
                    ];


                if (
                    top === "("
                ) {

                    break;

                }


                if (
                    top === "u-"
                ) {

                    output.push(
                        operators.pop()
                    );

                    continue;

                }


                const current =
                    precedence(token);

                const topValue =
                    precedence(top);


                const shouldPop =
                    isRightAssociative(
                        token
                    )
                        ? current < topValue
                        : current <= topValue;


                if (!shouldPop) {

                    break;

                }


                output.push(
                    operators.pop()
                );

            }


            operators.push(token);

            previousToken = token;

        }

    }


    // Remaining operators

    while (
        operators.length > 0
    ) {

        const operator =
            operators.pop();


        if (
            operator === "("
        ) {

            throw new Error(
                "Invalid parentheses"
            );

        }


        output.push(operator);

    }


    // ======================================
    // RPN EVALUATION
    // ======================================

    const stack = [];


    for (
        const token of output
    ) {

        // Number

        if (
            typeof token === "number"
        ) {

            stack.push(token);

            continue;

        }


        // Percentage

        if (
            token === "%"
        ) {

            if (
                stack.length < 1
            ) {

                throw new Error(
                    "Invalid percentage"
                );

            }


            const number =
                stack.pop();


            stack.push(
                number / 100
            );

            continue;

        }


        // Unary minus

        if (
            token === "u-"
        ) {

            if (
                stack.length < 1
            ) {

                throw new Error(
                    "Invalid expression"
                );

            }


            const number =
                stack.pop();


            stack.push(
                -number
            );

            continue;

        }


        // Binary operator

        if (
            stack.length < 2
        ) {

            throw new Error(
                "Invalid expression"
            );

        }


        const right =
            stack.pop();

        const left =
            stack.pop();

        let result;


        switch (token) {

            case "+":

                result =
                    left + right;

                break;


            case "-":

                result =
                    left - right;

                break;


            case "*":

                result =
                    left * right;

                break;


            case "/":

                if (
                    right === 0
                ) {

                    throw new Error(
                        "Division by zero"
                    );

                }


                result =
                    left / right;

                break;


            case "**":

                result =
                    Math.pow(
                        left,
                        right
                    );

                break;


            default:

                throw new Error(
                    "Unknown operator"
                );

        }


        if (
            !Number.isFinite(result)
        ) {

            throw new Error(
                "Invalid result"
            );

        }


        stack.push(result);

    }


    if (
        stack.length !== 1
    ) {

        throw new Error(
            "Invalid expression"
        );

    }


    return stack[0];

}


// ==========================================
// CALCULATE
// ==========================================

function calculate() {

    if (
        display.value === "" ||
        display.value === "Error"
    ) {

        return;

    }


    const originalExpression =
        display.value;


    try {

        if (
            !validParentheses(
                originalExpression
            )
        ) {

            showError(
                "Invalid parentheses"
            );

            return;

        }


        const lastCharacter =
            originalExpression.slice(-1);


        if (
            ["+", "-", "*", "/"]
                .includes(lastCharacter)
        ) {

            showError(
                "Incomplete expression"
            );

            return;

        }


        const result =
            safeEvaluate(
                originalExpression
            );


        const formatted =
            formatResult(result);


        expressionDisplay.textContent =
            originalExpression;


        display.value =
            formatted;


        lastExpression =
            originalExpression;


        addToHistory(
            originalExpression,
            formatted
        );

    }
    catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Invalid expression"
        );

    }

}


// ==========================================
// ERROR
// ==========================================

function showError(message) {

    expressionDisplay.textContent =
        message;

    display.value =
        "Error";

}


// ==========================================
// FORMAT RESULT
// ==========================================

function formatResult(number) {

    if (
        Math.abs(number) < 1e-12
    ) {

        return "0";

    }


    const rounded =
        Number(
            number.toFixed(10)
        );


    return rounded.toString();

}


// ==========================================
// HISTORY
// ==========================================

function addToHistory(
    expression,
    result
) {

    calculationHistory.unshift({

        expression: expression,

        result: result

    });


    if (
        calculationHistory.length > 20
    ) {

        calculationHistory =
            calculationHistory.slice(
                0,
                20
            );

    }


    saveHistory();

    loadHistory();

}


function createHistoryItem(
    expression,
    result
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "history-item";


    item.innerHTML = `

        <div class="history-expression">

            ${escapeHTML(expression)}

        </div>


        <div class="history-result">

            = ${escapeHTML(result)}

        </div>

    `;


    item.addEventListener(
        "click",
        function() {

            display.value =
                result;

            expressionDisplay.textContent =
                expression;

        }
    );


    historyList.appendChild(item);

}


function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


function clearHistory() {

    calculationHistory = [];

    saveHistory();

    showEmptyHistory();

}


// ==========================================
// MEMORY FUNCTIONS
// ==========================================

function saveMemory() {

    localStorage.setItem(
        "calculatorMemory",
        memoryValue
    );

}


// ------------------------------------------
// MC - MEMORY CLEAR
// ------------------------------------------

function memoryClear() {

    memoryValue = 0;

    saveMemory();

    expressionDisplay.textContent =
        "Memory cleared";

}


// ------------------------------------------
// MR - MEMORY RECALL
// ------------------------------------------

function memoryRecall() {

    display.value =
        formatResult(memoryValue);

    expressionDisplay.textContent =
        "Memory recall";

}


// ------------------------------------------
// M+ - MEMORY ADD
// ------------------------------------------

function memoryAdd() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    memoryValue += number;

    saveMemory();


    expressionDisplay.textContent =
        `Memory: ${formatResult(memoryValue)}`;

}


// ------------------------------------------
// M- - MEMORY SUBTRACT
// ------------------------------------------

function memorySubtract() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    memoryValue -= number;

    saveMemory();


    expressionDisplay.textContent =
        `Memory: ${formatResult(memoryValue)}`;

}


// ------------------------------------------
// GET CURRENT NUMBER
// ------------------------------------------

function getCurrentNumber() {

    if (
        display.value === "" ||
        display.value === "Error"
    ) {

        return null;

    }


    const number =
        Number(display.value);


    if (
        !Number.isFinite(number)
    ) {

        return null;

    }


    return number;

}


// ==========================================
// FACTORIAL
// ==========================================

function factorial() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    if (
        number < 0 ||
        !Number.isInteger(number)
    ) {

        showError(
            "Factorial needs a positive integer"
        );

        return;

    }


    if (
        number > 170
    ) {

        showError(
            "Number is too large"
        );

        return;

    }


    let result = 1;


    for (
        let i = 2;
        i <= number;
        i++
    ) {

        result *= i;

    }


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `${number}!`;


    display.value =
        formatted;


    addToHistory(
        `${number}!`,
        formatted
    );

}


// ==========================================
// RECIPROCAL
// ==========================================

function reciprocal() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    if (
        number === 0
    ) {

        showError(
            "Cannot divide by zero"
        );

        return;

    }


    const result =
        1 / number;


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `1/${number}`;


    display.value =
        formatted;


    addToHistory(
        `1/${number}`,
        formatted
    );

}


// ==========================================
// ABSOLUTE VALUE
// ==========================================

function absoluteValue() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const result =
        Math.abs(number);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `|${number}|`;


    display.value =
        formatted;


    addToHistory(
        `|${number}|`,
        formatted
    );

}


// ==========================================
// TOGGLE SIGN
// ==========================================

function toggleSign() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const result =
        number * -1;


    display.value =
        formatResult(result);

}


// ==========================================
// 10^X
// ==========================================

function tenPower() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const result =
        Math.pow(10, number);


    if (
        !Number.isFinite(result)
    ) {

        showError(
            "Result too large"
        );

        return;

    }


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `10^${number}`;


    display.value =
        formatted;


    addToHistory(
        `10^${number}`,
        formatted
    );

}


// ==========================================
// SQUARE ROOT
// ==========================================

function squareRoot() {

    const number =
        getCurrentNumber();


    if (
        number === null ||
        number < 0
    ) {

        showError(
            "Invalid square root"
        );

        return;

    }


    const result =
        Math.sqrt(number);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `√${number}`;


    display.value =
        formatted;


    addToHistory(
        `√${number}`,
        formatted
    );

}


// ==========================================
// SQUARE
// ==========================================

function squareNumber() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const result =
        Math.pow(
            number,
            2
        );


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `${number}²`;


    display.value =
        formatted;


    addToHistory(
        `${number}²`,
        formatted
    );

}


// ==========================================
// POWER
// ==========================================

function powerNumber() {

    if (
        display.value === "" ||
        display.value === "Error"
    ) {

        return;

    }


    const lastCharacter =
        display.value.slice(-1);


    if (
        ["+", "-", "*", "/", "."]
            .includes(lastCharacter)
    ) {

        return;

    }


    display.value += "**";

}


// ==========================================
// SIN
// ==========================================

function sinFunction() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const radians =
        number *
        Math.PI /
        180;


    const result =
        Math.sin(radians);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `sin(${number}°)`;


    display.value =
        formatted;


    addToHistory(
        `sin(${number}°)`,
        formatted
    );

}


// ==========================================
// COS
// ==========================================

function cosFunction() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const radians =
        number *
        Math.PI /
        180;


    const result =
        Math.cos(radians);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `cos(${number}°)`;


    display.value =
        formatted;


    addToHistory(
        `cos(${number}°)`,
        formatted
    );

}


// ==========================================
// TAN
// ==========================================

function tanFunction() {

    const number =
        getCurrentNumber();


    if (
        number === null
    ) {

        showError(
            "Enter a number"
        );

        return;

    }


    const normalized =
        Math.abs(
            number % 180
        );


    if (
        Math.abs(
            normalized - 90
        ) < 1e-10
    ) {

        showError(
            "Undefined tangent"
        );

        return;

    }


    const radians =
        number *
        Math.PI /
        180;


    const result =
        Math.tan(radians);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `tan(${number}°)`;


    display.value =
        formatted;


    addToHistory(
        `tan(${number}°)`,
        formatted
    );

}


// ==========================================
// LOG
// ==========================================

function logFunction() {

    const number =
        getCurrentNumber();


    if (
        number === null ||
        number <= 0
    ) {

        showError(
            "Log requires positive number"
        );

        return;

    }


    const result =
        Math.log10(number);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `log(${number})`;


    display.value =
        formatted;


    addToHistory(
        `log(${number})`,
        formatted
    );

}


// ==========================================
// LN
// ==========================================

function lnFunction() {

    const number =
        getCurrentNumber();


    if (
        number === null ||
        number <= 0
    ) {

        showError(
            "ln requires positive number"
        );

        return;

    }


    const result =
        Math.log(number);


    const formatted =
        formatResult(result);


    expressionDisplay.textContent =
        `ln(${number})`;


    display.value =
        formatted;


    addToHistory(
        `ln(${number})`,
        formatted
    );

}


// ==========================================
// THEME
// ==========================================

function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );


    if (
        document.body.classList.contains(
            "light"
        )
    ) {

        themeButton.textContent =
            "☀️";


        localStorage.setItem(
            "calculatorTheme",
            "light"
        );

    }
    else {

        themeButton.textContent =
            "🌙";


        localStorage.setItem(
            "calculatorTheme",
            "dark"
        );

    }

}


// ==========================================
// KEYBOARD SUPPORT
// ==========================================

document.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key;


        // Numbers

        if (
            key >= "0" &&
            key <= "9"
        ) {

            appendValue(key);

        }


        // Operators

        else if (
            key === "+" ||
            key === "-" ||
            key === "*" ||
            key === "/"
        ) {

            appendOperator(key);

        }


        // Decimal

        else if (
            key === "."
        ) {

            appendValue(".");

        }


        // Parentheses

        else if (
            key === "("
        ) {

            appendValue("(");

        }


        else if (
            key === ")"
        ) {

            appendValue(")");

        }


        // Percentage

        else if (
            key === "%"
        ) {

            appendValue("%");

        }


        // Calculate

        else if (
            key === "Enter" ||
            key === "="
        ) {

            calculate();

        }


        // Delete

        else if (
            key === "Backspace"
        ) {

            deleteLast();

        }


        // Clear

        else if (
            key === "Escape"
        ) {

            clearDisplay();

        }


        // Factorial

        else if (
            key === "!"
        ) {

            factorial();

        }

    }
);