// Variables de configuración
let configData = {};

// Cargar configuración desde la base de datos
async function loadConfigFromDB() {
    try {
        configData = {
            tipos: {},
            categorias: {},
            subcategorias: {},
            tallas: {},
            colores: {},
            temporadas: {}
        };

        if (!db) {
            console.warn('Base de datos no inicializada, usando configuración por defecto');
            configData = { ...initialConfigData };
            return;
        }

        // Cargar tipos
        const tipos = db.exec("SELECT codigo, nombre FROM config_tipos WHERE activo = 1 ORDER BY codigo");
        if (tipos.length > 0) {
            tipos[0].values.forEach(([codigo, nombre]) => {
                configData.tipos[codigo] = nombre;
            });
        }

        // Cargar categorías
        const categorias = db.exec("SELECT codigo, nombre FROM config_categorias WHERE activo = 1 ORDER BY codigo");
        if (categorias.length > 0) {
            categorias[0].values.forEach(([codigo, nombre]) => {
                configData.categorias[codigo] = nombre;
            });
        }

        // Cargar subcategorías
        const subcategorias = db.exec("SELECT categoria_codigo, codigo, nombre FROM config_subcategorias WHERE activo = 1 ORDER BY categoria_codigo, codigo");
        if (subcategorias.length > 0) {
            subcategorias[0].values.forEach(([categoria, codigo, nombre]) => {
                if (!configData.subcategorias[categoria]) {
                    configData.subcategorias[categoria] = {};
                }
                configData.subcategorias[categoria][codigo] = nombre;
            });
        }

        // Cargar tallas
        const tallas = db.exec("SELECT codigo, nombre FROM config_tallas WHERE activo = 1 ORDER BY codigo");
        if (tallas.length > 0) {
            tallas[0].values.forEach(([codigo, nombre]) => {
                configData.tallas[codigo] = nombre;
            });
        }

        // Cargar colores
        const colores = db.exec("SELECT codigo, nombre FROM config_colores WHERE activo = 1 ORDER BY codigo");
        if (colores.length > 0) {
            colores[0].values.forEach(([codigo, nombre]) => {
                configData.colores[codigo] = nombre;
            });
        }

        // Cargar temporadas
        const temporadas = db.exec("SELECT codigo, nombre FROM config_temporadas WHERE activo = 1 ORDER BY codigo");
        if (temporadas.length > 0) {
            temporadas[0].values.forEach(([codigo, nombre]) => {
                configData.temporadas[codigo] = nombre;
            });
        }

    } catch (error) {
        console.error('Error cargando configuración:', error);
        configData = { ...initialConfigData }; // Fallback a configuración inicial
    }
}

// Actualizar selects del formulario
function updateFormSelects() {
    updateSelectOptions('tipo', configData.tipos);
    updateSelectOptions('categoria', configData.categorias);
    updateSelectOptions('talla', configData.tallas);
    updateSelectOptions('color', configData.colores);
    updateSelectOptions('temporada', configData.temporadas);
    
    // También actualizar selects del modal de edición
    updateSelectOptions('editTipo', configData.tipos);
    updateSelectOptions('editCategoria', configData.categorias);
    updateSelectOptions('editTalla', configData.tallas);
    updateSelectOptions('editColor', configData.colores);
    updateSelectOptions('editTemporada', configData.temporadas);
}

// Función auxiliar para actualizar opciones de select
function updateSelectOptions(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar...</option>';
    
    Object.entries(options).forEach(([codigo, nombre]) => {
        const option = document.createElement('option');
        option.value = codigo;
        option.textContent = `${codigo} - ${nombre}`;
        select.appendChild(option);
    });
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Actualizar configuración visual
function updateConfigDisplay() {
    try {
        // Tipos
        updateConfigSection('tiposConfig', configData.tipos, 'tipos');
        
        // Categorías
        updateConfigSection('categoriasConfig', configData.categorias, 'categorias');
        
        // Tallas
        updateConfigSection('tallasConfig', configData.tallas, 'tallas');
        
        // Colores
        updateConfigSection('coloresConfig', configData.colores, 'colores');
        
        // Temporadas
        updateConfigSection('temporadasConfig', configData.temporadas, 'temporadas');
        
        // Actualizar select de subcategorías
        loadSubcategoryManagement();
        
    } catch (error) {
        console.error('Error actualizando configuración visual:', error);
    }
}

// Función auxiliar para actualizar secciones de configuración
function updateConfigSection(containerId, data, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    Object.entries(data).forEach(([codigo, nombre]) => {
        container.innerHTML += `
            <div class="config-item-row">
                <span class="config-item-text">${codigo} - ${nombre}</span>
                <div class="config-item-actions">
                    <button class="btn btn-small btn-edit" onclick="editConfigItem('${type}', '${codigo}', '${nombre}')">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deleteConfigItem('${type}', '${codigo}')">🗑️</button>
                </div>
            </div>
        `;
    });
}

// Función de debugging para verificar elementos del DOM
function debugConfigElements() {
    const types = ['tipos', 'categorias', 'tallas', 'colores', 'temporadas'];
    types.forEach(type => {
        const inputMapping = {
            'tipos': { code: 'newTipoCode', name: 'newTipoName' },
            'categorias': { code: 'newCategoriaCode', name: 'newCategoriaName' },
            'tallas': { code: 'newTallaCode', name: 'newTallaName' },
            'colores': { code: 'newColorCode', name: 'newColorName' },
            'temporadas': { code: 'newTemporadaCode', name: 'newTemporadaName' }
        };
        
        const mapping = inputMapping[type];
        const codeElement = document.getElementById(mapping.code);
        const nameElement = document.getElementById(mapping.name);
        
        console.log(`${type}:`, {
            codeElement: codeElement ? 'Found' : 'NOT FOUND',
            nameElement: nameElement ? 'Found' : 'NOT FOUND',
            codeId: mapping.code,
            nameId: mapping.name
        });
    });
}

// Función mejorada con mejor manejo de errores
function addConfigItem(type) {
    try {
        console.log(`Intentando agregar elemento de tipo: ${type}`);
        
        // Mapeo correcto de IDs para cada tipo
        const inputMapping = {
            'tipos': { code: 'newTipoCode', name: 'newTipoName' },
            'categorias': { code: 'newCategoriaCode', name: 'newCategoriaName' },
            'tallas': { code: 'newTallaCode', name: 'newTallaName' },
            'colores': { code: 'newColorCode', name: 'newColorName' },
            'temporadas': { code: 'newTemporadaCode', name: 'newTemporadaName' }
        };

        const mapping = inputMapping[type];
        if (!mapping) {
            console.error(`Tipo de configuración no válido: ${type}`);
            showAlert('Tipo de configuración no válido', 'danger');
            return;
        }

        console.log(`Buscando elementos: ${mapping.code}, ${mapping.name}`);
        
        const codeInput = document.getElementById(mapping.code);
        const nameInput = document.getElementById(mapping.name);
        
        if (!codeInput) {
            console.error(`Elemento no encontrado: ${mapping.code}`);
            showAlert(`Error: campo de código no encontrado (${mapping.code})`, 'danger');
            // Ejecutar debug para mostrar qué elementos existen
            debugConfigElements();
            return;
        }
        
        if (!nameInput) {
            console.error(`Elemento no encontrado: ${mapping.name}`);
            showAlert(`Error: campo de nombre no encontrado (${mapping.name})`, 'danger');
            return;
        }

        console.log('Elementos encontrados correctamente');
        
        const codigo = codeInput.value.trim();
        const nombre = nameInput.value.trim();

        console.log(`Valores ingresados - Código: "${codigo}", Nombre: "${nombre}"`);

        if (!codigo || !nombre) {
            showAlert('Por favor, complete todos los campos', 'danger');
            return;
        }

        // Validaciones específicas por tipo
        if (!validateConfigInput(type, codigo, nombre)) {
            return;
        }

        if (!db) {
            showAlert('Base de datos no inicializada', 'danger');
            return;
        }

        let tableName = getTableName(type);
        if (!tableName) {
            showAlert('Tipo de configuración no válido', 'danger');
            return;
        }

        console.log(`Verificando si existe en tabla: ${tableName}`);

        // Verificar si ya existe
        const exists = db.exec(`SELECT codigo FROM ${tableName} WHERE codigo = ? AND activo = 1`, [codigo]);
        if (exists.length > 0 && exists[0].values.length > 0) {
            showAlert('El código ya existe', 'danger');
            return;
        }

        console.log('Insertando en base de datos...');

        // Insertar nuevo elemento
        db.run(`INSERT INTO ${tableName} (codigo, nombre) VALUES (?, ?)`, [codigo, nombre]);
        
        // Actualizar configuración local
        configData[type][codigo] = nombre;
        
        console.log('Guardando base de datos...');
        saveDatabase();
        
        console.log('Actualizando interfaz...');
        updateFormSelects();
        updateConfigDisplay();
        
        // Limpiar campos
        codeInput.value = '';
        nameInput.value = '';
        
        console.log('¡Elemento agregado exitosamente!');
        showAlert(`${getDisplayName(type)} agregado exitosamente`, 'success');

    } catch (error) {
        console.error('Error agregando elemento:', error);
        showAlert('Error al agregar elemento: ' + error.message, 'danger');
    }
}

// Función auxiliar para obtener nombre de visualización
function getDisplayName(type) {
    const names = {
        'tipos': 'Tipo',
        'categorias': 'Categoría',
        'tallas': 'Talla',
        'colores': 'Color',
        'temporadas': 'Temporada'
    };
    return names[type] || type;
}

// Validar entrada de configuración
function validateConfigInput(type, codigo, nombre) {
    // Validaciones específicas por tipo
    switch(type) {
        case 'tipos':
            if (codigo.length !== 1 || isNaN(codigo)) {
                showAlert('El código de tipo debe ser un solo dígito', 'danger');
                return false;
            }
            break;
        case 'categorias':
            if (codigo.length !== 2 || isNaN(codigo)) {
                showAlert('El código de categoría debe ser de 2 dígitos', 'danger');
                return false;
            }
            break;
        case 'tallas':
            if (codigo.length !== 1 || isNaN(codigo)) {
                showAlert('El código de talla debe ser un solo dígito', 'danger');
                return false;
            }
            break;
        case 'colores':
            if (codigo.length !== 2 || isNaN(codigo)) {
                showAlert('El código de color debe ser de 2 dígitos', 'danger');
                return false;
            }
            break;
        case 'temporadas':
            if (codigo.length !== 1 || isNaN(codigo)) {
                showAlert('El código de temporada debe ser un solo dígito', 'danger');
                return false;
            }
            break;
    }
    
    if (nombre.length < 3) {
        showAlert('El nombre debe tener al menos 3 caracteres', 'danger');
        return false;
    }
    
    return true;
}

// Obtener nombre de tabla
function getTableName(type) {
    switch(type) {
        case 'tipos': return 'config_tipos';
        case 'categorias': return 'config_categorias';
        case 'tallas': return 'config_tallas';
        case 'colores': return 'config_colores';
        case 'temporadas': return 'config_temporadas';
        default: return null;
    }
}

// Editar elemento de configuración
function editConfigItem(type, codigo, nombre) {
    const nuevoNombre = prompt(`Editar ${type}:\nCódigo: ${codigo}\nNuevo nombre:`, nombre);
    
    if (nuevoNombre === null) return; // Cancelado
    
    if (nuevoNombre.trim().length < 3) {
        showAlert('El nombre debe tener al menos 3 caracteres', 'danger');
        return;
    }

    try {
        const tableName = getTableName(type);
        if (!tableName) {
            showAlert('Tipo de configuración no válido', 'danger');
            return;
        }

        // Actualizar en la base de datos
        db.run(`UPDATE ${tableName} SET nombre = ? WHERE codigo = ?`, [nuevoNombre.trim(), codigo]);
        
        // Actualizar configuración local
        configData[type][codigo] = nuevoNombre.trim();
        
        saveDatabase();
        updateFormSelects();
        updateConfigDisplay();
        
        showAlert('Elemento actualizado exitosamente', 'success');

    } catch (error) {
        console.error('Error actualizando elemento:', error);
        showAlert('Error al actualizar elemento: ' + error.message, 'danger');
    }
}

// Eliminar elemento de configuración
function deleteConfigItem(type, codigo) {
    if (confirm('¿Está seguro de que desea eliminar este elemento?')) {
        try {
            if (!db) {
                showAlert('Base de datos no inicializada', 'danger');
                return;
            }

            let tableName = getTableName(type);
            let checkColumn = getCheckColumn(type);
            
            if (!tableName || !checkColumn) {
                showAlert('Tipo de configuración no válido', 'danger');
                return;
            }

            // Verificar si está en uso
            const inUse = db.exec(`SELECT COUNT(*) FROM productos WHERE ${checkColumn} = ? AND activo = 1`, [codigo]);
            if (inUse[0].values[0][0] > 0) {
                showAlert('No se puede eliminar: este elemento está siendo usado por productos existentes', 'danger');
                return;
            }

            // Eliminar elemento
            db.run(`UPDATE ${tableName} SET activo = 0 WHERE codigo = ?`, [codigo]);
            
            // Actualizar configuración local
            delete configData[type][codigo];
            
            saveDatabase();
            updateFormSelects();
            updateConfigDisplay();
            
            showAlert('Elemento eliminado exitosamente', 'success');

        } catch (error) {
            console.error('Error eliminando elemento:', error);
            showAlert('Error al eliminar elemento: ' + error.message, 'danger');
        }
    }
}

// Obtener columna de verificación
function getCheckColumn(type) {
    switch(type) {
        case 'tipos': return 'tipo';
        case 'categorias': return 'categoria';
        case 'tallas': return 'talla';
        case 'colores': return 'color';
        case 'temporadas': return 'temporada';
        default: return null;
    }
}

// GESTIÓN DE SUBCATEGORÍAS

// Cargar gestión de subcategorías
function loadSubcategoryManagement() {
    const select = document.getElementById('subcatCategorySelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar categoría...</option>';
    Object.entries(configData.categorias).forEach(([codigo, nombre]) => {
        const option = document.createElement('option');
        option.value = codigo;
        option.textContent = `${codigo} - ${nombre}`;
        select.appendChild(option);
    });
}

// Cargar subcategorías para una categoría
function loadSubcategoriesForCategory() {
    const categoriaSelect = document.getElementById('subcatCategorySelect');
    const managementDiv = document.getElementById('subcategoryManagement');
    const subList = document.getElementById('subcategoriesList');
    
    const categoria = categoriaSelect.value;
    
    if (!categoria) {
        managementDiv.style.display = 'none';
        return;
    }
    
    managementDiv.style.display = 'block';
    subList.innerHTML = '';
    
    if (configData.subcategorias[categoria]) {
        Object.entries(configData.subcategorias[categoria]).forEach(([codigo, nombre]) => {
            subList.innerHTML += `
                <div class="subcategory-item">
                    <span>${codigo} - ${nombre}</span>
                    <div>
                        <button class="btn btn-small btn-edit" onclick="editSubcategory('${categoria}', '${codigo}', '${nombre}')">✏️</button>
                        <button class="btn btn-small btn-danger" onclick="deleteSubcategory('${categoria}', '${codigo}')">🗑️</button>
                    </div>
                </div>
            `;
        });
    }
    
    if (subList.innerHTML === '') {
        subList.innerHTML = '<p>No hay subcategorías definidas para esta categoría.</p>';
    }
}

// Agregar subcategoría
function addSubcategory() {
    const categoria = document.getElementById('subcatCategorySelect').value;
    const codigo = document.getElementById('newSubcategoriaCode').value.trim();
    const nombre = document.getElementById('newSubcategoriaName').value.trim();
    
    if (!categoria) {
        showAlert('Seleccione una categoría primero', 'danger');
        return;
    }
    
    if (!codigo || !nombre) {
        showAlert('Complete todos los campos', 'danger');
        return;
    }
    
    if (codigo.length !== 1 || isNaN(codigo)) {
        showAlert('El código debe ser un solo dígito', 'danger');
        return;
    }
    
    if (nombre.length < 3) {
        showAlert('El nombre debe tener al menos 3 caracteres', 'danger');
        return;
    }
    
    try {
        // Verificar si ya existe
        const exists = db.exec(`SELECT id FROM config_subcategorias WHERE categoria_codigo = ? AND codigo = ? AND activo = 1`, [categoria, codigo]);
        if (exists.length > 0 && exists[0].values.length > 0) {
            showAlert('Ya existe una subcategoría con ese código para esta categoría', 'danger');
            return;
        }
        
        // Insertar nueva subcategoría
        db.run(`INSERT INTO config_subcategorias (categoria_codigo, codigo, nombre) VALUES (?, ?, ?)`, [categoria, codigo, nombre]);
        
        // Actualizar configuración local
        if (!configData.subcategorias[categoria]) {
            configData.subcategorias[categoria] = {};
        }
        configData.subcategorias[categoria][codigo] = nombre;
        
        saveDatabase();
        updateFormSelects();
        loadSubcategoriesForCategory();
        
        // Limpiar campos
        document.getElementById('newSubcategoriaCode').value = '';
        document.getElementById('newSubcategoriaName').value = '';
        
        showAlert('Subcategoría agregada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error agregando subcategoría:', error);
        showAlert('Error al agregar subcategoría: ' + error.message, 'danger');
    }
}

// Editar subcategoría
function editSubcategory(categoria, codigo, nombre) {
    const nuevoNombre = prompt(`Editar subcategoría:\nCategoría: ${configData.categorias[categoria]}\nCódigo: ${codigo}\nNuevo nombre:`, nombre);
    
    if (nuevoNombre === null) return; // Cancelado
    
    if (nuevoNombre.trim().length < 3) {
        showAlert('El nombre debe tener al menos 3 caracteres', 'danger');
        return;
    }

    try {
        // Actualizar en la base de datos
        db.run(`UPDATE config_subcategorias SET nombre = ? WHERE categoria_codigo = ? AND codigo = ?`, [nuevoNombre.trim(), categoria, codigo]);
        
        // Actualizar configuración local
        configData.subcategorias[categoria][codigo] = nuevoNombre.trim();
        
        saveDatabase();
        updateFormSelects();
        loadSubcategoriesForCategory();
        
        showAlert('Subcategoría actualizada exitosamente', 'success');

    } catch (error) {
        console.error('Error actualizando subcategoría:', error);
        showAlert('Error al actualizar subcategoría: ' + error.message, 'danger');
    }
}

// Eliminar subcategoría
function deleteSubcategory(categoria, codigo) {
    if (confirm('¿Está seguro de que desea eliminar esta subcategoría?')) {
        try {
            // Verificar si está en uso
            const inUse = db.exec(`SELECT COUNT(*) FROM productos WHERE categoria = ? AND subcategoria = ? AND activo = 1`, [categoria, codigo]);
            if (inUse[0].values[0][0] > 0) {
                showAlert('No se puede eliminar: esta subcategoría está siendo usada por productos existentes', 'danger');
                return;
            }

            // Eliminar subcategoría
            db.run(`UPDATE config_subcategorias SET activo = 0 WHERE categoria_codigo = ? AND codigo = ?`, [categoria, codigo]);
            
            // Actualizar configuración local
            if (configData.subcategorias[categoria]) {
                delete configData.subcategorias[categoria][codigo];
            }
            
            saveDatabase();
            updateFormSelects();
            loadSubcategoriesForCategory();
            
            showAlert('Subcategoría eliminada exitosamente', 'success');

        } catch (error) {
            console.error('Error eliminando subcategoría:', error);
            showAlert('Error al eliminar subcategoría: ' + error.message, 'danger');
        }
    }
}