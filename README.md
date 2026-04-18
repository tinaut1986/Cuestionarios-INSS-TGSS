# Cuestionarios-INSS-TGSS

Una plataforma web ligera y estática para realizar tests de oposiciones de forma local y gratuita, centrada en el temario común de la Administración del Estado, con foco principal en la Seguridad Social.
Diseñada para funcionar directamente desde el navegador, sin necesidad de servidores, bases de datos ni conexión a internet.

## 📋 Características

* **Zero Configuración:** Simplemente descarga y abre `index.html`.
* **100% Offline:** Funciona en tu ordenador sin internet.
* **Simulación Real:**
    * Selección múltiple de exámenes.
    * Preguntas y respuestas aleatorizadas (modo "Barajar").
    * Soporte para **Casos Prácticos** (textos de contexto).
* **Repaso Activo:** Opción para reintentar solo las preguntas falladas al final de la sesión.

---

## 🧠 Temario Cubierto (Convocatorias 2021-2026)

Este repositorio incluye preguntas basadas en convocatorias recientes de acceso libre y promoción interna para la Seguridad Social, así como convocatorias de administración local.

**Nota:** El cuestionario "EJERCICIO PRUEBA SEGURIDAD SOCIAL (Generado por IA)" se incluye como material de práctica adicional y no corresponde a una convocatoria oficial.

### 1. Sistema de la Seguridad Social (Typology: SS)
* **Ley General de la Seguridad Social (TRLGSS):** Afiliación, inscripción, altas, bajas y cotización.
* **Gestión Recaudatoria:** Recargos, aplazamientos, intereses de demora y el Procedimiento de Apremio (Reglamento General de Recaudación, Real Decreto 1415/2004).
* **Prestaciones Contributivas:**
    * **Incapacidad Temporal (IT), Incapacidad Permanente (IP) y Lesiones Permanentes No Invalidantes**.
    * **Jubilación:** Ordinaria, anticipada, parcial y compatibilidad (Jubilación Activa).
    * **Muerte y Supervivencia:** Viudedad y Orfandad.
    * **Nacimiento y Cuidado de Menor**.
* **Prestaciones No Contributivas** (Invalidez, Jubilación e Ingreso Mínimo Vital).
* **Regímenes Especiales:** Trabajadores por Cuenta Propia o **Autónomos (RETA)** y del Mar.

### 2. Administración Local (Typology: CBS GIRONÈS-SALT)
* **Consorci de Benestar Social Gironès-Salt:** Estatutos y funcionamiento.
* **Derecho Autonómico:** Transparencia (Llei 19/2014) y régimen jurídico de Cataluña.
* **Gestión de RRHH:** Oferta pública, bolsas de trabajo, RLT y plantillas.
* **Derecho Laboral y Función Pública:** EBEP, contratos de trabajo y personal laboral.

### 3. Derecho Constitucional y Administrativo
* **Constitución Española (CE):** Derechos fundamentales (Art. 23, 41), La Corona, Las Cortes Generales, El Gobierno y sus órganos, y el Tribunal Constitucional.
* **Procedimiento Administrativo Común (Ley 39/2015):** Derechos de los interesados, actos administrativos (nulidad y anulabilidad), notificaciones y recursos administrativos (alzada).
* **Régimen Jurídico del Sector Público (Ley 40/2015):** Organización Central del Estado.
* **Función Pública:** Estatuto Básico del Empleado Público (TREBEP).
* **Otras Normas:** Protección de Datos, Ley de Igualdad y Ley LGTBI.

### 4. Derecho de la Unión Europea
* **Normativa Comunitaria:** Reglamentos 883/2004 y 987/2009 (Coordinación de la Seguridad Social).

---

## 🚀 Cómo usarlo

1.  **Descargar:** Clona este repositorio o descarga el ZIP (Código -> Download ZIP).
2.  **Abrir:** Descomprime la carpeta y haz doble clic en el archivo **`index.html`** para abrir la aplicación en tu navegador.
3.  **Practicar:** Selecciona los exámenes que quieras repasar, elige el número de preguntas y ¡listo!

## 🛠️ Estructura del Proyecto
* `index.html`: La aplicación principal.
* `exams/`: Carpeta con los archivos de examen (`.js`).
* `script.js`: Lógica del examen (JavaScript).
* `style.css`: Estilos visuales.
* `lang/`: Archivos de traducción de la interfaz (ES/CA).

---

## 🌍 Traducción de Exámenes

La plataforma admite exámenes multilingües. Para que un examen se vea en el idioma seleccionado por el usuario, los campos de texto del archivo `.js` del examen deben convertirse en objetos en lugar de strings simples.

### Estructura para Traducción

Si quieres traducir un examen, cambia los strings por un objeto con las claves `es` (español) y `ca` (catalán):

```javascript
window.registerExam('id_del_examen', {
    "Title": {
        "es": "Título en Español",
        "ca": "Títol en Català"
    },
    // ...
    "ExamParts": [
        {
            "Title": { "es": "Parte Única", "ca": "Part Única" },
            "Questions": [
                {
                    "Statement": {
                        "es": "¿Cuál es...?",
                        "ca": "Quina és...?"
                    },
                    "Answers": [
                        { "Text": { "es": "Opción A", "ca": "Opció A" }, "IsCorrect": true },
                        // ...
                    ]
                }
            ]
        }
    ]
});
```

*   **Idioma por defecto:** Si el idioma seleccionado por el usuario no existe en el objeto, la plataforma mostrará el español (`es`) por defecto. Si el español tampoco está disponible, mostrará el primer idioma que encuentre en el objeto.
*   **Compatibilidad:** Los exámenes antiguos que usan strings simples seguirán funcionando correctamente en su idioma original (sin traducción).

---
*Este repositorio es una herramienta de estudio gratuita y no tiene afiliación oficial con ningún organismo público.*