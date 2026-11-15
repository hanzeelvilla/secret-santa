import { describe, expect, it } from "vitest";
import { drawDoneEmail, groupUpdatedEmail } from "./email-templates";

describe("groupUpdatedEmail", () => {
  const base = {
    name: "Ana",
    ownerName: "Beto",
    groupName: "Posada",
    changes: [{ label: "Nombre", from: "Posada", to: "Posada 2026" }],
    url: "https://app.test/groups/1",
  };

  it("lista los cambios y enlaza al grupo", () => {
    const { subject, html, text } = groupUpdatedEmail(base);
    expect(subject).toContain("Posada");
    expect(html).toContain("Posada 2026");
    expect(html).toContain("https://app.test/groups/1");
    expect(text).toContain("Nombre: Posada → Posada 2026");
  });

  it("escapa los datos del usuario para que no inyecten HTML", () => {
    const { html } = groupUpdatedEmail({
      ...base,
      name: "<img src=x onerror=alert(1)>",
      groupName: "<script>alert(1)</script>",
      changes: [{ label: "Nombre", from: "<b>a</b>", to: "<i>b</i>" }],
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>a</b>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("drawDoneEmail", () => {
  const base = {
    name: "Ana",
    ownerName: "Beto",
    groupName: "Posada",
    redo: false,
    exchangeDate: "24 de diciembre de 2026",
    budget: "$500",
    url: "https://app.test/groups/1",
  };

  it("avisa del sorteo sin decir a quién le toca a nadie", () => {
    const { subject, html, text } = drawDoneEmail(base);
    expect(subject).toContain("Ya se hizo el sorteo");
    expect(html).toContain("Descubrir mi regalo");
    expect(html).toContain("24 de diciembre de 2026");
    expect(text).toContain("no dice a quién le tocó");
  });

  it("el asunto cambia cuando se rehace el sorteo", () => {
    const first = drawDoneEmail(base).subject;
    const redo = drawDoneEmail({ ...base, redo: true }).subject;
    expect(redo).not.toBe(first);
    expect(redo).toContain("rehízo");
  });

  it("omite fecha y presupuesto cuando no hay", () => {
    const { html } = drawDoneEmail({
      ...base,
      exchangeDate: null,
      budget: null,
    });
    expect(html).not.toContain("Fecha del intercambio");
    expect(html).not.toContain("Presupuesto");
  });

  it("escapa el nombre del grupo", () => {
    const { html } = drawDoneEmail({ ...base, groupName: "<script>x</script>" });
    expect(html).not.toContain("<script>");
  });
});
