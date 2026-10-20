/* ==========================================================================
   TIMED QUESTION-BY-QUESTION EXAM TEMPLATE - JAVASCRIPT LOGIC
   Simple, clean, vanilla JS implementation with robust state management & Gedit UTF-8 importer
   ========================================================================== */

// LocalStorage key for persisting exam configuration
const STORAGE_KEY = 'timed_exam_config';

// Sample questions for quick testing
const DEMO_QUESTIONS = [
  "What is the difference between HTML and CSS?",
  "Explain the concept of gravity in simple terms.",
  "What are the three main states of matter?",
  "Name the capital city of France and its famous landmark.",
  "What is 15 multiplied by 12?"
];

/* ==========================================================================
   DOM CONTENT LOADED ROUTER
   ========================================================================== */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('questionsContainer')) {
      initSetupPage();
    } else if (document.getElementById('questionText')) {
      initExamPage();
    }
  });
}


/* ==========================================================================
   PAGE 1: EXAM SETUP LOGIC & GEDIt UTF-8 IMPORTER (INDEX.HTML)
   ========================================================================== */
function initSetupPage() {
  const numQuestionsInput = document.getElementById('numQuestions');
  const timePerQuestionInput = document.getElementById('timePerQuestion');
  const questionsContainer = document.getElementById('questionsContainer');
  const btnStartExam = document.getElementById('btnStartExam');
  const btnLoadDemo = document.getElementById('btnLoadDemo');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');
  const questionsCountBadge = document.getElementById('questionsCountBadge');

  // File Import Elements
  const fileInput = document.getElementById('fileInput');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const importSuccessBanner = document.getElementById('importSuccessBanner');
  const importSuccessMessage = document.getElementById('importSuccessMessage');

  // Overwrite Confirmation Modal
  const importConfirmModal = document.getElementById('importConfirmModal');
  const btnConfirmImport = document.getElementById('btnConfirmImport');
  const btnCancelImport = document.getElementById('btnCancelImport');

  // Memory variables
  let currentQuestionsText = [];
  let pendingImportQuestions = null;

  // Try loading saved configuration from localStorage
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      const config = JSON.parse(savedData);
      if (Array.isArray(config.questions) && config.questions.length > 0) {
        numQuestionsInput.value = config.questions.length;
        currentQuestionsText = config.questions;
      }
      if (config.timePerQuestion > 0) {
        timePerQuestionInput.value = config.timePerQuestion;
      }
    } catch (e) {
      console.warn('Could not parse saved exam data from localStorage:', e);
    }
  }

  // Initial render of question textareas
  renderQuestionInputs();

  // Listener: Number of questions input changed manually
  numQuestionsInput.addEventListener('input', () => {
    saveCurrentInputsToMemory();
    renderQuestionInputs();
  });

  // Listener: Load Demo Questions button
  btnLoadDemo.addEventListener('click', () => {
    hideBanners();
    numQuestionsInput.value = DEMO_QUESTIONS.length;
    timePerQuestionInput.value = 15;
    currentQuestionsText = [...DEMO_QUESTIONS];
    renderQuestionInputs();
  });

  // Listener: File Import Change
  fileInput.addEventListener('change', handleFileImport);

  // Modal Listeners
  btnConfirmImport.addEventListener('click', () => {
    importConfirmModal.classList.add('hidden');
    if (pendingImportQuestions) {
      applyImportedQuestions(pendingImportQuestions);
      pendingImportQuestions = null;
    }
  });

  btnCancelImport.addEventListener('click', () => {
    importConfirmModal.classList.add('hidden');
    pendingImportQuestions = null;
    fileInput.value = '';
    fileNameDisplay.textContent = 'No file chosen';
    fileNameDisplay.classList.remove('active');
  });

  // Listener: Start Exam button
  btnStartExam.addEventListener('click', validateAndStartExam);

  /**
   * Reads file via HTML5 FileReader API with UTF-8 encoding (Gedit compatible)
   */
  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.textContent = file.name;
    fileNameDisplay.classList.add('active');
    hideBanners();

    const reader = new FileReader();
    reader.onload = function (event) {
      const content = event.target.result;
      const parsed = parseQuestionsFromText(content);

      if (parsed.questions.length === 0) {
        showError('Unable to find any numbered questions in file. Please format questions like: 1. First question  2. Second question');
        fileInput.value = '';
        return;
      }

      // Check if user already typed non-empty questions
      if (hasExistingContent()) {
        pendingImportQuestions = parsed;
        importConfirmModal.classList.remove('hidden');
      } else {
        applyImportedQuestions(parsed);
      }
    };

    reader.onerror = function () {
      showError('Error reading file. Please make sure it is a valid UTF-8 text file.');
    };

    // Explicit UTF-8 encoding read for Arabic/Unicode Gedit compatibility
    reader.readAsText(file, 'UTF-8');
  }

  /**
   * Applies parsed questions array to the form
   */
  function applyImportedQuestions(parsed) {
    currentQuestionsText = parsed.questions;
    numQuestionsInput.value = parsed.questions.length;
    renderQuestionInputs();

    let msg = `✓ ${parsed.questions.length} questions imported successfully`;
    if (parsed.emptyCount > 0) {
      msg += ` (${parsed.emptyCount} empty entry skipped)`;
    }
    showImportSuccess(msg);
  }

  /**
   * Checks if current textareas contain non-empty user text
   */
  function hasExistingContent() {
    saveCurrentInputsToMemory();
    return currentQuestionsText.some(t => (t || '').trim().length > 0);
  }

  /**
   * Reads existing text from DOM textareas into memory array
   */
  function saveCurrentInputsToMemory() {
    const textareas = questionsContainer.querySelectorAll('.question-textarea');
    textareas.forEach((ta, idx) => {
      currentQuestionsText[idx] = ta.value;
    });
  }

  /**
   * Generates question textarea cards dynamically based on count
   */
  function renderQuestionInputs() {
    let count = parseInt(numQuestionsInput.value, 10);

    if (isNaN(count) || count < 1) count = 1;
    if (count > 100) count = 100;

    questionsCountBadge.textContent = `${count} Question${count > 1 ? 's' : ''}`;
    questionsContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      const card = document.createElement('div');
      card.className = 'question-card';

      const header = document.createElement('div');
      header.className = 'question-card-header';

      const badge = document.createElement('span');
      badge.className = 'question-badge';
      badge.textContent = `Question ${i}`;

      header.appendChild(badge);

      const textarea = document.createElement('textarea');
      textarea.className = 'question-textarea';
      textarea.id = `question_input_${i}`;
      textarea.placeholder = `Enter question ${i}...`;
      textarea.value = currentQuestionsText[i - 1] || '';

      // dir="auto" enables standard Unicode Bidirectional (LTR/RTL) detection for Arabic & English
      textarea.setAttribute('dir', 'auto');

      // Save input changes back to memory
      textarea.addEventListener('input', () => {
        currentQuestionsText[i - 1] = textarea.value;
        hideBanners();
      });

      card.appendChild(header);
      card.appendChild(textarea);
      questionsContainer.appendChild(card);
    }
  }

  /**
   * Validates all inputs before saving to localStorage and navigating
   */
  function validateAndStartExam() {
    hideBanners();
    saveCurrentInputsToMemory();

    const count = parseInt(numQuestionsInput.value, 10);
    const time = parseInt(timePerQuestionInput.value, 10);

    if (isNaN(count) || count < 1) {
      showError('Please enter at least 1 question.');
      numQuestionsInput.focus();
      return;
    }

    if (isNaN(time) || time <= 0) {
      showError('Please enter a time limit greater than 0 seconds.');
      timePerQuestionInput.focus();
      return;
    }

    // Check each question textarea for non-empty text
    for (let i = 0; i < count; i++) {
      const text = (currentQuestionsText[i] || '').trim();
      if (!text) {
        showError(`Question ${i + 1} cannot be empty.`);
        const emptyTa = document.getElementById(`question_input_${i + 1}`);
        if (emptyTa) emptyTa.focus();
        return;
      }
    }

    // Prepare clean exam configuration
    const examConfig = {
      questions: currentQuestionsText.slice(0, count).map(q => q.trim()),
      timePerQuestion: time,
      currentQuestionIndex: 0
    };

    // Store in browser memory
    localStorage.setItem(STORAGE_KEY, JSON.stringify(examConfig));

    // Navigate to live exam screen
    window.location.href = 'exam.html';
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showImportSuccess(msg) {
    importSuccessMessage.textContent = msg;
    importSuccessBanner.classList.remove('hidden');
  }

  function hideBanners() {
    errorBanner.classList.add('hidden');
    importSuccessBanner.classList.add('hidden');
  }
}


/* ==========================================================================
   GEDIT UTF-8 QUESTION BANK PARSER UTILITY
   ========================================================================== */

/**
 * Parses plain text files formatted with question numbers like:
 * 1. Question text...
 * 2) Question text...
 * 3 - Question text...
 * Supports multiline questions, Arabic/English/Mixed UTF-8, and removes question numbers.
 */
function parseQuestionsFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { questions: [], emptyCount: 0 };
  }

  // Normalize line endings (\r\n -> \n)
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Regex matches line starting with optional spaces + number + delimiter (. , ) , - , – , —) + optional space + question text
  const questionStartRegex = /^\s*(\d+)\s*[\.\)\-–—]\s*(.*)$/;

  const extractedQuestions = [];
  let currentBuffer = null;
  let emptyCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(questionStartRegex);

    if (match) {
      // If we were already building a question, save it
      if (currentBuffer !== null) {
        const trimmed = currentBuffer.trim();
        if (trimmed.length > 0) {
          extractedQuestions.push(trimmed);
        } else {
          emptyCount++;
        }
      }
      // Start new question buffer with text following the question number
      currentBuffer = match[2];
    } else if (currentBuffer !== null) {
      // Append multiline text to current question buffer
      currentBuffer += '\n' + line;
    }
  }

  // Push final question in buffer
  if (currentBuffer !== null) {
    const trimmed = currentBuffer.trim();
    if (trimmed.length > 0) {
      extractedQuestions.push(trimmed);
    } else {
      emptyCount++;
    }
  }

  return {
    questions: extractedQuestions,
    emptyCount: emptyCount
  };
}


/* ==========================================================================
   PAGE 2: LIVE EXAM PRESENTATION LOGIC (EXAM.HTML)
   ========================================================================== */
function initExamPage() {
  // Exam State Variables
  let questions = [];
  let currentQuestionIndex = 0;
  let timePerQuestion = 15;
  let remainingTime = 15;
  let timerInterval = null;

  // States: "READY", "RUNNING", "PAUSED", "COMPLETE"
  let examState = "READY";

  // DOM Elements
  const questionCard = document.getElementById('questionCard');
  const questionText = document.getElementById('questionText');
  const timerBox = document.getElementById('timerBox');
  const timerNumber = document.getElementById('timerNumber');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const progressText = document.getElementById('progressText');
  const progressBarFill = document.getElementById('progressBarFill');

  // Controls
  const btnPlay = document.getElementById('btnPlay');
  const btnPause = document.getElementById('btnPause');
  const btnStop = document.getElementById('btnStop');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const jumpInput = document.getElementById('jumpInput');
  const btnGoJump = document.getElementById('btnGoJump');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Modals
  const stopModal = document.getElementById('stopModal');
  const btnConfirmStop = document.getElementById('btnConfirmStop');
  const btnCancelStop = document.getElementById('btnCancelStop');

  const completionModal = document.getElementById('completionModal');
  const completionMessage = document.getElementById('completionMessage');
  const btnRestartExam = document.getElementById('btnRestartExam');
  const btnBackToSetup = document.getElementById('btnBackToSetup');

  // Initialize Exam Data
  loadExamConfig();

  // Attach Event Listeners
  btnPlay.addEventListener('click', startOrResumeExam);
  btnPause.addEventListener('click', pauseExam);
  btnStop.addEventListener('click', promptStopExam);
  btnPrev.addEventListener('click', goToPreviousQuestion);
  btnNext.addEventListener('click', goToNextQuestion);
  btnGoJump.addEventListener('click', handleJumpInput);

  jumpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleJumpInput();
  });

  btnFullscreen.addEventListener('click', toggleFullscreen);

  // Stop Modal Listeners
  btnConfirmStop.addEventListener('click', confirmStopExam);
  btnCancelStop.addEventListener('click', hideStopModal);

  // Completion Modal Listeners
  btnRestartExam.addEventListener('click', restartExam);
  btnBackToSetup.addEventListener('click', confirmStopExam);

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);

  /**
   * Loads saved exam data from localStorage and prepares Question 1 in READY state
   */
  function loadExamConfig() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      alert('No exam configuration found. Redirecting to setup page.');
      window.location.href = 'index.html';
      return;
    }

    try {
      const config = JSON.parse(rawData);
      if (!config.questions || !Array.isArray(config.questions) || config.questions.length === 0) {
        alert('Invalid exam questions configuration. Redirecting to setup.');
        window.location.href = 'index.html';
        return;
      }

      questions = config.questions;
      timePerQuestion = parseInt(config.timePerQuestion, 10) || 15;
      currentQuestionIndex = 0;
      remainingTime = timePerQuestion;

      // INITIAL EXAM STATE REQUIREMENT:
      // State MUST be READY. Timer is NOT started automatically.
      examState = "READY";

      // Render Question 1
      showQuestion(0);
      updateStatusDisplay();
    } catch (e) {
      console.error('Error loading exam config:', e);
      alert('Failed to load exam data. Redirecting to setup.');
      window.location.href = 'index.html';
    }
  }

  /**
   * Displays question at given index, updates counter, progress bar, and timer display
   */
  function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;

    currentQuestionIndex = index;

    // Subtle transition effect on question text
    questionCard.classList.add('transitioning');
    setTimeout(() => {
      questionText.textContent = questions[currentQuestionIndex];
      questionCard.classList.remove('transitioning');
    }, 150);

    // Reset remaining time for the new question
    remainingTime = timePerQuestion;

    // Update Progress UI
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    const pct = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBarFill.style.width = `${pct}%`;

    // Update Jump input
    jumpInput.value = currentQuestionIndex + 1;
    jumpInput.max = questions.length;

    // Navigation button disabled states
    btnPrev.disabled = currentQuestionIndex === 0;
    btnNext.disabled = currentQuestionIndex === questions.length - 1;

    // Update Timer display
    updateTimerDisplay();

    // If the exam is currently RUNNING, restart the interval timer for the new question
    if (examState === "RUNNING") {
      stopIntervalTimer();
      runIntervalTimer();
    }
  }

  /**
   * Starts or Resumes countdown timer
   */
  function startOrResumeExam() {
    if (examState === "COMPLETE") return;

    examState = "RUNNING";
    updateStatusDisplay();

    // Prevent duplicate intervals
    stopIntervalTimer();

    // Start timer ticking
    runIntervalTimer();
  }

  /**
   * Pauses the timer and keeps remaining seconds exact
   */
  function pauseExam() {
    if (examState !== "RUNNING") return;

    examState = "PAUSED";
    stopIntervalTimer();
    updateStatusDisplay();
  }

  /**
   * Core countdown timer interval function
   */
  function runIntervalTimer() {
    timerInterval = setInterval(() => {
      remainingTime--;
      updateTimerDisplay();

      // Check if time has expired
      if (remainingTime <= 0) {
        stopIntervalTimer();
        handleQuestionTimeUp();
      }
    }, 1000);
  }

  /**
   * Stops the JavaScript interval timer safely
   */
  function stopIntervalTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * Triggered when timer hits 0 seconds for a question
   */
  function handleQuestionTimeUp() {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question and automatically continue counting down
      currentQuestionIndex++;
      showQuestion(currentQuestionIndex);
    } else {
      // End of exam reached!
      examState = "COMPLETE";
      stopIntervalTimer();
      updateStatusDisplay();
      showCompletionModal();
    }
  }

  /**
   * Updates timer text and visual urgency indicator (warning/danger states)
   */
  function updateTimerDisplay() {
    timerNumber.textContent = remainingTime;

    // Visual urgency indicators
    timerBox.classList.remove('warning', 'danger');
    if (remainingTime <= 3 && remainingTime > 0) {
      timerBox.classList.add('danger');
    } else if (remainingTime <= 5) {
      timerBox.classList.add('warning');
    }
  }

  /**
   * Updates status badge pill UI (READY, RUNNING, PAUSED, COMPLETE)
   */
  function updateStatusDisplay() {
    statusBadge.className = 'status-badge';

    if (examState === "READY") {
      statusBadge.classList.add('status-ready');
      statusText.textContent = 'READY';
      btnPlay.disabled = false;
      btnPause.disabled = true;
    } else if (examState === "RUNNING") {
      statusBadge.classList.add('status-running');
      statusText.textContent = 'RUNNING';
      btnPlay.disabled = true;
      btnPause.disabled = false;
    } else if (examState === "PAUSED") {
      statusBadge.classList.add('status-paused');
      statusText.textContent = 'PAUSED';
      btnPlay.disabled = false;
      btnPause.disabled = true;
    } else if (examState === "COMPLETE") {
      statusBadge.classList.add('status-paused');
      statusText.textContent = 'COMPLETE';
      btnPlay.disabled = true;
      btnPause.disabled = true;
    }
  }

  /**
   * Manual Navigation: Previous Question
   */
  function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
      showQuestion(currentQuestionIndex - 1);
    }
  }

  /**
   * Manual Navigation: Next Question
   */
  function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      showQuestion(currentQuestionIndex + 1);
    }
  }

  /**
   * Manual Navigation: Jump to specific question
   */
  function handleJumpInput() {
    const val = parseInt(jumpInput.value, 10);
    if (isNaN(val) || val < 1 || val > questions.length) {
      alert(`Please enter a valid question number between 1 and ${questions.length}.`);
      jumpInput.value = currentQuestionIndex + 1;
      return;
    }

    showQuestion(val - 1);
  }

  /**
   * Stop Exam Prompt
   */
  function promptStopExam() {
    pauseExam();
    stopModal.classList.remove('hidden');
  }

  function hideStopModal() {
    stopModal.classList.add('hidden');
  }

  function confirmStopExam() {
    stopIntervalTimer();
    window.location.href = 'index.html';
  }

  /**
   * Exam Completion
   */
  function showCompletionModal() {
    completionMessage.textContent = `You have reached the end of the exam. All ${questions.length} questions completed!`;
    completionModal.classList.remove('hidden');
  }

  function restartExam() {
    completionModal.classList.add('hidden');
    currentQuestionIndex = 0;
    remainingTime = timePerQuestion;
    examState = "READY";
    updateStatusDisplay();
    showQuestion(0);
  }

  /**
   * Fullscreen API Helper
   */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /**
   * Keyboard Shortcuts Handler
   */
  function handleKeyboardShortcuts(e) {
    // Ignore keyboard shortcuts if focus is inside an input/textarea
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (examState === "RUNNING") {
          pauseExam();
        } else {
          startOrResumeExam();
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        goToNextQuestion();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        goToPreviousQuestion();
        break;

      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;

      default:
        break;
    }
  }
}
