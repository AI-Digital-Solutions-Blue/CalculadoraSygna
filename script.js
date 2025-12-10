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
let billingPeriod = 'monthly'; // 'monthly' o 'annual'
let calculation = {
    base: 0,
    modules: {},
    extras: {},
    total: 0,
    monthlyTotal: 0,
    annualTotal: 0,
    savings: 0
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeAccordion();
});

function initializeAccordion() {
    // Acordeón de módulos
    const modulesHeader = document.getElementById('modules-header');
    const modulesContent = document.getElementById('modules-content');
    
    modulesContent.classList.add('collapsed');
    modulesHeader.classList.add('collapsed');
    
    modulesHeader.addEventListener('click', () => {
        const isCollapsed = modulesContent.classList.contains('collapsed');
        if (isCollapsed) {
            modulesContent.classList.remove('collapsed');
            modulesHeader.classList.remove('collapsed');
        } else {
            modulesContent.classList.add('collapsed');
            modulesHeader.classList.add('collapsed');
        }
    });

    // Acordeón de bundles
    const bundlesHeader = document.getElementById('bundles-header');
    const bundlesContent = document.getElementById('bundles-content');
    
    bundlesContent.classList.add('collapsed');
    bundlesHeader.classList.add('collapsed');
    
    bundlesHeader.addEventListener('click', () => {
        const isCollapsed = bundlesContent.classList.contains('collapsed');
        if (isCollapsed) {
            bundlesContent.classList.remove('collapsed');
            bundlesHeader.classList.remove('collapsed');
        } else {
            bundlesContent.classList.add('collapsed');
            bundlesHeader.classList.add('collapsed');
        }
    });
}

function initializeEventListeners() {
    // Período de facturación
    document.querySelectorAll('input[name="period"]').forEach(radio => {
        radio.addEventListener('change', handlePeriodChange);
    });

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

    // Bundles
    document.getElementById('apply-bundle').addEventListener('click', applyBundle);
    document.getElementById('clear-bundle').addEventListener('click', clearBundle);
}

function handlePeriodChange(e) {
    if (e.target.checked) {
        billingPeriod = e.target.value;
        calculateTotal();
    }
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

    // Calcular total mensual
    calculation.monthlyTotal = calculation.base;
    Object.values(calculation.modules).forEach(m => calculation.monthlyTotal += m.price);
    Object.values(calculation.extras).forEach(e => calculation.monthlyTotal += e.price);

    // Calcular según período
    if (billingPeriod === 'annual') {
        // Plan anual: pagas 10 meses en lugar de 12 (2 meses gratis = 17% descuento)
        calculation.total = calculation.monthlyTotal * 10;
        calculation.annualTotal = calculation.total;
        calculation.savings = (calculation.monthlyTotal * 12) - calculation.total;
    } else {
        // Plan mensual
        calculation.total = calculation.monthlyTotal;
        calculation.annualTotal = calculation.monthlyTotal * 12;
        calculation.savings = 0;
    }

    updateSummary();
}

// Configuración de bundles
const BUNDLES = {
    'cumple-factura': {
        base: 'micro',
        modules: { facturacion: { package: 's' } }
    },
    'personas-facturae-nominas': {
        base: 'micro',
        modules: { rrhh: true, facturacion: { package: 's' }, nominas: true }
    },
    'vende-cobra': {
        base: 'micro',
        modules: { facturacion: { package: 'm' }, tesoreria: true }
    },
    'autonomo-pro-360': {
        base: 'micro',
        modules: { facturacion: { package: 'm' }, tesoreria: true, contabilidad: true }
    },
    'servicios-tickets': {
        base: 'micro',
        modules: { facturacion: { package: 's' }, tickets: true, documentos: true }
    },
    'personas-facturae-nominas-pyme': {
        base: 'pyme',
        modules: { rrhh: true, facturacion: { package: 'l' }, nominas: true }
    },
    'ventas-cobros': {
        base: 'pyme',
        modules: { facturacion: { package: 'l' }, tesoreria: true }
    },
    'finanzas-360': {
        base: 'pyme',
        modules: { facturacion: { package: 'l' }, tesoreria: true, contabilidad: true }
    },
    'operativa-completa': {
        base: 'pyme',
        modules: { 
            facturacion: { package: 'l' }, 
            tesoreria: true, 
            rrhh: true, 
            contabilidad: true, 
            tickets: true, 
            documentos: true, 
            dashboards: true 
        }
    },
    'erp-facturae-personas': {
        base: 'empresa',
        modules: { 
            facturacion: { package: 'xl' }, 
            tesoreria: true, 
            contabilidad: true, 
            rrhh: true, 
            nominas: true 
        }
    },
    'erp-esencial': {
        base: 'empresa',
        modules: { 
            facturacion: { package: 'xl' }, 
            tesoreria: true, 
            contabilidad: true 
        }
    },
    'erp-pro': {
        base: 'empresa',
        modules: { 
            facturacion: { package: 'enterprise' }, 
            tesoreria: true, 
            contabilidad: true, 
            rrhh: true, 
            documentos: true, 
            dashboards: true, 
            tickets: true 
        }
    }
};

function applyBundle() {
    const selectedBundle = document.querySelector('input[name="bundle"]:checked');
    if (!selectedBundle) {
        alert('Por favor, selecciona un bundle primero.');
        return;
    }

    const bundle = BUNDLES[selectedBundle.value];
    if (!bundle) return;

    // Limpiar selección anterior
    clearBundle(false);

    // Aplicar base
    const baseRadio = document.querySelector(`input[name="base"][value="${bundle.base}"]`);
    if (baseRadio) {
        baseRadio.checked = true;
        selectedBase = bundle.base;
    }

    // Aplicar módulos
    Object.keys(bundle.modules).forEach(moduleId => {
        const moduleConfig = bundle.modules[moduleId];
        const moduleCheckbox = document.getElementById(moduleId);
        
        if (moduleCheckbox) {
            moduleCheckbox.checked = true;
            
            // Configurar opciones específicas
            if (moduleId === 'facturacion' && moduleConfig.package) {
                const packageSelect = document.getElementById('facturacion-package');
                packageSelect.value = moduleConfig.package;
                const options = document.getElementById('facturacion-options');
                options.style.display = 'block';
                selectedModules.add('facturacion');
            } else if (moduleId === 'nominas') {
                const options = document.getElementById('nominas-options');
                options.style.display = 'block';
                selectedModules.add('nominas');
            } else {
                selectedModules.add(moduleId);
            }
        }
    });

    // Recalcular
    calculateTotal();
    
    // Expandir sección de módulos para ver la configuración
    const modulesContent = document.getElementById('modules-content');
    const modulesHeader = document.getElementById('modules-header');
    modulesContent.classList.remove('collapsed');
    modulesHeader.classList.remove('collapsed');
}

function clearBundle(showAlert = true) {
    // Desmarcar todos los bundles
    document.querySelectorAll('input[name="bundle"]').forEach(radio => {
        radio.checked = false;
    });

    // Limpiar base
    document.querySelectorAll('input[name="base"]').forEach(radio => {
        radio.checked = false;
    });
    selectedBase = null;

    // Limpiar módulos
    document.querySelectorAll('input[data-module]').forEach(checkbox => {
        checkbox.checked = false;
    });
    selectedModules.clear();

    // Ocultar opciones
    document.getElementById('facturacion-options').style.display = 'none';
    document.getElementById('nominas-options').style.display = 'none';

    // Limpiar inputs
    document.getElementById('facturas-extra').value = 0;
    document.getElementById('num-nominas').value = 0;
    document.getElementById('usuarios-extra').value = 0;
    document.getElementById('pack-1000').checked = false;

    if (showAlert) {
        alert('Bundle limpiado. Puedes configurar manualmente.');
    }

    calculateTotal();
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

    // Mostrar período seleccionado
    html += `<div class="summary-item period-info">
        <span class="label">Período: <strong>${billingPeriod === 'annual' ? 'Anual (10 meses)' : 'Mensual'}</strong></span>
        ${billingPeriod === 'annual' ? `<span class="value savings">Ahorras: ${calculation.savings.toFixed(2)} €</span>` : ''}
    </div>`;

    // Base
    if (calculation.base > 0) {
        const basePrice = billingPeriod === 'annual' ? (calculation.base * 10) : calculation.base;
        html += `<div class="summary-item">
            <span class="label">Base ${PRICES.bases[selectedBase].name}</span>
            <span class="value">${basePrice.toFixed(2)} €</span>
        </div>`;
    }

    // Módulos
    Object.values(calculation.modules).forEach(module => {
        const modulePrice = billingPeriod === 'annual' ? (module.price * 10) : module.price;
        html += `<div class="summary-item">
            <span class="label">${module.name}${module.detail ? ` (${module.detail})` : ''}</span>
            <span class="value">${modulePrice.toFixed(2)} €</span>
        </div>`;
    });

    // Extras
    Object.values(calculation.extras).forEach(extra => {
        const extraPrice = billingPeriod === 'annual' ? (extra.price * 10) : extra.price;
        html += `<div class="summary-item">
            <span class="label">${extra.name}</span>
            <span class="value">${extraPrice.toFixed(2)} €</span>
        </div>`;
    });

    summaryContent.innerHTML = html || '<p class="empty-message">Añade módulos para ver el desglose</p>';

    // Actualizar totales según período
    if (billingPeriod === 'annual') {
        totalMensual.textContent = `${(calculation.total / 12).toFixed(2)} €/mes`;
        totalAnual.textContent = `${calculation.total.toFixed(2)} €/año`;
    } else {
        totalMensual.textContent = `${calculation.total.toFixed(2)} €/mes`;
        totalAnual.textContent = `${calculation.annualTotal.toFixed(2)} €/año`;
    }
    
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
        <p><strong>Período de facturación:</strong> ${billingPeriod === 'annual' ? 'Anual (pago por 10 meses)' : 'Mensual'}</p>
        ${billingPeriod === 'annual' ? `<p style="color: #4ade80; font-weight: bold;"><strong>Ahorro:</strong> ${calculation.savings.toFixed(2)} € (2 meses gratis)</p>` : ''}
    </div>

    <table>
        <thead>
            <tr>
                <th>Concepto</th>
                <th style="text-align: right;">${billingPeriod === 'annual' ? 'Precio Anual (10 meses)' : 'Precio Mensual'}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Base ${PRICES.bases[selectedBase].name}</strong> (${PRICES.bases[selectedBase].users} usuario${PRICES.bases[selectedBase].users > 1 ? 's' : ''} incluido${PRICES.bases[selectedBase].users > 1 ? 's' : ''})</td>
                <td style="text-align: right;">${(billingPeriod === 'annual' ? calculation.base * 10 : calculation.base).toFixed(2)} €</td>
            </tr>`;

    // Módulos
    Object.values(calculation.modules).forEach(module => {
        const modulePrice = billingPeriod === 'annual' ? (module.price * 10) : module.price;
        presupuestoHTML += `
            <tr>
                <td>${module.name}${module.detail ? ` - ${module.detail}` : ''}</td>
                <td style="text-align: right;">${modulePrice.toFixed(2)} €</td>
            </tr>`;
    });

    // Extras
    Object.values(calculation.extras).forEach(extra => {
        const extraPrice = billingPeriod === 'annual' ? (extra.price * 10) : extra.price;
        presupuestoHTML += `
            <tr>
                <td>${extra.name}</td>
                <td style="text-align: right;">${extraPrice.toFixed(2)} €</td>
            </tr>`;
    });

    presupuestoHTML += `
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-line">
            <span>Total ${billingPeriod === 'annual' ? 'anual (10 meses)' : 'mensual'}:</span>
            <span>${calculation.total.toFixed(2)} €</span>
        </div>
        ${billingPeriod === 'annual' ? `
        <div class="total-line" style="color: #4ade80; font-weight: bold;">
            <span>Ahorro (2 meses gratis):</span>
            <span>${calculation.savings.toFixed(2)} €</span>
        </div>
        <div class="total-line">
            <span>Equivalente mensual:</span>
            <span>${(calculation.total / 12).toFixed(2)} €/mes</span>
        </div>
        ` : `
        <div class="total-line">
            <span>Total anual (12 meses):</span>
            <span>${calculation.annualTotal.toFixed(2)} €</span>
        </div>
        `}
        <div class="total-line grand">
            <span>TOTAL A PAGAR:</span>
            <span>${calculation.total.toFixed(2)} €${billingPeriod === 'annual' ? '/año' : '/mes'}</span>
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

