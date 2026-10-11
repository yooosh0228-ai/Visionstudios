import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanServiceInput,
  getService,
  jobTitle,
  normalizeWhatsapp,
  SERVICE_PRICE_IDS,
  slugify,
  splitHandoff,
  whatsappLink,
  AGENT_MESSAGE_PRICE_ID,
} from "../servicios/catalog.ts";
import { AGENT_MESSAGE_MAX, AGENTS, buildTurns, chatTitle, cleanAgentMessage, getAgent } from "../servicios/agents.ts";
import { isUsable, normalizeContent, normalizeDiagnosis, normalizeOutput } from "../servicios/outputs.ts";
import { parseInline, parseMarkdown } from "../servicios/markdown.ts";

const contenido = getService("contenido");
const asistente = getService("asistente");

test("every service has a price row, plus the per-reply prices of the assistant and the agents", () => {
  assert.deepEqual(SERVICE_PRICE_IDS, [
    "svc-contenido",
    "svc-radiografia",
    "svc-documento",
    "svc-asistente",
    "svc-asistente-msg",
    "svc-agente-msg",
  ]);
  assert.equal(getService("nada"), null);
});

test("service input keeps only known fields, trims them and enforces required ones", () => {
  const input = cleanServiceInput(contenido, {
    negocio: "  Barbería El Corte ",
    rubro: "barbería",
    productos: "Corte RD$300",
    redes: ["instagram", "hackeo", "instagram"],
    tono: "cercano",
    mes: "noviembre",
    extra: "no debe pasar",
  });
  assert.equal(input.negocio, "Barbería El Corte");
  assert.deepEqual(input.redes, ["instagram"]);
  assert.equal("extra" in input, false);
  assert.throws(() => cleanServiceInput(contenido, { ...input, negocio: " " }), /Nombre del negocio/);
  assert.throws(() => cleanServiceInput(contenido, { ...input, redes: [] }), /Redes/);
  assert.throws(() => cleanServiceInput(contenido, { ...input, tono: "grosero" }), /Tono/);
  assert.throws(() => cleanServiceInput(contenido, { ...input, productos: "x".repeat(1501) }), /muy largo/);
  assert.throws(() => cleanServiceInput(contenido, null), /inválida/);
});

test("WhatsApp numbers are normalized to international digits", () => {
  assert.equal(normalizeWhatsapp("809-555-1234"), "18095551234");
  assert.equal(normalizeWhatsapp("+1 (829) 555 1234"), "18295551234");
  assert.equal(normalizeWhatsapp("123"), null);
  assert.equal(normalizeWhatsapp(5), null);
  const base = { negocio: "X", rubro: "y", productos: "z", horario: "h", tono: "cercano" };
  assert.equal(cleanServiceInput(asistente, { ...base, whatsapp: "8095551234" }).whatsapp, "18095551234");
  assert.throws(() => cleanServiceInput(asistente, { ...base, whatsapp: "abc" }), /WhatsApp/);
  assert.equal(whatsappLink("18095551234", "Hola ñ"), "https://wa.me/18095551234?text=Hola%20%C3%B1");
});

test("slugs are lowercase ascii with dashes and at least three characters", () => {
  assert.equal(slugify("Barbería El Corte #1"), "barberia-el-corte-1");
  assert.equal(slugify("ñ"), "negocio-n");
  assert.match(slugify("!!!"), /^[a-z0-9-]{3,40}$/);
  assert.ok(slugify("a".repeat(80)).length <= 32);
});

test("job titles name the business, the month or the document type", () => {
  assert.equal(jobTitle(contenido, { negocio: "El Corte", mes: "noviembre" }), "El Corte · noviembre");
  assert.equal(jobTitle(getService("documento"), { tipo: "cv", datos: "Ana Pérez\nCajera" }), "Currículum (CV) · Ana Pérez");
});

test("the WhatsApp handoff marker is removed from the reply", () => {
  assert.deepEqual(splitHandoff("Claro, te esperamos. [WHATSAPP]"), { text: "Claro, te esperamos.", handoff: true });
  assert.deepEqual(splitHandoff("Abrimos a las 9."), { text: "Abrimos a las 9.", handoff: false });
});

test("content output is normalized defensively", () => {
  const out = normalizeContent({
    estrategia: "Vender más",
    posts: [
      { dia: 40, texto: "Hola", hashtags: ["santiago", "#RD", "con espacio"] },
      { dia: 2 },
    ],
  });
  assert.equal(out.posts.length, 1);
  assert.equal(out.posts[0].dia, 1);
  assert.deepEqual(out.posts[0].hashtags, ["#santiago", "#RD", "#conespacio"]);
  assert.deepEqual(out.promociones, []);
  assert.equal(isUsable({ service: "contenido", data: out }), false);
});

test("diagnosis scores are clamped and unknown levels fall back", () => {
  const out = normalizeDiagnosis({
    resumen: "ok",
    areas: [{ area: "Ventas", nota: 15 }, { area: "Redes", nota: "x" }],
    mejoras: [{ titulo: "Algo", nivel: "caro" }],
  });
  assert.equal(out.areas[0].nota, 10);
  assert.equal(out.areas[1].nota, 5);
  assert.equal(out.mejoras[0].nivel, "bajo");
  assert.equal(isUsable({ service: "radiografia", data: out }), true);
  assert.equal(normalizeOutput("otro", {}), null);
});

test("markdown parses headings, lists, tables, rules and emphasis", () => {
  const blocks = parseMarkdown(
    "# Ana Pérez\n\nCajera con **5 años**.\n\n- Uno\n- Dos\n\n1. A\n2. B\n\n| Art | Precio |\n|---|---|\n| Logo | RD$5,000 |\n\n---\ntexto"
  );
  assert.deepEqual(blocks.map((b) => b.kind), ["heading", "paragraph", "list", "list", "table", "rule", "paragraph"]);
  assert.equal(blocks[2].items.length, 2);
  assert.equal(blocks[3].ordered, true);
  assert.equal(blocks[4].rows.length, 1);
  assert.deepEqual(parseInline("a **b** _c_"), [
    { text: "a " },
    { text: "b", bold: true },
    { text: " " },
    { text: "c", italic: true },
  ]);
});

test("agents: four specialists with starters, and the per-reply price is registered", () => {
  assert.deepEqual(AGENTS.map((a) => a.id), ["negocio", "contenido", "marca", "ventas"]);
  for (const agent of AGENTS) assert.ok(agent.starters.length >= 2);
  assert.equal(getAgent("ventas")?.name, "Vendedor");
  assert.equal(getAgent("nada"), null);
  assert.ok(SERVICE_PRICE_IDS.includes(AGENT_MESSAGE_PRICE_ID));
});

test("agent messages are trimmed, required and capped", () => {
  assert.equal(cleanAgentMessage("  hola \u0000 "), "hola");
  assert.throws(() => cleanAgentMessage("   "));
  assert.throws(() => cleanAgentMessage(42));
  assert.throws(() => cleanAgentMessage("x".repeat(AGENT_MESSAGE_MAX + 1)));
});

test("chat titles come from the first non-empty line and are shortened", () => {
  assert.equal(chatTitle("\n  Precios de mi barbería \nmás"), "Precios de mi barbería");
  assert.equal(chatTitle("a".repeat(100)).length, 58);
  assert.equal(chatTitle(""), "Conversación nueva");
});

test("agent turns start with the user, alternate and keep only recent history", () => {
  const history = [
    { role: "assistant", content: "hola" },
    { role: "user", content: "a" },
    { role: "user", content: "b" },
    { role: "assistant", content: "c" },
  ];
  assert.deepEqual(buildTurns(history, "d"), [
    { role: "user", content: "a\n\nb" },
    { role: "assistant", content: "c" },
    { role: "user", content: "d" },
  ]);
  const long = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: String(i) }));
  const turns = buildTurns(long, "fin", 16);
  assert.equal(turns[0].role, "user");
  assert.equal(turns.at(-1).content, "fin");
  assert.ok(turns.length <= 17);
});
