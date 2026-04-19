/**
 * Aplicación de Exámenes - Versión 1.3.2
 */
const APP_VERSION = '1.3.2';

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
    const setupArea = document.getElementById('setup-area');
    const quizContainer = document.getElementById('quiz-container'); // Overall container
    const quizArea = document.getElementById('quiz-area');
    const mainTitle = document.getElementById('main-title');
    const quizTitle = document.getElementById('quiz-title');
    const typologySelect = document.getElementById('typology-select');
    const examsCheckboxesContainer = document.getElementById('exams-checkboxes');
    const selectAllCheckbox = document.getElementById('select-all-exams');
    const startBtn = document.getElementById('start-btn');
    const numQuestionsInput = document.getElementById('num_questions');

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
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const langSelect = document.getElementById('lang-select');
    const versionNumberDisplay = document.getElementById('version-number');

    // --- State Variables ---
    let allOriginalQuestionsFlat = []; // Holds the FLATTENED, ordered list from the new JSON structure
    let sessionQuestions = [];     // Questions selected for this session (subset/shuffled)
    let currentSessionIndex = 0;
    let score = 0;
    let userAnswers = [];          // Stores { selectedOption: 'a', isCorrect: true/false/null } for each session question
    let isRetryMode = false;       // Flag for retry session

    // Sync local select with global initial state
    if (langSelect) langSelect.value = window.currentLang;

    function updateLanguageUI() {
        if (mainTitle) mainTitle.textContent = t('main_title');

        const setupTitle = document.querySelector('#setup-area h1');
        if (setupTitle) setupTitle.textContent = t('setup_title');

        const typologyLabel = document.querySelector('label[for="typology-select"]');
        if (typologyLabel) typologyLabel.textContent = t('typology_label');

        const selectExamsLabel = document.getElementById('select-exams-label');
        if (selectExamsLabel) selectExamsLabel.textContent = t('select_exams_label');

        const selectAllLabel = document.getElementById('select-all-text');
        if (selectAllLabel) selectAllLabel.textContent = t('select_all');

        const numQuestionsLabel = document.getElementById('num-questions-label');
        if (numQuestionsLabel) numQuestionsLabel.textContent = t('num_questions_label');

        const numQuestionsSmall = document.getElementById('num-questions-small');
        if (numQuestionsSmall) numQuestionsSmall.textContent = t('num_questions_small');

        if (startBtn && !startBtn.disabled) startBtn.textContent = t('start_btn');

        const exitBtnText = exitBtn.querySelector('.button-text');
        if (exitBtnText) exitBtnText.textContent = t('salir');

        const prevBtnText = prevBtn.querySelector('.button-text');
        if (prevBtnText) prevBtnText.textContent = t('anterior');

        const scoreAreaLabel = document.getElementById('score-area');
        if (scoreAreaLabel) {
            scoreAreaLabel.innerHTML = `${t('puntuacion')} <span id="score">${scoreDisplay.textContent}</span> / <span id="total-questions">${totalQuestionsDisplay.textContent}</span>`;
        }

        const resultsAreaTitle = document.querySelector('#results-area h2');
        if (resultsAreaTitle) resultsAreaTitle.textContent = t('resultados_finales');

        const resultsAreaP1 = document.querySelector('#results-area p:nth-of-type(1)');
        if (resultsAreaP1) resultsAreaP1.textContent = t('completado');

        const retryFailedBtnText = retryFailedBtn ? retryFailedBtn.querySelector('.button-text') : null;
        if (retryFailedBtnText) retryFailedBtnText.textContent = t('reintentar_falladas');

        const restartBtnText = restartBtn ? restartBtn.querySelector('.button-text') : null;
        if (restartBtnText) restartBtnText.textContent = t('configuracion');

        const exitModalTitle = document.getElementById('exit-modal-title');
        if (exitModalTitle) exitModalTitle.innerHTML = `<i class="fas fa-door-open"></i> ${t('confirm_exit_title')}`;

        const exitModalMsg = document.querySelector('#exit-modal-box p');
        if (exitModalMsg) exitModalMsg.innerHTML = t('confirm_exit_msg');

        const exitModalCancel = document.getElementById('exit-modal-cancel');
        if (exitModalCancel) exitModalCancel.innerHTML = `<i class="fas fa-times"></i> ${t('cancelar')}`;

        const exitModalConfirm = document.getElementById('exit-modal-confirm');
        if (exitModalConfirm) exitModalConfirm.innerHTML = `<i class="fas fa-door-open"></i> ${t('salir')}`;

        // Update setup area if visible
        if (setupArea && setupArea.style.display !== 'none') {
            if (window.availableTypologies && typologySelect) {
                const currentVal = typologySelect.value;
                typologySelect.innerHTML = '';
                window.availableTypologies.forEach(tobj => {
                    const option = document.createElement('option');
                    option.value = tobj.id;
                    option.textContent = window.currentLang === 'ca' && tobj.name_ca ? tobj.name_ca : tobj.name;
                    typologySelect.appendChild(option);
                });
                typologySelect.value = currentVal;
            }
            if (window.updateExamsListGlobal) window.updateExamsListGlobal();
        }

        // Update labels within the quiz if active
        if (quizContainer && quizContainer.style.display === 'block') {
            const numText = `${t('pregunta')} ${currentSessionIndex + 1} ${t('de')} ${sessionQuestions.length}`;
            if (questionNumberDisplay) questionNumberDisplay.textContent = numText;

            const currentQuestion = sessionQuestions[currentSessionIndex];
            if (questionTypeDisplay && currentQuestion) {
                questionTypeDisplay.textContent = getQuestionTypeLabel(currentQuestion);
            }

            const sourceDisplay = document.getElementById('question-source-display');
            if (sourceDisplay && currentQuestion && currentQuestion.sourceTitle) {
                sourceDisplay.textContent = `(${t('origen')}: ${getTranslatedText(currentQuestion.sourceTitle)})`;
            }

            const currentPartTitleElem = document.querySelector('#current-question-area h2');
            if (currentPartTitleElem) currentPartTitleElem.textContent = t('pregunta_label');

            const extraAreaTitle = document.querySelector('#extra-statements-area h2');
            if (extraAreaTitle) extraAreaTitle.textContent = t('contexto_adicional');

            const currentExtraAreaTitle = document.querySelector('#current-extra-statement-area h2');
            if (currentExtraAreaTitle) currentExtraAreaTitle.textContent = t('contexto_especifico');

            if (window.originalQuestionsData) {
                updateQuizTitle(window.originalQuestionsData);
            }

            // Refresh the current question content to update language of statement and answers
            if (sessionQuestions.length > 0 && currentSessionIndex >= 0) {
                loadQuestion(currentSessionIndex);
            }

            updateNavigationButtons();
        }

        // Handle Results Area if visible
        if (resultsArea && resultsArea.style.display === 'block') {
            showResults(); // Re-run results to update all strings there
        }
    }

    function updateQuizTitle(data) {
        if (!data || !quizTitle) return;
        const titles = (data.SourceTitles || []).map(t => getTranslatedText(t));
        let finalTitle = titles.length > 0 ? titles[0] : t('quiz_title');

        if (titles.length > 1) {
            finalTitle = titles.join(' + ');
        }
        if (titles.length > 3) {
            finalTitle = t('exams_selected', { count: titles.length });
        }

        document.title = finalTitle;
        quizTitle.textContent = finalTitle;
    }

    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            window.currentLang = e.target.value;
            localStorage.setItem('lang', window.currentLang);
            updateLanguageUI();
        });
    }

    // --- SETUP LOGIC ---
    function initSetup() {
        // 1. Populate Typologies
        if (window.availableTypologies) {
            typologySelect.innerHTML = '';
            window.availableTypologies.forEach(tobj => {
                const option = document.createElement('option');
                option.value = tobj.id;
                option.textContent = window.currentLang === 'ca' && tobj.name_ca ? tobj.name_ca : tobj.name;
                typologySelect.appendChild(option);
            });
        }

        // 2. Load Saved Settings
        const savedTypology = localStorage.getItem('lastTypology');
        if (savedTypology) typologySelect.value = savedTypology;

        const savedNumQuestions = localStorage.getItem('lastNumQuestions');
        if (savedNumQuestions) numQuestionsInput.value = savedNumQuestions;

        // 3. Function to Populate Exams based on Typology
        function updateExamsList() {
            const selectedTypology = typologySelect.value;
            examsCheckboxesContainer.innerHTML = '';
            localStorage.setItem('lastTypology', selectedTypology);

            const filteredExams = window.availableExams ? window.availableExams.filter(e => e.typology === selectedTypology) : [];

            if (filteredExams.length > 0) {
                // Sort by title
                filteredExams.sort((a, b) => getTranslatedText(a.title).localeCompare(getTranslatedText(b.title)));

                const savedExams = JSON.parse(localStorage.getItem('lastSelectedExams') || '[]');

                filteredExams.forEach(exam => {
                    const label = document.createElement('label');
                    const isChecked = savedExams.length === 0 || savedExams.includes(exam.id);
                    
                    // Intelligent language tag: Show what the user will actually get
                    let effectiveLang = 'es'; // Fallback
                    if (exam.lang) {
                        const availableLangs = exam.lang.split('/');
                        if (availableLangs.includes(window.currentLang)) {
                            effectiveLang = window.currentLang;
                        } else {
                            effectiveLang = availableLangs[0];
                        }
                    }
                    const langTag = `[${effectiveLang.toUpperCase()}] `;

                    label.innerHTML = `<input type="checkbox" class="exam-checkbox" value="${exam.id}" ${isChecked ? 'checked' : ''}> ${langTag}${getTranslatedText(exam.title)}`;
                    examsCheckboxesContainer.appendChild(label);
                });

                updateSelectAllState();
                startBtn.disabled = false;
            } else {
                examsCheckboxesContainer.innerHTML = `<p style="color: #666; font-style: italic; margin-top: 10px;">${t('no_exams')}</p>`;
                selectAllCheckbox.checked = false;
                selectAllCheckbox.disabled = true;
                startBtn.disabled = true;
            }
        }
        window.updateExamsListGlobal = updateExamsList; // Expose to updateLanguageUI

        function updateSelectAllState() {
            const all = document.querySelectorAll('.exam-checkbox');
            const checked = document.querySelectorAll('.exam-checkbox:checked');
            selectAllCheckbox.checked = all.length > 0 && all.length === checked.length;
            selectAllCheckbox.disabled = all.length === 0;
        }

        // Initial population
        updateExamsList();

        // Handle Typology Change
        typologySelect.addEventListener('change', updateExamsList);

        // Checkbox Logic
        selectAllCheckbox.addEventListener('change', function () {
            document.querySelectorAll('.exam-checkbox').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            saveExamSelections();
        });

        examsCheckboxesContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('exam-checkbox')) {
                updateSelectAllState();
                saveExamSelections();
            }
        });

        function saveExamSelections() {
            const checked = document.querySelectorAll('.exam-checkbox:checked');
            const ids = Array.from(checked).map(cb => cb.value);
            localStorage.setItem('lastSelectedExams', JSON.stringify(ids));
        }

        numQuestionsInput.addEventListener('change', () => {
            localStorage.setItem('lastNumQuestions', numQuestionsInput.value);
        });

        // 4. Start Button Logic
        startBtn.addEventListener('click', () => {
            const selectedCheckboxes = document.querySelectorAll('.exam-checkbox:checked');
            const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
            const numQuestions = parseInt(numQuestionsInput.value, 10);

            const errorP = document.getElementById('setup-error');
            if (errorP) errorP.style.display = 'none';

            if (selectedIds.length === 0) {
                if (errorP) {
                    errorP.textContent = t('error_select_exam');
                    errorP.style.display = 'block';
                }
                return;
            }
            if (!numQuestions || numQuestions <= 0) {
                if (errorP) {
                    errorP.textContent = t('error_valid_num');
                    errorP.style.display = 'block';
                }
                return;
            }

            // UI Loading State
            startBtn.textContent = t('loading');
            startBtn.disabled = true;

            // Load Data
            window.loadSelectedExams(selectedIds, (mergedData) => {
                startBtn.textContent = t('start_btn');
                startBtn.disabled = false;

                if (!mergedData) {
                    if (errorP) {
                        errorP.textContent = t('error_loading');
                        errorP.style.display = 'block';
                    }
                    return;
                }

                // Success! Switch to Quiz Mode
                setupArea.style.display = 'none';
                quizContainer.style.display = 'block';

                if (mainTitle) mainTitle.style.display = 'none';
                updateQuizTitle(mergedData);

                // Set Globals
                window.originalQuestionsData = mergedData;
                window.requestedNumQuestions = numQuestions;

                // Launch Quiz
                initQuiz(null, numQuestions, false);
            });
        });
    }

    // --- Function to Flatten the New JSON Structure ---
    function flattenExamData(examData) {
        const flatQuestions = [];
        let absoluteIndex = 0;

        if (!examData || !Array.isArray(examData.ExamParts)) {
            console.error("Invalid exam data structure passed to flattenExamData:", examData);
            return [];
        }

        examData.ExamParts.forEach(part => {
            const partType = part.Type;
            const partTitle = part.Title;
            const isPractical = (partType === 'PracticalCase');
            const originalFile = part.originalSourceFile || 'Archivo Desconocido';
            const originalTitle = part.originalExamTitle || 'Examen Desconocido';

            const createQuestionObject = (q, index, isSuppl) => ({
                ...q,
                IsSupplementary: isSuppl,
                IsPracticalCase: isPractical,
                PartType: partType,
                PartTitle: partTitle,
                originalIndexInPart: index,
                absoluteOriginalIndex: absoluteIndex++,
                sourceFile: originalFile,
                sourceTitle: originalTitle
            });

            if (part.Questions && Array.isArray(part.Questions)) {
                part.Questions.forEach((q, index) => {
                    flatQuestions.push(createQuestionObject(q, index, false));
                });
            }

            if (part.SupplementaryQuestions && Array.isArray(part.SupplementaryQuestions)) {
                part.SupplementaryQuestions.forEach((q, index) => {
                    const isSupplFlag = (typeof q.IsSupplementary === 'boolean') ? q.IsSupplementary : true;
                    flatQuestions.push(createQuestionObject(q, index, isSupplFlag));
                });
            }
        });
        return flatQuestions;
    }

    // --- Initialization ---
    function initQuiz(questionsSource, numToSelect, isRetry = false) {
        if (typeof originalQuestionsData === 'undefined' || !originalQuestionsData || !Array.isArray(originalQuestionsData.ExamParts)) {
            console.error("Initial quiz data is missing or invalid.");
            return;
        }

        isRetryMode = isRetry;

        if (!isRetry) {
            allOriginalQuestionsFlat = flattenExamData(originalQuestionsData);
        }

        let sourceForShuffling = isRetry ? questionsSource : allOriginalQuestionsFlat;
        let availableQuestions = shuffleArray([...sourceForShuffling]);
        let numAvailable = availableQuestions.length;
        let actualNumQuestions = Math.min(numToSelect || numAvailable, numAvailable);

        sessionQuestions = availableQuestions.slice(0, actualNumQuestions);

        currentSessionIndex = 0;
        score = 0;

        userAnswers = new Array(sessionQuestions.length).fill(null).map(() => ({
            selectedShuffledIndex: null,
            isCorrect: null
        }));

        scoreDisplay.textContent = score;
        totalQuestionsDisplay.textContent = sessionQuestions.length;
        resultsArea.style.display = 'none';
        quizArea.style.display = 'block';
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        progressBar.style.display = 'flex';
        progressBarBottom.style.display = 'flex';
        progressBar.innerHTML = '';
        progressBarBottom.innerHTML = '';

        sessionQuestions.forEach((_, index) => {
            const indicatorTop = document.createElement('div');
            indicatorTop.classList.add('progress-indicator');
            indicatorTop.dataset.index = index;
            indicatorTop.addEventListener('click', () => navigateToQuestion(index));
            progressBar.appendChild(indicatorTop);

            const indicatorBottom = indicatorTop.cloneNode(true);
            indicatorBottom.addEventListener('click', () => navigateToQuestion(index));
            progressBarBottom.appendChild(indicatorBottom);
        });

        if (sessionQuestions.length > 0) {
            loadQuestion(currentSessionIndex);
        } else {
            quizArea.innerHTML = `<p>Error: No se pudieron cargar las preguntas.</p>`;
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            progressBar.style.display = 'none';
            progressBarBottom.style.display = 'none';
        }

        updateNavigationButtons();
        retryFailedBtn.style.display = 'none';

        prevBtn.onclick = handlePrevQuestion;
        nextBtn.onclick = handleNextQuestion;
        retryFailedBtn.onclick = startRetryFailed;
        restartBtn.onclick = () => { window.location.reload(); };

        exitBtn.onclick = () => { showExitModal(); };
    }
    window.initQuiz = initQuiz;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function loadQuestion(index) {
        if (index < 0 || index >= sessionQuestions.length) return;

        currentSessionIndex = index;
        const currentQuestion = sessionQuestions[index];
        const currentAnswerState = userAnswers[currentSessionIndex];

        feedbackArea.textContent = '';
        feedbackArea.className = 'feedback-area';
        questionNumberDisplay.textContent = `${t('pregunta')} ${index + 1} ${t('de')} ${sessionQuestions.length}`;
        questionTypeDisplay.textContent = getQuestionTypeLabel(currentQuestion);

        const sourceDisplay = document.getElementById('question-source-display');
        if (sourceDisplay && currentQuestion.sourceTitle) {
            sourceDisplay.textContent = `(${t('origen')}: ${getTranslatedText(currentQuestion.sourceTitle)})`;
            sourceDisplay.style.display = 'inline-block';
        } else if (sourceDisplay) {
            sourceDisplay.style.display = 'none';
        }

        questionStatement.innerHTML = formatTextAsParagraphs(getTranslatedText(currentQuestion.Statement) || 'Pregunta no disponible');
        displayExtraStatements(currentQuestion);
        displayCurrentExtraStatement(getTranslatedText(currentQuestion.ExtraStatement));

        const currentPartTitleElem = document.querySelector('#current-question-area h2');
        if (currentPartTitleElem) currentPartTitleElem.textContent = t('pregunta_label');

        const extraAreaTitle = document.querySelector('#extra-statements-area h2');
        if (extraAreaTitle) extraAreaTitle.textContent = t('contexto_adicional');

        const currentExtraAreaTitle = document.querySelector('#current-extra-statement-area h2');
        if (currentExtraAreaTitle) currentExtraAreaTitle.textContent = t('contexto_especifico');

        answerOptionsList.innerHTML = '';
        if (currentQuestion.Answers && Array.isArray(currentQuestion.Answers)) {
            // Use existing shuffled answers if available to avoid reshuffling on language change
            if (!currentQuestion.shuffledAnswers) {
                currentQuestion.shuffledAnswers = shuffleArray([...currentQuestion.Answers]);
            }
            const shuffledAnswers = currentQuestion.shuffledAnswers;
            const optionLabels = ['A', 'B', 'C', 'D'];
            const wasAnswered = currentAnswerState.selectedShuffledIndex !== null;

            shuffledAnswers.forEach((answer, shuffledIdx) => {
                const li = document.createElement('li');
                const displayLabel = optionLabels[shuffledIdx];
                li.innerHTML = `<b>${displayLabel})</b> ${(getTranslatedText(answer.Text) || '').replace(/\n/g, '<br>')}`;
                li.dataset.shuffledIndex = shuffledIdx;

                if (wasAnswered) {
                    li.style.cursor = 'default';
                    if (shuffledIdx === currentAnswerState.selectedShuffledIndex) {
                        li.classList.add('selected');
                        li.classList.add(currentAnswerState.isCorrect ? 'correct' : 'incorrect');
                    }
                    if (answer.IsCorrect) {
                        li.classList.add('correct');
                    }
                } else {
                    li.addEventListener('click', () => handleAnswerSelection(li, currentQuestion, shuffledAnswers));
                    li.style.cursor = 'pointer';
                }
                answerOptionsList.appendChild(li);
            });

            if (wasAnswered) {
                const correctAnswer = currentQuestion.Answers.find(a => a.IsCorrect === true);
                const correctLetter = correctAnswer ? correctAnswer.Option.toUpperCase() : '??';
                feedbackArea.textContent = currentAnswerState.isCorrect ? t('correcto_feedback') : t('incorrecto_feedback', { letter: correctLetter });
                feedbackArea.className = `feedback-area ${currentAnswerState.isCorrect ? 'correct' : 'incorrect'}`;
            }
        } else {
            answerOptionsList.innerHTML = `<li>${t('no_options')}</li>`;
        }

        updateProgressBarHighlight();
        updateNavigationButtons();
    }

    function getQuestionTypeLabel(question) {
        let labels = [];
        if (question.IsPracticalCase) labels.push(t('caso_practico'));
        else labels.push(t('teoria'));
        if (question.IsSupplementary) labels.push(`${t('reserva')}`);
        return `(${labels.join(' - ')})`;
    }

    function displayExtraStatements(currentQuestion) {
        extraStatementsContent.innerHTML = '';
        let found = false;
        const currentSource = currentQuestion.sourceFile;
        const currentPart = currentQuestion.PartTitle;
        const currentIndex = currentQuestion.absoluteOriginalIndex;

        for (let i = 0; i < allOriginalQuestionsFlat.length; i++) {
            const q = allOriginalQuestionsFlat[i];
            if (q.absoluteOriginalIndex >= currentIndex) break;
            if (q.sourceFile === currentSource && q.PartTitle === currentPart && q.ExtraStatement) {
                const div = document.createElement('div');
                div.innerHTML = getTranslatedText(q.ExtraStatement);
                extraStatementsContent.appendChild(div);
                found = true;
            }
        }
        extraStatementsArea.style.display = found ? 'block' : 'none';
    }

    function displayCurrentExtraStatement(extraStatement) {
        if (extraStatement && (typeof extraStatement === 'string' ? extraStatement.trim() !== '' : true)) {
            currentExtraStatementContent.innerHTML = formatTextAsParagraphs(getTranslatedText(extraStatement));
            currentExtraStatementArea.style.display = 'block';
        } else {
            currentExtraStatementArea.style.display = 'none';
        }
    }

    function handleAnswerSelection(selectedLi, questionData, shuffledAnswers) {
        if (userAnswers[currentSessionIndex].selectedShuffledIndex !== null) return;

        const selectedIdx = parseInt(selectedLi.dataset.shuffledIndex, 10);
        const selectedAnswer = shuffledAnswers[selectedIdx];
        const isCorrect = !!(selectedAnswer && selectedAnswer.IsCorrect);

        userAnswers[currentSessionIndex] = { selectedShuffledIndex: selectedIdx, isCorrect: isCorrect };
        if (isCorrect) {
            score++;
            scoreDisplay.textContent = score;
        }

        Array.from(answerOptionsList.children).forEach(li => {
            li.style.cursor = 'default';
            const idx = parseInt(li.dataset.shuffledIndex, 10);
            const ans = shuffledAnswers[idx];
            li.classList.remove('selected', 'correct', 'incorrect');
            if (idx === selectedIdx) {
                li.classList.add('selected', isCorrect ? 'correct' : 'incorrect');
            }
            if (ans && ans.IsCorrect) li.classList.add('correct');

            // Reemplazar para quitar listeners
            const clone = li.cloneNode(true);
            li.parentNode.replaceChild(clone, li);
        });

        const correctIdx = shuffledAnswers.findIndex(a => a.IsCorrect === true);
        const correctLetter = ['A', 'B', 'C', 'D'][correctIdx] || '??';
        feedbackArea.textContent = isCorrect ? t('correcto_feedback') : t('incorrecto_feedback', { letter: correctLetter });
        feedbackArea.className = `feedback-area ${isCorrect ? 'correct' : 'incorrect'}`;

        updateProgressBarIndicator(currentSessionIndex, isCorrect);
        nextBtn.disabled = false;
        updateNavigationButtons();
    }

    function updateProgressBarIndicator(index, isCorrect) {
        document.querySelectorAll(`.progress-indicator[data-index="${index}"]`).forEach(ind => {
            ind.classList.remove('correct', 'incorrect');
            ind.classList.add(isCorrect ? 'correct' : 'incorrect');
        });
    }

    function updateProgressBarHighlight() {
        document.querySelectorAll('.progress-indicator').forEach(ind => {
            const idx = parseInt(ind.dataset.index, 10);
            ind.classList.toggle('current', idx === currentSessionIndex);
        });
    }

    function handlePrevQuestion() {
        if (currentSessionIndex > 0) loadQuestion(currentSessionIndex - 1);
    }

    function handleNextQuestion() {
        if (nextBtn.disabled) return;
        if (currentSessionIndex < sessionQuestions.length - 1) loadQuestion(currentSessionIndex + 1);
        else showResults();
    }

    function navigateToQuestion(index) {
        loadQuestion(index);
    }

    function updateNavigationButtons() {
        prevBtn.disabled = currentSessionIndex === 0;
        const isAnswered = userAnswers[currentSessionIndex] && userAnswers[currentSessionIndex].selectedShuffledIndex !== null;
        const isLast = currentSessionIndex === sessionQuestions.length - 1;

        const nextBtnIcon = nextBtn.querySelector('i');
        const nextBtnText = nextBtn.querySelector('.button-text');

        if (isLast && isAnswered) {
            nextBtnText.textContent = t('ver_resultados');
            nextBtnIcon.className = 'fas fa-poll';
            nextBtn.disabled = false;
        } else {
            nextBtnText.textContent = t('siguiente');
            nextBtnIcon.className = 'fas fa-arrow-right';
            nextBtn.disabled = !isAnswered;
        }
    }

    function showResults() {
        exitBtn.style.display = 'none';
        quizArea.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        progressBar.style.display = 'none';
        progressBarBottom.style.display = 'none';
        resultsArea.style.display = 'block';

        const correctCount = userAnswers.filter(a => a && a.isCorrect).length;
        const total = sessionQuestions.length;
        const incorrectCount = total - correctCount;

        correctCountDisplay.textContent = correctCount;
        incorrectCountDisplay.textContent = incorrectCount;
        finalScoreDisplay.textContent = correctCount;
        finalTotalDisplay.textContent = total;

        const resultsAreaP2 = document.querySelector('#results-area p:nth-of-type(2)');
        if (resultsAreaP2) resultsAreaP2.innerHTML = `${t('resultados_finales')}: <span id="correct-count">${correctCount}</span> ${t('correctas')}, <span id="incorrect-count">${incorrectCount}</span> ${t('incorrectas')}.`;

        const resultsAreaP3 = document.querySelector('#results-area p:nth-of-type(3)');
        if (resultsAreaP3) resultsAreaP3.innerHTML = `${t('puntuacion_final')} <span id="final-score">${correctCount}</span> / <span id="final-total">${total}</span>.`;

        const failed = sessionQuestions.filter((_, i) => userAnswers[i] && userAnswers[i].isCorrect === false);
        retryFailedBtn.style.display = (failed.length > 0 && !isRetryMode) ? 'inline-block' : 'none';
    }

    function startRetryFailed() {
        const failed = sessionQuestions.filter((_, i) => userAnswers[i] && userAnswers[i].isCorrect === false);
        if (failed.length > 0) initQuiz(failed, failed.length, true);
    }

    // --- DARK MODE ---
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon();
    }

    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            updateDarkModeIcon();
        });
    }

    function updateDarkModeIcon() {
        if (!darkModeBtn) return;
        const icon = darkModeBtn.querySelector('i');
        if (document.body.classList.contains('dark-mode')) icon.className = 'fas fa-sun';
        else icon.className = 'fas fa-moon';
    }

    // --- MAXIMIZE ---
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.error(err));
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (maximizeBtn) {
            const icon = maximizeBtn.querySelector('i');
            icon.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
        }
    });

    // Set version number
    if (versionNumberDisplay) versionNumberDisplay.textContent = APP_VERSION;

    // Start everything
    initSetup();
    updateLanguageUI();
});

// Exit Modal Logic
(function () {
    function initExitModal() {
        const exitModal = document.getElementById('exit-modal');
        const exitModalCancel = document.getElementById('exit-modal-cancel');
        const exitModalConfirm = document.getElementById('exit-modal-confirm');

        window.showExitModal = function () {
            if (exitModal) exitModal.classList.add('visible');
        };

        function hideExitModal() {
            if (exitModal) exitModal.classList.remove('visible');
        }

        if (exitModalCancel) exitModalCancel.addEventListener('click', hideExitModal);
        if (exitModal) exitModal.addEventListener('click', (e) => { if (e.target === exitModal) hideExitModal(); });

        if (exitModalConfirm) {
            exitModalConfirm.addEventListener('click', () => {
                hideExitModal();
                if (document.fullscreenElement) sessionStorage.setItem('restoreFullscreen', '1');
                window.location.reload();
            });
        }

        if (sessionStorage.getItem('restoreFullscreen') === '1') {
            sessionStorage.removeItem('restoreFullscreen');
            document.documentElement.requestFullscreen().catch(() => { });
        }
    }
    document.addEventListener('DOMContentLoaded', initExitModal);
})();
