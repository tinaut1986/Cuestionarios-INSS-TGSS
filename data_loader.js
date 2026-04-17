window.loadedExamsData = {};

/**
 * Register an exam's data. Called by the <script> tags of the converted exams.
 */
window.registerExam = function (id, data) {
    console.log("Registered exam:", id);
    window.loadedExamsData[id] = data;
};

/**
 * Loading Manager
 * @param {string[]} selectedIds - Array of exam IDs (filenames without extension)
 * @param {function} callback - Function called with the merged data object
 */
window.loadSelectedExams = function (selectedIds, callback) {
    let loadedCount = 0;
    const total = selectedIds.length;

    if (total === 0) {
        callback(null);
        return;
    }

    // Function to check completion
    const checkDone = () => {
        loadedCount++;
        if (loadedCount === total) {
            mergeAndProceed(selectedIds, callback);
        }
    };

    selectedIds.forEach(id => {
        // Find exam metadata in registry
        const examMeta = window.availableExams.find(e => e.id === id);
        if (!examMeta) {
            console.error("Exam metadata not found for ID:", id);
            checkDone();
            return;
        }

        // Check if already loaded
        if (window.loadedExamsData[id]) {
            checkDone();
        } else {
            // Load script dynamically
            const script = document.createElement('script');
            script.src = examMeta.filename;
            script.onload = checkDone;
            script.onerror = () => {
                console.error("Failed to load exam script for:", id);
                alert("Error al cargar el archivo del examen: " + id);
                // We still proceed to avoid hanging, but data will be missing
                checkDone();
            };
            document.head.appendChild(script);
        }
    });
};

function mergeAndProceed(selectedIds, callback) {
    let mergedParts = [];
    let titles = [];

    selectedIds.forEach(id => {
        const data = window.loadedExamsData[id];
        if (data && data.ExamParts) {
            // Replicate the PHP logic of decorating parts
            data.ExamParts.forEach(part => {
                // Ensure we don't overwrite if it already exists (from re-runs)
                // But since we flatten deeper, it's fine.
                // We add the metadata expected by script.js
                part.originalSourceFile = id + ".json";
                part.originalExamTitle = data.Title || id;
                mergedParts.push(part);
            });
            titles.push(data.Title || id);
        }
    });

    if (mergedParts.length === 0) {
        alert("No se encontraron preguntas válidas en los exámenes seleccionados.");
        return;
    }

    let finalTitle = titles.length > 0 ? titles[0] : "Examen";
    if (titles.length > 1) {
        finalTitle = titles.join(' + ');
    }
    if (titles.length > 3) {
        finalTitle = titles.length + " Exámenes Seleccionados";
    }

    const finalData = {
        Title: finalTitle,
        ExamParts: mergedParts
    };

    callback(finalData);
}
