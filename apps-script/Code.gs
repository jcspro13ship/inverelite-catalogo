/**
 * ====================================================================
 * InverElite — Apps Script
 * ====================================================================
 * API de la aplicación web. Todas las acciones, salvo `ping`, exigen la
 * contraseña del equipo, que se valida aquí en el servidor.
 *
 * Acciones:
 *   - ping                → prueba de vida (sin contraseña)
 *   - login               → valida la contraseña
 *   - saveCotizacion      → guarda una nueva cotización
 *   - convertToPedido     → convierte cotización en pedido
 *   - updateEstadoPedido  → cambia estado de un pedido
 *   - listCotizaciones    → lista todas las cotizaciones
 *   - listPedidos         → lista todos los pedidos
 *   - listVendedores      → lista vendedores activos
 *   - listProductos       → todos los productos, incluidos los inactivos
 *   - listFichas          → fichas técnicas internas (hoja privada)
 *   - saveProducto        → edita datos del producto y su ficha
 *   - setActivo           → activa o desactiva un producto
 *   - uploadFoto          → guarda una foto en Drive y la asigna al producto
 *
 * Instalación: ejecutar una vez la función `setup` desde el editor.
 * ====================================================================
 */

const SHEET_COTIZACIONES = 'Cotizaciones';
const SHEET_PEDIDOS = 'Pedidos';
const SHEET_VENDEDORES = 'Vendedores';
const SHEET_PRODUCTOS = 'Productos';
const SHEET_FICHAS = 'Fichas';
const SHEET_CONFIG = 'Config';

// Carpeta de Drive donde se guardan las fotos subidas desde la app
const FOTOS_FOLDER_ID = '1V11PVgnu7o9_HVbkQrzAAfg96jODnZA4';
const FOTOS_FOLDER = 'InverElite - Fotos de productos'; // solo si la carpeta anterior no existe
const PROP_PASSWORD = 'PASSWORD_EQUIPO';
const PROP_FOLDER = 'FOTOS_FOLDER_ID';

const PUBLIC_ACTIONS = ['ping'];

// Columnas de Productos que la app puede editar
const PRODUCT_FIELDS = [
  'Nombre', 'Proveedor', 'Marca', 'Categoria', 'Presentacion',
  'Precio_PV', 'Precio_Pub', 'IVA_Incluido',
  'Descripcion_Comercial', 'Descripcion_Tecnica', 'Activo'
];
const NUMERIC_FIELDS = ['Precio_PV', 'Precio_Pub', 'IVA_Incluido'];

const FICHA_HEADERS = [
  'ID', 'Composicion', 'Beneficios', 'Indicacion', 'Dosis',
  'Almacenamiento', 'Transporte', 'Notas_Internas', 'Estado_Dato', 'Actualizado'
];

// ============== ENTRADAS ==============
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let params = e.parameter || {};
    // Si viene en JSON en el body (POST)
    if (e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        params = Object.assign({}, params, body);
      } catch (err) { /* ignore */ }
    }

    const action = params.action || '';
    if (PUBLIC_ACTIONS.indexOf(action) === -1) checkAuth(params);

    let result;
    switch (action) {
      case 'ping':               result = { ok: true, ts: new Date().toISOString() }; break;
      case 'login':              result = { ok: true }; break;
      case 'saveCotizacion':     result = saveCotizacion(params); break;
      case 'convertToPedido':    result = convertToPedido(params); break;
      case 'updateEstadoPedido': result = updateEstadoPedido(params); break;
      case 'listCotizaciones':   result = listCotizaciones(); break;
      case 'listPedidos':        result = listPedidos(); break;
      case 'listVendedores':     result = listVendedores(); break;
      case 'listProductos':      result = listProductos(); break;
      case 'listFichas':         result = listFichas(); break;
      case 'saveProducto':       result = saveProducto(params); break;
      case 'setActivo':          result = setActivo(params); break;
      case 'uploadFoto':         result = uploadFoto(params); break;
      default: throw new Error('Acción desconocida: ' + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============== SEGURIDAD ==============
function getPassword() {
  const stored = PropertiesService.getScriptProperties().getProperty(PROP_PASSWORD);
  if (stored) return stored;
  // Antes de ejecutar `setup` la clave sigue en la hoja Config
  return readConfigValue('password_equipo');
}

function checkAuth(p) {
  const expected = getPassword();
  if (!expected) throw new Error('No hay contraseña configurada. Ejecuta la función setup.');
  if (String(p.password || '') !== String(expected)) {
    Utilities.sleep(800); // frena intentos repetidos
    throw new Error('Contraseña incorrecta');
  }
}

function readConfigValue(clave) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) return '';
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === clave) return String(data[i][1] || '');
  }
  return '';
}

// ============== INSTALACIÓN (ejecutar una vez) ==============
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const log = [];

  // 1. Comprobar pestañas existentes
  [SHEET_PRODUCTOS, SHEET_CONFIG, SHEET_COTIZACIONES, SHEET_PEDIDOS].forEach(function (name) {
    if (!ss.getSheetByName(name)) log.push('FALTA la pestaña "' + name + '". Revisa el nombre.');
  });

  // 2. Hoja privada de fichas
  let fichas = ss.getSheetByName(SHEET_FICHAS);
  if (!fichas) {
    fichas = ss.insertSheet(SHEET_FICHAS);
    fichas.getRange(1, 1, 1, FICHA_HEADERS.length).setValues([FICHA_HEADERS]).setFontWeight('bold');
    fichas.setFrozenRows(1);
    log.push('Pestaña "Fichas" creada. NO la publiques en la web.');
  }

  // 3. Carga inicial de fichas (si pegaste el archivo FichasIniciales.gs)
  if (fichas.getLastRow() < 2 && typeof FICHAS_INICIALES !== 'undefined') {
    const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const rows = FICHAS_INICIALES.map(function (f) {
      return FICHA_HEADERS.map(function (h) { return h === 'Actualizado' ? fecha : (f[h] || ''); });
    });
    fichas.getRange(2, 1, rows.length, FICHA_HEADERS.length).setValues(rows);
    log.push(rows.length + ' fichas iniciales cargadas.');
  }

  // 4. Carpeta de fotos en Drive
  const carpeta = getFotosFolder();
  log.push('Carpeta de fotos: ' + carpeta.getName() + ' — ' + carpeta.getUrl());
  if (carpeta.getId() !== FOTOS_FOLDER_ID) log.push('AVISO: no pude abrir la carpeta configurada; se usará esta otra.');

  // 5. Sacar la contraseña de la hoja pública
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP_PASSWORD)) {
    const actual = readConfigValue('password_equipo');
    if (actual) {
      props.setProperty(PROP_PASSWORD, actual);
      const config = ss.getSheetByName(SHEET_CONFIG);
      const data = config.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === 'password_equipo') config.getRange(i + 1, 2).setValue('');
      }
      log.push('Contraseña movida a las propiedades del script y borrada de la hoja Config.');
    } else {
      log.push('No encontré contraseña en Config. Créala en Configuración del proyecto > Propiedades del script, con el nombre ' + PROP_PASSWORD + '.');
    }
  }

  Logger.log(log.join('\n'));
  return log;
}

// ============== UTILS ==============
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(name);
  if (!s) throw new Error('Pestaña no encontrada: ' + name);
  return s;
}

function generateId(prefix) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const sheet = prefix === 'COT' ? getSheet(SHEET_COTIZACIONES) : getSheet(SHEET_PEDIDOS);
  const data = sheet.getDataRange().getValues();
  let max = 0;
  const todayPrefix = `${prefix}-${dateStr}-`;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0] || '');
    if (id.startsWith(todayPrefix)) {
      const n = parseInt(id.split('-').pop()) || 0;
      if (n > max) max = n;
    }
  }
  return `${prefix}-${dateStr}-${String(max + 1).padStart(3, '0')}`;
}

function rowsToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue; // skip empty
    const obj = {};
    headers.forEach((h, idx) => {
      let val = data[i][idx];
      // Format dates as YYYY-MM-DD
      if (val instanceof Date) {
        const yyyy = val.getFullYear();
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const dd = String(val.getDate()).padStart(2, '0');
        val = `${yyyy}-${mm}-${dd}`;
      }
      obj[h] = val;
    });
    out.push(obj);
  }
  return out;
}

// Igual que rowsToObjects pero con el texto tal como se ve en la hoja
// (así los precios llegan con el mismo formato que en el CSV publicado)
function rowsToDisplayObjects(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
    out.push(obj);
  }
  return out;
}

// Devuelve { sheet, headers, row } de la fila cuyo ID (columna A) coincide; row = 0 si no existe
function findRowById(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  let row = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { row = i + 1; break; }
  }
  return { sheet: sheet, headers: headers, row: row };
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

// ============== COTIZACIONES ==============
function saveCotizacion(p) {
  const sheet = getSheet(SHEET_COTIZACIONES);
  const id = generateId('COT');
  const now = new Date();
  const fecha = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const hora = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');

  const row = [
    id, fecha, hora,
    p.vendedor || '',
    p.cliente_nombre || '',
    p.cliente_documento || '',
    p.cliente_telefono || '',
    p.cliente_email || '',
    p.cliente_direccion || '',
    p.lista_precios || '',
    Number(p.total) || 0,
    Number(p.num_productos) || 0,
    Number(p.num_unidades) || 0,
    p.productos_json || '[]',
    p.observaciones || '',
    'Activa',
    ''
  ];
  sheet.appendRow(row);
  return { id, fecha, hora };
}

function listCotizaciones() {
  return rowsToObjects(getSheet(SHEET_COTIZACIONES));
}

// ============== PEDIDOS ==============
function convertToPedido(p) {
  // Necesita: cotizacion_id (para vincular) — los demás campos pueden venir del cliente
  // o se buscan en la cotización original
  const cotId = p.cotizacion_id;
  if (!cotId) throw new Error('Falta cotizacion_id');

  const cotSheet = getSheet(SHEET_COTIZACIONES);
  const data = cotSheet.getDataRange().getValues();
  const headers = data[0];
  let rowIdx = -1;
  let cotData = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === cotId) {
      rowIdx = i + 1;
      cotData = {};
      headers.forEach((h, idx) => { cotData[h] = data[i][idx]; });
      break;
    }
  }
  if (!cotData) throw new Error('Cotización no encontrada: ' + cotId);

  // Crear el pedido
  const pedSheet = getSheet(SHEET_PEDIDOS);
  const pedId = generateId('PED');
  const now = new Date();
  const fecha = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const hora = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');

  const row = [
    pedId, fecha, hora,
    cotData.Vendedor || '',
    cotId,
    cotData.Cliente_Nombre || '',
    cotData.Cliente_Documento || '',
    cotData.Cliente_Telefono || '',
    cotData.Cliente_Email || '',
    cotData.Cliente_Direccion || '',
    cotData.Lista_Precios || '',
    Number(cotData.Total) || 0,
    Number(cotData.Num_Productos) || 0,
    Number(cotData.Num_Unidades) || 0,
    cotData.Productos_JSON || '[]',
    cotData.Observaciones || '',
    'Pendiente',
    fecha
  ];
  pedSheet.appendRow(row);

  // Marcar la cotización como convertida
  const estadoCol = headers.indexOf('Estado') + 1;
  const pedidoIdCol = headers.indexOf('Pedido_ID') + 1;
  cotSheet.getRange(rowIdx, estadoCol).setValue('Convertida a Pedido');
  cotSheet.getRange(rowIdx, pedidoIdCol).setValue(pedId);

  return { id: pedId, fecha, hora };
}

function updateEstadoPedido(p) {
  if (!p.pedido_id) throw new Error('Falta pedido_id');
  if (!p.estado) throw new Error('Falta estado');
  const validos = ['Pendiente', 'Facturado', 'Entregado'];
  if (validos.indexOf(p.estado) === -1) throw new Error('Estado inválido');

  const sheet = getSheet(SHEET_PEDIDOS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const estadoCol = headers.indexOf('Estado') + 1;
  const fechaEstadoCol = headers.indexOf('Fecha_Estado') + 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.pedido_id) {
      sheet.getRange(i + 1, estadoCol).setValue(p.estado);
      const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.getRange(i + 1, fechaEstadoCol).setValue(fecha);
      return { id: p.pedido_id, estado: p.estado };
    }
  }
  throw new Error('Pedido no encontrado: ' + p.pedido_id);
}

function listPedidos() {
  return rowsToObjects(getSheet(SHEET_PEDIDOS));
}

// ============== VENDEDORES ==============
function listVendedores() {
  const sheet = getSheet(SHEET_VENDEDORES);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && String(data[i][1]).toUpperCase() === 'SI') {
      out.push(String(data[i][0]));
    }
  }
  return out;
}

// ============== PRODUCTOS (edición desde la app) ==============
function listProductos() {
  return rowsToDisplayObjects(getSheet(SHEET_PRODUCTOS));
}

function listFichas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_FICHAS);
  if (!sheet) return [];
  return rowsToDisplayObjects(sheet);
}

function writeProductFields(found, campos) {
  Object.keys(campos).forEach(function (field) {
    if (PRODUCT_FIELDS.indexOf(field) === -1) return; // campo no editable
    const col = found.headers.indexOf(field) + 1;
    if (!col) return;
    let val = campos[field];
    if (NUMERIC_FIELDS.indexOf(field) !== -1) {
      val = Number(String(val).replace(/[^0-9.]/g, '')) || 0;
    } else if (field === 'Activo') {
      val = String(val).toUpperCase() === 'SI' ? 'SI' : 'NO';
    } else {
      val = String(val == null ? '' : val);
    }
    found.sheet.getRange(found.row, col).setValue(val);
  });
}

function saveProducto(p) {
  if (!p.id) throw new Error('Falta id');
  return withLock(function () {
    const found = findRowById(SHEET_PRODUCTOS, p.id);
    if (!found.row) throw new Error('Producto no encontrado: ' + p.id);
    if (p.producto) writeProductFields(found, p.producto);
    if (p.ficha) saveFicha(p.id, p.ficha);
    return { id: p.id };
  });
}

function saveFicha(id, ficha) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_FICHAS)) throw new Error('Falta la pestaña Fichas. Ejecuta la función setup.');
  const found = findRowById(SHEET_FICHAS, id);
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (!found.row) {
    const row = found.headers.map(function (h) {
      if (h === 'ID') return id;
      if (h === 'Actualizado') return fecha;
      return String(ficha[h] == null ? '' : ficha[h]);
    });
    found.sheet.appendRow(row);
    return;
  }
  found.headers.forEach(function (h, idx) {
    if (h === 'ID') return;
    if (h === 'Actualizado') { found.sheet.getRange(found.row, idx + 1).setValue(fecha); return; }
    if (ficha[h] === undefined) return;
    found.sheet.getRange(found.row, idx + 1).setValue(String(ficha[h] == null ? '' : ficha[h]));
  });
}

function setActivo(p) {
  if (!p.id) throw new Error('Falta id');
  return withLock(function () {
    const found = findRowById(SHEET_PRODUCTOS, p.id);
    if (!found.row) throw new Error('Producto no encontrado: ' + p.id);
    const activo = String(p.activo).toUpperCase() === 'SI' ? 'SI' : 'NO';
    writeProductFields(found, { Activo: activo });
    return { id: p.id, activo: activo };
  });
}

// ============== FOTOS ==============
function getFotosFolder() {
  try { return DriveApp.getFolderById(FOTOS_FOLDER_ID); } catch (err) { /* sin acceso: usar una propia */ }
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(PROP_FOLDER);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (err) { /* se borró: crear otra */ }
  }
  const folder = DriveApp.createFolder(FOTOS_FOLDER);
  props.setProperty(PROP_FOLDER, folder.getId());
  return folder;
}

function uploadFoto(p) {
  if (!p.id) throw new Error('Falta id');
  if (!p.data) throw new Error('Falta la imagen');
  const mime = p.mime || 'image/jpeg';
  if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mime) === -1) throw new Error('Formato de imagen no permitido');
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

  return withLock(function () {
    const found = findRowById(SHEET_PRODUCTOS, p.id);
    if (!found.row) throw new Error('Producto no encontrado: ' + p.id);
    const col = found.headers.indexOf('Foto_URL') + 1;
    if (!col) throw new Error('Falta la columna Foto_URL en Productos');

    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
    const blob = Utilities.newBlob(Utilities.base64Decode(p.data), mime, p.id + '_' + stamp + '.' + ext);
    const file = getFotosFolder().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
    found.sheet.getRange(found.row, col).setValue(url);
    return { id: p.id, url: url };
  });
}
