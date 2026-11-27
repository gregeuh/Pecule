/** The blocks of the iPhone home, under « Ce qu’il vous reste » (always first). */
export const HOME_BLOCKS = [
  "conseils",
  "alertes",
  "verifications",
  "tuiles",
  "operations",
  "previsions",
  "saisie",
] as const;
export type HomeBlock = (typeof HOME_BLOCKS)[number];
export type HomeLayout = { order: HomeBlock[]; hidden: HomeBlock[] };

export const HOME_BLOCK_LABELS: Record<HomeBlock, { name: string; hint: string }> = {
  conseils: { name: "Conseils du mois", hint: "Paie arrivée, fin de période serrée" },
  alertes: { name: "Alertes de dépenses", hint: "Seuils par catégorie" },
  verifications: { name: "Vérifications", hint: "Doublons, comptés deux fois" },
  tuiles: { name: "Tuiles", hint: "Comptes, récurrences, mois, épargne" },
  operations: { name: "Dernières opérations", hint: "Les 2 dernières" },
  previsions: { name: "Prévisions et calcul", hint: "Replié" },
  saisie: { name: "Ma saisie et mes favoris", hint: "Replié" },
};

export const DEFAULT_HOME_LAYOUT: HomeLayout = { order: [...HOME_BLOCKS], hidden: [] };

/** A stored layout made whole: unknown ids dropped, blocks added since then put back at their default place. */
export function normalizeLayout(layout?: Partial<HomeLayout> | null): HomeLayout {
  const known = (ids: unknown) =>
    (Array.isArray(ids) ? ids : []).filter(
      (id, i, all): id is HomeBlock => HOME_BLOCKS.includes(id as HomeBlock) && all.indexOf(id) === i,
    );
  const order = known(layout?.order);
  for (const id of HOME_BLOCKS)
    if (!order.includes(id)) {
      const before = HOME_BLOCKS.indexOf(id);
      const after = order.findIndex((x) => HOME_BLOCKS.indexOf(x) > before);
      order.splice(after < 0 ? order.length : after, 0, id);
    }
  return { order, hidden: known(layout?.hidden) };
}

/** The blocks to show, in order. A warning that money runs out comes back even when its block was removed. */
export function visibleBlocks(layout: HomeLayout | undefined, urgent: boolean): HomeBlock[] {
  const { order, hidden } = normalizeLayout(layout);
  return order.filter((id) => !hidden.includes(id) || (id === "conseils" && urgent));
}

export const isDefaultLayout = (layout?: HomeLayout) => {
  const l = normalizeLayout(layout);
  return !l.hidden.length && l.order.every((id, i) => id === HOME_BLOCKS[i]);
};

export function moveBlock(layout: HomeLayout, id: HomeBlock, by: -1 | 1): HomeLayout {
  const l = normalizeLayout(layout);
  const shown = l.order.filter((x) => !l.hidden.includes(x));
  const i = shown.indexOf(id),
    j = i + by;
  if (i < 0 || j < 0 || j >= shown.length) return l;
  const order = [...l.order];
  const a = order.indexOf(shown[i]),
    b = order.indexOf(shown[j]);
  [order[a], order[b]] = [order[b], order[a]];
  return { ...l, order };
}

export const hideBlock = (layout: HomeLayout, id: HomeBlock): HomeLayout => {
  const l = normalizeLayout(layout);
  return { ...l, hidden: [...l.hidden.filter((x) => x !== id), id] };
};

/** A block put back comes at the end of the visible ones. */
export function showBlock(layout: HomeLayout, id: HomeBlock): HomeLayout {
  const l = normalizeLayout(layout);
  const order = [
    ...l.order.filter((x) => x !== id && !l.hidden.includes(x)),
    id,
    ...l.order.filter((x) => x !== id && l.hidden.includes(x)),
  ];
  return { order, hidden: l.hidden.filter((x) => x !== id) };
}
