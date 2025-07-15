// Inicializar aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initDatabase();
        await loadConfigFromDB();
        updateFormSelects();
        updateConfigDisplay();
        displayProducts();
        updateStats();
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showAlert('Error al inicializar la aplicación. Algunas funciones pueden no estar disponibles.', 'danger');
    }
});

// Función principal para cambiar tabs
function switchTab(tabName) {
    try {
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Mostrar tab seleccionado
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Activar botón correspondiente por atributo data
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Cargar contenido específico según el tab
        if (tabName === 'products') {
            displayProducts();
        } else if (tabName === 'reports') {
            updateStats();
        } else if (tabName === 'database') {
            showDatabaseInfo();
        } else if (tabName === 'config') {
            loadSubcategoryManagement();
            // Verificar elementos de configuración
            setTimeout(() => {
                if (typeof debugConfigElements === 'function') {
                    console.log('Verificando elementos de configuración...');
                    debugConfigElements();
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error al cambiar de tab:', error);
        showAlert('Error al cambiar de pestaña', 'danger');
    }
}

// Mostrar alerta
function showAlert(message, type = 'info') {
    try {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            console.warn('Alert container not found, using console log:', message);
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    } catch (error) {
        console.error('Error mostrando alerta:', error);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// EVENT LISTENERS

// Manejar cambios en los selects para generar automáticamente
document.addEventListener('change', function(e) {
    try {
        if (['tipo', 'categoria', 'subcategoria', 'talla', 'color', 'temporada'].includes(e.target.id)) {
            const allFieldsFilled = ['tipo', 'categoria', 'subcategoria', 'talla', 'color', 'temporada']
                .every(id => {
                    const element = document.getElementById(id);
                    return element && element.value !== '';
                });
            
            if (allFieldsFilled) {
                // Auto-generar código cuando todos los campos están llenos
                setTimeout(generateCode, 100);
            }
        }

        // También para los campos de edición
        if (['editTipo', 'editCategoria', 'editSubcategoria', 'editTalla', 'editColor', 'editTemporada'].includes(e.target.id)) {
            const allEditFieldsFilled = ['editTipo', 'editCategoria', 'editSubcategoria', 'editTalla', 'editColor', 'editTemporada']
                .every(id => {
                    const element = document.getElementById(id);
                    return element && element.value !== '';
                });
            
            if (allEditFieldsFilled) {
                // Auto-generar nombre cuando todos los campos están llenos
                const nombre = generateProductName(
                    document.getElementById('editTipo').value,
                    document.getElementById('editCategoria').value,
                    document.getElementById('editSubcategoria').value,
                    document.getElementById('editTalla').value,
                    document.getElementById('editColor').value,
                    document.getElementById('editTemporada').value
                );
                document.getElementById('editNombre').value = nombre;
            }
        }
    } catch (error) {
        console.error('Error en cambio de select:', error);
    }
});

// Función para manejar Enter en el campo de búsqueda
document.addEventListener('keypress', function(e) {
    try {
        if (e.target.id === 'searchInput' && e.key === 'Enter') {
            searchProducts();
        }
    } catch (error) {
        console.error('Error en búsqueda por Enter:', error);
    }
});

// Cerrar modales al hacer click fuera de ellos
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    const duplicateModal = document.getElementById('duplicateModal');
    
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === duplicateModal) {
        closeDuplicateModal();
    }
});

// Función de limpieza al cerrar la página
window.addEventListener('beforeunload', function() {
    try {
        if (db) {
            saveDatabase();
        }
    } catch (error) {
        console.error('Error al guardar antes de cerrar:', error);
    }
});

// Manejo de errores globales
window.addEventListener('error', function(event) {
    console.error('Error global:', event.error);
    if (typeof showAlert === 'function') {
        showAlert('Ha ocurrido un error inesperado. Revise la consola para más detalles.', 'danger');
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDuplicateModal();
    }
});

// ASIGNAR FUNCIONES AL OBJETO WINDOW PARA COMPATIBILIDAD

// Asegurar que las funciones principales estén disponibles globalmente
window.generateCode = generateCode;
window.saveProduct = saveProduct;
window.generateNewCode = generateNewCode;
window.updateSubcategories = updateSubcategories;
window.updateEditSubcategories = updateEditSubcategories;
window.searchProducts = searchProducts;
window.clearSearch = clearSearch;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.closeEditModal = closeEditModal;
window.updateProduct = updateProduct;
window.exportToCSV = exportToCSV;
window.exportToJSON = exportToJSON;
window.generateCategoryReport = generateCategoryReport;
window.generateColorReport = generateColorReport;
window.generateSizeReport = generateSizeReport;
window.generateSeasonReport = generateSeasonReport;
window.addConfigItem = addConfigItem;
window.editConfigItem = editConfigItem;
window.deleteConfigItem = deleteConfigItem;
window.loadSubcategoriesForCategory = loadSubcategoriesForCategory;
window.addSubcategory = addSubcategory;
window.editSubcategory = editSubcategory;
window.deleteSubcategory = deleteSubcategory;
window.executeSQLQuery = executeSQLQuery;
window.clearSQLResult = clearSQLResult;
window.backupDatabase = backupDatabase;
window.restoreDatabase = restoreDatabase;
window.clearAllData = clearAllData;
window.loadSampleData = loadSampleData;
window.showDatabaseInfo = showDatabaseInfo;
window.updateConfigDisplay = updateConfigDisplay;
window.switchTab = switchTab;
window.showAlert = showAlert;
window.closeDuplicateModal = closeDuplicateModal;
window.confirmSaveProduct = confirmSaveProduct;

// Inicialización de la aplicación
console.log('🚀 Aplicación de Generador de Códigos de Productos inicializada');
console.log('📊 Base de datos SQLite: Habilitada');
console.log('⚡ Funcionalidades: Generación automática, Reportes, Exportación, Configuración avanzada');
console.log('✏️ Edición de productos: Habilitada');
console.log('⚙️ Configuración dinámica: Habilitada');
console.log('🔍 Validación de duplicados: Habilitada');
console.log('🔧 Version: 2.1.0 - Mejorada');