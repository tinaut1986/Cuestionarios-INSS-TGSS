/**
 * Convierte un string con saltos de línea (especialmente dobles saltos)
 * en párrafos HTML (<p>).
 * @param {string} text El texto de entrada con \n.
 * @returns {string} El texto formateado como HTML con etiquetas <p>.
 */
function formatTextAsParagraphs(text) {
    if (!text || typeof text !== 'string') {
        return ''; // Devuelve vacío si no hay texto o no es string
    }

    // 1. Reemplaza saltos de línea de Windows (\r\n) por \n estándar
    let processedText = text.replace(/\r\n/g, '\n');

    // 2. Recorta espacios en blanco al inicio y final
    processedText = processedText.trim();

    // 3. Divide el texto en bloques usando dos o más saltos de línea como separador
    //    Esto trata \n\n, \n\n\n, etc., como separadores de párrafo.
    const paragraphs = processedText.split(/\n{2,}/);

    // 4. Envuelve cada bloque no vacío en etiquetas <p>, convirtiendo \n internos a <br>
    const htmlParagraphs = paragraphs
        .map(p => p.trim()) // Quita espacios extra de cada bloque
        .filter(p => p.length > 0) // Elimina bloques vacíos
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`); // Envuelve en <p> y convierte \n internos a <br>

    // 5. Une los párrafos HTML
    return htmlParagraphs.join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizContainer = document.getElementById('quiz-container'); // Overall container
    const quizArea = document.getElementById('quiz-area');
    const progressBar = document.getElementById('progress-bar');
    const questionNumberDisplay = document.getElementById('question-number-display');
    const questionTypeDisplay = document.getElementById('question-type-display');
    const extraStatementsArea = document.getElementById('extra-statements-area');
    const extraStatementsContent = document.getElementById('extra-statements-content');
    const currentExtraStatementArea = document.getElementById('current-extra-statement-area');
    const currentExtraStatementContent = document.getElementById('current-extra-statement-content');
    const questionStatement = document.getElementById('question-statement');
    const answerOptionsList = document.getElementById('answer-options');
    const feedbackArea = document.getElementById('feedback-area');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreDisplay = document.getElementById('score');
    const totalQuestionsDisplay = document.getElementById('total-questions');
    const resultsArea = document.getElementById('results-area');
    const correctCountDisplay = document.getElementById('correct-count');
    const incorrectCountDisplay = document.getElementById('incorrect-count');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalTotalDisplay = document.getElementById('final-total');
    const retryFailedBtn = document.getElementById('retry-failed-btn');
    const restartBtn = document.getElementById('restart-btn'); // Goes back to setup
    const progressBarBottom = document.getElementById('progress-bar-bottom');
    const exitBtn = document.getElementById('exit-btn');

    // --- State Variables ---
    let allOriginalQuestionsFlat = []; // Holds the FLATTENED, ordered list from the new JSON structure
    let sessionQuestions = [];     // Questions selected for this session (subset/shuffled)
    let currentSessionIndex = 0;
    let score = 0;
    let userAnswers = [];          // Stores { selectedOption: 'a', isCorrect: true/false/null } for each session question
    let isRetryMode = false;       // Flag for retry session

    // --- Function to Flatten the New JSON Structure ---
    function flattenExamData(examData) {
        const flatQuestions = [];
        let absoluteIndex = 0; // Track overall index for context display later

        if (!examData || !Array.isArray(examData.ExamParts)) {
            console.error("Invalid exam data structure passed to flattenExamData:", examData);
            return [];
        }

        examData.ExamParts.forEach(part => {
            const partType = part.Type; // "Theory" or "PracticalCase"
            const partTitle = part.Title;
            const isPractical = (partType === 'PracticalCase');

            // *** READ THE FILENAME FROM THE 'part' OBJECT ***
            const originalFile = part.originalSourceFile || 'Archivo Desconocido';
            const originalTitle = part.originalExamTitle || 'Examen Desconocido'; // Usa la propiedad añadida por PHP

            const createQuestionObject = (q, index, isSuppl) => ({
                ...q, // Spread original question properties
                IsSupplementary: false, // Explicitly set
                IsPracticalCase: isPractical,
                PartType: partType,
                PartTitle: partTitle,
                originalIndexInPart: index, // Index within its original array (Questions)
                absoluteOriginalIndex: absoluteIndex++, // Absolute index in the flattened list
                sourceFile: originalFile,     // Identifier for the source exam
                sourceTitle: originalTitle   // Title of the source exam
            });

            // Process Regular Questions
            if (part.Questions && Array.isArray(part.Questions)) {
                part.Questions.forEach((q, index) => {
                    flatQuestions.push(createQuestionObject(q, index, false)); // isSuppl = false
                });
            }

            // Process Supplementary Questions
            if (part.SupplementaryQuestions && Array.isArray(part.SupplementaryQuestions)) {
                part.SupplementaryQuestions.forEach((q, index) => {
                    const isSupplFlag = (typeof q.IsSupplementary === 'boolean') ? q.IsSupplementary : true;
                    flatQuestions.push(createQuestionObject(q, index, isSupplFlag)); // Pasar flag de suplementaria
                });
            }
        });
        return flatQuestions;
    }

    // --- Initialization ---
    function initQuiz(questionsSource, numToSelect, isRetry = false) {
        if (typeof originalQuestionsData === 'undefined' || !originalQuestionsData || !Array.isArray(originalQuestionsData.ExamParts)) {
            console.error("Initial quiz data (originalQuestionsData with ExamParts) is missing or invalid.");
            if (!quizContainer) return;
        }

        exitBtn.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que quieres salir y volver a la configuración? Perderás el progreso actual.")) {
                window.location.reload(); // Reload to go back to setup
            }
        });



        isRetryMode = isRetry;

        // **MODIFIED:** Flatten the data structure first if not in retry mode
        if (!isRetry) {
            allOriginalQuestionsFlat = flattenExamData(originalQuestionsData);
        }
        // If retrying, questionsSource IS already the flattened, filtered list


        // --- Select and Shuffle Questions for the Session ---
        // **MODIFIED:** Use allOriginalQuestionsFlat if not retrying, otherwise use questionsSource
        let sourceForShuffling = isRetry ? questionsSource : allOriginalQuestionsFlat;
        let availableQuestions = shuffleArray([...sourceForShuffling]); // Shuffle a copy
        let numAvailable = availableQuestions.length;
        // **MODIFIED:** Use the requestedNumQuestions passed from PHP
        let actualNumQuestions = Math.min(requestedNumQuestions || numAvailable, numAvailable); // Use PHP's request or max available

        sessionQuestions = availableQuestions.slice(0, actualNumQuestions);

        // --- Reset State ---
        currentSessionIndex = 0;
        score = 0;

        userAnswers = new Array(sessionQuestions.length).fill(null).map(() => ({
            selectedShuffledIndex: null, // Asegurar que se inicializa así
            isCorrect: null
        }));

        // --- Update UI ---
        scoreDisplay.textContent = score;
        totalQuestionsDisplay.textContent = sessionQuestions.length;
        resultsArea.style.display = 'none';
        quizArea.style.display = 'block';
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        progressBar.style.display = 'flex'; // Ensure visible
        progressBarBottom.style.display = 'flex'; // Ensure visible
        progressBar.innerHTML = ''; // Clear old progress bar (top)
        progressBarBottom.innerHTML = ''; // Clear old progress bar (bottom)

        // --- Create Progress Bar Indicators (for both bars) ---
        sessionQuestions.forEach((_, index) => {
            const indicatorTop = document.createElement('div');
            indicatorTop.classList.add('progress-indicator');
            indicatorTop.dataset.index = index;
            indicatorTop.addEventListener('click', () => navigateToQuestion(index));
            progressBar.appendChild(indicatorTop);

            // Clone for the bottom bar
            const indicatorBottom = indicatorTop.cloneNode(true);
            indicatorBottom.addEventListener('click', () => navigateToQuestion(index)); // Add listener again for clone
            progressBarBottom.appendChild(indicatorBottom);
        });

        // --- Load First Question ---
        if (sessionQuestions.length > 0) {
            loadQuestion(currentSessionIndex);
        } else {
            console.error("No questions available to load for the session.");
            quizArea.innerHTML = "<p>Error: No se pudieron cargar las preguntas.</p>"; // Inform user
            // Consider hiding buttons etc.
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            progressBar.style.display = 'none';
            progressBarBottom.style.display = 'none';
        }

        // --- Reset Button States ---
        updateNavigationButtons();
        retryFailedBtn.style.display = 'none'; // Hide retry initially

        // --- Add Event Listeners (if not already added or if needed after reset) ---
        prevBtn.onclick = handlePrevQuestion; // Use onclick for simplicity in reset
        nextBtn.onclick = handleNextQuestion;
        retryFailedBtn.onclick = startRetryFailed;
        restartBtn.onclick = () => { window.location.reload(); }; // Reload page to reset
    }
    // Make initQuiz global so it can be called from index.html
    window.initQuiz = initQuiz;

    // --- Fisher-Yates Shuffle ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Load Question ---
    function loadQuestion(index) {
        console.log(`--- loadQuestion(${index}) ---`); // LOG INICIO
        if (index < 0 || index >= sessionQuestions.length) {
            console.error("loadQuestion: Invalid question index:", index);
            return;
        }

        currentSessionIndex = index;
        const currentQuestion = sessionQuestions[index];
        const currentAnswerState = userAnswers[currentSessionIndex] || { selectedShuffledIndex: null, isCorrect: null };
        console.log("loadQuestion: currentQuestion:", currentQuestion); // LOG DATOS PREGUNTA
        console.log("loadQuestion: currentAnswerState:", currentAnswerState); // LOG ESTADO GUARDADO

        // --- Update UI Elements ---
        feedbackArea.textContent = '';
        feedbackArea.className = 'feedback-area';
        questionNumberDisplay.textContent = `Pregunta ${index + 1} de ${sessionQuestions.length}`;
        questionTypeDisplay.textContent = getQuestionTypeLabel(currentQuestion);
        const sourceDisplay = document.getElementById('question-source-display');
        if (sourceDisplay && currentQuestion.sourceTitle) {
            sourceDisplay.textContent = `(Origen: ${currentQuestion.sourceTitle})`;
            sourceDisplay.style.display = 'inline-block';
        } else if (sourceDisplay) {
            sourceDisplay.textContent = '';
            sourceDisplay.style.display = 'none';
        }
        const statementText = currentQuestion.Statement || 'Pregunta no disponible';
        questionStatement.innerHTML = formatTextAsParagraphs(statementText);
        displayExtraStatements(currentQuestion);
        displayCurrentExtraStatement(currentQuestion.ExtraStatement);

        // --- Display Answer Options ---
        answerOptionsList.innerHTML = '';
        optionsAvailable = currentQuestion.Answers && Array.isArray(currentQuestion.Answers);

        if (optionsAvailable) {
            const shuffledAnswers = shuffleArray([...currentQuestion.Answers]);
            console.log("loadQuestion: shuffledAnswers:", shuffledAnswers); // LOG RESPUESTAS BARAJADAS
            const optionLabels = ['A', 'B', 'C', 'D'];
            const wasAnswered = currentAnswerState.selectedShuffledIndex !== null && currentAnswerState.selectedShuffledIndex !== undefined;
            console.log("loadQuestion: wasAnswered:", wasAnswered); // LOG SI ESTABA RESPONDIDA

            shuffledAnswers.forEach((answer, shuffledIdx) => {
                const li = document.createElement('li');
                const displayLabel = optionLabels[shuffledIdx];
                const answerText = answer.Text || '(Opción inválida)';
                li.innerHTML = `<b>${displayLabel})</b> ${answerText.replace(/\n/g, '<br>')}`;
                li.dataset.shuffledIndex = shuffledIdx;
                // console.log(`loadQuestion: Creating LI ${displayLabel}, shuffledIndex: ${shuffledIdx}, answer:`, answer); // LOG DETALLE LI

                if (wasAnswered) {
                    li.style.cursor = 'default';
                    if (shuffledIdx === currentAnswerState.selectedShuffledIndex) {
                        li.classList.add('selected');
                        li.classList.add(currentAnswerState.isCorrect ? 'correct' : 'incorrect');
                        // console.log(`loadQuestion: Restoring state for selected LI ${displayLabel}: correct=${currentAnswerState.isCorrect}`); // LOG RESTORE SELECTED
                    }
                    if (answer.IsCorrect === true) {
                        li.classList.add('correct');
                        // console.log(`loadQuestion: Marking correct LI ${displayLabel}`); // LOG MARKING CORRECT
                    }
                } else {
                    li.addEventListener('click', (event) => {
                        console.log(`Click detected on LI with shuffledIndex: ${event.currentTarget.dataset.shuffledIndex}`); // LOG CLICK
                        handleAnswerSelection(event.currentTarget, currentQuestion, shuffledAnswers);
                    });
                    li.style.cursor = 'pointer';
                }
                answerOptionsList.appendChild(li);
            });

            // --- Restaurar Texto de Feedback si fue respondida (MODIFICADO) ---
            if (wasAnswered) {
                let correctVisualLetterWhenAnswered = '??';
                // Necesitamos encontrar dónde ESTABA la correcta cuando se respondió.
                // ¡OJO! shuffledAnswers aquí es diferente cada vez que cargas!
                // ESTO ES COMPLICADO y propenso a errores si recargas una pregunta ya respondida.
                // Es MUCHO MÁS SEGURO mostrar siempre la LETRA ORIGINAL correcta.

                // *** Mantener la versión anterior es más fiable: ***
                const correctAnswerOriginal = currentQuestion.Answers.find(a => a.IsCorrect === true);
                const correctOriginalLetter = correctAnswerOriginal ? correctAnswerOriginal.Option.toUpperCase() : '??';

                feedbackArea.textContent = currentAnswerState.isCorrect
                    ? '¡Correcto!'
                    : `Incorrecto. La respuesta correcta era la ${correctOriginalLetter}.`; // Mantenemos letra ORIGINAL
                feedbackArea.className = `feedback-area ${currentAnswerState.isCorrect ? 'correct' : 'incorrect'}`;
                console.log("loadQuestion: Restored feedback text:", feedbackArea.textContent); // LOG RESTORE FEEDBACK TEXT
            }
        } else {
            answerOptionsList.innerHTML = '<li>No hay opciones disponibles.</li>';
        }

        updateProgressBarHighlight();
        updateNavigationButtons(); // Actualizar botones (llamada inicial)

        // Re-evaluar estado de nextBtn después de que todo se haya cargado
        const isCurrentAnsweredFinalCheck = userAnswers[currentSessionIndex]?.selectedShuffledIndex !== null && userAnswers[currentSessionIndex]?.selectedShuffledIndex !== undefined;
        nextBtn.disabled = !isCurrentAnsweredFinalCheck && !(currentSessionIndex === sessionQuestions.length - 1 && isCurrentAnsweredFinalCheck);
        console.log(`loadQuestion: Final nextBtn.disabled state: ${nextBtn.disabled}`); // LOG ESTADO FINAL BOTON NEXT

        // Si es la última y está respondida, llama a updateNavigationButtons de nuevo para el texto/icono
        if (currentSessionIndex === sessionQuestions.length - 1 && isCurrentAnsweredFinalCheck) {
            console.log("loadQuestion: Last question answered, updating nav buttons for 'Results' text."); // LOG LAST QUESTION UPDATE
            updateNavigationButtons();
        }
    }

    function getQuestionTypeLabel(question) {
        let label = '';
        if (question.IsPracticalCase) {
            label += 'Caso Práctico';
        } else {
            label += 'Teoría';
        }

        if (question.IsSupplementary) {
            label += ' (Reserva)';
        }

        // // *** AÑADIR ORIGEN ***
        // if (question.sourceFile) {
        //     // Limpiar el nombre del archivo (quitar extensión, opcional)
        //     let sourceName = question.sourceFile.replace(/\.json$/i, ''); // Quita .json (insensible a mayús)
        //     // Reemplazar '+' con espacios si usas ese convenio en títulos
        //     sourceName = sourceName.replace(/\+/g, ' ');
        //     label += ` [${sourceName}]`; // Añadir entre corchetes, por ejemplo
        // }


        return `(${label.trim() || 'Tipo Desconocido'})`;
    }

    // --- Display Accumulated Extra Statements ---
    function displayExtraStatements(currentQuestion) {
        extraStatementsContent.innerHTML = ''; // Clear existing content
        let foundStatements = false;

        const currentSourceFile = currentQuestion.sourceFile;
        const currentPartTitle = currentQuestion.PartTitle;
        const currentAbsoluteOriginalIndex = currentQuestion.absoluteOriginalIndex;

        for (let i = 0; i < allOriginalQuestionsFlat.length; i++) {
            const prevQuestion = allOriginalQuestionsFlat[i];

            if (prevQuestion.absoluteOriginalIndex >= currentAbsoluteOriginalIndex) {
                break;
            }

            if (prevQuestion.sourceFile === currentSourceFile &&
                prevQuestion.PartTitle === currentPartTitle) {
                if (prevQuestion.ExtraStatement) {
                    const div = document.createElement('div'); // Use a div container for each statement
                    // *** CHANGE HERE ***
                    // Directly assign the HTML string from the JSON
                    div.innerHTML = prevQuestion.ExtraStatement;
                    extraStatementsContent.appendChild(div);
                    foundStatements = true;
                }
            }
        }

        extraStatementsArea.style.display = foundStatements ? 'block' : 'none';
    }

    // --- Display Current Question's Extra Statement (SIMPLIFICADO) ---
    function displayCurrentExtraStatement(extraStatement) {
        // Verifica si hay algo en extraStatement (no null, no vacío, no solo espacios)
        if (extraStatement && extraStatement.trim() !== '') {
            // Si hay texto válido, lo mostramos
            const currentExtraText = extraStatement || '';
            // Asigna el texto formateado
            currentExtraStatementContent.innerHTML = formatTextAsParagraphs(currentExtraText); // O como lo estés formateando
            // Muestra el área
            currentExtraStatementArea.style.display = 'block';
        } else {
            // Si no hay texto válido (null, vacío, etc.), oculta el área
            currentExtraStatementArea.style.display = 'none';
        }
    }

    // --- MODIFICADO Handle Answer Selection ---
    function handleAnswerSelection(selectedLi, questionData, shuffledAnswers) {
        console.log("--- handleAnswerSelection ---"); // LOG INICIO HANDLE
        const currentSessionIndexForHandler = currentSessionIndex; // Captura el índice actual para evitar problemas de scope si hay clicks rápidos
        console.log("handleAnswerSelection: questionIndex:", currentSessionIndexForHandler);

        if (userAnswers[currentSessionIndexForHandler].selectedShuffledIndex !== null && userAnswers[currentSessionIndexForHandler].selectedShuffledIndex !== undefined) {
            console.warn("handleAnswerSelection: Already answered. Exiting.");
            return;
        }

        const selectedShuffledIndex = parseInt(selectedLi.dataset.shuffledIndex, 10);
        console.log("handleAnswerSelection: selectedShuffledIndex:", selectedShuffledIndex);

        if (!shuffledAnswers || selectedShuffledIndex < 0 || selectedShuffledIndex >= shuffledAnswers.length) {
            console.error("handleAnswerSelection: Invalid shuffledAnswers or index.", selectedShuffledIndex, shuffledAnswers);
            return;
        }
        const selectedAnswerObject = shuffledAnswers[selectedShuffledIndex];
        console.log("handleAnswerSelection: selectedAnswerObject:", selectedAnswerObject);

        let isCorrect = false;
        if (selectedAnswerObject && typeof selectedAnswerObject.IsCorrect === 'boolean') {
            isCorrect = selectedAnswerObject.IsCorrect;
        } else {
            console.error("handleAnswerSelection: Cannot determine correctness. Answer object:", selectedAnswerObject);
        }
        console.log("handleAnswerSelection: Determined isCorrect:", isCorrect);

        userAnswers[currentSessionIndexForHandler] = { selectedShuffledIndex: selectedShuffledIndex, isCorrect: isCorrect };
        console.log("handleAnswerSelection: State saved:", userAnswers[currentSessionIndexForHandler]);

        if (isCorrect) {
            score++;
            scoreDisplay.textContent = score;
            console.log("handleAnswerSelection: Score updated to:", score);
        }

        // --- Visual Feedback ---
        console.log("handleAnswerSelection: Applying visual feedback...");
        Array.from(answerOptionsList.children).forEach(li => {
            li.style.cursor = 'default';
            const old_element = li;
            const new_element = old_element.cloneNode(true);
            old_element.parentNode.replaceChild(new_element, old_element);
            const currentLi = new_element;
            const currentLiShuffledIndex = parseInt(currentLi.dataset.shuffledIndex, 10);

            if (!shuffledAnswers || currentLiShuffledIndex < 0 || currentLiShuffledIndex >= shuffledAnswers.length) {
                console.error("handleAnswerSelection: FB Loop - Invalid shuffledAnswers or index.", currentLiShuffledIndex, shuffledAnswers);
                return;
            }
            const currentLiAnswerObject = shuffledAnswers[currentLiShuffledIndex];
            if (!currentLiAnswerObject) {
                console.error("handleAnswerSelection: FB Loop - Cannot find answer object for index.", currentLiShuffledIndex);
                return;
            }

            currentLi.classList.remove('selected', 'correct', 'incorrect');

            if (currentLiShuffledIndex === selectedShuffledIndex) {
                currentLi.classList.add('selected');
                currentLi.classList.add(isCorrect ? 'correct' : 'incorrect');
                console.log(`handleAnswerSelection: FB Loop - Applied .selected and .${isCorrect ? 'correct' : 'incorrect'} to LI index ${currentLiShuffledIndex}`);
            }
            if (currentLiAnswerObject.IsCorrect === true) {
                currentLi.classList.add('correct');
                console.log(`handleAnswerSelection: FB Loop - Applied .correct to LI index ${currentLiShuffledIndex}`);
            }
        });

        // --- Text Feedback ---
        let correctVisualLetter = '??';
        // Encontrar el ÍNDICE BARAJADO de la respuesta correcta
        const correctShuffledIndex = shuffledAnswers.findIndex(a => a.IsCorrect === true);
        if (correctShuffledIndex !== -1) {
            // Obtener la letra visual (A, B, C, D) de ese índice
            const optionLabels = ['A', 'B', 'C', 'D'];
            correctVisualLetter = optionLabels[correctShuffledIndex];
        }

        feedbackArea.textContent = isCorrect ? '¡Correcto!' : `Incorrecto. La respuesta correcta era la ${correctVisualLetter}.`; // Usa la letra VISUAL
        feedbackArea.className = `feedback-area ${isCorrect ? 'correct' : 'incorrect'}`;
        console.log("handleAnswerSelection: Text feedback set:", feedbackArea.textContent);

        // --- Update Progress & Navigation ---
        updateProgressBarIndicator(currentSessionIndexForHandler, isCorrect);
        nextBtn.disabled = false; // Habilitar botón
        console.log("handleAnswerSelection: Enabling next button.");
        updateNavigationButtons(); // Actualizar botones AHORA
        console.log("handleAnswerSelection: --- END ---");
    }

    // --- Progress Bar Update ---
    function updateProgressBarIndicator(index, isCorrect) {
        const indicators = document.querySelectorAll(`.progress-indicator[data-index="${index}"]`); // Select all matching indicators
        indicators.forEach(indicator => {
            if (indicator) {
                indicator.classList.remove('correct', 'incorrect'); // Clear previous state
                indicator.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });
    }

    function updateProgressBarHighlight() {
        document.querySelectorAll('.progress-indicator').forEach(ind => {
            const index = parseInt(ind.dataset.index, 10);
            ind.classList.toggle('current', index === currentSessionIndex);
        });
    }

    // --- Navigation ---
    function handlePrevQuestion() {
        console.log("--- handlePrevQuestion ---");
        if (currentSessionIndex > 0) {
            loadQuestion(currentSessionIndex - 1);
        } else {
            console.log("handlePrevQuestion: Already at first question.");
        }
    }

    function handleNextQuestion() {
        console.log("--- handleNextQuestion ---");
        // Check if the button is disabled (shouldn't happen if logic is right, but good check)
        if (nextBtn.disabled) {
            console.warn("handleNextQuestion: Clicked but button is disabled.");
            return;
        }

        if (currentSessionIndex < sessionQuestions.length - 1) {
            console.log("handleNextQuestion: Moving to next question:", currentSessionIndex + 1);
            loadQuestion(currentSessionIndex + 1);
        } else {
            console.log("handleNextQuestion: Showing results.");
            showResults();
        }
    }

    function navigateToQuestion(index) {
        if (index >= 0 && index < sessionQuestions.length) {
            loadQuestion(index);
        }
    }

    function updateNavigationButtons() {
        console.log("--- updateNavigationButtons ---"); // LOG INICIO UPDATE NAV
        prevBtn.disabled = currentSessionIndex === 0;
        console.log(`updateNavigationButtons: prevBtn.disabled: ${prevBtn.disabled}`);

        const nextBtnIcon = nextBtn.querySelector('i');
        const nextBtnText = nextBtn.querySelector('.button-text');

        if (!nextBtnIcon || !nextBtnText) {
            console.error("updateNavigationButtons: Cannot find next button icon/text elements.");
            return;
        }

        // *** Re-check the state using the correct property ***
        const isCurrentAnswered = userAnswers[currentSessionIndex]?.selectedShuffledIndex !== null && userAnswers[currentSessionIndex]?.selectedShuffledIndex !== undefined;
        const isLastQuestion = currentSessionIndex === sessionQuestions.length - 1;
        console.log(`updateNavigationButtons: isCurrentAnswered: ${isCurrentAnswered}, isLastQuestion: ${isLastQuestion}`); // LOG ESTADO ACTUAL

        if (isLastQuestion && isCurrentAnswered) {
            console.log("updateNavigationButtons: Setting 'Results' state");
            nextBtnText.textContent = ' Ver Resultados';
            nextBtn.title = "Ver Resultados";
            nextBtnIcon.classList.remove('fa-arrow-right');
            nextBtnIcon.classList.add('fa-poll');
            if (!nextBtnIcon.classList.contains('fas')) nextBtnIcon.classList.add('fas');
            nextBtn.disabled = false; // Ensure enabled
        } else {
            console.log("updateNavigationButtons: Setting 'Next' state");
            nextBtnText.textContent = ' Siguiente';
            nextBtn.title = "Siguiente";
            nextBtnIcon.classList.remove('fa-poll');
            nextBtnIcon.classList.add('fa-arrow-right');
            if (!nextBtnIcon.classList.contains('fas')) nextBtnIcon.classList.add('fas');
            // Disable if current question is NOT answered
            nextBtn.disabled = !isCurrentAnswered;
        }
        console.log(`updateNavigationButtons: Final nextBtn.disabled state: ${nextBtn.disabled}`); // LOG ESTADO FINAL BOTON NEXT
        console.log("--- updateNavigationButtons END ---");
    }

    // --- Show Results ---
    function showResults() {
        exitBtn.style.display = 'none'; // Hide exit button in results view
        quizArea.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        progressBar.style.display = 'none'; // Hide progress bar in results
        progressBarBottom.style.display = 'none'; // Hide bottom progress bar too
        resultsArea.style.display = 'block';

        let correctCount = 0;
        userAnswers.forEach(answer => {
            // Ensure answer object exists before checking isCorrect
            if (answer && answer.isCorrect) {
                correctCount++;
            }
        });
        let incorrectCount = sessionQuestions.length - correctCount;

        correctCountDisplay.textContent = correctCount;
        incorrectCountDisplay.textContent = incorrectCount;
        finalScoreDisplay.textContent = correctCount; // Score is already calculated
        finalTotalDisplay.textContent = sessionQuestions.length;

        // Show retry button only if there were incorrect answers and not already in retry mode
        // **MODIFIED:** Use sessionQuestions which holds the *current* set being reviewed
        const failedQuestionsCurrentSession = sessionQuestions.filter((_, index) => userAnswers[index]?.isCorrect === false);
        retryFailedBtn.style.display = (failedQuestionsCurrentSession.length > 0 && !isRetryMode) ? 'inline-block' : 'none';
    }

    // --- Retry Failed Questions ---
    function startRetryFailed() {
        // **MODIFIED:** Filter the *current session's* questions based on *current userAnswers*
        const failedQuestions = sessionQuestions.filter((_, index) => userAnswers[index]?.isCorrect === false);

        if (failedQuestions.length > 0) {
            // Re-initialize the quiz with only the failed questions from THIS session
            // Pass the already flattened+filtered list, select all of them, set retry flag
            initQuiz(failedQuestions, failedQuestions.length, true);
            progressBar.style.display = 'flex'; // Show progress bar again
            progressBarBottom.style.display = 'flex'; // Show bottom progress bar again
            exitBtn.style.display = 'inline-block'; // Show exit button again for retry mode
        }
    }


    // --- Start the Quiz ---
    // In static mode, this is handled by index.html calling window.launchQuiz or similar.
    // We do NOT auto-start here anymore.
});