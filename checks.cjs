const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
process.chdir(__dirname);
const E = require("./dist/assets/engine.js");
const gifts = JSON.parse(
  fs.readFileSync("dist/assets/data/gifts.json", "utf8"),
);
const dict = JSON.parse(fs.readFileSync("dist/assets/data/i18n.json", "utf8"));
assert.deepEqual(Object.keys(dict.ru).sort(), Object.keys(dict.en).sort());
assert.equal(gifts.length, 36);
assert.equal(new Set(gifts.map((g) => g.id)).size, gifts.length);
for (const g of gifts) {
  assert(g.title.ru && g.title.en && g.description.ru && g.description.en);
  assert(g.price > 0);
  assert(/^[a-z-]+$/.test(g.photo), `Safe image filename: ${g.id}`);
  assert(fs.existsSync(`dist/assets/photos/${g.photo}.webp`), g.photo);
  assert(dict.ru['photo_' + g.photo] && dict.en['photo_' + g.photo]);
  for (const tag of [g.category, ...g.tags, ...g.styles])
    assert(dict.ru[tag] && dict.en[tag]);
}
assert.equal(new Set(gifts.map(g => g.photo)).size, 36);
let draws = 0;
for (let n = 3; n <= 12; n++)
  for (let round = 0; round < 100; round++) {
    const ids = Array.from({ length: n }, (_, i) => "p-" + i);
    const result = E.draw(ids, Math.random);
    assert(E.validDraw(ids, result));
    assert.deepEqual(Object.keys(result), ids);
    draws++;
  }
assert.throws(() => E.draw(["a", "b"]));
assert.throws(() => E.draw(["a", "b", "b"]));
assert(
  E.validDraw(
    ["a", "b", "c"],
    E.draw(["a", "b", "c"], () => 0.999999),
  ),
);
assert(!E.validDraw(["a", "b", "c"], { a: "a", b: "c", c: "b" }));
const person = {
  name: "Test",
  interests: ["art", "reading"],
  styles: ["handmade", "useful"],
  avoid: ["food"],
};
for (const budget of [100, 500, 2500, 7000, 15000]) {
  const results = E.recommend(gifts, person, budget);
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    assert(item.gift.price <= budget);
    assert(!person.avoid.includes(item.gift.category));
    assert.deepEqual(
      item.interests,
      item.gift.tags.filter((t) => person.interests.includes(t)),
    );
    if (i) assert(results[i - 1].score >= item.score);
  }
}
assert.equal(E.recommend(gifts, person, 100).length, 0);
const allExcluded = {
  ...person,
  avoid: [...new Set(gifts.map((g) => g.category))],
};
assert.equal(E.recommend(gifts, allExcluded, 100000).length, 0);
assert(!E.ready({ name: "Test", interests: [], styles: ["cozy"] }));
assert(E.ready(person));
const good = {
  title: "Test game",
  budget: 7000,
  date: "2030-12-25",
  deadline: "2030-12-20",
};
assert.deepEqual(E.gameErrors(good, "2030-12-01"), {});
assert(E.gameErrors({ ...good, budget: -1 }, "2030-12-01").budget);
assert(
  E.gameErrors({ ...good, deadline: "2030-12-26" }, "2030-12-01").deadline,
);
assert(E.gameErrors({ ...good, date: "2030-02-30" }, "2030-01-01").date);
for (const page of [
  "index",
  "game",
  "profile",
  "recipient",
  "catalog",
  "preparation",
]) {
  const source = fs.readFileSync(`dist/${page}.html`, "utf8");
  for (const match of source.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g))
    assert(fs.existsSync(path.join("dist", match[1])), match[1]);
}
console.log(
  `PASS: ${draws} draws; no self/duplicate recipients; fallback; matching, exclusions and budget; date validation; 36 gifts and distinct local photographs; bilingual key parity; local assets.`,
);
require('./theme-checks.cjs');
