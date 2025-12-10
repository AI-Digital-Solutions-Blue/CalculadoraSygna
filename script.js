// Datos de precios
const PRICES = {
    bases: {
        micro: { price: 6, users: 1, name: 'Micro' },
        pyme: { price: 12, users: 3, name: 'Pyme' },
        empresa: { price: 24, users: 7, name: 'Empresa' }
    },
    modules: {
        facturacion: { name: 'Facturación Digital' },
        rrhh: { price: 9, name: 'RRHH' },
        nominas: { name: 'Nóminas', requires: 'rrhh' },
        tesoreria: { price: 9, name: 'Tesorería' },
        contabilidad: { price: 9, name: 'Contabilidad', requires: 'facturacion' },
        documentos: { price: 4, name: 'Documentos y Firma Digital' },
        dashboards: { price: 6, name: 'Dashboards e Integraciones' },
        tickets: { price: 6, name: 'Tickets' }
    },
    facturacionPackages: {
        s: { price: 9, invoices: 250 },
        m: { price: 12, invoices: 1000 },
        l: { price: 16, invoices: 3000 },
        xl: { price: 20, invoices: 5000 },
        enterprise: { price: 28, invoices: 10000 }
    },
    extras: {
        usuarioAdicional: 3,
        facturaAdicional: 0.10,
        pack1000Facturas: 80 / 12, // 6.67 €/mes
        nomina: 5
    }
};

// Estado de la calculadora
let selectedBase = null;
let selectedModules = new Set();
let calculation = {
    base: 0,
    modules: {},
    extras: {},
    total: 0
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Bases
    document.querySelectorAll('input[name="base"]').forEach(radio => {
        radio.addEventListener('change', handleBaseChange);
    });

    // Módulos
    document.getElementById('facturacion').addEventListener('change', handleFacturacionChange);
    document.getElementById('rrhh').addEventListener('change', handleModuleChange);
    document.getElementById('nominas').addEventListener('change', handleNominasChange);
    document.getElementById('tesoreria').addEventListener('change', handleModuleChange);
    document.getElementById('contabilidad').addEventListener('change', handleModuleChange);
    document.getElementById('documentos').addEventListener('change', handleModuleChange);
    document.getElementById('dashboards').addEventListener('change', handleModuleChange);
    document.getElementById('tickets').addEventListener('change', handleModuleChange);

    // Opciones de facturación
    document.getElementById('facturacion-package').addEventListener('change', calculateTotal);
    document.getElementById('facturas-extra').addEventListener('input', calculateTotal);
    document.getElementById('pack-1000').addEventListener('change', calculateTotal);

    // Nóminas
    document.getElementById('num-nominas').addEventListener('input', calculateTotal);

    // Extras
    document.getElementById('usuarios-extra').addEventListener('input', calculateTotal);

    // Botón generar presupuesto
    document.getElementById('generar-presupuesto').addEventListener('click', generatePresupuesto);
}

function handleBaseChange(e) {
    if (e.target.checked) {
        selectedBase = e.target.value;
        calculateTotal();
    }
}

function handleFacturacionChange(e) {
    const options = document.getElementById('facturacion-options');
    if (e.target.checked) {
        options.style.display = 'block';
        selectedModules.add('facturacion');
    } else {
        options.style.display = 'none';
        selectedModules.delete('facturacion');
        // Desactivar contabilidad si requiere facturación
        if (document.getElementById('contabilidad').checked) {
            document.getElementById('contabilidad').checked = false;
            handleModuleChange({ target: document.getElementById('contabilidad') });
        }
    }
    calculateTotal();
}

function handleNominasChange(e) {
    const options = document.getElementById('nominas-options');
    if (e.target.checked) {
        if (!document.getElementById('rrhh').checked) {
            alert('Las Nóminas requieren el módulo de RRHH activo.');
            e.target.checked = false;
            return;
        }
        options.style.display = 'block';
        selectedModules.add('nominas');
    } else {
        options.style.display = 'none';
        selectedModules.delete('nominas');
    }
    calculateTotal();
}

function handleModuleChange(e) {
    const moduleId = e.target.id;
    const module = PRICES.modules[moduleId];

    if (e.target.checked) {
        // Verificar dependencias
        if (module.requires) {
            const requiredModule = document.getElementById(module.requires);
            if (!requiredModule.checked) {
                alert(`${module.name} requiere el módulo de ${PRICES.modules[module.requires].name} activo.`);
                e.target.checked = false;
                return;
            }
        }
        selectedModules.add(moduleId);
    } else {
        selectedModules.delete(moduleId);
        // Desactivar módulos que dependen de este
        if (moduleId === 'rrhh' && document.getElementById('nominas').checked) {
            document.getElementById('nominas').checked = false;
            handleNominasChange({ target: document.getElementById('nominas') });
        }
        if (moduleId === 'facturacion' && document.getElementById('contabilidad').checked) {
            document.getElementById('contabilidad').checked = false;
            handleModuleChange({ target: document.getElementById('contabilidad') });
        }
    }
    calculateTotal();
}

function calculateTotal() {
    calculation = {
        base: 0,
        modules: {},
        extras: {},
        total: 0
    };

    // Base
    if (selectedBase) {
        const base = PRICES.bases[selectedBase];
        calculation.base = base.price;
    }

    // Módulos
    selectedModules.forEach(moduleId => {
        const module = PRICES.modules[moduleId];
        
        if (moduleId === 'facturacion') {
            const packageSelect = document.getElementById('facturacion-package');
            const selectedPackage = packageSelect.value;
            const packageData = PRICES.facturacionPackages[selectedPackage];
            calculation.modules[moduleId] = {
                name: `${module.name} - Paquete ${selectedPackage.toUpperCase()}`,
                price: packageData.price
            };
        } else if (moduleId === 'nominas') {
            const numNominas = parseInt(document.getElementById('num-nominas').value) || 0;
            const totalNominas = numNominas * PRICES.extras.nomina;
            calculation.modules[moduleId] = {
                name: module.name,
                price: totalNominas,
                detail: `${numNominas} nóminas × ${PRICES.extras.nomina} €`
            };
        } else if (module.price) {
            calculation.modules[moduleId] = {
                name: module.name,
                price: module.price
            };
        }
    });

    // Extras
    // Usuarios adicionales
    const usuariosExtra = parseInt(document.getElementById('usuarios-extra').value) || 0;
    if (usuariosExtra > 0 && selectedBase) {
        const base = PRICES.bases[selectedBase];
        calculation.extras.usuarios = {
            name: `${usuariosExtra} usuarios adicionales`,
            price: usuariosExtra * PRICES.extras.usuarioAdicional
        };
    }

    // Facturas adicionales
    if (selectedModules.has('facturacion')) {
        const facturasExtra = parseInt(document.getElementById('facturas-extra').value) || 0;
        if (facturasExtra > 0) {
            calculation.extras.facturas = {
                name: `${facturasExtra} facturas adicionales`,
                price: facturasExtra * PRICES.extras.facturaAdicional
            };
        }

        // Pack +1000 facturas
        if (document.getElementById('pack-1000').checked) {
            calculation.extras.pack1000 = {
                name: 'Pack +1.000 facturas/año',
                price: PRICES.extras.pack1000Facturas
            };
        }
    }

    // Calcular total
    calculation.total = calculation.base;
    Object.values(calculation.modules).forEach(m => calculation.total += m.price);
    Object.values(calculation.extras).forEach(e => calculation.total += e.price);

    updateSummary();
}

function updateSummary() {
    const summaryContent = document.getElementById('summary-content');
    const totalMensual = document.getElementById('total-mensual');
    const totalAnual = document.getElementById('total-anual');
    const btnPresupuesto = document.getElementById('generar-presupuesto');

    if (!selectedBase) {
        summaryContent.innerHTML = '<p class="empty-message">Selecciona una base para comenzar</p>';
        totalMensual.textContent = '0,00 €';
        totalAnual.textContent = '0,00 €';
        btnPresupuesto.disabled = true;
        return;
    }

    let html = '';

    // Base
    if (calculation.base > 0) {
        html += `<div class="summary-item">
            <span class="label">Base ${PRICES.bases[selectedBase].name}</span>
            <span class="value">${calculation.base.toFixed(2)} €</span>
        </div>`;
    }

    // Módulos
    Object.values(calculation.modules).forEach(module => {
        html += `<div class="summary-item">
            <span class="label">${module.name}${module.detail ? ` (${module.detail})` : ''}</span>
            <span class="value">${module.price.toFixed(2)} €</span>
        </div>`;
    });

    // Extras
    Object.values(calculation.extras).forEach(extra => {
        html += `<div class="summary-item">
            <span class="label">${extra.name}</span>
            <span class="value">${extra.price.toFixed(2)} €</span>
        </div>`;
    });

    summaryContent.innerHTML = html || '<p class="empty-message">Añade módulos para ver el desglose</p>';

    totalMensual.textContent = `${calculation.total.toFixed(2)} €`;
    totalAnual.textContent = `${(calculation.total * 12).toFixed(2)} €`;
    btnPresupuesto.disabled = false;
}

function generatePresupuesto() {
    if (!selectedBase || calculation.total === 0) {
        alert('Por favor, completa la configuración antes de generar el presupuesto.');
        return;
    }

    // Crear contenido del presupuesto
    const fecha = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    let presupuestoHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Presupuesto Sygna</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .info {
            margin-bottom: 30px;
        }
        .info p {
            margin: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #667eea;
            color: white;
        }
        .total-row {
            font-weight: bold;
            font-size: 1.1em;
            background-color: #f0f4ff;
        }
        .total-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 1.2em;
        }
        .total-line.grand {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
            border-top: 2px solid #667eea;
            padding-top: 10px;
            margin-top: 20px;
        }
        .note {
            margin-top: 30px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PRESUPUESTO SYGNA</h1>
        <p>Modelo Modular - Planes y Funcionalidades 2025</p>
    </div>

    <div class="info">
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Precios:</strong> Sin IVA</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Concepto</th>
                <th style="text-align: right;">Precio Mensual</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Base ${PRICES.bases[selectedBase].name}</strong> (${PRICES.bases[selectedBase].users} usuario${PRICES.bases[selectedBase].users > 1 ? 's' : ''} incluido${PRICES.bases[selectedBase].users > 1 ? 's' : ''})</td>
                <td style="text-align: right;">${calculation.base.toFixed(2)} €</td>
            </tr>`;

    // Módulos
    Object.values(calculation.modules).forEach(module => {
        presupuestoHTML += `
            <tr>
                <td>${module.name}${module.detail ? ` - ${module.detail}` : ''}</td>
                <td style="text-align: right;">${module.price.toFixed(2)} €</td>
            </tr>`;
    });

    // Extras
    Object.values(calculation.extras).forEach(extra => {
        presupuestoHTML += `
            <tr>
                <td>${extra.name}</td>
                <td style="text-align: right;">${extra.price.toFixed(2)} €</td>
            </tr>`;
    });

    presupuestoHTML += `
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-line">
            <span>Total mensual:</span>
            <span>${calculation.total.toFixed(2)} €</span>
        </div>
        <div class="total-line">
            <span>Total anual (12 meses):</span>
            <span>${(calculation.total * 12).toFixed(2)} €</span>
        </div>
        <div class="total-line grand">
            <span>TOTAL:</span>
            <span>${calculation.total.toFixed(2)} €/mes</span>
        </div>
    </div>

    <div class="note">
        <p><strong>Notas importantes:</strong></p>
        <ul>
            <li>Los precios mostrados son sin IVA.</li>
            <li>Los módulos pueden activarse o desactivarse mes a mes.</li>
            <li>La Contabilidad requiere el módulo de Facturación activo.</li>
            <li>Las Nóminas requieren el módulo de RRHH activo.</li>
            <li>Las facturas adicionales y packs aplican solo al módulo de Facturación.</li>
        </ul>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir Presupuesto</button>
    </div>
</body>
</html>`;

    // Abrir ventana con el presupuesto
    const ventana = window.open('', '_blank');
    ventana.document.write(presupuestoHTML);
    ventana.document.close();
}

