import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (!specifier.startsWith(".")) throw error;
      if (error.code === "ERR_MODULE_NOT_FOUND") return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

const { convertir, limpiarRegistro, aColumnas, aTexto, CAMPOS, CampoInvalido } = await import("../lib/vs/campos.ts");
const { cuentaDe, depositoSugerido, formatoRD, hoyRD } = await import("../lib/vs/cuentas.ts");
const { normalizarAjustes, enlaceChat, AJUSTES_BASE } = await import("../lib/vs/ajustes.ts");
const { radiografiaDe, puntuar } = await import("../lib/vs/radiografia.ts");
const { resumenDe } = await import("../lib/vs/resumen.ts");

const campo = (entidad, columna) => CAMPOS[entidad].find((c) => c.columna === columna);

test("los formularios solo guardan columnas conocidas y las convierten a su tipo", () => {
  const fila = limpiarRegistro(
    "cobro",
    { cliente_id: "11111111-1111-1111-1111-111111111111", concepto: " Montaje ", tipo: "proyecto", precio: "RD$12,500", deposito: "", vencimiento: "2026-11-01", cancelado: "false", hackeo: "x", id: "nope" },
    { creando: true }
  );
  assert.equal(fila.concepto, "Montaje");
  assert.equal(fila.precio, 12500);
  assert.equal(fila.deposito, null);
  assert.equal(fila.cancelado, false);
  assert.equal("hackeo" in fila, false);
  assert.equal("id" in fila, false);
});

test("faltar un campo obligatorio o mandar una opción inventada se rechaza", () => {
  assert.throws(() => limpiarRegistro("prospecto", { estado: "nuevo" }, { creando: true }), CampoInvalido);
  assert.throws(() => convertir(campo("prospecto", "estado"), "regalado"), CampoInvalido);
  assert.throws(() => convertir(campo("cobro", "cliente_id"), "' or 1=1 --"), CampoInvalido);
  assert.throws(() => convertir(campo("cobro", "precio"), "-5"), CampoInvalido);
  assert.throws(() => convertir(campo("cobro", "vencimiento"), "mañana"), CampoInvalido);
  assert.throws(() => convertir(campo("trabajo", "id"), "Con Espacios"), CampoInvalido);
  assert.throws(() => convertir(campo("trabajo", "video_remoto"), "javascript:alert(1)"), CampoInvalido);
});

test("el código de una oferta o un trabajo solo se escribe al crearlo", () => {
  const datos = { id: "pagina-signal", nombre: "Página Signal", categoria: "apps", unidad: "pago único" };
  assert.equal(limpiarRegistro("oferta", datos, { creando: true }).id, "pagina-signal");
  assert.equal("id" in limpiarRegistro("oferta", datos, { creando: false }), false);
});

test("listas, cifras y pantallas van y vuelven como texto de una línea por punto", () => {
  const hecho = convertir(campo("trabajo", "hecho"), "Uno\n\n  Dos  \n");
  assert.deepEqual(hecho, ["Uno", "Dos"]);
  const cifras = convertir(campo("trabajo", "cifras"), "4 | toques\nmal\n24/7 | abierta");
  assert.deepEqual(cifras, [["4", "toques"], ["24/7", "abierta"]]);
  const pantallas = convertir(campo("trabajo", "pantallas"), "La app | vivo | real\nEl anuncio | gallery-anuncio | 15 s");
  assert.deepEqual(pantallas, [
    { etiqueta: "La app", vivo: true, leyenda: "real" },
    { etiqueta: "El anuncio", ver: "gallery-anuncio", leyenda: "15 s" },
  ]);
  assert.equal(aTexto(campo("trabajo", "pantallas"), pantallas), "La app | vivo | real\nEl anuncio | gallery-anuncio | 15 s");
  assert.equal(aTexto(campo("trabajo", "cifras"), cifras), "4 | toques\n24/7 | abierta");
});

test("los registros pasan a columnas para el formulario, con video y fondo separados", () => {
  const fila = aColumnas({ clienteId: "a", fechaProxima: "2026-10-12", video: { local: "/v.mp4", remoto: null } });
  assert.deepEqual(fila, { cliente_id: "a", fecha_proxima: "2026-10-12", video_local: "/v.mp4", video_remoto: null });
});

test("el correo del cliente se guarda en minúsculas", () => {
  assert.equal(convertir(campo("cliente", "email"), " Edwin@Gmail.COM "), "edwin@gmail.com");
  assert.throws(() => convertir(campo("cliente", "email"), "no-es-correo"), CampoInvalido);
});

const cobro = (extra = {}) => ({
  id: "c1", clienteId: "k", proyectoId: null, ofertaId: null, concepto: "Montaje", tipo: "proyecto",
  precio: 10000, deposito: 6000, vencimiento: "2026-10-20", nota: "", cancelado: false, createdAt: "", ...extra,
});
const pago = (monto, estado, extra = {}) => ({
  id: String(Math.random()), tipo: "cobro", cobroId: "c1", clienteId: "k", userId: null, email: null, monto, creditos: null,
  metodo: "popular", referencia: "", estado, reportadoPor: "cliente", nota: "", createdAt: "", revisadoAt: null, ...extra,
});

test("lo recibido solo cuenta pagos confirmados; lo reportado queda por confirmar", () => {
  const c = cuentaDe(cobro(), [pago(4000, "confirmado"), pago(2000, "pendiente"), pago(9000, "rechazado")], "2026-10-10");
  assert.equal(c.recibido, 4000);
  assert.equal(c.porConfirmar, 2000);
  assert.equal(c.saldo, 6000);
  assert.equal(c.estado, "deposito");
  assert.equal(c.retieneEntrega, true);
});

test("estados de un cobro: saldo, pagado, vencido y cancelado", () => {
  assert.equal(cuentaDe(cobro(), [pago(6000, "confirmado")], "2026-10-10").estado, "saldo");
  assert.equal(cuentaDe(cobro(), [pago(10000, "confirmado")], "2026-10-10").estado, "pagado");
  assert.equal(cuentaDe(cobro(), [pago(6000, "confirmado")], "2026-10-21").estado, "vencido");
  const cancelado = cuentaDe(cobro({ cancelado: true }), [], "2026-10-10");
  assert.equal(cancelado.estado, "cancelado");
  assert.equal(cancelado.saldo, 0);
  assert.equal(cancelado.retieneEntrega, false);
  // Un pago de otro cobro no se mezcla.
  assert.equal(cuentaDe(cobro(), [pago(10000, "confirmado", { cobroId: "otro" })], "2026-10-10").recibido, 0);
});

test("el depósito sugerido sigue las reglas de cobro", () => {
  assert.equal(depositoSugerido(8000, "proyecto"), 8000);
  assert.equal(depositoSugerido(10000, "proyecto"), 10000);
  assert.equal(depositoSugerido(25000, "proyecto"), 15000);
  assert.equal(depositoSugerido(1500, "mensualidad"), 1500);
  assert.equal(depositoSugerido(3000, "terceros"), 3000);
});

test("formatos de dinero y fecha de Santo Domingo", () => {
  assert.equal(formatoRD(2000), "RD$2,000");
  assert.equal(formatoRD(null), "—");
  // 02:00 UTC del 11 es todavía el 10 en Santo Domingo (UTC−4).
  assert.equal(hoyRD(new Date("2026-10-11T02:00:00Z")), "2026-10-10");
});

test("los ajustes se completan con la base y descartan lo que no tiene forma", () => {
  const a = normalizarAjustes({ whatsapp: "+1 (809) 555-1234", instagram: "@visionstudios.rd", capacidad: "9", paquetesCreditos: [{ precio: 300, creditos: 500 }, { precio: 0, creditos: 10 }, "x"], pruebaSocial: [["a"], ["100%", "personalizado"]] });
  assert.equal(a.whatsapp, "18095551234");
  assert.equal(a.instagram, "visionstudios.rd");
  assert.equal(a.capacidad, 9);
  assert.deepEqual(a.paquetesCreditos, [{ precio: 300, creditos: 500 }]);
  assert.deepEqual(a.pruebaSocial, [["100%", "personalizado"]]);
  assert.deepEqual(normalizarAjustes(null).reglasCobro, AJUSTES_BASE.reglasCobro);
  assert.equal(enlaceChat({ whatsapp: "", instagram: "visionstudios.rd" }), "https://ig.me/m/visionstudios.rd");
  assert.equal(enlaceChat({ whatsapp: "18095551234", instagram: "x" }, "hola"), "https://wa.me/18095551234?text=hola");
});

test("la radiografía mide lo que dijo el cliente y nombra el problema principal", () => {
  assert.equal(puntuar(""), 0);
  assert.equal(puntuar("Cortes"), 1);
  const vacio = radiografiaDe({ oferta: "", audiencia: "", enlace: "", prueba: "", objetivo: "", obstaculo: "", materiales: "", rangoPrecio: "" });
  assert.equal(vacio.ofertaSugerida, "radiografia");
  assert.equal(vacio.completo, 0);
  const sinPresencia = radiografiaDe({ oferta: "Cortes de adulto a RD$500 y corte con barba a RD$700 para hombres de la zona", audiencia: "", enlace: "", prueba: "", objetivo: "", obstaculo: "", materiales: "", rangoPrecio: "" });
  assert.equal(sinPresencia.ofertaSugerida, "pagina-signal");
  assert.ok(sinPresencia.hipotesis.every((h) => h.startsWith("Hipótesis")));
});

test("el resumen cuenta lo cobrado en el mes y la capacidad usada", () => {
  const panel = {
    ajustes: normalizarAjustes(null),
    clientes: [{ id: "k", nombre: "Gallery" }],
    prospectos: [],
    proyectos: [
      { id: "p1", clienteId: "k", etapa: "produccion", cerrado: false },
      { id: "p2", clienteId: "k", etapa: "estrategia", cerrado: false },
    ],
    entregables: [],
    cobros: [cobro()],
    pagos: [pago(4000, "confirmado", { revisadoAt: "2026-10-05T12:00:00Z" }), pago(1000, "confirmado", { revisadoAt: "2026-09-30T12:00:00Z" })],
    ofertas: [],
    trabajos: [],
    apps: [],
  };
  const r = resumenDe(panel, "2026-10-10");
  assert.equal(r.cobradoMes, 4000);
  assert.equal(r.porCobrar, 5000);
  assert.equal(r.capacidadUsada, 1);
});
