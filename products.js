// Variables para gestión de productos
let currentEditingProductId = null;
let tempProduct = null;

// Actualizar subcategorías según la categoría seleccionada
function updateSubcategories() {
    const categoria = document.getElementById('categoria').value;
    const subcategoriaSelect = document.getElementById('subcategoria');
    
    subcategoriaSelect.innerHTML = '<option value="">Seleccionar...</option>';
    
    if (categoria && configData.subcategorias[categoria]) {
        Object.entries(configData.subcategorias[categoria]).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${key} - ${value}`;
            subcategoriaSelect.appendChild(option);
        });
    }
}

// Actualizar subcategorías en modal de edición
function updateEditSubcategories() {
    const categoria = document.getElementById('editCategoria').value;
    const subcategoriaSelect = document.getElementById('editSubcategoria');
    
    subcategoriaSelect.innerHTML = '<option value="">Seleccionar...</option>';
    
    if (categoria && configData.subcategorias[categoria]) {
        Object.entries(configData.subcategorias[categoria]).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${key} - ${value}`;
            subcategoriaSelect.appendChild(option);
        });
    }
}

// Generar código del producto - FUNCIÓN CORREGIDA
function generateCode() {
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const subcategoria = document.getElementById('subcategoria').value;
    const talla = document.getElementById('talla').value;
    const color = document.getElementById('color').value;
    const temporada = document.getElementById('temporada').value;

    if (!tipo || !categoria || !subcategoria || !talla || !color || !temporada) {
        showAlert('Por favor, complete todos los campos', 'danger');
        return;
    }

    try {
        // Verificar si existe un producto con las mismas características (sin consecutivo)
        const existingCheck = checkProductExists(tipo, categoria, subcategoria, talla, color, temporada);
        
        // Generar consecutivo único
        let consecutivo = getNextConsecutivo();
        let codigo = `${tipo}${categoria}${subcategoria}${talla}${color}${temporada}${consecutivo.toString().padStart(3, '0')}`;
        
        // Verificar si ya existe en la base de datos (por si acaso)
        let exists = db.exec("SELECT codigo FROM productos WHERE codigo = ?", [codigo]);
        while (exists.length > 0 && exists[0].values.length > 0) {
            consecutivo++;
            codigo = `${tipo}${categoria}${subcategoria}${talla}${color}${temporada}${consecutivo.toString().padStart(3, '0')}`;
            exists = db.exec("SELECT codigo FROM productos WHERE codigo = ?", [codigo]);
        }

        // Generar nombre del producto
        const nombre = generateProductName(tipo, categoria, subcategoria, talla, color, temporada);

        // Mostrar resultado
        document.getElementById('generatedCode').textContent = codigo;
        document.getElementById('generatedName').textContent = nombre;
        document.getElementById('resultSection').style.display = 'block';
        
        // Guardar temporalmente
        tempProduct = {
            codigo: codigo,
            nombre: nombre,
            tipo: tipo,
            categoria: categoria,
            subcategoria: subcategoria,
            talla: talla,
            color: color,
            temporada: temporada,
            consecutivo: consecutivo,
            hasExistingProducts: existingCheck.exists,
            existingProducts: existingCheck.products
        };

        // Si hay productos similares, mostrar advertencia
        if (existingCheck.exists) {
            showAlert(`⚠️ Atención: Ya existen ${existingCheck.products.length} producto(s) con estas mismas características. Revise antes de guardar.`, 'warning');
        }

    } catch (error) {
        console.error('Error generando código:', error);
        showAlert('Error al generar el código: ' + error.message, 'danger');
    }
}

// Generar nombre del producto
function generateProductName(tipo, categoria, subcategoria, talla, color, temporada) {
    const tipoNombre = configData.tipos[tipo] || 'Producto';
    const categoriaNombre = configData.categorias[categoria] || 'Categoría';
    const subcategoriaNombre = configData.subcategorias[categoria] ? 
        (configData.subcategorias[categoria][subcategoria] || 'Subcategoría') : 'Subcategoría';
    const tallaNombre = configData.tallas[talla] || 'Talla';
    const colorNombre = configData.colores[color] || 'Color';
    const temporadaNombre = configData.temporadas[temporada] || 'Temporada';

    return `${tipoNombre} - ${subcategoriaNombre} ${colorNombre} ${tallaNombre} (${temporadaNombre})`;
}

// Guardar producto - FUNCIÓN CORREGIDA CON VALIDACIÓN
function saveProduct() {
    if (!tempProduct) {
        showAlert('No hay producto generado para guardar', 'danger');
        return;
    }

    // Si hay productos similares, mostrar modal de confirmación
    if (tempProduct.hasExistingProducts) {
        showDuplicateConfirmation();
        return;
    }

    // Si no hay duplicados, guardar directamente
    performSaveProduct();
}

// Mostrar modal de confirmación para productos duplicados
function showDuplicateConfirmation() {
    const modal = document.getElementById('duplicateModal');
    const duplicateInfo = document.getElementById('duplicateProductInfo');
    const newProductInfo = document.getElementById('newProductInfo');

    // Mostrar información de productos existentes
    let duplicateHTML = '<div class="duplicate-product-info"><h5>Productos existentes:</h5>';
    tempProduct.existingProducts.forEach(product => {
        duplicateHTML += `<div class="duplicate-product-details">• Código: ${product.codigo} - ${product.nombre}</div>`;
    });
    duplicateHTML += '</div>';
    duplicateInfo.innerHTML = duplicateHTML;

    // Mostrar información del nuevo producto
    newProductInfo.innerHTML = `
        <div class="new-product-info">
            <div class="new-product-details">• Código: ${tempProduct.codigo}</div>
            <div class="new-product-details">• Nombre: ${tempProduct.nombre}</div>
        </div>
    `;

    modal.style.display = 'block';
}

// Cerrar modal de duplicados
function closeDuplicateModal() {
    document.getElementById('duplicateModal').style.display = 'none';
}

// Confirmar guardado del producto
function confirmSaveProduct() {
    closeDuplicateModal();
    performSaveProduct();
}

// Realizar el guardado del producto
function performSaveProduct() {
    try {
        // Verificar duplicados una vez más por seguridad
        const exists = db.exec("SELECT codigo FROM productos WHERE codigo = ?", [tempProduct.codigo]);
        if (exists.length > 0 && exists[0].values.length > 0) {
            showAlert('El código ya existe en la base de datos', 'danger');
            return;
        }

        // Insertar producto en la base de datos
        db.run(`INSERT INTO productos 
               (codigo, nombre, tipo, categoria, subcategoria, talla, color, temporada, consecutivo) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
               [tempProduct.codigo, tempProduct.nombre, tempProduct.tipo,
                tempProduct.categoria, tempProduct.subcategoria, tempProduct.talla,
                tempProduct.color, tempProduct.temporada, tempProduct.consecutivo]);

        // Guardar base de datos
        saveDatabase();
        
        showAlert('Producto guardado exitosamente', 'success');
        
        // Limpiar formulario
        generateNewCode();
        
        // Limpiar producto temporal
        tempProduct = null;

        // Actualizar vista de productos si está activa
        if (document.getElementById('products').classList.contains('active')) {
            displayProducts();
        }

        // Actualizar estadísticas
        updateStats();

    } catch (error) {
        console.error('Error guardando producto:', error);
        showAlert('Error al guardar el producto: ' + error.message, 'danger');
    }
}

// Generar nuevo código
function generateNewCode() {
    document.getElementById('tipo').value = '';
    document.getElementById('categoria').value = '';
    document.getElementById('subcategoria').value = '';
    document.getElementById('talla').value = '';
    document.getElementById('color').value = '';
    document.getElementById('temporada').value = '';
    document.getElementById('resultSection').style.display = 'none';
    updateSubcategories();
}

// Mostrar productos
function displayProducts(searchTerm = '') {
    try {
        let query = `SELECT * FROM productos WHERE activo = 1`;
        let params = [];

        if (searchTerm) {
            query += ` AND (codigo LIKE ? OR nombre LIKE ? OR categoria LIKE ? OR color LIKE ?)`;
            const searchPattern = `%${searchTerm}%`;
            params = [searchPattern, searchPattern, searchPattern, searchPattern];
        }

        query += ` ORDER BY fecha_creacion DESC`;

        const result = db.exec(query, params);
        const container = document.getElementById('productsContainer');

        if (result.length === 0 || result[0].values.length === 0) {
            container.innerHTML = '<p>No se encontraron productos.</p>';
            return;
        }

        let html = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Categoría</th>
                        <th>Talla</th>
                        <th>Color</th>
                        <th>Temporada</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        result[0].values.forEach(row => {
            const [id, codigo, nombre, tipo, categoria, subcategoria, talla, color, temporada, consecutivo, fecha, fechaMod, activo] = row;
            const fechaFormateada = new Date(fecha).toLocaleDateString();
            
            html += `
                <tr>
                    <td><strong>${codigo}</strong></td>
                    <td>${nombre}</td>
                    <td>${configData.tipos[tipo] || tipo}</td>
                    <td>${configData.categorias[categoria] || categoria}</td>
                    <td>${configData.tallas[talla] || talla}</td>
                    <td>${configData.colores[color] || color}</td>
                    <td>${configData.temporadas[temporada] || temporada}</td>
                    <td>${fechaFormateada}</td>
                    <td>
                        <button class="btn btn-small btn-edit" onclick="editProduct(${id})">✏️ Editar</button>
                        <button class="btn btn-small btn-danger" onclick="deleteProduct(${id})">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error mostrando productos:', error);
        document.getElementById('productsContainer').innerHTML = '<p>Error al cargar productos.</p>';
    }
}

// Buscar productos
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    displayProducts(searchTerm);
}

// Limpiar búsqueda
function clearSearch() {
    document.getElementById('searchInput').value = '';
    displayProducts();
}

// Eliminar producto
function deleteProduct(id) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        try {
            db.run("UPDATE productos SET activo = 0 WHERE id = ?", [id]);
            saveDatabase();
            displayProducts();
            updateStats();
            showAlert('Producto eliminado exitosamente', 'success');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            showAlert('Error al eliminar el producto: ' + error.message, 'danger');
        }
    }
}

// Editar producto
function editProduct(id) {
    try {
        const result = db.exec("SELECT * FROM productos WHERE id = ? AND activo = 1", [id]);
        if (result.length === 0 || result[0].values.length === 0) {
            showAlert('Producto no encontrado', 'danger');
            return;
        }

        const [productId, codigo, nombre, tipo, categoria, subcategoria, talla, color, temporada, consecutivo, fecha, fechaMod, activo] = result[0].values[0];
        
        // Llenar el modal con los datos del producto
        document.getElementById('editTipo').value = tipo;
        document.getElementById('editCategoria').value = categoria;
        document.getElementById('editTalla').value = talla;
        document.getElementById('editColor').value = color;
        document.getElementById('editTemporada').value = temporada;
        document.getElementById('editNombre').value = nombre;
        
        // Actualizar subcategorías y seleccionar la correcta
        updateEditSubcategories();
        setTimeout(() => {
            document.getElementById('editSubcategoria').value = subcategoria;
        }, 100);
        
        currentEditingProductId = id;
        document.getElementById('editModal').style.display = 'block';

    } catch (error) {
        console.error('Error cargando producto para editar:', error);
        showAlert('Error al cargar el producto: ' + error.message, 'danger');
    }
}

// Cerrar modal de edición
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingProductId = null;
}

// Actualizar producto editado
function updateProduct() {
    if (!currentEditingProductId) {
        showAlert('No hay producto seleccionado para editar', 'danger');
        return;
    }

    const tipo = document.getElementById('editTipo').value;
    const categoria = document.getElementById('editCategoria').value;
    const subcategoria = document.getElementById('editSubcategoria').value;
    const talla = document.getElementById('editTalla').value;
    const color = document.getElementById('editColor').value;
    const temporada = document.getElementById('editTemporada').value;

    if (!tipo || !categoria || !subcategoria || !talla || !color || !temporada) {
        showAlert('Por favor, complete todos los campos', 'danger');
        return;
    }

    try {
        // Generar nuevo código
        let consecutivo = getNextConsecutivo();
        let nuevoCodigo = `${tipo}${categoria}${subcategoria}${talla}${color}${temporada}${consecutivo.toString().padStart(3, '0')}`;
        
        // Verificar si el nuevo código ya existe (excluyendo el producto actual)
        let exists = db.exec("SELECT codigo FROM productos WHERE codigo = ? AND id != ?", [nuevoCodigo, currentEditingProductId]);
        while (exists.length > 0 && exists[0].values.length > 0) {
            consecutivo++;
            nuevoCodigo = `${tipo}${categoria}${subcategoria}${talla}${color}${temporada}${consecutivo.toString().padStart(3, '0')}`;
            exists = db.exec("SELECT codigo FROM productos WHERE codigo = ? AND id != ?", [nuevoCodigo, currentEditingProductId]);
        }

        // Generar nuevo nombre
        const nuevoNombre = generateProductName(tipo, categoria, subcategoria, talla, color, temporada);

        // Actualizar producto en la base de datos
        db.run(`UPDATE productos SET 
               codigo = ?, nombre = ?, tipo = ?, categoria = ?, subcategoria = ?, 
               talla = ?, color = ?, temporada = ?, consecutivo = ?
               WHERE id = ?`, 
               [nuevoCodigo, nuevoNombre, tipo, categoria, subcategoria, 
                talla, color, temporada, consecutivo, currentEditingProductId]);

        saveDatabase();
        closeEditModal();
        displayProducts();
        updateStats();
        
        showAlert('Producto actualizado exitosamente', 'success');

    } catch (error) {
        console.error('Error actualizando producto:', error);
        showAlert('Error al actualizar el producto: ' + error.message, 'danger');
    }
}

// Exportar a CSV
function exportToCSV() {
    try {
        const result = db.exec("SELECT * FROM productos WHERE activo = 1 ORDER BY codigo");
        if (result.length === 0) {
            showAlert('No hay productos para exportar', 'info');
            return;
        }

        let csv = 'ID,Código,Nombre,Tipo,Categoría,Subcategoría,Talla,Color,Temporada,Consecutivo,Fecha Creación,Fecha Modificación\n';
        
        result[0].values.forEach(row => {
            csv += row.map(field => `"${field}"`).join(',') + '\n';
        });

        downloadFile(csv, 'productos.csv', 'text/csv');
        showAlert('Archivo CSV exportado exitosamente', 'success');

    } catch (error) {
        console.error('Error exportando CSV:', error);
        showAlert('Error al exportar CSV: ' + error.message, 'danger');
    }
}

// Exportar a JSON
function exportToJSON() {
    try {
        const result = db.exec("SELECT * FROM productos WHERE activo = 1 ORDER BY codigo");
        if (result.length === 0) {
            showAlert('No hay productos para exportar', 'info');
            return;
        }

        const products = result[0].values.map(row => {
            const [id, codigo, nombre, tipo, categoria, subcategoria, talla, color, temporada, consecutivo, fecha, fechaMod, activo] = row;
            return {
                id, codigo, nombre, tipo, categoria, subcategoria, 
                talla, color, temporada, consecutivo, 
                fecha_creacion: fecha, fecha_modificacion: fechaMod
            };
        });

        const json = JSON.stringify(products, null, 2);
        downloadFile(json, 'productos.json', 'application/json');
        showAlert('Archivo JSON exportado exitosamente', 'success');

    } catch (error) {
        console.error('Error exportando JSON:', error);
        showAlert('Error al exportar JSON: ' + error.message, 'danger');
    }
}

// Función auxiliar para descargar archivos
function downloadFile(content, fileName, contentType) {
    try {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error descargando archivo:', error);
        showAlert('Error al descargar archivo: ' + error.message, 'danger');
    }
}