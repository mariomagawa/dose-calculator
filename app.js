document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        vialMg: null,
        diluentMl: null,
        syringeMl: null,
        doseMg: null
    };

    // Elements
    const elements = {
        vialButtons: document.querySelectorAll('#vial-buttons button'),
        customVial: document.getElementById('custom-vial'),
        
        diluentButtons: document.querySelectorAll('#diluent-buttons button'),
        customDiluent: document.getElementById('custom-diluent'),
        
        syringeButtons: document.querySelectorAll('#syringe-buttons button'),
        
        doseButtons: document.querySelectorAll('#dose-buttons button'),
        customDose: document.getElementById('custom-dose'),

        resultsPlaceholder: document.querySelector('.placeholder-text'),
        resultData: document.getElementById('result-data'),
        
        resDoseMg: document.getElementById('res-dose-mg'),
        resDrawMl: document.getElementById('res-draw-ml'),
        resDrawUnits: document.getElementById('res-draw-units'),
        resConcentration: document.getElementById('res-concentration'),
        resDoses: document.getElementById('res-doses'),
        resDoseEach: document.getElementById('res-dose-each'),

        syringeLiquid: document.getElementById('syringe-liquid'),
        syringePlunger: document.getElementById('syringe-plunger'),
        syringeWarning: document.getElementById('syringe-warning'),
        syringeMarks: document.querySelector('.syringe-marks'),

        btnReset: document.getElementById('btn-reset'),
        btnPrint: document.getElementById('btn-print')
    };
    const updateSyringeMarks = (syringeMl) => {
        if (!syringeMl) return;
        let html = '';
        if (syringeMl === 0.3) {
            for (let i = 5; i <= 30; i += 5) {
                html += `<div class="mark-group"><span>${i}</span></div>`;
            }
        } else if (syringeMl === 0.5) {
            for (let i = 10; i <= 50; i += 10) {
                html += `<div class="mark-group"><span>${i}</span></div>`;
            }
        } else {
            for (let i = 10; i <= 100; i += 10) {
                html += `<div class="mark-group"><span>${i}</span></div>`;
            }
        }
        if (elements.syringeMarks) {
            elements.syringeMarks.innerHTML = html;
        }
    };

    // Helper to format numbers nicely (e.g. 0.333)
    const formatNumber = (num, maxDecimals = 3) => {
        return Number(Math.round(num + 'e' + maxDecimals) + 'e-' + maxDecimals);
    };

    // Setup Group Handlers
    const setupGroup = (buttons, customInput, stateKey) => {
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selected from all
                buttons.forEach(b => b.classList.remove('selected'));
                // Add to clicked
                btn.classList.add('selected');
                // Clear custom input
                if (customInput) {
                    customInput.value = '';
                    customInput.parentElement.classList.remove('active');
                }
                // Update state
                state[stateKey] = parseFloat(btn.dataset.value);
                if (stateKey === 'syringeMl') {
                    updateSyringeMarks(state[stateKey]);
                }
                calculate();
            });
        });

        if (customInput) {
            customInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                // Remove selected from buttons
                buttons.forEach(b => b.classList.remove('selected'));
                
                if (!isNaN(val) && val > 0) {
                    customInput.parentElement.classList.add('active');
                    state[stateKey] = val;
                } else {
                    customInput.parentElement.classList.remove('active');
                    state[stateKey] = null;
                }
                calculate();
            });
        }
    };

    // Initialize groups
    setupGroup(elements.vialButtons, elements.customVial, 'vialMg');
    setupGroup(elements.diluentButtons, elements.customDiluent, 'diluentMl');
    setupGroup(elements.syringeButtons, null, 'syringeMl');
    setupGroup(elements.doseButtons, elements.customDose, 'doseMg');

    // Calculate Logic
    const calculate = () => {
        const { vialMg, diluentMl, syringeMl, doseMg } = state;

        if (vialMg && diluentMl && syringeMl && doseMg) {
            // All inputs selected
            elements.resultsPlaceholder.classList.add('hidden');
            elements.resultData.classList.remove('hidden');

            const concentration = vialMg / diluentMl;
            const drawVolume = doseMg / concentration;
            const drawUnits = drawVolume * 100;
            const totalDoses = vialMg / doseMg;

            // Update Text
            elements.resDoseMg.textContent = `${formatNumber(doseMg)}mg`;
            elements.resDrawMl.textContent = `${formatNumber(drawVolume)} mL`;
            elements.resDrawUnits.textContent = `${formatNumber(drawUnits)} Unidades`;
            elements.resConcentration.textContent = `${formatNumber(concentration)} mg/mL`;
            elements.resDoses.textContent = Math.floor(totalDoses);
            elements.resDoseEach.textContent = formatNumber(doseMg);

            // Update Syringe Visual
            // Max volume is syringe capacity
            let fillPercentage = (drawVolume / syringeMl) * 100;
            
            if (fillPercentage > 100) {
                fillPercentage = 100;
                elements.syringeWarning.classList.remove('hidden');
                elements.syringeLiquid.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
            } else {
                elements.syringeWarning.classList.add('hidden');
                elements.syringeLiquid.style.background = 'linear-gradient(90deg, #0ea5e9, #3b82f6)';
            }

            // Liquid width
            elements.syringeLiquid.style.width = `${fillPercentage}%`;
            // Plunger moves right based on liquid
            elements.syringePlunger.style.left = `${fillPercentage}%`;

        } else {
            // Missing inputs
            elements.resultsPlaceholder.classList.remove('hidden');
            elements.resultData.classList.add('hidden');
        }
    };

    // Reset
    elements.btnReset.addEventListener('click', () => {
        // Clear state
        state.vialMg = null;
        state.diluentMl = null;
        state.syringeMl = null;
        state.doseMg = null;

        // Clear UI
        const allButtons = document.querySelectorAll('.card-body button');
        allButtons.forEach(b => b.classList.remove('selected'));
        
        if (elements.customVial) elements.customVial.value = '';
        if (elements.customDiluent) elements.customDiluent.value = '';
        if (elements.customDose) elements.customDose.value = '';

        document.querySelectorAll('.custom-input-group').forEach(g => g.classList.remove('active'));

        calculate();
    });

    // Print
    elements.btnPrint.addEventListener('click', () => {
        window.print();
    });
});
