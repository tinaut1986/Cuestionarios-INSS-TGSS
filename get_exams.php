<?php
/**
 * Generador dinámico del registro de exámenes
 * Este script se comporta como un archivo .js para el navegador
 */
header('Content-Type: application/javascript; charset=utf-8');

$typologies = [
    [ "id" => "ss", "name" => "SEGURIDAD SOCIAL", "name_ca" => "SEGURETAT SOCIAL" ],
    [ "id" => "cbs", "name" => "CBS GIRONÈS-SALT", "name_ca" => "CBS GIRONÈS-SALT" ],
];

function getExamMetadata($filePath) {
    $content = file_get_contents($filePath);
    $filename = basename($filePath);
    
    // ID por defecto es el nombre del archivo
    $id = str_replace('.js', '', $filename);
    
    // 1. Extraer ID real si existe en el código
    if (preg_match("/window\.registerExam\s*\(\s*['\"]([^'\"]+)['\"]/", $content, $idMatch)) {
        $id = $idMatch[1];
    }

    // 2. Extraer Título (Soporta String u Objeto bilingüe)
    $title = $id; 
    if (preg_match("/\"Title\"\s*:\s*\{([^\}]+)\}/s", $content, $titleObjMatch)) {
        $objBody = $titleObjMatch[1];
        $es = preg_match("/\"es\"\s*:\s*\"([^\"]+)\"/", $objBody, $m) ? $m[1] : $id;
        $ca = preg_match("/\"ca\"\s*:\s*\"([^\"]+)\"/", $objBody, $m) ? $m[1] : null;
        $title = ["es" => $es];
        if ($ca) $title["ca"] = $ca;
    } elseif (preg_match("/\"Title\"\s*:\s*\"([^\"]+)\"/", $content, $titleMatch)) {
        $title = $titleMatch[1];
    }

    // 3. Detectar idiomas (si existen claves "ca": )
    $hasCa = strpos($content, '"ca":') !== false;
    $lang = $hasCa ? "es/ca" : "es";

    // 4. Tipología (nombre de la carpeta contenedora)
    $pathParts = explode(DIRECTORY_SEPARATOR, $filePath);
    $filename = end($pathParts);
    $typology = count($pathParts) >= 2 ? $pathParts[count($pathParts) - 2] : 'ss';
    if ($typology === 'exams') $typology = 'ss';

    return [
        "title" => $title,
        "id" => $id,
        "filename" => "exams/" . $typology . "/" . $filename,
        "typology" => $typology,
        "lang" => $lang
    ];
}

$exams = [];
$baseDir = __DIR__ . DIRECTORY_SEPARATOR . 'exams';

if (is_dir($baseDir)) {
    // Escaneamos las carpetas de tipologías
    $folders = array_filter(glob($baseDir . DIRECTORY_SEPARATOR . '*'), 'is_dir');
    foreach ($folders as $folder) {
        $files = glob($folder . DIRECTORY_SEPARATOR . '*.js');
        foreach ($files as $file) {
            // Ignoramos el propio registry.js si estuviera ahí
            if (basename($file) === 'registry.js') continue;
            $exams[] = getExamMetadata($file);
        }
    }
}

// Ordenar por ID de forma natural
usort($exams, function($a, $b) {
    return strnatcasecmp($a['id'], $b['id']);
});

// Generar el código JS
$jsCode = "/**\n * Registro de Exámenes - Generado automáticamente por get_exams.php\n */\n";
$jsCode .= "window.availableTypologies = " . json_encode($typologies, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . ";\n\n";
$jsCode .= "window.availableExams = " . json_encode($exams, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . ";\n";

// Salida inmediata para la petición HTTP
echo $jsCode;

// --- PERSISTENCIA PARA MODO OFFLINE ---
// Guardamos una copia física en registry.js para que siempre esté actualizado
// y pueda usarse si se prefiere una carga estática o el Service Worker necesita un archivo físico.
@file_put_contents($baseDir . DIRECTORY_SEPARATOR . 'registry.js', $jsCode);

// También guardamos en JSON por si se necesita para otros usos (como el SW original sugería)
@file_put_contents($baseDir . DIRECTORY_SEPARATOR . 'registry.json', json_encode([
    "typologies" => $typologies,
    "exams" => $exams
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
