import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (!specifier.startsWith(".")) throw error;
      if (error.code === "ERR_UNSUPPORTED_DIR_IMPORT") return nextResolve(`${specifier}/index.ts`, context);
      if (error.code === "ERR_MODULE_NOT_FOUND") return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

const { TRENDS, getTrend, trendPlane } = await import("../lib/studio/trends.ts");
const { MODELS, getModel, parseSettings } = await import("../generation/catalog/index.ts");
const { toPlatform } = await import("../generation/to-platform.ts");
const { normalizarAjustes, AJUSTES_BASE } = await import("../lib/vs/ajustes.ts");

const foto = { url: "https://cdn.example.com/selfie.jpg", name: "selfie.jpg" };

function listo(trend, input) {
  const entry = getModel(trend.model);
  const draft = trendPlane(trend, input);
  return { ...draft, settings: parseSettings(entry, draft.settings) };
}

test("cada trend usa un modelo instalado y una muestra real", () => {
  const ids = new Set(MODELS.map((m) => m.id));
  for (const t of TRENDS) {
    assert.ok(ids.has(t.model), `${t.id} usa ${t.model}`);
    assert.match(t.cover, /^https:\/\//, `${t.id} tiene muestra`);
    assert.equal(getModel(t.model).surface, t.kind, `${t.id} genera ${t.kind}`);
  }
  assert.equal(new Set(TRENDS.map((t) => t.id)).size, TRENDS.length, "ids únicos");
});

test("cada trend se puede enviar a la plataforma con su foto y su texto", () => {
  for (const t of TRENDS) {
    const plane = listo(t, { text: "Ana", photo: t.photo ? foto : null });
    const req = toPlatform(plane);
    assert.ok(req.path, `${t.id} tiene ruta`);
    assert.ok(String(req.body.prompt ?? "").length > 20, `${t.id} lleva descripción`);
  }
});

test("la selfie entra como referencia a Grok", () => {
  const req = toPlatform(listo(getTrend("noche-de-pelota"), { photo: foto }));
  assert.equal(req.path, "xai/grok-imagine-image-2.0");
  assert.deepEqual(req.body.image_urls, [foto.url]);
});

test("Dale vida manda la foto como cuadro inicial a Seedance 2.5 por 5 segundos", () => {
  const req = toPlatform(listo(getTrend("dale-vida"), { photo: foto }));
  assert.equal(req.path, "bytedance/seedance-2.5/image-to-video");
  assert.equal(req.body.image_url, foto.url);
  assert.equal(req.body.duration, 5);
});

test("el texto vacío usa el de ejemplo y nunca rompe las comillas", () => {
  const caja = getTrend("muneco-en-caja");
  assert.match(trendPlane(caja, { text: "" , photo: foto }).prompt.text, /EDICIÓN SANTIAGO/);
  const conComillas = trendPlane(caja, { text: 'YO "EL" MEJOR', photo: foto }).prompt.text;
  assert.match(conComillas, /YO 'EL' MEJOR/);
  const largo = trendPlane(caja, { text: "X".repeat(200), photo: foto }).prompt.text;
  assert.ok(!largo.includes("X".repeat(17)), "respeta el máximo");
});

test("sin foto no se envía ninguna referencia", () => {
  const plane = trendPlane(getTrend("paisaje-en-video"), { text: "Samaná" });
  assert.deepEqual(plane.media, {});
  assert.match(plane.prompt.text, /Samaná/);
});

test("el regalo de bienvenida tiene valores seguros", () => {
  assert.deepEqual(AJUSTES_BASE.bienvenida, { activo: true, creditos: 50, tope: 100 });
  assert.deepEqual(normalizarAjustes({}).bienvenida, AJUSTES_BASE.bienvenida);
  const n = normalizarAjustes({ bienvenida: { activo: false, creditos: 99999, tope: "20" } });
  assert.deepEqual(n.bienvenida, { activo: false, creditos: 1000, tope: 20 });
  assert.deepEqual(normalizarAjustes({ bienvenida: { creditos: -5 } }).bienvenida, { activo: true, creditos: 50, tope: 100 });
});
