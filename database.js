// Variables globales de base de datos
let db = null;
let SQL = null;

// Datos de configuración inicial
const initialConfigData = {
    tipos: {
        '1': 'Producto Simple',
        '2': 'Producto Compuesto',
        '3': 'Set/Conjunto',
        '4': 'Producto Promocional',
        '5': 'Producto de Temporada'
    },
    categorias: {
        '10': 'Ropa Superior',
        '20': 'Ropa Inferior',
        '30': 'Vestidos y Enterizos',
        '40': 'Ropa Interior y Pijamas',
        '50': 'Calzado',
        '60': 'Accesorios para Cabello',
        '70': 'Bolsos y Mochilas',
        '80': 'Joyería Infantil',
        '90': 'Ropa de Ocasión'
    },
    subcategorias: {
        '10': { '1': 'Camisetas básicas', '2': 'Blusas elegantes', '3': 'Suéteres/Chompas', '4': 'Chaquetas ligeras', '5': 'Abrigos', '6': 'Tops deportivos' },
        '20': { '1': 'Pantalones', '2': 'Jeans', '3': 'Shorts', '4': 'Faldas', '5': 'Leggins' },
        '30': { '1': 'Vestidos casuales', '2': 'Vestidos elegantes', '3': 'Enterizos', '4': 'Jumpers' },
        '40': { '1': 'Ropa interior', '2': 'Pijamas', '3': 'Camisones', '4': 'Medias/Calcetines' },
        '50': { '1': 'Zapatos escolares', '2': 'Zapatillas deportivas', '3': 'Sandalias', '4': 'Botas', '5': 'Zapatos de vestir' },
        '60': { '1': 'Diademas', '2': 'Moños', '3': 'Clips', '4': 'Cintas' },
        '70': { '1': 'Mochilas escolares', '2': 'Bolsos pequeños', '3': 'Carteras', '4': 'Loncheras' },
        '80': { '1': 'Collares', '2': 'Pulseras', '3': 'Anillos', '4': 'Aretes' },
        '90': { '1': 'Vestidos de fiesta', '2': 'Trajes elegantes', '3': 'Disfraces', '4': 'Ropa ceremonial' }
    },
    tallas: {
        '0': 'Talla única',
        '1': '2-4 años',
        '2': '4-6 años',
        '3': '6-8 años',
        '4': '8-10 años',
        '5': '10-12 años',
        '6': '12-14 años',
        '7': '14-16 años'
    },
    colores: {
        '01': 'Blanco', '02': 'Negro', '03': 'Rosa', '04': 'Azul', '05': 'Rojo',
        '06': 'Amarillo', '07': 'Verde', '08': 'Morado', '09': 'Naranja', '10': 'Gris',
        '11': 'Multicolor', '12': 'Estampado floral', '13': 'Estampado animal', 
        '14': 'Estampado geométrico', '15': 'Dorado/Plateado'
    },
    temporadas: {
        '1': 'Primavera-Verano', '2': 'Otoño-Invierno', '3': 'Colección Especial',
        '4': 'Todo el año', '5': 'Navidad', '6': 'Regreso a clases',
        '7': 'Día de la madre', '8': 'Halloween', '9': 'Liquidación'
    }
};

// Inicializar base de datos SQLite
async function initDatabase() {
    try {
        updateDBStatus('Inicializando SQLite...', false);
        
        // Inicializar SQL.js
        SQL = await window.initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // Verificar si hay una base de datos guardada
        const savedDB = localStorage.getItem('productosDB');
        if (savedDB) {
            try {
                const uint8Array = new Uint8Array(JSON.parse(savedDB));
                db = new SQL.Database(uint8Array);
                updateDBStatus('Base de datos cargada desde almacenamiento local', true);
            } catch (error) {
                console.warn('Error cargando BD guardada, creando nueva:', error);
                db = new SQL.Database();
                await createTables();
                await insertInitialConfig();
                updateDBStatus('Nueva base de datos creada', true);
            }
        } else {
            // Crear nueva base de datos
            db = new SQL.Database();
            await createTables();
            await insertInitialConfig();
            updateDBStatus('Nueva base de datos creada', true);
        }

        console.log('Base de datos SQLite inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando base de datos:', error);
        updateDBStatus('Error al inicializar base de datos', false);
        showAlert('Error al inicializar la base de datos: ' + error.message, 'danger');
    }
}

// Crear tablas de la base de datos
async function createTables() {
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            categoria TEXT NOT NULL,
            subcategoria TEXT NOT NULL,
            talla TEXT NOT NULL,
            color TEXT NOT NULL,
            temporada TEXT NOT NULL,
            consecutivo INTEGER NOT NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS config_tipos (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS config_categorias (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS config_subcategorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria_codigo TEXT NOT NULL,
            codigo TEXT NOT NULL,
            nombre TEXT NOT NULL,
            activo INTEGER DEFAULT 1,
            FOREIGN KEY (categoria_codigo) REFERENCES config_categorias (codigo)
        );

        CREATE TABLE IF NOT EXISTS config_tallas (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS config_colores (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS config_temporadas (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            activo INTEGER DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
        CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
        CREATE INDEX IF NOT EXISTS idx_productos_fecha ON productos(fecha_creacion);
        
        CREATE TRIGGER IF NOT EXISTS update_fecha_modificacion 
        AFTER UPDATE ON productos
        BEGIN
            UPDATE productos SET fecha_modificacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
    `;

    db.exec(createTablesSQL);
}

// Insertar configuración inicial
async function insertInitialConfig() {
    try {
        // Insertar tipos
        Object.entries(initialConfigData.tipos).forEach(([codigo, nombre]) => {
            db.run("INSERT OR REPLACE INTO config_tipos (codigo, nombre) VALUES (?, ?)", [codigo, nombre]);
        });

        // Insertar categorías
        Object.entries(initialConfigData.categorias).forEach(([codigo, nombre]) => {
            db.run("INSERT OR REPLACE INTO config_categorias (codigo, nombre) VALUES (?, ?)", [codigo, nombre]);
        });

        // Insertar subcategorías
        Object.entries(initialConfigData.subcategorias).forEach(([categoria, subs]) => {
            Object.entries(subs).forEach(([codigo, nombre]) => {
                db.run("INSERT OR REPLACE INTO config_subcategorias (categoria_codigo, codigo, nombre) VALUES (?, ?, ?)", 
                       [categoria, codigo, nombre]);
            });
        });

        // Insertar tallas
        Object.entries(initialConfigData.tallas).forEach(([codigo, nombre]) => {
            db.run("INSERT OR REPLACE INTO config_tallas (codigo, nombre) VALUES (?, ?)", [codigo, nombre]);
        });

        // Insertar colores
        Object.entries(initialConfigData.colores).forEach(([codigo, nombre]) => {
            db.run("INSERT OR REPLACE INTO config_colores (codigo, nombre) VALUES (?, ?)", [codigo, nombre]);
        });

        // Insertar temporadas
        Object.entries(initialConfigData.temporadas).forEach(([codigo, nombre]) => {
            db.run("INSERT OR REPLACE INTO config_temporadas (codigo, nombre) VALUES (?, ?)", [codigo, nombre]);
        });

        saveDatabase();
    } catch (error) {
        console.error('Error insertando configuración inicial:', error);
    }
}

// Guardar base de datos en localStorage
function saveDatabase() {
    try {
        if (db) {
            const data = db.export();
            const dataString = JSON.stringify(Array.from(data));
            localStorage.setItem('productosDB', dataString);
        }
    } catch (error) {
        console.error('Error guardando base de datos:', error);
    }
}

// Actualizar estado de la base de datos
function updateDBStatus(message, isConnected) {
    const statusText = document.getElementById('dbStatusText');
    const indicator = document.querySelector('.status-indicator');
    
    if (statusText) {
        statusText.textContent = message;
    }
    if (indicator) {
        indicator.style.background = isConnected ? '#4CAF50' : '#f44336';
    }
}

// Obtener siguiente consecutivo
function getNextConsecutivo() {
    try {
        const result = db.exec("SELECT MAX(consecutivo) as max_consecutivo FROM productos");
        if (result.length > 0 && result[0].values.length > 0 && result[0].values[0][0] !== null) {
            return result[0].values[0][0] + 1;
        }
        return 1;
    } catch (error) {
        console.error('Error obteniendo consecutivo:', error);
        return 1;
    }
}

// Verificar si existe un producto con las mismas características (sin consecutivo)
function checkProductExists(tipo, categoria, subcategoria, talla, color, temporada) {
    try {
        const result = db.exec(`
            SELECT id, codigo, nombre 
            FROM productos 
            WHERE tipo = ? AND categoria = ? AND subcategoria = ? 
            AND talla = ? AND color = ? AND temporada = ? 
            AND activo = 1
        `, [tipo, categoria, subcategoria, talla, color, temporada]);
        
        if (result.length > 0 && result[0].values.length > 0) {
            return {
                exists: true,
                products: result[0].values.map(row => ({
                    id: row[0],
                    codigo: row[1],
                    nombre: row[2]
                }))
            };
        }
        return { exists: false, products: [] };
    } catch (error) {
        console.error('Error verificando producto existente:', error);
        return { exists: false, products: [] };
    }
}

// Mostrar información de la base de datos
function showDatabaseInfo() {
    try {
        const dbInfo = document.getElementById('dbInfo');
        
        if (!db) {
            dbInfo.innerHTML = '<p>Base de datos no inicializada.</p>';
            return;
        }
        
        // Obtener información de las tablas
        const tablesInfo = db.exec(`
            SELECT name, sql FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        let html = '<h5>📋 Estructura de Tablas</h5>';
        
        if (tablesInfo.length > 0) {
            tablesInfo[0].values.forEach(([tableName, sql]) => {
                // Obtener conteo de registros
                const countResult = db.exec(`SELECT COUNT(*) FROM ${tableName}`);
                const count = countResult[0].values[0][0];
                
                html += `
                    <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                        <strong>${tableName}</strong> - ${count} registros
                    </div>
                `;
            });
        } else {
            html += '<p>No se encontraron tablas.</p>';
        }

        // Información del tamaño de la base de datos
        const dbSize = localStorage.getItem('productosDB');
        const sizeKB = dbSize ? Math.round(dbSize.length / 1024) : 0;
        
        html += `
            <h5>💾 Información de Almacenamiento</h5>
            <p><strong>Tamaño:</strong> ${sizeKB} KB</p>
            <p><strong>Ubicación:</strong> Almacenamiento local del navegador</p>
            <p><strong>Última actualización:</strong> ${new Date().toLocaleString()}</p>
        `;

        dbInfo.innerHTML = html;

    } catch (error) {
        console.error('Error mostrando información de BD:', error);
        const dbInfo = document.getElementById('dbInfo');
        if (dbInfo) {
            dbInfo.innerHTML = '<p>Error al obtener información de la base de datos.</p>';
        }
    }
}

// Ejecutar consulta SQL personalizada
function executeSQLQuery() {
    const query = document.getElementById('sqlQuery').value.trim();
    if (!query) {
        showAlert('Por favor, ingrese una consulta SQL', 'danger');
        return;
    }

    if (!db) {
        showAlert('Base de datos no inicializada', 'danger');
        return;
    }

    try {
        const result = db.exec(query);
        const resultDiv = document.getElementById('sqlResult');

        if (result.length === 0) {
            resultDiv.innerHTML = '<div class="alert alert-info">Consulta ejecutada exitosamente. No se devolvieron datos.</div>';
            return;
        }

        // Mostrar resultados en tabla
        let html = `
            <div class="config-section">
                <h4>📊 Resultado de la Consulta</h4>
                <table class="products-table">
                    <thead>
                        <tr>
        `;

        // Headers
        result[0].columns.forEach(column => {
            html += `<th>${column}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Datos
        result[0].values.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell !== null ? cell : 'NULL'}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        resultDiv.innerHTML = html;

        showAlert('Consulta ejecutada exitosamente', 'success');

    } catch (error) {
        console.error('Error ejecutando consulta:', error);
        document.getElementById('sqlResult').innerHTML = `
            <div class="alert alert-danger">
                <strong>Error en la consulta:</strong><br>
                ${error.message}
            </div>
        `;
    }
}

// Limpiar resultado SQL
function clearSQLResult() {
    document.getElementById('sqlResult').innerHTML = '';
    document.getElementById('sqlQuery').value = '';
}

// Crear respaldo de la base de datos
function backupDatabase() {
    try {
        if (!db) {
            showAlert('Base de datos no inicializada', 'danger');
            return;
        }

        const data = db.export();
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `productos_backup_${new Date().toISOString().split('T')[0]}.db`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showAlert('Respaldo creado exitosamente', 'success');
    } catch (error) {
        console.error('Error creando respaldo:', error);
        showAlert('Error al crear respaldo: ' + error.message, 'danger');
    }
}

// Restaurar base de datos desde archivo
function restoreDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let data;
            
            if (file.name.endsWith('.json')) {
                // Restaurar desde JSON
                const jsonData = JSON.parse(e.target.result);
                
                if (!db) {
                    showAlert('Base de datos no inicializada', 'danger');
                    return;
                }
                
                // Limpiar base de datos actual
                db.run("DELETE FROM productos");
                
                // Insertar datos desde JSON
                jsonData.forEach(producto => {
                    db.run(`INSERT INTO productos 
                           (codigo, nombre, tipo, categoria, subcategoria, talla, color, temporada, consecutivo) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                           [producto.codigo, producto.nombre, producto.tipo, producto.categoria,
                            producto.subcategoria, producto.talla, producto.color, 
                            producto.temporada, producto.consecutivo]);
                });
                
            } else {
                // Restaurar desde archivo .db
                data = new Uint8Array(e.target.result);
                db = new SQL.Database(data);
            }

            saveDatabase();
            await loadConfigFromDB();
            updateFormSelects();
            displayProducts();
            updateStats();
            
            showAlert('Base de datos restaurada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error restaurando base de datos:', error);
            showAlert('Error al restaurar base de datos: ' + error.message, 'danger');
        }
    };

    if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// Limpiar todos los datos
function clearAllData() {
    if (confirm('¿Está seguro de que desea eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
        if (confirm('Esta acción eliminará todos los productos y configuraciones. ¿Continuar?')) {
            try {
                if (!db) {
                    showAlert('Base de datos no inicializada', 'danger');
                    return;
                }

                // Limpiar todas las tablas
                db.run("DELETE FROM productos");
                db.run("DELETE FROM config_tipos");
                db.run("DELETE FROM config_categorias");
                db.run("DELETE FROM config_subcategorias");
                db.run("DELETE FROM config_tallas");
                db.run("DELETE FROM config_colores");
                db.run("DELETE FROM config_temporadas");

                // Reinsertar configuración inicial
                insertInitialConfig();
                
                // Recargar todo
                loadConfigFromDB();
                updateFormSelects();
                displayProducts();
                updateStats();
                updateConfigDisplay();

                showAlert('Todos los datos han sido eliminados y la configuración inicial restaurada', 'success');

            } catch (error) {
                console.error('Error limpiando datos:', error);
                showAlert('Error al limpiar datos: ' + error.message, 'danger');
            }
        }
    }
}

// Cargar datos de prueba
function loadSampleData() {
    if (confirm('¿Desea cargar productos de prueba? Esto agregará varios productos de ejemplo.')) {
        try {
            if (!db) {
                showAlert('Base de datos no inicializada', 'danger');
                return;
            }

            const sampleProducts = [
                { tipo: '1', categoria: '10', subcategoria: '1', talla: '2', color: '03', temporada: '4' },
                { tipo: '1', categoria: '20', subcategoria: '2', talla: '3', color: '04', temporada: '1' },
                { tipo: '3', categoria: '30', subcategoria: '1', talla: '4', color: '05', temporada: '2' },
                { tipo: '1', categoria: '50', subcategoria: '2', talla: '2', color: '02', temporada: '6' },
                { tipo: '2', categoria: '60', subcategoria: '1', talla: '0', color: '03', temporada: '4' },
                { tipo: '1', categoria: '40', subcategoria: '2', talla: '3', color: '11', temporada: '4' },
                { tipo: '3', categoria: '90', subcategoria: '1', talla: '5', color: '15', temporada: '5' },
                { tipo: '1', categoria: '70', subcategoria: '1', talla: '0', color: '07', temporada: '6' }
            ];

            sampleProducts.forEach(producto => {
                // Generar código para cada producto
                let consecutivo = getNextConsecutivo();
                let codigo = `${producto.tipo}${producto.categoria}${producto.subcategoria}${producto.talla}${producto.color}${producto.temporada}${consecutivo.toString().padStart(3, '0')}`;
                
                // Verificar si ya existe
                let exists = db.exec("SELECT codigo FROM productos WHERE codigo = ?", [codigo]);
                while (exists.length > 0 && exists[0].values.length > 0) {
                    consecutivo++;
                    codigo = `${producto.tipo}${producto.categoria}${producto.subcategoria}${producto.talla}${producto.color}${producto.temporada}${consecutivo.toString().padStart(3, '0')}`;
                    exists = db.exec("SELECT codigo FROM productos WHERE codigo = ?", [codigo]);
                }

                const nombre = generateProductName(producto.tipo, producto.categoria, producto.subcategoria, producto.talla, producto.color, producto.temporada);

                db.run(`INSERT INTO productos 
                       (codigo, nombre, tipo, categoria, subcategoria, talla, color, temporada, consecutivo) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                       [codigo, nombre, producto.tipo, producto.categoria, producto.subcategoria, 
                        producto.talla, producto.color, producto.temporada, consecutivo]);
            });

            saveDatabase();
            displayProducts();
            updateStats();

            showAlert('Datos de prueba cargados exitosamente', 'success');

        } catch (error) {
            console.error('Error cargando datos de prueba:', error);
            showAlert('Error al cargar datos de prueba: ' + error.message, 'danger');
        }
    }
}