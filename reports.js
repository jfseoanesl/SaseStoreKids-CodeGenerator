// Actualizar estadísticas
function updateStats() {
    try {
        if (!db) return;

        // Total productos
        const totalResult = db.exec("SELECT COUNT(*) as total FROM productos WHERE activo = 1");
        const total = totalResult[0].values[0][0];
        document.getElementById('totalProducts').textContent = total;

        // Total categorías únicas
        const categoriesResult = db.exec("SELECT COUNT(DISTINCT categoria) as total FROM productos WHERE activo = 1");
        const totalCategories = categoriesResult[0].values[0][0];
        document.getElementById('totalCategories').textContent = totalCategories;

        // Total colores únicos
        const colorsResult = db.exec("SELECT COUNT(DISTINCT color) as total FROM productos WHERE activo = 1");
        const totalColors = colorsResult[0].values[0][0];
        document.getElementById('totalColors').textContent = totalColors;

        // Último código
        const lastCodeResult = db.exec("SELECT codigo FROM productos WHERE activo = 1 ORDER BY fecha_creacion DESC LIMIT 1");
        const lastCode = lastCodeResult.length > 0 && lastCodeResult[0].values.length > 0 ? 
            lastCodeResult[0].values[0][0] : '-';
        document.getElementById('lastCode').textContent = lastCode;

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// Generar reporte por categorías
function generateCategoryReport() {
    try {
        const result = db.exec(`
            SELECT categoria, COUNT(*) as cantidad 
            FROM productos 
            WHERE activo = 1 
            GROUP BY categoria 
            ORDER BY cantidad DESC
        `);

        if (result.length === 0) {
            showAlert('No hay datos para el reporte', 'info');
            return;
        }

        let html = `
            <div class="config-section">
                <h4>📊 Reporte por Categorías</h4>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Nombre</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const total = result[0].values.reduce((sum, row) => sum + row[1], 0);

        result[0].values.forEach(([categoria, cantidad]) => {
            const porcentaje = ((cantidad / total) * 100).toFixed(1);
            const nombreCategoria = configData.categorias[categoria] || categoria;
            
            html += `
                <tr>
                    <td>${categoria}</td>
                    <td>${nombreCategoria}</td>
                    <td>${cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        document.getElementById('reportResults').innerHTML = html;

    } catch (error) {
        console.error('Error generando reporte:', error);
        showAlert('Error al generar reporte: ' + error.message, 'danger');
    }
}

// Generar reporte por colores
function generateColorReport() {
    try {
        const result = db.exec(`
            SELECT color, COUNT(*) as cantidad 
            FROM productos 
            WHERE activo = 1 
            GROUP BY color 
            ORDER BY cantidad DESC
        `);

        if (result.length === 0) {
            showAlert('No hay datos para el reporte', 'info');
            return;
        }

        let html = `
            <div class="config-section">
                <h4>🎨 Reporte por Colores</h4>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Código Color</th>
                            <th>Nombre</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const total = result[0].values.reduce((sum, row) => sum + row[1], 0);

        result[0].values.forEach(([color, cantidad]) => {
            const porcentaje = ((cantidad / total) * 100).toFixed(1);
            const nombreColor = configData.colores[color] || color;
            
            html += `
                <tr>
                    <td>${color}</td>
                    <td>${nombreColor}</td>
                    <td>${cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        document.getElementById('reportResults').innerHTML = html;

    } catch (error) {
        console.error('Error generando reporte:', error);
        showAlert('Error al generar reporte: ' + error.message, 'danger');
    }
}

// Generar reporte por tallas
function generateSizeReport() {
    try {
        const result = db.exec(`
            SELECT talla, COUNT(*) as cantidad 
            FROM productos 
            WHERE activo = 1 
            GROUP BY talla 
            ORDER BY talla
        `);

        if (result.length === 0) {
            showAlert('No hay datos para el reporte', 'info');
            return;
        }

        let html = `
            <div class="config-section">
                <h4>📏 Reporte por Tallas</h4>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Código Talla</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const total = result[0].values.reduce((sum, row) => sum + row[1], 0);

        result[0].values.forEach(([talla, cantidad]) => {
            const porcentaje = ((cantidad / total) * 100).toFixed(1);
            const nombreTalla = configData.tallas[talla] || talla;
            
            html += `
                <tr>
                    <td>${talla}</td>
                    <td>${nombreTalla}</td>
                    <td>${cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        document.getElementById('reportResults').innerHTML = html;

    } catch (error) {
        console.error('Error generando reporte:', error);
        showAlert('Error al generar reporte: ' + error.message, 'danger');
    }
}

// Generar reporte por temporadas
function generateSeasonReport() {
    try {
        const result = db.exec(`
            SELECT temporada, COUNT(*) as cantidad 
            FROM productos 
            WHERE activo = 1 
            GROUP BY temporada 
            ORDER BY cantidad DESC
        `);

        if (result.length === 0) {
            showAlert('No hay datos para el reporte', 'info');
            return;
        }

        let html = `
            <div class="config-section">
                <h4>🗓️ Reporte por Temporadas</h4>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Temporada</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const total = result[0].values.reduce((sum, row) => sum + row[1], 0);

        result[0].values.forEach(([temporada, cantidad]) => {
            const porcentaje = ((cantidad / total) * 100).toFixed(1);
            const nombreTemporada = configData.temporadas[temporada] || temporada;
            
            html += `
                <tr>
                    <td>${temporada}</td>
                    <td>${nombreTemporada}</td>
                    <td>${cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        document.getElementById('reportResults').innerHTML = html;

    } catch (error) {
        console.error('Error generando reporte:', error);
        showAlert('Error al generar reporte: ' + error.message, 'danger');
    }
}